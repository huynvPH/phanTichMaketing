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
