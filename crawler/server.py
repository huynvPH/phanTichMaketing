"""FastAPI wrapper around the vendored crawl4ai core (crawler/crawl4ai).

Local-only service, called by server/crawlerService.js (Express proxies
/api/crawl/:action -> this process on 127.0.0.1:11235). Keeps one shared
headless AsyncWebCrawler for the process lifetime; a request-scoped browser
with a persisted login profile (Facebook, ...) is only spun up on demand.
"""

import asyncio
import html
import json
import math
import os
import re
import sys
from contextlib import asynccontextmanager
from typing import Literal

import lxml.html
import yt_dlp
from fastapi import FastAPI, HTTPException
from playwright.async_api import async_playwright
from pydantic import BaseModel, Field, field_validator, model_validator
from urllib.parse import parse_qs, quote_plus, urlparse

from crawl4ai import (
    AsyncWebCrawler,
    BM25ContentFilter,
    BrowserConfig,
    CacheMode,
    CrawlerRunConfig,
    DefaultMarkdownGenerator,
    LLMConfig,
    LLMContentFilter,
    LLMExtractionStrategy,
    MemoryAdaptiveDispatcher,
    PruningContentFilter,
    RateLimiter,
)
from crawl4ai.async_configs import Provenance, UntrustedConfigError
from crawl4ai.utils import aperform_completion_with_backoff, configure_windows_event_loop, get_home_folder

if sys.platform == "win32":
    configure_windows_event_loop()  # Windows needs Proactor for Playwright's subprocess pipes

_shared_crawler: AsyncWebCrawler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _shared_crawler
    crawler = AsyncWebCrawler(config=BrowserConfig(headless=True, verbose=False))
    await crawler.start()
    _shared_crawler = crawler
    try:
        yield
    finally:
        await crawler.close()
        _shared_crawler = None


app = FastAPI(lifespan=lifespan)


@asynccontextmanager
async def crawler_for(profile: str | None):
    """Yield the shared crawler, or (for a logged-in profile that actually exists) a fresh persistent-context one."""
    profile_dir = os.path.join(get_home_folder(), "profiles", profile) if profile else None
    if not profile_dir or not os.path.isdir(profile_dir):
        yield _shared_crawler
        return
    async with AsyncWebCrawler(
        config=BrowserConfig(
            headless=True,
            use_persistent_context=True,
            user_data_dir=profile_dir,
        )
    ) as c:
        yield c


# Profile/name strings get joined into a filesystem path (get_home_folder()/profiles/<name>) -
# keep them to a safe charset so a request can never path-traverse out of that folder.
_SAFE_NAME = r"^[A-Za-z0-9_-]{1,40}$"

# litellm-native providers vs. OpenAI-compatible gateways (9Router/local proxy/OpenRouter all
# speak the OpenAI chat-completions wire format, so litellm just needs the openai/ prefix + base_url).
_NATIVE_LLM_PROVIDERS = {"openai", "gemini", "anthropic", "openrouter"}


class LLMIn(BaseModel):
    provider: str
    model: str | None = None
    apiKey: str | None = None
    baseUrl: str | None = None


def to_llm_config(llm: LLMIn) -> LLMConfig:
    provider = "anthropic" if llm.provider == "claude" else llm.provider
    provider_str = f"{provider}/{llm.model}" if provider in _NATIVE_LLM_PROVIDERS else f"openai/{llm.model}"
    try:
        return LLMConfig(
            provider=provider_str,
            api_token=llm.apiKey or "local",
            base_url=llm.baseUrl,
            # Body comes over the network from Express; never let it resolve a server env var.
            provenance=Provenance.UNTRUSTED,
        )
    except UntrustedConfigError:
        raise HTTPException(400, "API key không hợp lệ (không nhận dạng env:VAR).")


class SearchReq(BaseModel):
    query: str = Field(min_length=1, max_length=300)
    platform: Literal["web", "youtube", "facebook"] = "web"
    limit: int = Field(10, ge=1, le=20)


_URL_RE = re.compile(r"^(https?://|raw:)")


class CrawlReq(BaseModel):
    urls: list[str] = Field(min_length=1, max_length=20)
    query: str | None = None
    filter: Literal["fit", "bm25", "llm"] = "fit"
    profile: str | None = Field(default=None, pattern=_SAFE_NAME)
    llm: LLMIn | None = None

    @field_validator("urls")
    @classmethod
    def _urls_http_or_raw(cls, v: list[str]) -> list[str]:
        for u in v:
            if not _URL_RE.match(u):
                raise ValueError(f"URL không hợp lệ (chỉ nhận http(s) hoặc raw:): {u}")
        return v


