import { useState } from 'react';
import { Sparkles, Compass, AlertTriangle, Link as LinkIcon, FileText } from 'lucide-react';
import { postJSON } from '../utils/projectManager';

const MODES = [
  { id: 'research', icon: Sparkles, label: 'Tự động tìm kiếm' },
  { id: 'linkComments', icon: LinkIcon, label: 'Từ Link MXH (Comment)' },
  { id: 'linkContent', icon: FileText, label: 'Từ Link bài viết (Nội dung)' },
];

const PLATFORM_BADGE = {
  youtube: 'bg-red-50 text-red-700 border-red-200',
  facebook: 'bg-blue-50 text-blue-700 border-blue-200',
  web: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('facebook.com')) return 'facebook';
    return 'web';
  } catch {
    return 'web';
  }
}

// Mỗi dòng 1 link, chỉ nhận http(s), bỏ trùng, tối đa 10 link
function parseUrls(text) {
  const seen = new Set();
  const urls = [];
  for (const line of text.split('\n')) {
    const url = line.trim();
    if (!url || !(url.startsWith('http://') || url.startsWith('https://')) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= 10) break;
  }
  return urls;
}

// Các dòng không phải link trong cùng ô textarea = mô tả tự do cần lấy gì (dùng cho Link -> Comment)
function parseInstruction(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !(line.startsWith('http://') || line.startsWith('https://')))
    .join(' ');
}

/**
 * AI Crawl Feedback thật — gom về 1 khối duy nhất trong Tầng 1 (VoC).
 * 3 chế độ: AI tự tìm nguồn theo chủ đề / Link -> Comment / Link -> Nội dung.
 * onAppend(text) nối kết quả crawl vào ô VoC của form cha.
 */
