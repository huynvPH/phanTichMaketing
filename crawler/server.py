"""FastAPI wrapper around the vendored crawl4ai core (crawler/crawl4ai).

Local-only service, called by server/crawlerService.js (Express proxies
/api/crawl/:action -> this process on 127.0.0.1:11235). Keeps one shared
headless AsyncWebCrawler for the process lifetime; a request-scoped browser
with a persisted login profile (Facebook, ...) is only spun up on demand.
"""

import asyncio
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
from pydantic import BaseModel, Field, field_validator
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


class CommentsReq(BaseModel):
    url: str = Field(pattern=r"^https?://")
    max: int = Field(100, ge=1, le=500)
    profile: str | None = Field(default=None, pattern=_SAFE_NAME)
    llm: LLMIn | None = None


class ResearchReq(BaseModel):
    topic: str = Field(min_length=1, max_length=300)
    platforms: list[Literal["web", "youtube", "facebook"]] = Field(default=["web", "youtube"], min_length=1)
    maxSources: int = Field(10, ge=1, le=20)
    llm: LLMIn | None = None


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


# ponytail: FB/forum "expand comments" is a text-based button-label heuristic, so it breaks
# whenever a platform changes its DOM/wording. Upgrade path: JsonCssExtractionStrategy.generate_schema
# once per domain and cache the CSS schema under ~/.crawl4ai/schema (see crawlers/google_search for the pattern).
EXPAND_JS = """
const patterns = [/xem thêm/i, /see more/i, /view more comments/i, /xem thêm bình luận/i, /load more/i];
for (let i = 0; i < 5; i++) {
    const els = Array.from(document.querySelectorAll('button, span'));
    for (const el of els) {
        const t = (el.textContent || '').trim();
        if (patterns.some((p) => p.test(t))) {
            try { el.click(); } catch (e) {}
        }
    }
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
        return {"comments": out, "title": (info or {}).get("title")}

    if req.llm is None:
        raise HTTPException(400, "Cần cấu hình AI để trích comment ngoài YouTube")

    cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        scan_full_page=True,
        scroll_delay=0.6,
        delay_before_return_html=2.0,
        page_timeout=90000,
        js_code=EXPAND_JS,
        markdown_generator=DefaultMarkdownGenerator(content_filter=PruningContentFilter()),
        extraction_strategy=LLMExtractionStrategy(
            llm_config=to_llm_config(req.llm),
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
    out = [c for c in extracted if isinstance(c, dict) and (c.get("text") or "").strip()][: req.max]
    fit_markdown = (r.markdown.fit_markdown or r.markdown.raw_markdown) if r.markdown else ""
    return {"comments": out, "title": (r.metadata or {}).get("title"), "markdown": fit_markdown}


@app.post("/research")
async def research(req: ResearchReq):
    if req.llm is None:
        raise HTTPException(400, "Cần cấu hình AI (llm) để tự nghiên cứu chủ đề này.")
    llm_config = to_llm_config(req.llm)

    prompt = (
        "Bạn là researcher marketing. Sinh 3-5 truy vấn tìm kiếm ngắn (tiếng Việt, có thể kèm 'review', "
        "'đánh giá', 'có tốt không') để gom feedback/khiếu nại thật của khách hàng về chủ đề: "
        f"{req.topic}. Trả về JSON {{\"queries\": [...]}} không giải thích."
    )
    try:
        resp = await aperform_completion_with_backoff(
            provider=llm_config.provider,
            prompt_with_variables=prompt,
            api_token=llm_config.api_token,
            base_url=llm_config.base_url,
            json_response=True,
        )
        parsed = json.loads(resp.choices[0].message.content)
        queries = [str(q) for q in parsed["queries"]][:5]
        if not queries:
            raise ValueError("empty queries")
    except Exception:
        queries = [req.topic]

    per_platform = math.ceil(req.maxSources / len(req.platforms))
    sources = []
    seen_urls = set()
    for platform in req.platforms:
        for q in queries:
            try:
                r = await search(SearchReq(query=q, platform=platform, limit=per_platform))
            except HTTPException:
                continue
            for item in r["results"]:
                if item["url"] in seen_urls:
                    continue
                seen_urls.add(item["url"])
                sources.append({"url": item["url"], "platform": platform, "title": item.get("title")})
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
                        crawl(CrawlReq(urls=[source["url"]], query=req.topic, filter="bm25")), timeout=120
                    )
                    result = r["results"][0]
                    source["markdown_chunk"] = (result.get("markdown") or "")[:4000]
                    source["title"] = source.get("title") or result.get("title")
            except Exception as e:
                source["error"] = str(e)

    await asyncio.gather(*[_fill(s) for s in sources])

    blocks = []
    for s in sources:
        header = f"=== [{s['platform']}] {s.get('title') or s['url']} ===\n{s['url']}\n"
        if s.get("comments"):
            body = "\n".join(f"- {c.get('author') or '?'}: {c['text']} ({c.get('likes') or 0} likes)" for c in s["comments"])
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
                "error": s.get("error"),
            }
            for s in sources
        ],
        "combinedText": combined_text,
    }


_profile_lock = asyncio.Lock()


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
            await closed.wait()
        return {"profile": req.name, "path": profile_dir}