class ResearchContext(BaseModel):
    product: str = Field("", max_length=300)
    industry: str = Field("", max_length=300)
    audience: str = Field("", max_length=500)
    goal: str = Field("", max_length=500)

    def filled(self) -> bool:
        return bool(self.product.strip() or self.industry.strip())


class CommentsReq(BaseModel):
    url: str = Field(pattern=r"^https?://")
    max: int = Field(100, ge=1, le=500)
    profile: str | None = Field(default=None, pattern=_SAFE_NAME)
    llm: LLMIn | None = None
    instruction: str = Field("", max_length=500)
    context: ResearchContext | None = None

    @property
    def focused(self) -> bool:
        """True when the caller gave a free-text instruction or section-1 product/industry context,
        so the crawl should be narrowed (AI relevance filter, group keyword search) instead of dumping
        every post/comment."""
        return bool(self.instruction.strip() or (self.context and self.context.filled()))


class ResearchReq(BaseModel):
    topic: str = Field("", max_length=300)
    context: ResearchContext | None = None
    platforms: list[Literal["web", "youtube", "facebook"]] = Field(default=["web", "youtube"], min_length=1)
    maxSources: int = Field(10, ge=1, le=20)
    llm: LLMIn | None = None

    @model_validator(mode="after")
    def _topic_or_context(self):
        if not self.topic.strip() and not (self.context and self.context.filled()):
            raise ValueError("Cần nhập chủ đề hoặc thông tin sản phẩm/ngành hàng ở mục 1.")
        return self


def _brief_from(context: ResearchContext | None, topic: str = "", instruction: str = "") -> str:
    """Vietnamese multi-line brief from section-1 context + optional topic/free-text instruction,
    for the query/filter prompts (research queries, relevance filter, group keyword search)."""
    ctx = context or ResearchContext()
    pairs = [
        ("Sản phẩm/dịch vụ", ctx.product),
        ("Ngành hàng/lĩnh vực", ctx.industry),
        ("Khách hàng mục tiêu", ctx.audience),
        ("Mục tiêu kinh doanh", ctx.goal),
        ("Chủ đề bổ sung", topic),
        ("Yêu cầu của người dùng (ưu tiên cao nhất)", instruction),
    ]
    return "\n".join(f"{label}: {value.strip()}" for label, value in pairs if value.strip())


async def _ask_json(llm_config: LLMConfig, prompt: str) -> dict:
    # The backoff helper only retries 429; also retry transient 503/500 ("model overloaded").
    for attempt in range(3):
        try:
            resp = await aperform_completion_with_backoff(
                provider=llm_config.provider,
                prompt_with_variables=prompt,
                api_token=llm_config.api_token,
                base_url=llm_config.base_url,
                json_response=True,
                base_delay=10,  # Gemini free tier (5 req/min) asks for ~28s; 10+20+40s covers that window
                max_attempts=4,
            )
            return json.loads(resp.choices[0].message.content)
        except Exception as e:
            if attempt == 2 or type(e).__name__ not in ("ServiceUnavailableError", "InternalServerError"):
                raise
            await asyncio.sleep(8 * (attempt + 1))


_MD_PREFIX_RE = re.compile(r"^[\s\-*+#>]+")


def _paragraphs(md: str) -> list[str]:
    """Split markdown into lines with bullets/#/>/whitespace stripped, keeping only lines >= 40 chars."""
    out = []
    for line in md.splitlines():
        cleaned = _MD_PREFIX_RE.sub("", line).strip()
        if len(cleaned) >= 40:
            out.append(cleaned)
    return out


def _batch_items(texts: list[str], budget: int) -> list[list[int]]:
    """Group item indices into batches whose cumulative text length stays <= budget.
    A single item longer than budget still gets its own batch (never dropped, never loops)."""
    batches: list[list[int]] = []
    current: list[int] = []
    current_len = 0
    for i, t in enumerate(texts):
        if current and current_len + len(t) > budget:
            batches.append(current)
            current, current_len = [], 0
        current.append(i)
        current_len += len(t)
    if current:
        batches.append(current)
    return batches


