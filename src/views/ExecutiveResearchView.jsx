import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  Share2, 
  Compass, 
  Search, 
  MessageSquare, 
  Swords, 
  Tag, 
  Layers
} from 'lucide-react';

export default function ExecutiveResearchView({ 
  currentModel, 
  researchContext, 
  onSaveAllResearch, 
  onNavigateToStrategy, 
  onSyncToNotion 
}) {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('marketing_executive_form');
      return saved ? JSON.parse(saved) : {
        productName: '',
        industry: '',
        targetAudience: '',
        businessGoal: '',
        customerPainRaw: '',
        competitorAndOffer: '',
      };
    } catch {
      return {
        productName: '',
        industry: '',
        targetAudience: '',
        businessGoal: '',
        customerPainRaw: '',
        competitorAndOffer: '',
      };
    }
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('marketing_executive_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem('marketing_executive_form', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResetForm = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới form nhập liệu?')) {
      const empty = {
        productName: '',
        industry: '',
        targetAudience: '',
        businessGoal: '',
        customerPainRaw: '',
        competitorAndOffer: '',
      };
      setFormData(empty);
      setResult(null);
      try {
        localStorage.removeItem('marketing_executive_form');
        localStorage.removeItem('marketing_executive_result');
      } catch {}
    }
  };

  const handleAnalyzeAll = async () => {
    if (!formData.productName.trim() && !formData.customerPainRaw.trim()) {
      alert('Vui lòng nhập tên sản phẩm hoặc nội dung phản hồi của khách hàng.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'all_in_one_research',
          model: currentModel,
          rawData: {
            productName: formData.productName,
            industry: formData.industry,
            targetAudience: formData.targetAudience,
            businessGoal: formData.businessGoal,
            customerFeedbackAndPain: formData.customerPainRaw,
            competitorAndOffer: formData.competitorAndOffer,
          },
          metadata: {
            product: formData.productName,
            industry: formData.industry,
            targetAudience: formData.targetAudience,
            source: 'Executive Research',
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra khi phân tích.');
      }

      const analyzed = data.data;
      setResult(analyzed);
      try {
        localStorage.setItem('marketing_executive_result', JSON.stringify(analyzed));
      } catch {}

      if (onSaveAllResearch) {
        onSaveAllResearch(analyzed, formData);
      }
    } catch (err) {
      alert('Lỗi phân tích: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Tầng 1: Customer Research
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Nghiên Cứu Khách Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Nhập đề bài và dữ liệu phản hồi thực tế của khách hàng. Hệ thống tự động phân tích toàn diện 5 nhánh và chuyển tiếp sang Chiến lược nội dung.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(formData.productName || formData.customerPainRaw || result) && (
            <button
              onClick={handleResetForm}
              type="button"
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Làm mới
            </button>
          )}

          <button
            onClick={handleAnalyzeAll}
            disabled={loading}
            type="button"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang phân tích...' : 'Bắt đầu Phân tích'}
          </button>
        </div>
      </div>

      {/* Input Form Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
        {/* Section 1: Thông tin sản phẩm & thị trường */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Thông Tin Sản Phẩm & Mục Tiêu
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tên Sản phẩm / Dịch vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="Nhập tên sản phẩm hoặc dịch vụ..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Ngành hàng / Lĩnh vực
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Ví dụ: Mỹ phẩm, Gia dụng, Thời trang, F&B..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Khách hàng mục tiêu
              </label>
              <textarea
                rows={2}
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="Độ tuổi, giới tính, đặc điểm, thói quen, tâm lý..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Mục tiêu kinh doanh cốt lõi
              </label>
              <textarea
                rows={2}
                value={formData.businessGoal}
                onChange={(e) => handleInputChange('businessGoal', e.target.value)}
                placeholder="Mục tiêu doanh số, kênh bán lẻ (TikTok, Shopee, Facebook)..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Phản hồi khách hàng & Nỗi đau */}
        <div className="space-y-3 pt-2">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Phản Hồi Khách Hàng & Nỗi Đau (VoC)
            </h2>
            <span className="text-[11px] text-slate-400">Dữ liệu quan trọng nhất</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Dán các bình luận, phản hồi, review hoặc tin nhắn thực tế của khách hàng:
            </label>
            <textarea
              rows={6}
              value={formData.customerPainRaw}
              onChange={(e) => handleInputChange('customerPainRaw', e.target.value)}
              placeholder="Dán các câu nói hoặc phản hồi thực tế của khách tại đây... (Mỗi ý một dòng)"
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Section 3: Đối thủ & Ưu đãi */}
        <div className="space-y-3 pt-2">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Đối Thủ Cạnh Tranh & Ưu Đãi (Tùy chọn)
            </h2>
          </div>

          <div>
            <textarea
              rows={3}
              value={formData.competitorAndOffer}
              onChange={(e) => handleInputChange('competitorAndOffer', e.target.value)}
              placeholder="Tên đối thủ, điểm mạnh/yếu của họ hoặc ý tưởng quà tặng, chính sách cam kết dự kiến..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Submit Button Row */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={handleAnalyzeAll}
            disabled={loading}
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang phân tích 5 nhánh...' : 'Phân tích Nghiên cứu Khách hàng'}
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="p-8 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-2">
          <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-1" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            AI đang phân tích dữ liệu nghiên cứu...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hệ thống đang bóc tách Định khung, Nhu cầu tìm kiếm, Tiếng nói khách hàng, Đối thủ và Ưu đãi.
          </p>
        </div>
      )}

      {/* Results Document */}
      {result && !loading && (
        <div className="space-y-6 pt-4">
          {/* Header Bar of Results */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Báo Cáo Nghiên Cứu
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Bức Tranh Chiến Lược Khách Hàng
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {onSyncToNotion && (
                <button
                  onClick={() => onSyncToNotion('Nghiên Cứu Khách Hàng', formData, result)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Đồng bộ Notion
                </button>
              )}

              {onNavigateToStrategy && (
                <button
                  onClick={onNavigateToStrategy}
                  type="button"
                  className="px-4 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  Sang Tầng 2: Lập Chiến Lược
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tóm Tắt Dành Cho Lãnh Đạo
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {result.executiveSummary || 'Chưa có tóm tắt.'}
            </p>

            {result.topStrategicPriorities && result.topStrategicPriorities.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Ưu tiên hành động chiến lược:
                </span>
                <div className="space-y-1.5">
                  {result.topStrategicPriorities.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 shrink-0">{idx + 1}.</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Branch Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả 5 nhánh
            </button>
            <button
              onClick={() => setActiveSection('framing')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'framing'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Định Khung
            </button>
            <button
              onClick={() => setActiveSection('search')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'search'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Nhu Cầu Tìm Kiếm
            </button>
            <button
              onClick={() => setActiveSection('voc')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'voc'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Tiếng Nói Khách Hàng (VoC)
            </button>
            <button
              onClick={() => setActiveSection('competitor')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'competitor'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Đối Thủ
            </button>
            <button
              onClick={() => setActiveSection('offer')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'offer'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Quảng Cáo & Offer
            </button>
          </div>

          {/* Section: 1. Framing */}
          {(activeSection === 'all' || activeSection === 'framing') && result.framing && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Compass className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Định Khung Đề Bài Nghiên Cứu
                </h4>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Mục tiêu quyết định:</span>
                  <p className="text-slate-800 mt-0.5">{result.framing.clarifiedGoal}</p>
                </div>
                {result.framing.criticalQuestions && (
                  <div>
                    <span className="font-semibold text-slate-700">Câu hỏi then chốt:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-700">
                      {result.framing.criticalQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: 2. Search */}
          {(activeSection === 'all' || activeSection === 'search') && result.search && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Search className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Nhu Cầu Tìm Kiếm & Ý Định Mua
                </h4>
              </div>
              <p className="text-xs text-slate-700">{result.search.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {(result.search.intentClusters || []).map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{c.theme}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{c.searchIntent}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{(c.questions || []).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: 3. VoC */}
          {(activeSection === 'all' || activeSection === 'voc') && result.voc && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <MessageSquare className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Tiếng Nói Khách Hàng (VoC)
                </h4>
              </div>
              <p className="text-xs text-slate-700">{result.voc.summary}</p>

              {/* Marketing Hooks */}
              {result.voc.marketingHooks && result.voc.marketingHooks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Gợi ý Câu Hook (Theo ngôn từ của khách):
                  </span>
                  <div className="space-y-1.5">
                    {result.voc.marketingHooks.map((hk, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs text-slate-800">
                        <span className="italic">"{hk}"</span>
                        <button
                          type="button"
                          onClick={() => copyText(hk, i)}
                          className="text-slate-500 hover:text-slate-900 transition p-1 cursor-pointer shrink-0"
                          title="Sao chép"
                        >
                          {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pain points */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-800 block">Nỗi đau khách hàng & Trích dẫn:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(result.voc.painPoints || []).map((p, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                      <div className="font-semibold text-slate-900">{p.pain}</div>
                      {p.quote && <p className="italic text-slate-600 text-[11px]">"{p.quote}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: 4. Competitor */}
          {(activeSection === 'all' || activeSection === 'competitor') && result.competitor && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Swords className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  4. Nội Dung Đối Thủ & Góc Tiếp Cận
                </h4>
              </div>
              <p className="text-xs text-slate-700">{result.competitor.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">Format hiệu quả:</span>
                  <div className="space-y-1.5">
                    {(result.competitor.winningFormats || []).map((f, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                        <span className="font-semibold text-slate-900 block">{f.format}</span>
                        <span className="text-slate-600 text-[11px]">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">Góc Đại Dương Xanh:</span>
                  <div className="space-y-1.5">
                    {(result.competitor.blueOceanAngles || []).map((b, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                        <span className="font-semibold text-slate-900 block">{b.angle}</span>
                        <span className="text-slate-600 text-[11px]">{b.executionIdea}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: 5. Offer */}
          {(activeSection === 'all' || activeSection === 'offer') && result.offer && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Tag className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  5. Quảng Cáo & Lời Chào Hàng (Offer)
                </h4>
              </div>
              <p className="text-xs text-slate-700">{result.offer.summary}</p>
              {result.offer.improvedOfferIdea && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900 block">
                    Gợi ý Lời Chào Hàng: {result.offer.improvedOfferIdea.coreOffer}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">Quà tặng kèm:</span>
                      <ul className="list-disc list-inside mt-0.5">
                        {(result.offer.improvedOfferIdea.bonuses || []).map((bn, bi) => <li key={bi}>{bn}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Đảo ngược rủi ro:</span>
                      <p className="mt-0.5">{result.offer.improvedOfferIdea.riskReversal}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          {onNavigateToStrategy && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onNavigateToStrategy}
                type="button"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                Tiếp tục: Sang Tầng 2 (Chiến Lược Nội Dung)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
