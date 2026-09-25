# crawler/crawl4ai (vendored)

Source: https://github.com/unclecode/crawl4ai @ 86e6464f (v0.9.4), Apache-2.0 (see LICENSE).

Removed (CLI/UI/dead code): `cli.py`, `cloud/`, `legacy/`, `docker_client.py`, `install.py`,
`components/` (crawler_monitor), `deep_crawling/crazy.py`, `crawlers/amazon_product/`,
`html2text/cli.py`, `html2text/__main__.py`, 7 dead helper functions in `utils.py`.

Setup: `uv sync --project crawler` then `uv run --project crawler playwright install chromium`.