async def _select_relevant(llm_config: LLMConfig, brief: str, texts: list[str]) -> tuple[set[int], str | None]:
    """Batched AI relevance filter shared by /research and focused /comments: given a brief and a flat
    list of item texts, ask which global indices are real, on-topic user voice. Returns kept indices
    plus a warning message when any batch failed (rate-limited/overloaded model)."""
    kept_idx: set[int] = set()
    warning: str | None = None
    for batch in _batch_items(texts, 50000):
        numbered = "\n".join(f"[{i}] {texts[i]}" for i in batch)
        prompt = (
            "Bạn là chuyên gia lọc dữ liệu marketing. Bối cảnh nghiên cứu:\n"
            f"{brief}\n\n"
            f"Danh sách mục (đánh số):\n{numbered}\n\n"
            "Chọn chỉ số các mục là LỜI NÓI THẬT của khách hàng/người dùng (ngôi thứ nhất: review, bình luận, "
            "trải nghiệm, phàn nàn, câu hỏi, nhu cầu) LIÊN QUAN tới ngành hàng/nhóm khách hàng ở trên. LOẠI BỎ: "
            "nội dung bài viết/blog/listicle/quảng cáo do tác giả hoặc nhà cung cấp viết (kể cả khi nó liệt kê "
            "'khó khăn của doanh nghiệp' chung chung), spam, emoji, lạc đề, tự PR. Nếu có 'Yêu cầu của người "
            "dùng', CHỈ giữ mục đáp ứng đúng yêu cầu đó. Trả về JSON {\"keep\": [chỉ số]} không giải thích."
        )
        try:
            parsed = await _ask_json(llm_config, prompt)
            for i in parsed.get("keep") or []:
                if isinstance(i, (int, str)) and str(i).lstrip("-").isdigit() and int(i) in batch:
                    kept_idx.add(int(i))
        except Exception as e:
            print("AI filter batch failed:", repr(e)[:800], file=sys.stderr)
            warning = (
                "AI hết quota (vd Gemini free 5 lượt/phút) — đợi 1 phút hoặc đổi model"
                if type(e).__name__ == "RateLimitError"
                else "AI đang quá tải (503) — thử lại sau vài phút hoặc đổi model"
                if type(e).__name__ == "ServiceUnavailableError"
                else "AI lọc feedback lỗi"
            )
    return kept_idx, warning


async def _focus(req: CommentsReq, out: list[dict]) -> tuple[list[dict], str | None]:
    """Shared focus step for all 3 /comments branches: run the AI relevance filter when the
    request is focused and AI is configured, else pass items through (with a warning if AI is missing)."""
    if not req.focused:
        return out, None
    if req.llm is None:
        return out, "Chưa cấu hình AI nên không lọc theo mục tiêu"
    brief = _brief_from(req.context, "", req.instruction)
    kept, warning = await _select_relevant(to_llm_config(req.llm), brief, [c["text"][:400] for c in out])
    return [c for i, c in enumerate(out) if i in kept], warning


class ProfileReq(BaseModel):
    name: str = Field(default="facebook", pattern=_SAFE_NAME)


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/search")
async def search(req: SearchReq):
    if req.platform == "youtube":
        try:
            info = await asyncio.to_thread(
                yt_dlp.YoutubeDL({"quiet": True, "extract_flat": True, "skip_download": True}).extract_info,
                f"ytsearch{req.limit}:{req.query}",
                download=False,
            )
        except Exception:
            raise HTTPException(502, "Không tìm được video YouTube, thử lại sau.")
        entries = (info or {}).get("entries") or []
        results = [
            {"url": f"https://www.youtube.com/watch?v={e['id']}", "title": e.get("title") or "", "platform": "youtube"}
            for e in entries
            if e and e.get("id")
        ]
        return {"results": results[: req.limit]}

    # web / facebook both go through DuckDuckGo HTML search (facebook = site:facebook.com query)
    q = req.query if req.platform == "web" else f"site:facebook.com {req.query}"
    try:
        r = await _shared_crawler.arun(
            f"https://html.duckduckgo.com/html/?q={quote_plus(q)}",
            config=CrawlerRunConfig(cache_mode=CacheMode.BYPASS),
        )
    except Exception:
        raise HTTPException(502, "Không tìm kiếm được, thử lại sau.")
    if not r.success:
        raise HTTPException(502, "Không tìm kiếm được, thử lại sau.")
    results, seen = [], set()
    for a in lxml.html.fromstring(r.html).cssselect("a.result__a"):
        href = a.get("href") or ""
        url = parse_qs(urlparse(href).query).get("uddg", [href])[0]  # parse_qs already percent-decodes
        if not url.startswith(("http://", "https://")) or "duckduckgo.com" in url or url in seen:
            continue
        seen.add(url)
        results.append({"url": url, "title": a.text_content().strip(), "platform": req.platform})
        if len(results) >= req.limit:
            break
    return {"results": results}


