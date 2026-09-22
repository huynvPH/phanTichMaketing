import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Share2, 
  Search, 
  Filter, 
  Link2, 
  Quote, 
  CheckCircle, 
  HelpCircle, 
  Video, 
  FileText, 
  Layers, 
  Eye, 
  X,
  Tag,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

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
  const [selectedPillarFilter, setSelectedPillarFilter] = useState('ALL');
  const [selectedFunnelFilter, setSelectedFunnelFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [loading, setLoading] = useState(false);
  const [calendar, setCalendar] = useState(calendarData || null);
  const [activePostInspect, setActivePostInspect] = useState(null);

  useEffect(() => {
    setCalendar(calendarData || null);
  }, [calendarData]);

  const channels = ['TikTok', 'Facebook Fanpage', 'Shopee/Reels', 'Website/Blog SEO', 'YouTube Shorts'];

  const handleGenerateCalendar = async () => {
    setLoading(true);
    try {
      // Chuẩn bị dữ liệu Grounding bắt buộc từ Research + Strategy
      const groundingPayload = {
        channel: selectedChannel,
        period: period,
        brandStrategy: strategyData || null,
        customerResearchEvidence: {
          vocData: researchContext?.voc || null,
          searchDemand: researchContext?.search || null,
          competitorData: researchContext?.competitor || null,
          offerData: researchContext?.offer || null,
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
            source: 'Hệ thống Lập Lịch Truy Xuất Nguồn Gốc',
          },
          customPrompt: `BẮT BUỘC: Không tự bịa topic. Mỗi post phải gán chính xác insightCode và verbatimEvidence (trích dẫn nguyên văn) từ dữ liệu nghiên cứu khách hàng đã cho.`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCalendar(data.data);
      if (onSaveCalendar) onSaveCalendar(data.data);
    } catch (err) {
      alert('Lỗi tạo lịch nội dung: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  // Lọc bài viết theo Pillar & Funnel
  const filteredPosts = calendar?.posts?.filter((post) => {
    if (selectedPillarFilter !== 'ALL' && post.pillarId !== selectedPillarFilter) return false;
    if (selectedFunnelFilter !== 'ALL' && post.funnelStage !== selectedFunnelFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Tầng 3: Execution
            </span>
            <h2 className="text-lg font-bold text-slate-900">Lịch Nội Dung Đa Kênh Có Truy Xuất Nguồn Gốc</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi bài viết đều gắn chặt với Trích dẫn nguyên văn của khách hàng (VoC) và Trụ cột chiến lược (Pillar).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateCalendar}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang Tạo Lịch...' : 'AI Tạo Lịch Có Truy Vết'}
          </button>
        </div>
      </div>

      {/* Control Bar: Chọn kênh & Bộ lọc */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Chọn Kênh */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="font-bold text-slate-700 shrink-0">Kênh:</span>
            {channels.map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedChannel === ch
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Chọn Khung thời gian */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Khung thời gian:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white focus:outline-none focus:border-indigo-600 font-medium"
            >
              <option value="7 ngày (Weekly Sprint)">7 ngày (Weekly Sprint)</option>
              <option value="14 ngày (Bi-weekly)">14 ngày (Bi-weekly)</option>
              <option value="30 ngày (Monthly Master)">30 ngày (Monthly Master)</option>
            </select>
          </div>
        </div>

        {/* Bộ lọc Pillar & Funnel & Chuyển View */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Lọc Trụ Cột:</span>
              <select
                value={selectedPillarFilter}
                onChange={(e) => setSelectedPillarFilter(e.target.value)}
                className="p-1 rounded border border-slate-200 bg-slate-50 text-slate-700 text-xs"
              >
                <option value="ALL">Tất cả Trụ cột</option>
                <option value="PIL-1">PIL-1: Thấu Cảm Nỗi Đau</option>
                <option value="PIL-2">PIL-2: Bằng Chứng & Hoài Nghi</option>
                <option value="PIL-3">PIL-3: Chuyển Đổi & Offer</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Lọc Phễu:</span>
              <select
                value={selectedFunnelFilter}
                onChange={(e) => setSelectedFunnelFilter(e.target.value)}
                className="p-1 rounded border border-slate-200 bg-slate-50 text-slate-700 text-xs"
              >
                <option value="ALL">Tất cả giai đoạn</option>
                <option value="TOFU">TOFU (Nhận thức)</option>
                <option value="MOFU">MOFU (Cân nhắc)</option>
                <option value="BOFU">BOFU (Chuyển đổi)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Lưới Tuần (Grid)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Bảng Truy Vết (Table)
            </button>
          </div>
        </div>
      </div>

      {/* Thông tin Lịch & Nút xuất Notion */}
      {calendar && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-slate-900">
                  {calendar.channel} • {calendar.period}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {filteredPosts.length} Bài Viết Đã Kiểm Định Nguồn Gốc
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {calendar.focusSummary}
              </p>
            </div>

            <button
              onClick={() => onSyncToNotion(`Lịch Nội Dung ${calendar.channel}`, { channel: calendar.channel, period: calendar.period }, calendar)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition shrink-0"
            >
              <Share2 className="h-3.5 w-3.5 text-indigo-600" /> Xuất Calendar sang Notion
            </button>
          </div>

          {/* DẠNG 1: GRID VIEW (Lưới ngày trong tuần) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => {
                const trace = post.traceableInsight || {};
                const funnelColors = {
                  TOFU: 'bg-sky-50 text-sky-700 border-sky-200',
                  MOFU: 'bg-amber-50 text-amber-700 border-amber-200',
                  BOFU: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                }[post.funnelStage] || 'bg-slate-100 text-slate-700';

                return (
                  <div
                    key={post.id}
                    onClick={() => setActivePostInspect(post)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2.5">
                      {/* Badge hàng đầu */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {post.day}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${funnelColors}`}>
                            {post.funnelStage}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {post.pillarId}
                          </span>
                        </div>
                      </div>

                      {/* Tiêu đề & Hook */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2">
                          {post.topic}
                        </h4>
                        <p className="text-[11px] text-slate-600 italic mt-1 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {post.hook}
                        </p>
                      </div>

                      {/* Định dạng */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Video className="h-3 w-3 text-indigo-500" />
                        <span className="truncate">{post.format}</span>
                      </div>
                    </div>

                    {/* KHU VỰC TRUY XUẤT NGUỒN GỐC (TRACEABILITY BADGE) */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Link2 className="h-3 w-3 text-indigo-600" /> Căn Cứ Insight:
                        </span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {trace.insightCode || '[VoC]'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 line-clamp-2 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                        💬 <strong className="font-semibold text-slate-800">Khách nói: </strong> 
                        <span className="italic">{trace.verbatimEvidence || 'Dựa trên VoC'}</span>
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-indigo-600 font-semibold pt-1">
                        <span>Bấm để soi toàn bộ nguồn gốc</span>
                        <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DẠNG 2: TABLE VIEW (Bảng đối chiếu kiểm toán nguồn gốc) */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-3">Ngày & Phễu</th>
                      <th className="p-3">Tiêu Đề & Hook</th>
                      <th className="p-3">Trụ Cột (Pillar)</th>
                      <th className="p-3">Insight Nguồn & Trích Dẫn Khách (Traceability)</th>
                      <th className="p-3">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPosts.map((post) => {
                      const trace = post.traceableInsight || {};
                      return (
                        <tr key={post.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 align-top whitespace-nowrap space-y-1">
                            <span className="font-bold text-slate-900 block">{post.day}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {post.funnelStage}
                            </span>
                          </td>

                          <td className="p-3 align-top max-w-xs space-y-1">
                            <span className="font-bold text-slate-900 block leading-snug">{post.topic}</span>
                            <span className="text-[11px] text-slate-600 italic block">{post.hook}</span>
                            <span className="text-[10px] text-slate-400 block">{post.format}</span>
                          </td>

                          <td className="p-3 align-top whitespace-nowrap">
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded block">
                              {post.pillarId}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1 max-w-[140px] truncate">
                              {post.pillarName}
                            </span>
                          </td>

                          <td className="p-3 align-top max-w-sm space-y-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                              <Link2 className="h-3 w-3" /> {trace.insightCode} • {trace.insightType}
                            </div>
                            <blockquote className="text-[11px] text-slate-700 bg-amber-50/70 p-2 rounded border border-amber-200/70 italic">
                              "{trace.verbatimEvidence}"
                            </blockquote>
                            <p className="text-[10px] text-slate-500">
                              💡 <strong>Lý do chọn:</strong> {trace.rationale}
                            </p>
                          </td>

                          <td className="p-3 align-top whitespace-nowrap">
                            <button
                              onClick={() => setActivePostInspect(post)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition"
                            >
                              Xem Chi Tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* POPUP KIỂM TOÁN NGUỒN GỐC (TRACEABILITY INSPECTOR MODAL) */}
      {activePostInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bảng Kiểm Định Nguồn Gốc Bài Viết ({activePostInspect.day})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Đối chiếu tính logic giữa Insight khách hàng và Kịch bản nội dung
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivePostInspect(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* 1. Thông tin bài đăng */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {activePostInspect.topic}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    {activePostInspect.pillarId}: {activePostInspect.pillarName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hook mở đầu:</span>
                  <p className="text-xs font-semibold text-indigo-900 bg-white p-2.5 rounded-lg border border-slate-200">
                    {activePostInspect.hook}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span><strong>Định dạng:</strong> {activePostInspect.format}</span>
                  <span><strong>Giai đoạn phễu:</strong> {activePostInspect.funnelStage}</span>
                </div>
              </div>

              {/* 2. KHU VỰC TRUY XUẤT NGUỒN GỐC CỐT LÕI */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-amber-700" /> BẰNG CHỨNG THỰC TẾ TRUY XUẤT TỪ NGHIÊN CỨU
                  </span>
                  <span className="text-[11px] font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">
                    {activePostInspect.traceableInsight?.insightCode || '[VoC Evidence]'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                    Trích dẫn nguyên văn câu nói của khách (Verbatim Quote):
                  </span>
                  <blockquote className="text-xs font-medium text-slate-800 bg-white p-3 rounded-lg border border-amber-200 italic shadow-2xs">
                    "{activePostInspect.traceableInsight?.verbatimEvidence}"
                  </blockquote>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                    Tại sao bài viết này giải quyết đúng Insight trên (Rationale):
                  </span>
                  <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-amber-100 leading-relaxed">
                    {activePostInspect.traceableInsight?.rationale}
                  </p>
                </div>
              </div>

              {/* 3. Dàn ý kịch bản & CTA */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 text-xs block">
                  Dàn Ý Triển Khai Nội Dung (Outline):
                </span>
                <ul className="space-y-1.5 text-slate-700 text-xs">
                  {activePostInspect.keyOutline?.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Lời kêu gọi hành động (CTA):</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
                    {activePostInspect.callToAction}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActivePostInspect(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