export default function CrawlPanel({ currentModel, context, onAppend }) {
  const [mode, setMode] = useState('research');
  const [topic, setTopic] = useState('');
  const [platforms, setPlatforms] = useState({ web: true, youtube: true, facebook: false });
  const [urlsText, setUrlsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [fbLoginBusy, setFbLoginBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [sources, setSources] = useState([]);

  const urls = parseUrls(urlsText);
  const instruction = parseInstruction(urlsText);
  const hasContext = !!(context?.product?.trim() || context?.industry?.trim());
  const focused = !!(instruction || hasContext);
  const contextSummary = [context?.product, context?.industry, context?.audience, context?.goal]
    .filter((v) => v && v.trim())
    .join(' · ');

  const handleResearch = async () => {
    if (!topic.trim() && !hasContext) return;
    setBusy(true);
    setNotice(null);
    try {
      const selected = Object.keys(platforms).filter((p) => platforms[p]);
      const data = await postJSON(
        '/api/crawl/research',
        { topic, context, platforms: selected, maxSources: 10, model: currentModel },
        'Lỗi khi tự động crawl feedback.'
      );
      setSources(data.sources || []);
      if (!data.combinedText) {
        const text = 'AI không tìm thấy feedback phù hợp — thử bổ sung chủ đề hoặc dán link cụ thể.';
        setNotice({ type: 'warning', text: data.warning ? `${text} ⚠ ${data.warning}` : text });
        return;
      }
      onAppend(data.combinedText);
      const okSources = (data.sources || []).filter((s) => !s.error).length;
      const text = `Đã lọc giữ feedback đúng ngữ cảnh từ ${okSources}/${data.sources?.length || 0} nguồn (${data.queries?.length || 0} truy vấn). Kiểm tra bên dưới rồi bấm phân tích.`;
      setNotice({ type: 'success', text: data.warning ? `${text} ⚠ ${data.warning}` : text });
    } catch (err) {
      setNotice({ type: 'warning', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleLinkComments = async () => {
    if (urls.length === 0) return;
    setBusy(true);
    setNotice(null);
    const blocks = [];
    const results = [];
    const warnings = new Set();
    for (const url of urls) {
      const platform = detectPlatform(url);
      try {
        const data = await postJSON(
          '/api/crawl/comments',
          { url, max: 100, profile: platform === 'facebook' ? 'facebook' : undefined, model: currentModel, instruction, context },
          'Lỗi khi crawl comment.'
        );
        if (data.warning) warnings.add(data.warning);
        const title = data.title || url;
        const total = data.total ?? (data.comments ? data.comments.length : 0);
        if (!data.comments || data.comments.length === 0) {
          results.push({
            url,
            platform,
            title,
            error:
              focused && total > 0
                ? 'Không có nội dung phù hợp với yêu cầu'
                : 'Không trích được comment (nhóm riêng tư, chưa đăng nhập hoặc chưa có bình luận)',
          });
          continue;
        }
        const commentCount = data.comments.length;
        const body = data.comments
          .map((c) => `- ${c.author || '?'}${c.kind === 'post' ? ' (bài đăng)' : ''}: ${c.text}${c.likes > 0 ? ` (${c.likes} likes)` : ''}`)
          .join('\n');
        blocks.push(`=== [${platform}] ${title} ===\n${url}\n${body}`);
        results.push({ url, platform, title, commentCount, total, expected: data.expected, error: null });
      } catch (err) {
        results.push({ url, platform, title: url, error: err.message });
      }
    }
    if (blocks.length > 0) onAppend(blocks.join('\n\n'));
    setSources(results);
    const warningSuffix = warnings.size > 0 ? ` ⚠ ${[...warnings].join(' ')}` : '';
    setNotice(
      blocks.length > 0
        ? {
            type: 'success',
            text: `Đã crawl comment từ ${blocks.length}/${urls.length} link. Kiểm tra bên dưới rồi bấm phân tích.${warningSuffix}`,
          }
        : { type: 'warning', text: `Không crawl được comment từ các link đã dán.${warningSuffix}` }
    );
    setBusy(false);
  };

  const handleLinkContent = async () => {
    if (urls.length === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const hasFacebookUrl = urls.some((url) => detectPlatform(url) === 'facebook');
      const data = await postJSON(
        '/api/crawl/crawl',
        { urls, filter: 'fit', model: currentModel, ...(hasFacebookUrl && { profile: 'facebook' }) },
        'Lỗi khi crawl nội dung.'
      );
      const blocks = [];
      const results = [];
      for (const r of data.results || []) {
        if (r.success) {
          const markdown = (r.markdown || '').slice(0, 4000);
          const title = r.title || r.url;
          blocks.push(`=== [web] ${title} ===\n${r.url}\n${markdown}`);
          results.push({ url: r.url, platform: 'web', title, chars: markdown.length, error: null });
        } else {
          results.push({ url: r.url, platform: 'web', title: r.url, error: r.error || 'Lỗi crawl.' });
        }
      }
      if (blocks.length > 0) onAppend(blocks.join('\n\n'));
      setSources(results);
      setNotice(
        blocks.length > 0
          ? { type: 'success', text: `Đã crawl nội dung từ ${blocks.length}/${urls.length} link. Kiểm tra bên dưới rồi bấm phân tích.` }
          : { type: 'warning', text: 'Không crawl được nội dung từ các link đã dán.' }
      );
    } catch (err) {
      setNotice({ type: 'warning', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  // Mở Chrome 1 lần để người dùng đăng nhập Facebook, lưu lại profile cho các lần crawl sau
  const handleFacebookLogin = async () => {
    setFbLoginBusy(true);
    setNotice({
      type: 'warning',
      text: 'Chrome đã mở — hãy đăng nhập Facebook trong cửa sổ đó. Cửa sổ sẽ tự đóng khi đăng nhập xong (tối đa 4 phút).',
    });
    try {
      const data = await postJSON('/api/crawl/profiles-create', { name: 'facebook' }, 'Lỗi khi đăng nhập Facebook.');
      if (data.loggedIn) {
        setNotice({ type: 'success', text: 'Đã lưu đăng nhập Facebook — giờ có thể crawl comment Facebook.' });
      } else {
        setNotice({
          type: 'warning',
          text: 'Chưa phát hiện đăng nhập Facebook (đã đóng cửa sổ hoặc hết 4 phút). Bấm lại để thử lại.',
        });
      }
    } catch (err) {
      setNotice({ type: 'warning', text: err.message });
    } finally {
      setFbLoginBusy(false);
    }
  };

  const handleRun = mode === 'research' ? handleResearch : mode === 'linkComments' ? handleLinkComments : handleLinkContent;
  const runDisabled = busy || (mode === 'research' ? !topic.trim() && !hasContext : urls.length === 0);
  const runLabel = busy
    ? 'Đang crawl dữ liệu…'
    : mode === 'research'
    ? 'Bắt đầu Tìm & Crawl'
    : mode === 'linkComments'
    ? 'Bắt đầu Crawl Comment'
    : 'Bắt đầu Crawl Nội Dung';

  return (
    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-4">
      {/* 1. Header & Segmented Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/70">
        <div>
          <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
            Công cụ AI tự động thu thập Feedback (VoC)
          </span>
        </div>

        {/* Segmented Mode Selector Tabs */}
        <div className="inline-flex p-1 bg-zinc-200/70 rounded-lg text-xs gap-1 shrink-0 self-start sm:self-center">
          {MODES.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                mode === id
                  ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 ${
          notice.type === 'success'
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/95 border-amber-200 text-amber-900'
        }`}>
          <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${notice.type === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div className="flex-1 leading-relaxed font-medium">{notice.text}</div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Inputs depending on mode */}
      {mode === 'research' && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                hasContext
                  ? '(Tuỳ chọn) bổ sung chủ đề cụ thể — AI đã tự nhận diện từ mục 1'
                  : 'Nhập chủ đề cần tìm feedback, ví dụ: kem trị mụn, son dưỡng ẩm...'
              }
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 focus:border-zinc-400 focus:outline-none text-zinc-900 bg-white"
            />
            <div className="flex items-center gap-3 text-xs text-zinc-700 shrink-0">
              {[
                { id: 'web', label: 'Web' },
                { id: 'youtube', label: 'YouTube' },
                { id: 'facebook', label: 'Facebook' },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={platforms[id]}
                    onChange={(e) => setPlatforms((prev) => ({ ...prev, [id]: e.target.checked }))}
                    className="cursor-pointer"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          {hasContext && (
            <div className="text-[11px] text-zinc-500 truncate">
              Ngữ cảnh đã nhận diện: <span className="text-zinc-700 font-medium">{contextSummary}</span>
            </div>
          )}
        </div>
      )}

      {(mode === 'linkComments' || mode === 'linkContent') && (
        <div className="space-y-1.5">
          <textarea
            rows={4}
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={
              mode === 'linkComments'
                ? 'https://www.facebook.com/groups/...\nhttps://www.youtube.com/watch?v=...\n(Mỗi dòng 1 link, tối đa 10 link)\nThêm 1 dòng mô tả cần lấy gì nếu muốn, vd: chỉ lấy phàn nàn về chất lượng son'
                : 'https://www.youtube.com/watch?v=...\nhttps://vnexpress.net/...\n(Mỗi dòng 1 link, tối đa 10 link)'
            }
            className="w-full p-3 text-xs rounded-lg border border-zinc-200 focus:border-zinc-400 focus:outline-none text-zinc-900 bg-white leading-relaxed font-mono"
          />
          <div className="text-[11px] text-zinc-500">
            {mode === 'linkComments' && focused
              ? `AI lọc nội dung liên quan tới: ${[instruction, contextSummary].filter(Boolean).join(' · ')}`
              : urls.length > 0
              ? `Đã nhận diện ${urls.length} link hợp lệ`
              : 'Chỉ nhận link http(s), tối đa 10 link'}
          </div>
        </div>
      )}

      {/* 3. Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-200/70">
        <span className="text-[11px] text-zinc-400">
          {mode === 'research'
            ? 'Hệ thống sẽ quét các nguồn mạng xã hội và web để tổng hợp phản hồi.'
            : 'Dán danh sách link để AI trích xuất dữ liệu.'}
        </span>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={fbLoginBusy}
            className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Compass className="w-3.5 h-3.5" />
            {fbLoginBusy ? 'Đang mở Chrome…' : 'Đăng nhập Facebook'}
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={runDisabled}
            className="h-8 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Sparkles className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            {runLabel}
          </button>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-200/70">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nguồn đã crawl ({sources.length})</span>
          <div className="space-y-1">
            {sources.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] p-2 rounded-lg bg-white border border-zinc-200">
                <span className={`px-1.5 py-0.5 rounded border font-semibold uppercase text-[10px] shrink-0 ${PLATFORM_BADGE[s.platform] || PLATFORM_BADGE.web}`}>
                  {s.platform}
                </span>
                <a href={s.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-zinc-700 hover:text-zinc-950 hover:underline">
                  {s.title || s.url}
                </a>
                {!s.error && (
                  <span className="text-zinc-400 shrink-0">
                    {s.commentCount > 0
                      ? s.total > s.commentCount
                        ? `${s.commentCount}/${s.total} mục`
                        : `${s.commentCount} mục`
                      : `${s.chars || 0} ký tự`}
                    {s.expected ? ` · FB báo ${s.expected} bình luận` : ''}
                  </span>
                )}
                {s.error && <span className="text-rose-600 font-medium shrink-0">{s.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