@app.post("/crawl")
async def crawl(req: CrawlReq):
    if req.filter == "fit":
        content_filter = PruningContentFilter()
    elif req.filter == "bm25":
        content_filter = BM25ContentFilter(user_query=req.query or "")
    else:
        if req.llm is None:
            raise HTTPException(400, "Cần cấu hình AI (llm) khi dùng filter='llm'.")
        content_filter = LLMContentFilter(
            llm_config=to_llm_config(req.llm),
            instruction="Keep only user comments, reviews, feedback and opinions; drop navigation, ads, boilerplate.",
        )

    cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        markdown_generator=DefaultMarkdownGenerator(content_filter=content_filter),
        scan_full_page=True,
        page_timeout=60000,
    )
    try:
        async with crawler_for(req.profile) as c:
            rs = await c.arun_many(
                req.urls,
                config=cfg,
                dispatcher=MemoryAdaptiveDispatcher(max_session_permit=3, rate_limiter=RateLimiter(base_delay=(1.0, 3.0))),
            )
    except Exception:
        raise HTTPException(502, "Không thể crawl các URL đã cho, thử lại sau.")

    results = []
    for r in rs:
        markdown = ""
        if r.success and r.markdown:
            markdown = (r.markdown.fit_markdown or "").strip() or r.markdown.raw_markdown or ""
        results.append(
            {
                "url": r.url,
                "success": r.success,
                "markdown": markdown,
                "title": (r.metadata or {}).get("title"),
                "error": re.sub(r"^Unexpected error in .*?\):\s*", "", r.error_message or "").split("\nCode context:")[0].strip(),
            }
        )
    return {"results": results}


def _is_facebook(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == d or host.endswith("." + d) for d in ("facebook.com", "fb.com"))


_FB_GROUP_RE = re.compile(r"^/groups/([^/]+)/?$")


def _fb_group_id(url: str) -> str | None:
    """Return the group id/slug when the URL path is exactly /groups/<id>[/] - NOT a post/permalink/
    search/multi_permalinks or any other sub-path inside the group."""
    m = _FB_GROUP_RE.match(urlparse(url).path)
    return m.group(1) if m else None


_WS_RE = re.compile(r"\s+")


def _verbatim(items: list[dict], page_text: str) -> list[dict]:
    """Anti-hallucination guard: keep only items whose text actually appears on the crawled page
    (LLMExtractionStrategy can invent items that aren't there)."""
    norm_page = _WS_RE.sub(" ", page_text).lower()
    out = []
    for it in items:
        text = _WS_RE.sub(" ", (it.get("text") or "")).strip().lower()
        if text and text[: min(40, len(text))] in norm_page:
            out.append(it)
    return out


# ponytail: forum/web "expand comments" is a text-based button-label heuristic, so it breaks
# whenever a platform changes its DOM/wording (Facebook has its own harvester, FB_HARVEST_JS).
# Upgrade path: JsonCssExtractionStrategy.generate_schema once per domain and cache the CSS
# schema under ~/.crawl4ai/schema (see crawlers/google_search for the pattern).
EXPAND_JS = """
const patterns = [/xem thêm/i, /see more/i, /view more comments/i, /xem thêm bình luận/i, /load more/i];
const startUrl = location.href;
for (let i = 0; i < 5; i++) {
    const root = document.querySelector('[role="main"]') || document;
    const els = Array.from(root.querySelectorAll('button, [role="button"]'));
    for (const el of els) {
        const t = (el.textContent || '').trim();
        if (patterns.some((p) => p.test(t)) && !el.closest('a[href]')) {
            try { el.click(); } catch (e) {}
        }
    }
    if (location.href !== startUrl) break;  // a stray "Xem thêm" nav link navigated us away
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 800));
}
"""

_COMMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "author": {"type": "string"},
        "text": {"type": "string"},
        "likes": {"type": "integer"},
        "time": {"type": "string"},
    },
}


