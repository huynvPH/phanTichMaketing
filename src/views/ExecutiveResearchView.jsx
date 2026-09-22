import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Crown, 
  Layers, 
  Compass, 
  Search, 
  MessageSquareQuote, 
  Swords, 
  Tag, 
  ArrowRight, 
  RotateCcw, 
  Copy, 
  Check, 
  CheckCircle2, 
  Share2, 
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet
} from 'lucide-react';

const SAMPLE_DATA = {
  productName: 'Serum Thảo Dược Trị Mụn & Mờ Thâm AcneCare X',
  industry: 'Mỹ phẩm / Dược mỹ phẩm thiên nhiên cho giới trẻ',
  targetAudience: 'Gen Z, sinh viên & dân văn phòng 18-28 tuổi, da dầu mụn nhạy cảm, hay thức khuya, tự ti về ngoại hình khi giao tiếp',
  businessGoal: 'Ra mắt phễu bán lẻ mới trên TikTok Shop & Shopee Mall; Mục tiêu cán mốc 3.000 đơn/tháng với chỉ số ROAS > 3.0 và tỷ lệ quay lại > 25%',
  customerPainRaw: `Dùng nhiều loại kem trị mụn trôi nổi trên mạng bị kích ứng bong tróc rát hết cả mặt, sợ nhất là kem trộn chứa corticoid.
Mụn bọc sưng to đau nhức mà đi làm nhìn tự ti kinh khủng, suốt ngày phải đeo khẩu trang che mặt.
Uống thuốc tây trị mụn thì sợ hại gan, người lúc nào cũng nóng trong nổi thêm mụn.
Nhiều loại bôi lên bết dính nhờn rít cực kỳ khó chịu, tối đi ngủ dính hết vào gối chăn bẩn thỉu.
Dùng BHA với Retinol nghe review rần rần thì bị đẩy mụn bung bét không kiểm soát được, hoảng loạn không dám ra đường.
Muốn tìm một loại serum thảo dược lành tính, gom cồi mụn nhanh trong 48h mà không để lại vết thâm đen hay sẹo rỗ.`,
  competitorAndOffer: `Đối thủ chính: Klenzit MS, La Roche-Posay Duo+, Derma Forte, các dòng serum tràm trà Some By Mi.
Điểm yếu đối thủ: La Roche-Posay đắt, Klenzit MS hay gây khô rát bong tróc, các dòng giá rẻ thì khách sợ hàng giả/kem trộn.
Gợi ý Offer dự kiến: Mua 1 Serum trị mụn 30ml tặng 1 Gel rửa mặt dịu nhẹ 50ml + Freeship toàn quốc + Cam kết hoàn tiền 100% trong 14 ngày nếu da bị kích ứng hoặc không cải thiện.`
};

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
  const [activeResultTab, setActiveResultTab] = useState('summary');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Result state
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

  const handleLoadSample = () => {
    setFormData(SAMPLE_DATA);
    try {
      localStorage.setItem('marketing_executive_form', JSON.stringify(SAMPLE_DATA));
    } catch {}
  };

  const handleClearForm = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa trắng dữ liệu đã nhập trong Form?')) {
      const empty = {
        productName: '',
        industry: '',
        targetAudience: '',
        businessGoal: '',
        customerPainRaw: '',
        competitorAndOffer: '',
      };
      setFormData(empty);
      try {
        localStorage.removeItem('marketing_executive_form');
      } catch {}
    }
  };

  const handleAnalyzeAll = async () => {
    if (!formData.productName.trim() && !formData.customerPainRaw.trim()) {
      alert('Vui lòng nhập tối thiểu Tên sản phẩm hoặc Dữ liệu phản hồi/nỗi đau của khách hàng!');
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
            source: 'Executive Master Form (Tầng 1 Hợp Nhất)',
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra trong quá trình xử lý');
      }

      const analyzed = data.data;
      setResult(analyzed);
      try {
        localStorage.setItem('marketing_executive_result', JSON.stringify(analyzed));
      } catch {}

      // Đồng bộ nạp dữ liệu vào cả 5 nhánh trong researchContext
      if (onSaveAllResearch) {
        onSaveAllResearch(analyzed, formData);
      }
    } catch (err) {
      alert('Lỗi phân tích Tầng 1 Hợp Nhất: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="w-48 h-48 text-amber-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide flex items-center gap-1 shadow-sm">
                <Crown className="h-3.5 w-3.5 fill-current" /> Executive Master Form
              </span>
              <span className="text-xs text-indigo-300 font-medium">Tầng 1: Customer Research</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Nghiên Cứu Khách Hàng Hợp Nhất (1-Click)
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Dành riêng cho Lãnh đạo & Quản lý: Nhập toàn bộ bối cảnh đề bài vào 1 màn hình duy nhất. 
              Hệ thống tự động bóc tách chuẩn xác đồng thời cả 5 nhánh nghiên cứu và chuyển thẳng sang Chiến lược Nội dung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleLoadSample}
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Điền sẵn đề bài thực chiến để thử nghiệm nhanh"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              Nạp Mẫu Demo
            </button>

            <button
              onClick={handleClearForm}
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 text-xs font-semibold border border-slate-700 hover:border-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Xóa trắng form để nhập đề bài mới"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa Trắng
            </button>

            <button
              onClick={handleAnalyzeAll}
              disabled={loading}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Đang Phân Tích Cả 5 Nhánh...' : '🚀 Phân Tích Toàn Bộ Tầng 1'}
            </button>
          </div>
        </div>
      </div>

      {/* Unified Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Khối 1: Bối cảnh & Sản phẩm */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Sản Phẩm & Mục Tiêu</h2>
              <p className="text-[10px] text-slate-400">Định vị & Quyết định kinh doanh</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên Sản phẩm / Dịch vụ <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="VD: Serum Trị Mụn AcneCare X"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ngành hàng / Lĩnh vực:
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="VD: Dược mỹ phẩm / Chăm sóc da"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Khách hàng mục tiêu:
              </label>
              <textarea
                rows={2}
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="VD: Gen Z, sinh viên & văn phòng 18-28 tuổi hay thức khuya, da dầu mụn..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 text-slate-900 bg-slate-50/50 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mục tiêu quyết định kinh doanh cốt lõi:
              </label>
              <textarea
                rows={2}
                value={formData.businessGoal}
                onChange={(e) => handleInputChange('businessGoal', e.target.value)}
                placeholder="VD: Ra mắt phễu TikTok Shop đạt 3.000 đơn/tháng, ROAS > 3.0..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 text-slate-900 bg-slate-50/50 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Khối 2: Tiếng nói Khách hàng & Nỗi đau thô */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Tiếng Nói Khách Hàng (VoC)</h2>
              <p className="text-[10px] text-slate-400">Nỗi đau, review & trích dẫn thô</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Dán comment, review Shopee/TikTok Shop, tin nhắn tư vấn hoặc đoạn brief nỗi đau:
            </label>
            <textarea
              rows={11}
              value={formData.customerPainRaw}
              onChange={(e) => handleInputChange('customerPainRaw', e.target.value)}
              placeholder="Dán các phản hồi thực tế của khách hàng tại đây (Mỗi dòng 1 ý kiến hoặc 1 câu nói)...
Ví dụ:
- Dùng nhiều kem trị mụn bị bong tróc rát da, sợ kem trộn có corticoid
- Mụn bọc sưng to tự ti không dám bỏ khẩu trang
- Muốn loại nào thảo dược lành tính, gom cồi nhanh trong 48h..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 text-slate-900 bg-slate-50/50 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Khối 3: Đối thủ & Offer */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Đối Thủ & Lời Chào Hàng (Offer)</h2>
              <p className="text-[10px] text-slate-400">Cạnh tranh, khuyến mãi & cam kết</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Đối thủ trực diện, điểm yếu của họ và ý tưởng combo/ưu đãi dự kiến:
            </label>
            <textarea
              rows={11}
              value={formData.competitorAndOffer}
              onChange={(e) => handleInputChange('competitorAndOffer', e.target.value)}
              placeholder="Nhập thông tin đối thủ và offer dự kiến...
Ví dụ:
- Đối thủ chính: Klenzit MS, La Roche-Posay Duo+, Derma Forte...
- Điểm yếu đối thủ: La Roche-Posay giá đắt, Klenzit MS hay gây khô rát bong tróc da...
- Offer dự kiến: Mua 1 serum tặng sữa rửa mặt bọt dịu nhẹ + Cam kết hoàn tiền 100% nếu kích ứng..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600 text-slate-900 bg-slate-50/50 leading-relaxed font-sans"
            />
          </div>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-200 text-center space-y-4 animate-pulse">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white mb-1 shadow-md">
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-indigo-900">
            Hệ thống AI đang phân tích đồng thời cả 5 nhánh Tầng 1...
          </h3>
          <p className="text-xs text-indigo-700 max-w-lg mx-auto leading-relaxed">
            Đang tổng hợp Định khung đề bài ➔ Nhu cầu tìm kiếm ➔ Bóc tách VoC ➔ Tình báo đối thủ ➔ Thiết kế Grand Slam Offer. Vui lòng đợi trong giây lát.
          </p>
        </div>
      )}

      {/* Executive Results Dashboard */}
      {result && !loading && (
        <div className="space-y-6 pt-2">
          {/* Executive Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 border-2 border-indigo-200 shadow-md space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                    BÁO CÁO CẤP QUẢN LÝ
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Bức Tranh Toàn Cảnh & Khuyến Nghị Chiến Lược
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onSyncToNotion && (
                  <button
                    onClick={() => onSyncToNotion('Executive Research Tầng 1', formData, result)}
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                    Đồng Bộ Notion
                  </button>
                )}

                {onNavigateToStrategy && (
                  <button
                    onClick={onNavigateToStrategy}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    Tiếp tục: Sang Tầng 2 (Chiến Lược) 
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Core Summary Text */}
            <div className="p-4 rounded-xl bg-white border border-indigo-100 text-slate-800 text-xs leading-relaxed font-medium shadow-xs">
              <span className="font-bold text-indigo-900 block mb-1">🎯 Tóm lược Chiến Lược:</span>
              {result.executiveSummary || 'Chưa có tóm tắt'}
            </div>

            {/* Top Strategic Priorities */}
            {result.topStrategicPriorities && result.topStrategicPriorities.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Top Ưu Tiên Hành Động Cần Thực Thi Ngay:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.topStrategicPriorities.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-snug font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5 Branches Detailed Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveResultTab('summary')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeResultTab === 'summary' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-4 w-4" />
                Tổng Quan 5 Nhánh
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('framing')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeResultTab === 'framing' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="h-4 w-4" />
                1. Định Khung
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('search')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeResultTab === 'search' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="h-4 w-4" />
                2. Nhu Cầu Tìm Kiếm
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('voc')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeResultTab === 'voc' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquareQuote className="h-4 w-4" />
                3. Tiếng Nói Khách Hàng (VoC)
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('competitor')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeResultTab === 'competitor' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Swords className="h-4 w-4" />
                4. Nội Dung Đối Thủ
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('offer')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeResultTab === 'offer' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="h-4 w-4" />
                5. Quảng Cáo & Offer
              </button>
            </div>

            {/* TAB CONTENT: Overview Matrix */}
            {activeResultTab === 'summary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Branch 1 Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <Compass className="h-4 w-4" /> 1. Định Khung Đề Bài
                    </span>
                    <button 
                      type="button"
                      onClick={() => setActiveResultTab('framing')}
                      className="text-[11px] text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {result.framing?.clarifiedGoal || 'Đã định vị bài toán'}
                  </p>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <span className="font-semibold block text-slate-600">Câu hỏi then chốt:</span>
                    {(result.framing?.criticalQuestions || []).slice(0, 2).map((q, i) => (
                      <div key={i} className="truncate">• {q}</div>
                    ))}
                  </div>
                </div>

                {/* Branch 2 Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                      <Search className="h-4 w-4" /> 2. Nhu Cầu Tìm Kiếm
                    </span>
                    <button 
                      type="button"
                      onClick={() => setActiveResultTab('search')}
                      className="text-[11px] text-slate-400 hover:text-sky-600 cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2">
                    {result.search?.summary || 'Đã phân nhóm từ khóa'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(result.search?.intentClusters || []).slice(0, 3).map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                        {c.theme}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Branch 3 Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <MessageSquareQuote className="h-4 w-4" /> 3. Tiếng Nói Khách Hàng (VoC)
                    </span>
                    <button 
                      type="button"
                      onClick={() => setActiveResultTab('voc')}
                      className="text-[11px] text-slate-400 hover:text-amber-600 cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(result.voc?.painPoints || []).slice(0, 2).map((p, i) => (
                      <div key={i} className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-900 leading-tight">
                        <span className="font-bold">{p.pain}</span>
                        {p.quote && <p className="italic text-rose-700 text-[10px] mt-0.5 truncate">"{p.quote}"</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch 4 Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                      <Swords className="h-4 w-4" /> 4. Nội Dung Đối Thủ
                    </span>
                    <button 
                      type="button"
                      onClick={() => setActiveResultTab('competitor')}
                      className="text-[11px] text-slate-400 hover:text-purple-600 cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1.5">
                    <span className="font-semibold block text-slate-700">Góc Đại Dương Xanh (Blue Ocean):</span>
                    {(result.competitor?.blueOceanAngles || []).slice(0, 2).map((b, i) => (
                      <div key={i} className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-900 leading-snug">
                        <span className="font-bold">{b.angle}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch 5 Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <Tag className="h-4 w-4" /> 5. Quảng Cáo & Offer
                    </span>
                    <button 
                      type="button"
                      onClick={() => setActiveResultTab('offer')}
                      className="text-[11px] text-slate-400 hover:text-emerald-600 cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 font-medium space-y-1">
                    <span className="font-bold block text-emerald-900">Gói Grand Slam Offer:</span>
                    <p className="text-[11px] leading-snug">{result.offer?.improvedOfferIdea?.coreOffer || 'Đã tạo gói offer cải tiến'}</p>
                  </div>
                </div>

                {/* Direct Action Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block mb-1">
                      BƯỚC TIẾP THEO
                    </span>
                    <h4 className="text-sm font-bold">Chuyển Sang Tầng 2</h4>
                    <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                      Toàn bộ insights của 5 nhánh đã được nạp tự động vào bộ nhớ. Bạn có thể tạo ngay Chiến lược nội dung.
                    </p>
                  </div>
                  {onNavigateToStrategy && (
                    <button
                      onClick={onNavigateToStrategy}
                      type="button"
                      className="mt-4 w-full py-2 rounded-lg bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      Lập Chiến Lược Nội Dung
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 1. Framing */}
            {activeResultTab === 'framing' && result.framing && (
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Compass className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">1. Định Khung Đề Bài Nghiên Cứu</h3>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Mục tiêu cốt lõi:</h4>
                  <p className="text-xs text-slate-900 p-3 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                    {result.framing.clarifiedGoal}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Dữ kiện đã xác định:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      {(result.framing.solidFacts || []).map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Giả định cần kiểm chứng:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      {(result.framing.hypotheses || []).map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Top câu hỏi nghiên cứu trọng tâm:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    {(result.framing.criticalQuestions || []).map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Search Demand */}
            {activeResultTab === 'search' && result.search && (
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Search className="h-4 w-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">2. Nhu Cầu Tìm Kiếm & Ý Định Mua</h3>
                </div>
                <p className="text-xs text-slate-800 p-3 rounded-lg bg-sky-50/50 border border-sky-100 font-medium">
                  {result.search.summary}
                </p>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">Các cụm nhu cầu tìm kiếm (Intent Clusters):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(result.search.intentClusters || []).map((c, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{c.theme}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
                            {c.searchIntent}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Câu hỏi tiêu biểu:</span>
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                            {(c.questions || []).map((q, qi) => <li key={qi}>{q}</li>)}
                          </ul>
                        </div>
                        {c.recommendedContent && (
                          <div className="text-[11px] p-2 rounded bg-slate-50 text-slate-700">
                            💡 Định dạng đề xuất: <span className="font-semibold">{c.recommendedContent}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. VoC */}
            {activeResultTab === 'voc' && result.voc && (
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MessageSquareQuote className="h-4 w-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">3. Tiếng Nói Khách Hàng (VoC)</h3>
                </div>
                <p className="text-xs text-slate-800 p-3 rounded-lg bg-amber-50/50 border border-amber-100 font-medium">
                  {result.voc.summary}
                </p>

                {/* Marketing Hooks */}
                {result.voc.marketingHooks && result.voc.marketingHooks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Gợi ý Câu Hook Triệu View (Đúng ngôn từ khách hàng):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.voc.marketingHooks.map((hk, i) => (
                        <div key={i} className="p-3 rounded-xl bg-gradient-to-r from-amber-50/70 to-orange-50/70 border border-amber-200 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-800 font-medium leading-snug">"{hk}"</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(hk, i)}
                            className="p-1.5 rounded-lg bg-white border border-amber-200 text-slate-600 hover:text-amber-700 cursor-pointer shrink-0 transition"
                            title="Sao chép câu hook"
                          >
                            {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pain Points */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800">Danh sách Nỗi Đau & Trích Dẫn Nguyên Văn:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(result.voc.painPoints || []).map((p, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-950">{p.pain}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                            {p.level}
                          </span>
                        </div>
                        {p.quote && (
                          <blockquote className="text-xs italic text-rose-800 bg-white/80 p-2 rounded border-l-2 border-rose-400">
                            "{p.quote}"
                          </blockquote>
                        )}
                        {p.context && (
                          <p className="text-[10px] text-slate-500">Hoàn cảnh: {p.context}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. Competitor */}
            {activeResultTab === 'competitor' && result.competitor && (
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Swords className="h-4 w-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">4. Tình Báo Nội Dung Đối Thủ</h3>
                </div>
                <p className="text-xs text-slate-800 p-3 rounded-lg bg-purple-50/50 border border-purple-100 font-medium">
                  {result.competitor.summary}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Winning Formats */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Định dạng chiến thắng của đối thủ:</h4>
                    <div className="space-y-2">
                      {(result.competitor.winningFormats || []).map((f, i) => (
                        <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                          <span className="text-xs font-bold text-slate-900">{f.format}</span>
                          <p className="text-[11px] text-slate-600">{f.reason}</p>
                          {f.hookStyle && <p className="text-[10px] text-indigo-600 font-medium">Hook: {f.hookStyle}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blue Ocean Angles */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Góc Đại Dương Xanh (Chưa ai khai thác):</h4>
                    <div className="space-y-2">
                      {(result.competitor.blueOceanAngles || []).map((b, i) => (
                        <div key={i} className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 space-y-1">
                          <span className="text-xs font-bold text-purple-950">{b.angle}</span>
                          <p className="text-[11px] text-purple-900">{b.executionIdea}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. Offer */}
            {activeResultTab === 'offer' && result.offer && (
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">5. Quảng Cáo & Thiết Kế Grand Slam Offer</h3>
                </div>
                <p className="text-xs text-slate-800 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 font-medium">
                  {result.offer.summary}
                </p>

                {/* Grand Slam Offer Idea */}
                {result.offer.improvedOfferIdea && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-emerald-700" />
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Gợi Ý Gói Lời Chào Hàng Đè Bẹp Đối Thủ (Grand Slam Offer)
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-emerald-200 font-semibold text-xs text-emerald-900">
                      📦 Gói Cốt Lõi: {result.offer.improvedOfferIdea.coreOffer}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">🎁 Quà tặng kèm (Bonus):</span>
                        <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                          {(result.offer.improvedOfferIdea.bonuses || []).map((bn, bi) => <li key={bi}>{bn}</li>)}
                        </ul>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">🛡️ Đảo ngược rủi ro:</span>
                        <p className="text-[11px] text-slate-700 font-medium">{result.offer.improvedOfferIdea.riskReversal}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">⏳ Lý do mua ngay (Urgency):</span>
                        <p className="text-[11px] text-slate-700 font-medium">{result.offer.improvedOfferIdea.urgencyScarcity}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
