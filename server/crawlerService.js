// Gọi sang crawler nội bộ (crawler/server.py, FastAPI). Đọc env trong hàm vì dotenv.config() ở
// index.js chạy sau các import ESM, nên đọc process.env.CRAWLER_URL ở top-level sẽ luôn rỗng.
export async function callCrawler(path, body) {
  const base = process.env.CRAWLER_URL || 'http://127.0.0.1:11235';
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Crawler chưa chạy — hãy chạy `npm run dev:crawler` (hoặc `npm run dev`)');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(typeof data.detail === 'string' ? data.detail : data.detail?.[0]?.msg || `Crawler lỗi ${res.status}`), { status: res.status });
  }
  return data;
}