# ponytail: Facebook has no role="article" posts anymore and injects hidden anti-scrape spans that
# pollute HTML/textContent/markdown - only innerText is clean, and the feed virtualizes past posts out
# of the DOM, so this harvests via innerText WHILE scrolling (never navigates - opening a post/comment
# thread changes the URL). Upgrade path: same as EXPAND_JS above once FB's DOM stabilizes again.
FB_HARVEST_JS = r"""
const startUrl = location.href;
const isPost = /\/(posts|permalink|videos|reel)\/|story\.php|story_fbid|\/photo/.test(startUrl);
const items = [];
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const normalize = (s) => s.replace(/\s*(Ẩn bớt|See less)\s*$/i, '').replace(/(…|\.\.\.)\s*(Xem thêm|See more)?\s*$/i, '').trim();
const add = (kind, author, text) => {
  text = normalize(clean(text));
  author = clean(author);
  if (text.length < 3 || /^(Facebook\s*)+$/.test(text)) return;
  // ponytail: O(n^2) prefix-match scan (a truncated preview and its expanded version share a
  // prefix but not a fixed-length key) - fine for the few hundred items one harvest yields.
  // Upgrade path: bucket by a short prefix if item counts ever grow large.
  for (const e of items) {
    const minLen = Math.min(text.length, e.text.length);
    if (minLen >= 20 && (e.text.startsWith(text) || text.startsWith(e.text))) {
      if (text.length > e.text.length) e.text = text;
      if (!e.author && author) e.author = author;
      return;
    }
  }
  items.push({ kind, author, text });
};
const expandInline = (root) => {
  // only "Xem thêm"/"See more" INSIDE a message body - expands text in place, never navigates
  root.querySelectorAll('[data-ad-comet-preview="message"] [role="button"], [data-ad-preview="message"] [role="button"], [role="article"] div[dir="auto"] [role="button"]').forEach((b) => {
    if (/^(xem thêm|see more)$/i.test(clean(b.innerText)) && !b.closest('a[href]')) { try { b.click(); } catch (e) {} }
  });
};
const harvest = () => {
  const root = document.querySelector('[role="main"]') || document.body;
  expandInline(root);
  root.querySelectorAll('[aria-posinset]').forEach((p) => {
    const msg = p.querySelector('[data-ad-comet-preview="message"], [data-ad-preview="message"]');
    if (!msg) return;
    const a = p.querySelector('h2 a, h3 a, h4 a, strong a');
    add('post', a ? a.innerText : '', msg.innerText);
  });
  root.querySelectorAll('[role="article"][aria-label]').forEach((c) => {
    const label = c.getAttribute('aria-label') || '';
    const m = label.match(/^(?:Bình luận|Phản hồi|Comment|Reply)[^A-Za-zÀ-ỹ]*?(?:dưới tên|by)\s+(.+?)\s+(?:vào|\d)/i);
    const parts = Array.from(c.querySelectorAll('div[dir="auto"]')).filter((d) => !d.closest('a[href]') && !d.querySelector('div[dir="auto"]'));
    const text = parts.map((d) => d.innerText).join(' ');
    add('comment', m ? m[1] : '', text);
  });
  if (isPost) {
    // on a single post we may open more comments: those buttons stay on the same URL
    root.querySelectorAll('[role="button"]').forEach((b) => {
      if (/(xem thêm bình luận|xem tất cả|view more comments|more replies|phản hồi)/i.test(clean(b.innerText)) && !b.closest('a[href]')) { try { b.click(); } catch (e) {} }
    });
  }
};
for (let i = 0; i < 25; i++) {
  if (location.href !== startUrl) break;
  harvest();
  window.scrollBy(0, Math.round(window.innerHeight * 0.8));
  await new Promise((r) => setTimeout(r, 1200));
}
if (location.href === startUrl) harvest();
const pre = document.createElement('pre');
pre.id = '__fb_harvest';
pre.textContent = JSON.stringify(items);
document.body.appendChild(pre);
"""

_FB_HARVEST_RE = re.compile(r'<pre id="__fb_harvest">(.*?)</pre>', re.S)


def _parse_fb_harvest(raw_html: str) -> list[dict]:
    """Extract the items array that FB_HARVEST_JS wrote into <pre id="__fb_harvest">."""
    m = _FB_HARVEST_RE.search(raw_html or "")
    if not m:
        return []
    try:
        return json.loads(html.unescape(m.group(1))) or []
    except Exception:
        return []


