"""crawler/selfcheck.py — plain-assert self-check, no framework.
Run from crawler/: `uv run --project crawler python selfcheck.py`
"""
import asyncio
import json
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

# 1j2) _fb_group_id: a share-link redirect (query/fragment ignored) still resolves to the group slug
assert server._fb_group_id("https://www.facebook.com/groups/opencode.io.vn/?rdid=abc&share_url=xyz#") == "opencode.io.vn"

# 1k) _brief_from: a free-text instruction gets its own high-priority line
assert "Yêu cầu của người dùng" in server._brief_from(None, "", "chỉ lấy phàn nàn")


# 1l) _ask_json: a ```json-fenced reply (9Router ignores json_response) still parses
async def _fenced_reply(**_):
    msg = type("M", (), {"content": '```json\n{\n  "keep": [2, 11]\n}\n```'})
    return type("R", (), {"choices": [type("C", (), {"message": msg})]})


_real_completion = server.aperform_completion_with_backoff
server.aperform_completion_with_backoff = _fenced_reply
assert asyncio.run(server._ask_json(server.LLMConfig(provider="openai/x", api_token="k"), "p")) == {"keep": [2, 11]}
server.aperform_completion_with_backoff = _real_completion


# 1l2) _select_relevant: when the AI call fails (quota/overload), KEEP the batch's indices
# unfiltered instead of dropping them, and warn that the data is unfiltered.
async def _raising_ask_json(*_a, **_kw):
    raise RuntimeError("boom")


_real_ask_json = server._ask_json
server._ask_json = _raising_ask_json
kept, warning = asyncio.run(
    server._select_relevant(server.LLMConfig(provider="openai/x", api_token="k"), "b", ["a", "b", "c"])
)
assert kept == {0, 1, 2}, kept
assert "chưa lọc" in warning, warning
server._ask_json = _real_ask_json


# 1m) _fb_items_from_json: synthetic FB SSR/graphql shape - two stories (A=target, B=other), a
# reposted/translated copy of A's message that must NOT be picked, a duplicate comment id, a
# no-typename comment, a notification (body.text but no author -> ignored), and a story-less comment.
_fb_story_a = {
    "post_id": "111",
    "actors": [{"name": "Alice"}],
    "creation_time": 1700000000,
    "attached_story": {"message": {"text": "WRONG - reposted story"}},
    "translated_message_for_viewer": {"message": {"text": "WRONG - translated"}},
    "wrapper": {"message": {"text": "Original text A"}},
    "comments": {"total_count": 3},
    "threads": [
        {"__typename": "Comment", "depth": 0, "id": "c1", "body": {"text": "Hello"}, "author": {"name": "Dave"}, "created_time": 1700000020},
        {"id": "c1", "body": {"text": "DUP - ignored"}, "author": {"name": "Dave"}, "created_time": 1700000021},  # dup id
        {"id": "c2", "body": {"text": "No typename comment"}, "author": {"name": "Eve"}, "created_time": 1700000030},  # no __typename
    ],
}
_fb_story_b = {
    "post_id": "222",
    "actors": [{"name": "Bob"}],
    "creation_time": 1700000001,
    "message": {"text": "Story B text"},
    "comment_of_b": {
        "__typename": "Comment", "id": "cB1",
        "body": {"text": "Comment in other story"}, "author": {"name": "Carol"}, "created_time": 1700000010,
    },
}
_fb_notification = {"id": "n1", "body": {"text": "notif"}, "created_time": 1700000040}  # no author -> ignored
_fb_story_less = {"id": "c3", "body": {"text": "Story-less comment"}, "author": {"name": "Frank"}, "created_time": 1700000050}
_fb_blobs = [json.dumps([_fb_story_a, _fb_notification, _fb_story_less, _fb_story_b])]

items_a, expected_a, found_a = server._fb_items_from_json(_fb_blobs, "111")
posts_a = [i for i in items_a if i["kind"] == "post"]
comments_a = [i for i in items_a if i["kind"] == "comment"]
assert found_a is True
assert expected_a == 3
assert [(p["author"], p["text"]) for p in posts_a] == [("Alice", "Original text A")], posts_a
assert sorted(c["text"] for c in comments_a) == ["Hello", "No typename comment", "Story-less comment"], comments_a

items_all, expected_all, found_all = server._fb_items_from_json(_fb_blobs, None)
assert found_all is False and expected_all is None
assert sorted(i["author"] for i in items_all if i["kind"] == "post") == ["Alice", "Bob"]
assert sorted(c["text"] for c in items_all if c["kind"] == "comment") == [
    "Comment in other story", "Hello", "No typename comment", "Story-less comment",
]

# a plain share (no own message) falls back to the shared post's text
_fb_share = {"post_id": "444", "actors": [{"name": "Sharer"}], "attached_story": {"message": {"text": "Shared text"}}}
assert server._fb_items_from_json([json.dumps(_fb_share)], None)[0][0]["text"] == "Shared text"

_, _, found_missing = server._fb_items_from_json(_fb_blobs, "999")
assert found_missing is False

# for (;;); guard + a graphql body with several JSON objects, one per line
_fb_blob_ml = (
    "for (;;);" + json.dumps({"post_id": "333", "actors": [{"name": "Zack"}], "creation_time": 1700000100, "message": {"text": "Multi-line post"}})
    + "\n" + json.dumps({"id": "c9", "body": {"text": "Multi-line comment"}, "author": {"name": "Yara"}, "created_time": 1700000110})
)
items_ml, _, _ = server._fb_items_from_json([_fb_blob_ml], None)
assert sorted(i["author"] for i in items_ml) == ["Yara", "Zack"], items_ml


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
