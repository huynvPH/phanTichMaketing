import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Target, 
  Compass, 
  Radio, 
  FileText,
  BookmarkCheck,
  ArrowRight
} from 'lucide-react';
export default function ContentStrategyView({ 
  currentModel, 
  researchContext, 
  strategyData, 
  onSaveStrategy, 
  onSyncToNotion,
  onNavigateToCalendar 
}) {
  const [formData, setFormData] = useState({
    brandPositioning: '',
    targetCustomer: '',
    brandTonePreference: '',
    customNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(strategyData || null);

  useEffect(() => {
    setStrategy(strategyData || null);
  }, [strategyData]);

  // Thống kê số lượng insights đã thu thập được từ các bước trước
  const insightCount = {
    vocPainPoints: researchContext?.voc?.painPoints?.length || 0,
    vocObjections: researchContext?.voc?.objections?.length || 0,
    searchClusters: researchContext?.search?.intentClusters?.length || 0,
    competitorAngles: researchContext?.competitor?.winningFormats?.length || 0,
  };

  const handleGenerateStrategy = async () => {
    setLoading(true);
    try {
      // Gom toàn bộ insights từ context để đưa vào AI làm căn cứ lập chiến lược
      const combinedResearchData = {
        brandInput: formData,
        customerResearchInsights: {
          vocData: researchContext?.voc || 'Chưa có VoC chi tiết, dùng bối cảnh chung',
          searchDemand: researchContext?.search || 'Chưa có Search Intent chi tiết',
          competitorData: researchContext?.competitor || 'Chưa có Competitor chi tiết',
          offerData: researchContext?.offer || 'Chưa có Offer chi tiết',
        },
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'strategy',
          model: currentModel,
          rawData: combinedResearchData,
          metadata: {
            industry: 'Mỹ phẩm & Chăm sóc da',
            product: formData.brandPositioning,
            targetAudience: formData.targetCustomer,
            source: 'Tổng hợp Customer Research Hub',
          },
          customPrompt: `Thiết lập 3-4 Content Pillars bám sát 100% vào các Nỗi đau, Rào cản và Động lực mua của khách hàng. Phân chia rõ tỷ lệ % và ma trận vai trò từng kênh.`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStrategy(data.data);
      if (onSaveStrategy) onSaveStrategy(data.data);
    } catch (err) {
      alert('Lỗi tạo chiến lược: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              Tầng 2: Strategy
            </span>
            <h2 className="text-lg font-bold text-slate-900">Chiến Lược Nội Dung Thương Hiệu (Content Strategy)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chuyển hóa Customer Insights thành Trụ Cột Nội Dung (Pillars), Tỷ Lệ Phân Bổ và Định Vị Vai Trò Từng Kênh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateStrategy}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang Tổng Hợp...' : 'AI Tổng Hợp Chiến Lược'}
          </button>
        </div>
      </div>

      {/* Thanh trạng thái dữ liệu nghiên cứu đã thu thập */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">Dữ liệu Nghiên cứu Khách hàng sẵn có làm căn cứ:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            💬 VoC Nỗi đau: <strong className="text-indigo-600">{insightCount.vocPainPoints}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            🛑 Rào cản hoài nghi: <strong className="text-indigo-600">{insightCount.vocObjections}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            🔍 Nhu cầu tìm kiếm: <strong className="text-indigo-600">{insightCount.searchClusters}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            ⚔️ Góc đối thủ: <strong className="text-indigo-600">{insightCount.competitorAngles}</strong>
          </span>
        </div>
      </div>

      {/* Form cấu hình định vị thương hiệu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <label className="block text-slate-600 font-medium">Định vị thương hiệu / Sản phẩm:</label>
          <input
            type="text"
            placeholder="VD: Dược mỹ phẩm trị mụn cho da dầu nhạy cảm..."
            value={formData.brandPositioning}
            onChange={(e) => setFormData({ ...formData, brandPositioning: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <label className="block text-slate-600 font-medium">Khách hàng mục tiêu nhắm tới:</label>
          <input
            type="text"
            placeholder="VD: Gen Z & Dân văn phòng 18-28 tuổi..."
            value={formData.targetCustomer}
            onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <label className="block text-slate-600 font-medium">Giọng điệu mong muốn (Tone of Voice):</label>
          <input
            type="text"
            placeholder="VD: Chuyên gia khoa học nhưng gần gũi..."
            value={formData.brandTonePreference}
            onChange={(e) => setFormData({ ...formData, brandTonePreference: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Hiển thị kết quả Chiến Lược */}
      {strategy && (
        <div className="space-y-6">
          {/* Action bar xuất Notion và sang Calendar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-950">
                Chiến lược nội dung đã sẵn sàng để chuyển hóa sang Lịch Nội Dung (Calendar)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSyncToNotion('Chiến Lược Nội Dung Thương Hiệu', formData, strategy)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition"
              >
                <Share2 className="h-3.5 w-3.5 text-indigo-600" /> Xuất sang Notion
              </button>

              <button
                onClick={onNavigateToCalendar}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Tạo Calendar Cho Từng Kênh <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 1. Tuyên ngôn định vị & Tone of Voice */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Định vị */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5" /> Tuyên Ngôn Định Vị Nội Dung
                </span>
                <p className="text-xs font-bold text-slate-900 leading-relaxed mt-2">
                  "{strategy.brandSummary}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 block">Giọng điệu chủ đạo:</span>
                <span className="text-xs font-semibold text-indigo-700">
                  {strategy.toneOfVoice?.primary}
                </span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {strategy.toneOfVoice?.keywords?.map((kw, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Dos & Don'ts */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  NÊN LÀM (Brand Dos)
                </div>
                <ul className="space-y-1.5 text-slate-700 text-[11px]">
                  {strategy.toneOfVoice?.do?.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  TUYỆT ĐỐI TRÁNH (Brand Don'ts)
                </div>
                <ul className="space-y-1.5 text-slate-700 text-[11px]">
                  {strategy.toneOfVoice?.dont?.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Content Pillars (Các Trụ Cột Nội Dung Cốt Lõi) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Các Trụ Cột Nội Dung Cốt Lõi (Content Pillars)
              </h3>
              <span className="text-xs text-slate-500">
                Neo chặt vào Nỗi đau & Rào cản VoC đã nghiên cứu
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategy.contentPillars?.map((pillar, idx) => {
                const colors = [
                  { badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', bar: 'bg-indigo-600' },
                  { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bar: 'bg-emerald-600' },
                  { badge: 'bg-amber-100 text-amber-800 border-amber-200', bar: 'bg-amber-600' },
                ][idx % 3];

                return (
                  <div key={pillar.id || idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors.badge}`}>
                          {pillar.id} • {pillar.ratioPercent}% Tỷ trọng
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${colors.bar}`} style={{ width: `${pillar.ratioPercent}%` }} />
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {pillar.name}
                      </h4>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                        <strong className="text-slate-800 block text-[10px] uppercase">Neo vào Insight:</strong>
                        {pillar.targetInsight}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-700">Mục tiêu:</strong> {pillar.objective}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-700 block mb-1">Các góc khai thác chính:</span>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {pillar.keyAngles?.map((angle, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-indigo-600">•</span>
                            <span>{angle}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Phân Vai Trò Theo Kênh (Channel Matrix) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="h-4 w-4 text-indigo-600" />
              Ma Trận Định Vị Vai Trò Từng Kênh (Channel Roles)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategy.channelRoles?.map((cr, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-600" /> {cr.channel}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {cr.postingFrequency}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700">
                    <strong className="text-slate-800">Vai trò:</strong> {cr.role}
                  </p>

                  <div>
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">Định dạng chủ đạo:</span>
                    <div className="flex flex-wrap gap-1">
                      {cr.primaryFormats?.map((fmt, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
