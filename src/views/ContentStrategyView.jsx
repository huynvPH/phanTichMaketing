import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Share2, 
  Check, 
  Layers, 
  Compass, 
  CheckCircle2, 
  XCircle,
  RotateCcw
} from 'lucide-react';

export default function ContentStrategyView({ 
  currentModel, 
  researchContext, 
  strategyData, 
  onSaveStrategy, 
  onSyncToNotion,
  onNavigateToCalendar 
}) {
  // Lấy dữ liệu sản phẩm ban đầu từ Tầng 1 nếu có sẵn
  const initialProduct = researchContext?.executive?.framing?.clarifiedGoal 
    || researchContext?.framing?.formData?.goal 
    || '';

  const initialAudience = researchContext?.executive?.voc?.summary
    || '';

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('marketing_strategy_form');
      return saved ? JSON.parse(saved) : {
        brandPositioning: initialProduct,
        targetCustomer: initialAudience,
        brandTonePreference: '',
      };
    } catch {
      return {
        brandPositioning: initialProduct,
        targetCustomer: initialAudience,
        brandTonePreference: '',
      };
    }
  });

  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(strategyData || null);

  useEffect(() => {
    setStrategy(strategyData || null);
  }, [strategyData]);

  // Cập nhật lại form nếu có dữ liệu mới từ researchContext
  useEffect(() => {
    if (!formData.brandPositioning && initialProduct) {
      setFormData((prev) => ({
        ...prev,
        brandPositioning: initialProduct,
      }));
    }
  }, [initialProduct]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem('marketing_strategy_form', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới phần chiến lược?')) {
      const empty = { brandPositioning: '', targetCustomer: '', brandTonePreference: '' };
      setFormData(empty);
      setStrategy(null);
      try {
        localStorage.removeItem('marketing_strategy_form');
        localStorage.removeItem('marketing_brand_strategy');
      } catch {}
    }
  };

  const handleGenerateStrategy = async () => {
    setLoading(true);
    try {
      const combinedResearchData = {
        brandInput: formData,
        customerResearchInsights: {
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
          moduleType: 'strategy',
          model: currentModel,
          rawData: combinedResearchData,
          metadata: {
            product: formData.brandPositioning,
            targetAudience: formData.targetCustomer,
            source: 'Hệ thống Chiến Lược Nội Dung Tầng 2',
          },
          customPrompt: `Thiết lập 3-4 Content Pillars bám sát 100% vào các Nỗi đau VoC, Rào cản và Động lực mua của khách hàng. Phân chia rõ tỷ lệ % và ma trận vai trò từng kênh.`,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi khi tạo chiến lược');

      setStrategy(data.data);
      if (onSaveStrategy) onSaveStrategy(data.data);
    } catch (err) {
      alert('Lỗi tạo chiến lược: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Tầng 2: Strategy
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Chiến Lược Nội Dung
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Chuyển hóa Customer Insights thành Trụ Cột Nội Dung (Pillars), Giọng điệu và Định vị Kênh phân bổ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(formData.brandPositioning || strategy) && (
            <button
              onClick={handleReset}
              type="button"
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Làm mới
            </button>
          )}

          <button
            onClick={handleGenerateStrategy}
            disabled={loading}
            type="button"
            className="px-4 py-2 btn-brand text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang tổng hợp...' : 'Bắt đầu Lập Chiến Lược'}
          </button>
        </div>
      </div>


      {/* Form cấu hình định vị thương hiệu (Đơn giản, sạch sẽ) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          Định Vị Thương Hiệu & Giọng Điệu
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Định vị Sản phẩm / Thương hiệu
            </label>
            <input
              type="text"
              value={formData.brandPositioning}
              onChange={(e) => handleInputChange('brandPositioning', e.target.value)}
              placeholder="Nhập tên sản phẩm hoặc định vị..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Khách hàng mục tiêu
            </label>
            <input
              type="text"
              value={formData.targetCustomer}
              onChange={(e) => handleInputChange('targetCustomer', e.target.value)}
              placeholder="Tệp khách hàng trọng tâm..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Giọng điệu mong muốn (Tone of Voice)
            </label>
            <input
              type="text"
              value={formData.brandTonePreference}
              onChange={(e) => handleInputChange('brandTonePreference', e.target.value)}
              placeholder="Ví dụ: Chân thành, chuyên gia, thực chiến..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white"
            />
          </div>
        </div>

      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-1" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            AI đang xây dựng Chiến Lược Nội Dung...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Đang liên kết Nỗi đau VoC vào các Trụ cột nội dung và phân bổ vai trò từng kênh.
          </p>
        </div>
      )}

      {/* Results Document */}
      {strategy && !loading && (
        <div className="space-y-6 pt-2">
          {/* Header Action Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Bản Kế Hoạch Chiến Lược
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Khung Chiến Lược Nội Dung Thương Hiệu
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {onSyncToNotion && (
                <button
                  onClick={() => onSyncToNotion('Chiến Lược Nội Dung', formData, strategy)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Đồng bộ Notion
                </button>
              )}

              {onNavigateToCalendar && (
                <button
                  onClick={onNavigateToCalendar}
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  Sang Tầng 3: Lập Lịch Đăng
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 1. Tuyên ngôn định vị & Giọng điệu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Tuyên Ngôn Định Vị Nội Dung
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                "{strategy.brandSummary}"
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Giọng Điệu Chủ Đạo
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {strategy.toneOfVoice?.primary}
              </p>
              {strategy.toneOfVoice?.keywords && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {strategy.toneOfVoice.keywords.map((kw, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dos & Don'ts */}
          {strategy.toneOfVoice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  NÊN LÀM (Brand Dos)
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {(strategy.toneOfVoice.do || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  TRÁNH LÀM (Brand Don'ts)
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {(strategy.toneOfVoice.dont || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 2. Content Pillars */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Các Trụ Cột Nội Dung Cốt Lõi (Content Pillars)
              </h3>
              <span className="text-[11px] text-slate-400">Gắn chặt vào Nỗi đau & Rào cản VoC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(strategy.contentPillars || []).map((pillar, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {pillar.id || `PIL-${idx + 1}`}
                      </span>
                      <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                        {pillar.ratioPercent}%
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs">
                      {pillar.name}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {pillar.objective}
                    </p>
                  </div>

                  {pillar.keyAngles && pillar.keyAngles.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 block">Góc triển khai:</span>
                      <ul className="text-[11px] text-slate-700 space-y-0.5">
                        {pillar.keyAngles.map((ang, ai) => (
                          <li key={ai} className="truncate">• {ang}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Phân bổ kênh */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Ma Trận Định Vị Kênh Phân Bổ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(strategy.channelRoles || []).map((ch, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ch.channel}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{ch.postingFrequency}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{ch.role}</p>
                  {ch.primaryFormats && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      Định dạng: <span className="text-slate-700 font-medium">{ch.primaryFormats.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          {onNavigateToCalendar && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onNavigateToCalendar}
                type="button"
                className="px-5 py-2.5 btn-brand text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                Tiếp tục: Sang Tầng 3 (Lập Lịch Đăng Bài)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
