"""crawler/fb_canary.py - live Facebook JSON-harvest canary.

Run this before deploys, or weekly, to catch Facebook DOM/JSON shape changes early:
`.venv/Scripts/python.exe fb_canary.py [URL ...]` (needs a logged-in "facebook" profile).
Exits 1 if any URL yields 0 items, falls back to the DOM harvest (via != "json"), or - when
Facebook's own comment count is known - covers less than 50% of it.
"""
import asyncio
import sys

import server

DEFAULT_URLS = [
    "https://www.facebook.com/groups/opencode.io.vn/posts/940082012492634/",
    "https://www.facebook.com/groups/pypcom/posts/3044749925862056/",
    "https://www.facebook.com/share/g/1DFj5SpP15/",  # posts can be deleted - pass your own URLs
]


async def main(urls: list[str]) -> int:
    ok = True
    async with server.lifespan(server.app):
        for url in urls:
            try:
                res = await server.comments(server.CommentsReq(url=url, max=500, profile="facebook"))
            except Exception as e:
                print(f"{url}: FAILED - {e}")
                ok = False
                continue
            total, expected, via = res["total"], res["expected"], res["via"]
            n_comments = sum(1 for c in res["comments"] if c["kind"] == "comment")
            coverage = f"{100 * n_comments / expected:.0f}%" if expected else "n/a"
            print(f"{url}\n  via={via} items={total} comments={n_comments} expected={expected} coverage={coverage}")
            if total == 0 or via != "json" or (expected and n_comments < 0.5 * expected):
                ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main(sys.argv[1:] or DEFAULT_URLS)))