@app.post("/comments")
async def comments(req: CommentsReq):
    if re.search(r"(youtube\.com|youtu\.be)", req.url):
        try:
            info = await asyncio.to_thread(
                yt_dlp.YoutubeDL(
                    {
                        "quiet": True,
                        "skip_download": True,
                        "getcomments": True,
                        "extractor_args": {
                            "youtube": {"max_comments": [str(req.max), "all", "all", "all"], "comment_sort": ["top"]}
                        },
                    }
                ).extract_info,
                req.url,
                download=False,
            )
        except Exception:
            raise HTTPException(502, "Không lấy được video/bình luận YouTube, thử lại sau.")
        raw_comments = (info or {}).get("comments") or []
        out = [
            {
                "author": c.get("author") or "",
                "text": c.get("text") or "",
                "likes": c.get("like_count") or 0,
                "time": c.get("_time_text") or c.get("timestamp"),
            }
            for c in raw_comments[: req.max]
        ]
        total = len(out)
        out, warning = await _focus(req, out)
        return {"comments": out, "title": (info or {}).get("title"), "total": total, "warning": warning}

    if _is_facebook(req.url):
        group_id = _fb_group_id(req.url)
        llm_config = to_llm_config(req.llm) if req.focused and req.llm is not None else None
        brief = _brief_from(req.context, "", req.instruction) if llm_config else ""

        # Focused + group + AI available: ask a few short, natural-language search keywords a group
        # member would actually write, then harvest each keyword's search results page instead of
        # dumping the whole group feed.
        keywords: list[str] = []
        if llm_config and group_id:
            kw_prompt = (
                "Bạn đang tìm bài đăng liên quan trong một group Facebook. Bối cảnh:\n"
                f"{brief}\n\n"
                "Đưa ra 2-3 từ khoá tìm kiếm ngắn (2-4 từ), tiếng Việt tự nhiên như cách thành viên group "
                "thực sự gõ khi hỏi/than phiền về chủ đề này (không phải từ khoá SEO). Trả về JSON "
                "{\"keywords\": [...]} không giải thích."
            )
            try:
                parsed_kw = await _ask_json(llm_config, kw_prompt)
                keywords = [str(k).strip() for k in (parsed_kw.get("keywords") or []) if str(k).strip()][:3]
                if not keywords:
                    raise ValueError("empty keywords")
            except Exception:
                ctx = req.context or ResearchContext()
                fallback = (ctx.industry or ctx.product or req.instruction).strip()
                keywords = [fallback] if fallback else []

        title = None
        harvested: list[dict] = []
        seen_texts = set()
        targets = [f"https://www.facebook.com/groups/{group_id}/search/?q={quote_plus(kw)}" for kw in keywords] or [req.url]
        cfg = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            page_timeout=60000 if keywords else 120000,
            delay_before_return_html=1.0,
            js_code=FB_HARVEST_JS,
        )
        try:
            async with crawler_for(req.profile) as c:
                for target in targets:
                    r = await c.arun(target, config=cfg)
                    title = title or (r.metadata or {}).get("title")
                    for it in _parse_fb_harvest(r.html or ""):
                        text = it.get("text") or ""
                        if text and text not in seen_texts:
                            seen_texts.add(text)
                            harvested.append(it)
        except Exception:
            raise HTTPException(502, "Không crawl được trang, thử lại sau.")

        out = [
            {
                "author": it.get("author") or "",
                "text": it.get("text") or "",
                "likes": 0,
                "time": None,
                "kind": it.get("kind"),
            }
            for it in harvested
        ][: req.max]
        total = len(out)
        out, warning = await _focus(req, out)
        return {"comments": out, "title": title, "total": total, "warning": warning}

    if req.llm is None:
        raise HTTPException(400, "Cần cấu hình AI để trích comment ngoài YouTube")
    llm_config = to_llm_config(req.llm)

    cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        scan_full_page=True,
        scroll_delay=0.6,
        delay_before_return_html=2.0,
        page_timeout=90000,
        js_code=EXPAND_JS,
        markdown_generator=DefaultMarkdownGenerator(content_filter=PruningContentFilter()),
        extraction_strategy=LLMExtractionStrategy(
            llm_config=llm_config,
            schema=_COMMENT_SCHEMA,
            extraction_type="schema",
            instruction="Extract every user comment/review on this page. Skip the post body, menus, ads.",
            input_format="fit_markdown",
        ),
    )
    try:
        async with crawler_for(req.profile) as c:
            r = await c.arun(req.url, config=cfg)
    except Exception:
        raise HTTPException(502, "Không crawl được trang, thử lại sau.")

    try:
        extracted = json.loads(r.extracted_content or "[]")
    except Exception:
        extracted = []
    if isinstance(extracted, dict):
        extracted = [extracted]
    candidates = [c for c in extracted if isinstance(c, dict) and (c.get("text") or "").strip()]
    page_text = r.markdown.raw_markdown if r.markdown else ""
    out = _verbatim(candidates, page_text)[: req.max]

    total = len(out)
    out, warning = await _focus(req, out)
    return {
        "comments": out,
        "title": (r.metadata or {}).get("title"),
        "total": total,
        "warning": warning,
    }


