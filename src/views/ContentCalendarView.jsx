import React, { useState } from 'react';
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { downloadFile } from '../utils/projectManager';

export default function ContentCalendarView({
  currentModel,
  researchContext,
  strategyData,
  calendarData,
  onSaveCalendar,
  onSyncToNotion
}) {
  const [selectedChannel, setSelectedChannel] = useState('TikTok');
  const [period, setPeriod] = useState('7 ngày (Weekly Sprint)');
  const [loading, setLoading] = useState(false);
  // Lịch: dùng thẳng prop từ dự án đang chọn (không mirror state cục bộ)
  const calendar = calendarData || null;
  const [copiedId, setCopiedId] = useState(null);

  const channels = ['TikTok', 'Facebook Fanpage', 'Shopee/Reels', 'Website/Blog SEO', 'YouTube Shorts'];

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới lịch nội dung?')) {
      if (onSaveCalendar) onSaveCalendar(null);
    }
  };

  const handleGenerateCalendar = async () => {
    setLoading(true);
    try {
      const groundingPayload = {
        channel: selectedChannel,
        period: period,
        brandStrategy: strategyData || null,
        customerResearchEvidence: {
          vocData: researchContext?.voc || researchContext?.executive?.voc || null,
          searchDemand: researchContext?.search || researchContext?.executive?.search || null,
          competitorData: researchContext?.competitor || researchContext?.executive?.competitor || null,
          offerData: researchContext?.offer || researchContext?.executive?.offer || null,
          framingData: researchContext?.framing || researchContext?.executive?.framing || null,
        },
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'calendar',
          model: currentModel,
          rawData: groundingPayload,
          metadata: {
            channel: selectedChannel,
            period: period,
            source: 'Hệ thống Lập Lịch Đăng Bài Tầng 3',
          },
          customPrompt: `BẮT BUỘC: Không tự bịa topic. Mỗi post phải gán chính xác insightCode và verbatimEvidence (trích dẫn nguyên văn) từ dữ liệu nghiên cứu khách hàng đã cho.`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi khi tạo lịch');

      if (onSaveCalendar) onSaveCalendar(data.data);
    } catch (err) {
      alert('Lỗi tạo lịch nội dung: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPostHook = (hook, id) => {
    navigator.clipboard.writeText(hook);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Xuất file CSV chuẩn UTF-8 (tương thích Excel và Google Sheets không bị lỗi font tiếng Việt)
  const handleExportCSV = () => {
    if (!calendar || !calendar.posts || calendar.posts.length === 0) {
      alert('Chưa có danh sách bài đăng để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Kênh',
      'Thời gian/Ngày',
      'Giai đoạn Phễu',
      'Trụ cột (Pillar)',
      'Định dạng',
      'Chủ đề/Tiêu đề bài viết',
      'Câu Hook 3s đầu',
      'Dàn ý nội dung',
      'CTA (Kêu gọi hành động)',
      'Mã Insight truy xuất',
      'Trích dẫn nguyên văn khách hàng (Verbatim)',
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = calendar.posts.map((post, index) => {
      const outlineStr = Array.isArray(post.keyOutline) ? post.keyOutline.join(' | ') : (post.keyOutline || '');
      const insightCode = post.traceableInsight?.insightCode || post.traceableInsight?.insightType || '';
      const verbatim = post.traceableInsight?.verbatimEvidence || '';

      return [
        index + 1,
        calendar.channel || selectedChannel,
        post.day || `Bài ${post.id}`,
        post.funnelStage || '',
        post.pillarName || post.pillarId || '',
        post.format || '',
        post.topic || '',
        post.hook || '',
        outlineStr,
        post.callToAction || '',
        insightCode,
        verbatim,
      ].map(escapeCSV).join(',');
    });

    // Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị đúng dấu tiếng Việt
    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
    const safeChannel = (calendar.channel || 'Lich_Content').replace(/\s+/g, '_');
    downloadFile(
      `${safeChannel}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Tầng 3: Execution
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lịch Nội Dung Đa Kênh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Chuyển hóa Chiến lược & Insight Khách hàng thành Kịch bản bài đăng chi tiết có truy vết nguồn gốc (Traceable).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {calendar && (
            <button
              onClick={handleReset}
              type="button"
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Làm mới
            </button>
          )}

          <button
            onClick={handleGenerateCalendar}
            disabled={loading}
            type="button"
            className="px-4 py-2 btn-brand text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tạo lịch...' : 'Bắt đầu Tạo Lịch'}
          </button>
        </div>
      </div>

      {/* Control Panel: Chọn Kênh & Thời Gian (Tối giản) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Chọn kênh */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Kênh triển khai:</label>
            <div className="flex flex-wrap gap-1.5">
              {channels.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    selectedChannel === ch
                      ? 'btn-brand text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn thời gian */}
          <div className="space-y-1.5 shrink-0">
            <label className="block text-xs font-medium text-slate-700">Khung thời gian:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-900 bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="7 ngày (Weekly Sprint)">7 ngày (Weekly Sprint)</option>
              <option value="14 ngày (Bi-weekly)">14 ngày (Bi-weekly)</option>
              <option value="30 ngày (Monthly Master)">30 ngày (Monthly Master)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
          Mỗi bài đăng sẽ tự động truy vết về đúng 1 Trụ cột (Pillar) và 1 Trích dẫn VoC thực tế.
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-1" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            AI đang lên kế hoạch kịch bản nội dung cho {selectedChannel}...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Đang truy vết từng nỗi đau của khách hàng để tạo câu Hook và dàn ý chi tiết.
          </p>
        </div>
      )}

      {/* Calendar Results */}
      {calendar && !loading && (
        <div className="space-y-6 pt-2">
          {/* Header Action Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="shrink-0">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">
                Kế Hoạch Xuất Bản
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                {calendar.channel} • {calendar.period}
              </h2>
              {calendar.focusSummary && (
                <p className="text-xs text-slate-300 mt-1 max-w-lg">
                  {calendar.focusSummary}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={handleExportCSV}
                type="button"
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                title="Tải bảng tính CSV để mở ngay trên Microsoft Excel hoặc Google Sheets"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất File Excel / CSV</span>
              </button>

              {onSyncToNotion && (
                <button
                  onClick={() => onSyncToNotion(`Lịch Nội Dung ${calendar.channel}`, { channel: calendar.channel, period: calendar.period }, calendar)}
                  type="button"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Đồng bộ Notion</span>
                </button>
              )}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {(calendar.posts || []).map((post) => (
              <div 
                key={post.id || post.day}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-xs transition hover:border-slate-300"
              >
                {/* Post Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                      {post.day || `Bài ${post.id}`}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {post.funnelStage || 'TOFU'}
                    </span>
                    {post.format && (
                      <span className="text-[11px] text-slate-500">
                        • {post.format}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-medium">
                    {post.pillarName || post.pillarId || 'Pillar'}
                  </span>
                </div>

                {/* Topic Title */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {post.topic}
                  </h3>
                </div>

                {/* Hook Box */}
                {post.hook && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        Câu Hook Mở Đầu (3 Giây Đầu):
                      </span>
                      <p className="font-medium text-slate-800 italic">
                        "{post.hook}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyPostHook(post.hook, post.id)}
                      className="text-slate-500 hover:text-slate-900 transition p-1 cursor-pointer shrink-0"
                      title="Sao chép câu hook"
                    >
                      {copiedId === post.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                {/* Key Outline */}
                {post.keyOutline && post.keyOutline.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Dàn ý triển khai:
                    </span>
                    <ul className="space-y-1 text-slate-700 pl-3">
                      {post.keyOutline.map((item, idx) => (
                        <li key={idx} className="list-disc leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                {post.callToAction && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Kêu gọi hành động (CTA):</span> {post.callToAction}
                  </div>
                )}

                {/* Traceable Insight Box */}
                {post.traceableInsight && (
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">
                        Nguồn gốc Insight: {post.traceableInsight.insightType || 'VoC'}
                      </span>
                      {post.traceableInsight.insightCode && (
                        <span className="font-mono text-[10px] text-slate-500">
                          {post.traceableInsight.insightCode}
                        </span>
                      )}
                    </div>
                    {post.traceableInsight.verbatimEvidence && (
                      <p className="italic text-slate-600">
                        "{post.traceableInsight.verbatimEvidence}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
