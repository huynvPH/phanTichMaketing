"""crawler/selfcheck.py — plain-assert self-check, no framework.
Run from crawler/: `uv run --project crawler python selfcheck.py`
"""
import asyncio
import sys

import crawl4ai  # noqa: F401

# 1) import crawl4ai must not pull in removed/dead modules
for bad in ("crawl4ai.components.crawler_monitor", "crawl4ai.docker_client", "crawl4ai.cli"):
    assert bad not in sys.modules, f"unexpected import pulled in: {bad}"

import server  # noqa: E402  (import after the sys.modules check above)
from pydantic import ValidationError  # noqa: E402


# 1b) ResearchReq: context alone satisfies the "need topic or context" validator, and its
# brief only prints the fields that were actually filled in.
req = server.ResearchReq(context=server.ResearchContext(industry="x"))
brief = server._brief_from(req.context, req.topic)
assert "Ngành hàng/lĩnh vực: x" in brief, brief
assert "Sản phẩm" not in brief, brief

# 1b2) ResearchContext.filled(): true iff product or industry is non-blank
assert server.ResearchContext(industry="x").filled() is True
assert server.ResearchContext().filled() is False

# 1c) topic + context both blank -> pydantic ValidationError
try:
    server.ResearchReq()
    raise AssertionError("expected ValidationError when topic and context are both blank")
except ValidationError:
    pass

# 1d) _paragraphs: strips leading markdown bullets/#/>/whitespace, keeps only lines >= 40 chars
paras = server._paragraphs("# Tiêu đề\n- ngắn\n- " + "a" * 50 + "\n\n> " + "b" * 45)
assert paras == ["a" * 50, "b" * 45], paras

# 1e) _batch_items: groups indices by cumulative char budget, no drop/infinite-loop on an
# item longer than the budget by itself.
assert server._batch_items(["x" * 30] * 5, 70) == [[0, 1], [2, 3], [4]]
assert server._batch_items(["y" * 100], 50) == [[0]]

# 1f) _is_facebook: hostname endswith facebook.com/fb.com, not just URL substring match
assert server._is_facebook("https://www.facebook.com/groups/123") is True
assert server._is_facebook("https://notfacebook.com.vn/x") is False

# 1g) _verbatim: drops items whose text doesn't actually appear on the crawled page (anti-hallucination)
kept = server._verbatim(
    [{"text": "Giao hàng   chậm quá"}, {"text": "bịa đặt hoàn toàn"}],
    "abc\nGiao hàng chậm quá, shop ơi",
)
assert kept == [{"text": "Giao hàng   chậm quá"}], kept

# 1h) _parse_fb_harvest: decodes the harvested-JSON <pre> block written by FB_HARVEST_JS (items array)
parsed = server._parse_fb_harvest(
    '<pre id="__fb_harvest">[{&quot;kind&quot;: &quot;post&quot;, &quot;author&quot;: &quot;A&quot;, '
    '&quot;text&quot;: &quot;xin chào&quot;}]</pre>'
)
assert parsed[0]["text"] == "xin chào", parsed

# 1i) _parse_fb_harvest: missing/malformed <pre> block -> empty list, no crash
assert server._parse_fb_harvest("<html></html>") == []

# 1j) _fb_group_id: only /groups/<id>[/] itself is the group - not a post/permalink/search/sub-path
assert server._fb_group_id("https://www.facebook.com/groups/congdongketoankiemtoanvn/") == "congdongketoankiemtoanvn"
assert server._fb_group_id("https://www.facebook.com/groups/123/posts/456") is None
assert server._fb_group_id("https://www.facebook.com/rsbnetwork") is None

# 1k) _brief_from: a free-text instruction gets its own high-priority line
assert "Yêu cầu của người dùng" in server._brief_from(None, "", "chỉ lấy phàn nàn")


RAW_HTML = (
    "raw:<html><body><h1>Review</h1>"
    '<div class="c"><b>An</b>: Sản phẩm dùng rất tốt, thấm nhanh không bết dính da.</div>'
    '<div class="c"><b>Bình</b>: Giao hàng chậm hơn hẹn hai ngày, hộp bị móp.</div>'
    "</body></html>"
)


async def main():
    async with server.lifespan(server.app):
        # 2) raw html with 2 comments -> /crawl markdown contains both
        r = await server.crawl(server.CrawlReq(urls=[RAW_HTML], filter="fit"))
        result = r["results"][0]
        assert result["success"], result
        md = result["markdown"]
        assert "thấm nhanh" in md, md
        assert "Giao hàng chậm" in md, md

        # 3) real page -> non-empty markdown
        r2 = await server.crawl(server.CrawlReq(urls=["https://example.com"]))
        result2 = r2["results"][0]
        assert result2["success"], result2
        assert "Example Domain" in result2["markdown"]

        # 4) youtube search -> at least 1 result
        r3 = await server.search(server.SearchReq(query="review son môi", platform="youtube", limit=3))
        assert len(r3["results"]) >= 1
        assert r3["results"][0]["url"].startswith("https://www.youtube.com/watch?v=")


if __name__ == "__main__":
    asyncio.run(main())
    print("PASS")