@app.post("/research")
async def research(req: ResearchReq):
    if req.llm is None:
        raise HTTPException(400, "Cần cấu hình AI (llm) để tự nghiên cứu chủ đề này.")
    llm_config = to_llm_config(req.llm)
    brief = _brief_from(req.context, req.topic)

    prompt = (
        "Bạn là researcher marketing. Dưới đây là bối cảnh nghiên cứu:\n"
        f"{brief}\n\n"
        "Thương hiệu/sản phẩm trên có thể còn ít người biết đến, nên PHẦN LỚN truy vấn phải nhắm vào NGÀNH HÀNG/"
        "DANH MỤC sản phẩm và NHÓM KHÁCH HÀNG MỤC TIÊU (ví dụ: \"phần mềm quản lý tài chính doanh nghiệp nhỏ "
        "review\", \"khó khăn quản lý tài chính SME\"), kèm thêm 1-2 truy vấn cho sản phẩm/đối thủ cạnh tranh nổi "
        "tiếng cùng ngành hàng đó. Chỉ đưa tên thương hiệu vào tối đa 1 truy vấn. Sinh 4-6 truy vấn tìm kiếm ngắn "
        "(tiếng Việt) để gom feedback/khiếu nại/nỗi đau thật của khách hàng. Ưu tiên truy vấn có khả năng ra "
        "tiếng nói thật của người dùng — review, kinh nghiệm dùng, có nên dùng, than phiền, hỏi đáp/thảo luận "
        "trên diễn đàn/group — và TRÁNH truy vấn dạng liệt kê/SEO như \"top\", \"tốt nhất\". Đồng thời trả về "
        "5-10 từ khoá (tiếng Việt, ngắn gọn) mô tả nhóm nỗi đau liên quan. Trả về JSON "
        "{\"queries\": [...], \"keywords\": [...]} không giải thích."
    )
    try:
        parsed = await _ask_json(llm_config, prompt)
        queries = [str(q) for q in parsed["queries"]][:6]
        keywords = [str(k) for k in (parsed.get("keywords") or [])][:10]
        if not queries:
            raise ValueError("empty queries")
    except Exception:
        fallback = " ".join(
            p.strip()
            for p in (req.topic, (req.context.industry if req.context else ""), (req.context.product if req.context else ""))
            if p and p.strip()
        )
        queries = [fallback]
        keywords = [fallback]

    bm25_query = " ".join(keywords) or (queries[0] if queries else "")

    # Cap each platform's own list at per_platform before concatenating, so e.g. web+youtube
    # doesn't let web (first in req.platforms) crowd out youtube once truncated to maxSources.
    per_platform = math.ceil(req.maxSources / len(req.platforms))
    seen_urls = set()
    sources = []
    for platform in req.platforms:
        platform_sources = []
        for q in queries:
            if len(platform_sources) >= per_platform:
                break
            try:
                r = await search(SearchReq(query=q, platform=platform, limit=per_platform))
            except HTTPException:
                continue
            for item in r["results"]:
                if item["url"] in seen_urls:
                    continue
                seen_urls.add(item["url"])
                platform_sources.append({"url": item["url"], "platform": platform, "title": item.get("title")})
                if len(platform_sources) >= per_platform:
                    break
        sources.extend(platform_sources)
    sources = sources[: req.maxSources]

    has_fb_profile = os.path.isdir(os.path.join(get_home_folder(), "profiles", "facebook"))
    sem = asyncio.Semaphore(3)

    async def _fill(source: dict):
        async with sem:
            try:
                if source["platform"] in ("youtube", "facebook"):
                    r = await asyncio.wait_for(
                        comments(
                            CommentsReq(
                                url=source["url"],
                                max=100,
                                profile="facebook" if (source["platform"] == "facebook" and has_fb_profile) else None,
                                llm=req.llm,
                            )
                        ),
                        timeout=120,
                    )
                    source["comments"] = r["comments"]
                    source["title"] = source.get("title") or r.get("title")
                else:
                    r = await asyncio.wait_for(
                        crawl(CrawlReq(urls=[source["url"]], query=bm25_query, filter="bm25")), timeout=120
                    )
                    result = r["results"][0]
                    source["markdown_chunk"] = (result.get("markdown") or "")[:4000]
                    source["title"] = source.get("title") or result.get("title")
            except Exception as e:
                source["error"] = str(e)

    await asyncio.gather(*[_fill(s) for s in sources])

    # ONE batched verbatim-selection pass across all sources, sequential (no parallelism) so a
    # free-tier LLM (e.g. Gemini 5 req/min) doesn't get hit with one call per source at once.
    items = []  # flat list of {"source", "payload", "text"} across every source's comments/paragraphs
    for s in sources:
        if s.get("error"):
            continue
        if s.get("comments"):
            s["total"] = len(s["comments"])
            for c in s["comments"]:
                items.append({"source": s, "payload": c, "text": (c.get("text") or "")[:400]})
        elif s.get("markdown_chunk"):
            paras = _paragraphs(s["markdown_chunk"])
            s["total"] = len(paras)
            for p in paras:
                items.append({"source": s, "payload": p, "text": p})
        else:
            s["total"] = 0

    kept_idx, warning = await _select_relevant(llm_config, brief, [it["text"] for it in items])

    kept_payloads: dict[int, list] = {}
    for i, it in enumerate(items):
        if i in kept_idx:
            kept_payloads.setdefault(id(it["source"]), []).append(it["payload"])

    for s in sources:
        if s.get("error") or not s.get("total"):
            continue
        was_comment_source = bool(s.get("comments"))
        kept = kept_payloads.get(id(s), [])
        if was_comment_source:
            s["comments"] = kept
        else:
            s["markdown_chunk"] = "\n".join(f"- {p}" for p in kept)
        if not kept and warning:
            s["error"] = warning

    def has_content(s: dict) -> bool:
        return bool(s.get("comments")) or bool((s.get("markdown_chunk") or "").strip())

    blocks = []
    for s in sources:
        if not has_content(s):
            continue
        header = f"=== [{s['platform']}] {s.get('title') or s['url']} ===\n{s['url']}\n"
        if s.get("comments"):
            body = "\n".join(
                f"- {c.get('author') or '?'}"
                + (" (bài đăng)" if c.get("kind") == "post" else "")
                + f": {c['text']}"
                + (f" ({c['likes']} likes)" if c.get("likes") else "")
                for c in s["comments"]
            )
        else:
            body = s.get("markdown_chunk") or ""
        blocks.append(header + body)
    combined_text = "\n\n".join(blocks)

    return {
        "queries": queries,
        "sources": [
            {
                "url": s["url"],
                "platform": s["platform"],
                "title": s.get("title"),
                "commentCount": len(s.get("comments") or []),
                "chars": len(s.get("markdown_chunk") or ""),
                "total": s.get("total", 0),
                "error": s.get("error") or (None if has_content(s) else "Không có feedback phù hợp"),
            }
            for s in sources
        ],
        "combinedText": combined_text,
        "warning": warning,
    }


_profile_lock = asyncio.Lock()


_PROFILE_LOGIN_DEADLINE = 240  # seconds - must stay < 300s (Node fetch/Express proxy default headersTimeout), or the proxy throws before we can respond


@app.post("/profiles/create")
async def profiles_create(req: ProfileReq):
    if _profile_lock.locked():
        raise HTTPException(409, "Đang có 1 phiên tạo profile khác chạy, vui lòng đợi.")
    async with _profile_lock:
        profile_dir = os.path.join(get_home_folder(), "profiles", req.name)
        async with async_playwright() as p:
            ctx = await p.chromium.launch_persistent_context(
                profile_dir, headless=False, viewport={"width": 1200, "height": 800}
            )
            page = ctx.pages[0] if ctx.pages else await ctx.new_page()
            await page.goto("https://www.facebook.com/login")
            closed = asyncio.Event()
            ctx.on("close", lambda *_: closed.set())
            logged_in = False
            for _ in range(_PROFILE_LOGIN_DEADLINE // 2):
                if closed.is_set():
                    break
                try:
                    cookies = await ctx.cookies()
                except Exception:  # user closed the window mid-call
                    break
                if any(c["name"] == "c_user" and "facebook.com" in c["domain"] for c in cookies):
                    logged_in = True
                    break
                try:
                    await asyncio.wait_for(closed.wait(), timeout=2)
                except asyncio.TimeoutError:
                    pass
            if logged_in:
                await asyncio.sleep(3)  # give Chrome time to flush the cookie to disk
            try:
                await ctx.close()
            except Exception:
                pass
        return {"profile": req.name, "path": profile_dir, "loggedIn": logged_in}
