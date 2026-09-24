import React, { useState, useEffect } from 'react';
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
  Layers,
  Download,
  FileText,
  AlertTriangle
} from 'lucide-react';
import MetricBadge from '../components/MetricBadge';
import DataVerificationCard from '../components/DataVerificationCard';

export default function ExecutiveResearchView({ 
  currentModel, 
  researchContext, 
  onSaveAllResearch, 
  onNavigateToStrategy, 
  onNavigateToCompetitor,
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

  const [rawTextOutput, setRawTextOutput] = useState(() => {
    try {
      return localStorage.getItem('marketing_executive_raw') || '';
    } catch {
      return '';
    }
  });

  const [progressStep, setProgressStep] = useState(0);

  // Hiệu ứng chuyển động các giai đoạn phân tích khi loading
  useEffect(() => {
    let timer;
    if (loading) {
      setProgressStep(0);
      timer = setInterval(() => {
        setProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    } else {
      setProgressStep(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Đánh giá sơ bộ chất lượng dữ liệu đầu vào (Input Health Gatekeeper)
  const getInputHealth = () => {
    const raw = (formData.customerPainRaw || '').trim();
    const words = raw ? raw.split(/\s+/).length : 0;
    if (!formData.productName && words === 0) return null;
    if (words < 25) {
      return { 
        status: 'low', 
        text: `Dữ liệu phản hồi của khách còn ít (${words} từ). AI sẽ phải dùng nhiều giả định định tính. Khuyến nghị dán thêm 5-10 review/comment thật.` 
      };
    }
    if (words < 120) {
      return { 
        status: 'medium', 
        text: `Độ dài dữ liệu mức trung bình (${words} từ). Đủ để bóc tách các nỗi đau và rào cản chính.` 
      };
    }
    return { 
      status: 'good', 
      text: `Dữ liệu VoC phong phú (${words} từ). Bằng chứng thực tế cao, giảm thiểu nguy cơ ảo giác!` 
    };
  };
  const inputHealth = getInputHealth();

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
      setRawTextOutput('');
      try {
        localStorage.removeItem('marketing_executive_form');
        localStorage.removeItem('marketing_executive_result');
        localStorage.removeItem('marketing_executive_raw');
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

      if (data.rawText) {
        setRawTextOutput(data.rawText);
        try {
          localStorage.setItem('marketing_executive_raw', data.rawText);
        } catch {}
      }

      const analyzed = data.data;
      setResult(analyzed);
      try {
        if (analyzed) {
          localStorage.setItem('marketing_executive_result', JSON.stringify(analyzed));
        }
      } catch {}

      if (onSaveAllResearch && analyzed) {
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

  // Xuất toàn bộ báo cáo nghiên cứu ra file Markdown (.md)
  const handleExportMarkdown = () => {
    if (!result) return;
    const pName = formData.productName || 'San_Pham';
    const lines = [
      `# 📊 BÁO CÁO NGHIÊN CỨU CHIẾN LƯỢC: ${formData.productName || 'Chưa đặt tên'}`,
      `- Ngành hàng: ${formData.industry || 'N/A'}`,
      `- Khách hàng mục tiêu: ${formData.targetAudience || 'N/A'}`,
      `- Ngày xuất bản: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
      '',
      '---',
      '',
      '## 🎯 1. Tóm Tắt Dành Cho Cấp Quản Lý (Executive Summary)',
      result.executiveSummary || 'N/A',
      '',
      '### 💡 Ưu Tiên Chiến Lược Hàng Đầu:',
      ...(result.topStrategicPriorities || []).map((p, i) => `${i + 1}. ${p}`),
      '',
      '---',
      '',
      '## 🧭 2. Định Khung Đề Bài (Framing)',
      `- **Mục tiêu quyết định cốt lõi:** ${result.framing?.clarifiedGoal || 'N/A'}`,
      '',
      '**Dữ kiện thực tế chắc chắn:**',
      ...(result.framing?.solidFacts || []).map(f => `- ${f}`),
      '',
      '**Giả định then chốt cần kiểm chứng:**',
      ...(result.framing?.hypotheses || []).map(h => `- ${h}`),
      '',
      '**Câu hỏi nghiên cứu then chốt:**',
      ...(result.framing?.criticalQuestions || []).map(q => `- ${q}`),
      '',
      '---',
      '',
      '## 🔍 3. Nhu Cầu Tìm Kiếm (Search Demand)',
      result.search?.summary || '',
      '',
      ...(result.search?.intentClusters || []).map(c => `### Chủ đề: ${c.theme} (${c.searchIntent} - ${c.stage})\n- Câu hỏi tiêu biểu: ${(c.questions || []).join(', ')}\n- Định dạng đề xuất: ${c.recommendedContent || 'N/A'}`),
      '',
      '---',
      '',
      '## 💬 4. Tiếng Nói Khách Hàng (Voice of Customer - VoC)',
      result.voc?.summary || '',
      '',
      '### Nỗi đau & Vấn đề nhức nhối (Pain Points):',
      ...(result.voc?.painPoints || []).map(p => `- **${p.pain}** (Mức độ: ${p.level})\n  > Trích dẫn: "${p.quote}"`),
      '',
      '### Rào cản hoài nghi (Objections):',
      ...(result.voc?.objections || []).map(o => `- **${o.objection}**\n  > Trích dẫn: "${o.quote}"`),
      '',
      '### Động lực mua hàng (Buying Triggers):',
      ...(result.voc?.buyingTriggers || []).map(b => `- **${b.trigger}**\n  > Trích dẫn: "${b.quote}"`),
      '',
      '### Gợi ý Hooks mở đầu video/bài viết:',
      ...(result.voc?.marketingHooks || []).map((h, i) => `${i + 1}. "${h}"`),
      '',
      '---',
      '',
      '## ⚔️ 5. Đối Thủ Cạnh Tranh & Góc Tiếp Cận Mới',
      result.competitor?.summary || '',
      '',
      '**Định dạng chiến thắng của đối thủ:**',
      ...(result.competitor?.winningFormats || []).map(w => `- **${w.format}**: ${w.reason}`),
      '',
      '**Khoảng trống Đại Dương Xanh (Blue Ocean):**',
      ...(result.competitor?.blueOceanAngles || []).map(b => `- **${b.angle}**: ${b.executionIdea}`),
      '',
      '---',
      '',
      '## 🎁 6. Ưu Đãi & Lời Chào Hàng Grand Slam Offer',
      `- **Gói ưu đãi cốt lõi:** ${result.offer?.improvedOfferIdea?.coreOffer || 'N/A'}`,
      `- **Quà tặng kèm:** ${(result.offer?.improvedOfferIdea?.bonuses || []).join(', ')}`,
      `- **Đảo ngược rủi ro / Cam kết:** ${result.offer?.improvedOfferIdea?.riskReversal || 'N/A'}`,
      `- **Tính cấp bách / Lý do mua ngay:** ${result.offer?.improvedOfferIdea?.urgencyScarcity || 'N/A'}`,
    ];

    const mdContent = lines.join('\n');
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = pName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    link.href = url;
    link.download = `Bao_Cao_${safeName}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
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
            className="px-4 py-2 btn-brand text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
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
            {inputHealth && (
              <div className={`mt-2 p-2.5 rounded-lg border flex items-center justify-between gap-2.5 text-xs transition-colors ${
                inputHealth.status === 'low' 
                  ? 'bg-rose-50/70 border-rose-200 text-rose-800' 
                  : inputHealth.status === 'medium' 
                  ? 'bg-amber-50/70 border-amber-200 text-amber-800' 
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                    inputHealth.status === 'low' ? 'text-rose-600' : inputHealth.status === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <span className="text-[11px]">
                    <strong>Độ vững bằng chứng:</strong> {inputHealth.text}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-current shrink-0">
                  {inputHealth.status === 'low' ? 'Sơ sài' : inputHealth.status === 'medium' ? 'Khá' : 'Tốt'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Ưu đãi & Lời chào hàng */}
        <div className="space-y-3 pt-2">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Đề Xuất Giá Trị & Ưu Đãi (Offer)
            </h2>
            {onNavigateToCompetitor && (
              <button
                type="button"
                onClick={onNavigateToCompetitor}
                className="text-[11px] text-slate-700 hover:text-slate-950 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Swords className="h-3 w-3 text-slate-700" />
                Mở Tình Báo Video Đối Thủ →
              </button>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-slate-700 shrink-0" />
              <span>
                Phần <strong>Phân Tích Đối Thủ & Quét Video</strong> đã được tách riêng chuyên sâu: Bạn có thể dán link video, bóc tách transcript và AI viết kịch bản phản đòn ngay tại tab <strong>Tình Báo Video Đối Thủ</strong>.
              </span>
            </div>
            {onNavigateToCompetitor && (
              <button
                type="button"
                onClick={onNavigateToCompetitor}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-800 hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                Chuyển tab
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Ưu đãi, chính sách bảo hành, cam kết hoặc quà tặng dự kiến của bạn:
            </label>
            <textarea
              rows={3}
              value={formData.competitorAndOffer}
              onChange={(e) => handleInputChange('competitorAndOffer', e.target.value)}
              placeholder="Chính sách dùng thử 30 ngày, tặng kèm ebook/khóa học, cam kết hoàn tiền 100%..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed font-sans"
            />
          </div>
        </div>

      </div>

      {/* Loading state indicator with dynamic progress steps */}
      {loading && (
        <div className="p-8 border border-indigo-200 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white text-center space-y-5 shadow-xs">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-100 text-indigo-600 mb-1">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {progressStep === 0 && 'Bước 1/4: Đang tiếp nhận & đồng bộ hồ sơ sản phẩm...'}
              {progressStep === 1 && 'Bước 2/4: AI đang giải mã tâm lý, nỗi đau & khao khát khách hàng...'}
              {progressStep === 2 && 'Bước 3/4: Đang quét khoảng trống thị trường & định vị khác biệt...'}
              {progressStep === 3 && 'Bước 4/4: Đang xây dựng ma trận chiến lược & kết xuất báo cáo...'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {progressStep === 0 && 'Rà soát các thông số thị trường mục tiêu và mục tiêu kinh doanh.'}
              {progressStep === 1 && 'Bóc tách ngôn từ VoC, phát hiện rào cản mua hàng và giải pháp tâm lý.'}
              {progressStep === 2 && 'So khớp các góc tiếp cận cạnh tranh và cơ hội Đại Dương Xanh.'}
              {progressStep === 3 && 'Hoàn thiện cấu trúc bảng và liên kết trực tiếp sang Tầng 2 Chiến lược.'}
            </p>
          </div>
          {/* Visual Step Progress Dots */}
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            {[0, 1, 2, 3].map((stepIdx) => (
              <div
                key={stepIdx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  progressStep >= stepIdx ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback View if AI returned raw text but JSON parsing failed */}
      {!result && !loading && rawTextOutput && (
        <div className="bg-white border border-amber-300 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Báo Cáo Nghiên Cứu (Dạng Văn Bản Tự Do)</h3>
                <p className="text-xs text-slate-500">AI đã hoàn thành phân tích. Toàn bộ nội dung phân tích chi tiết được lưu giữ an toàn bên dưới.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyText(rawTextOutput, 'raw')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedIndex === 'raw' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedIndex === 'raw' ? 'Đã sao chép' : 'Sao chép toàn bộ'}
              </button>
              <button
                type="button"
                onClick={handleAnalyzeAll}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Phân tích lại
              </button>
            </div>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {rawTextOutput}
          </div>
        </div>
      )}

      {/* Results Document */}
      {result && !loading && (
        <div className="space-y-6 pt-4">
          {/* Header Bar of Results */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="shrink-0">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">
                Báo Cáo Nghiên Cứu
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                Bức Tranh Chiến Lược Khách Hàng
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={handleExportMarkdown}
                type="button"
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                title="Tải toàn bộ báo cáo nghiên cứu dạng file Markdown (.md)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tải Báo Cáo (.md)</span>
              </button>

              {onSyncToNotion && (
                <button
                  onClick={() => onSyncToNotion('Nghiên Cứu Khách Hàng', formData, result)}
                  type="button"
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Đồng bộ Notion</span>
                </button>
              )}

              {onNavigateToStrategy && (
                <button
                  onClick={onNavigateToStrategy}
                  type="button"
                  className="px-3.5 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <span>Sang Tầng 2: Lập Chiến Lược</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-700" />
                </button>
              )}
            </div>
          </div>

          {/* Data Verification & Anti-Hallucination Card */}
          <DataVerificationCard report={result.dataVerificationReport} />

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
                  ? 'btn-brand text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả 5 nhánh
            </button>
            <button
              onClick={() => setActiveSection('framing')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'framing'
                  ? 'btn-brand text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Định Khung
            </button>
            <button
              onClick={() => setActiveSection('search')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'search'
                  ? 'btn-brand text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Nhu Cầu Tìm Kiếm
            </button>
            <button
              onClick={() => setActiveSection('voc')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'voc'
                  ? 'btn-brand text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Tiếng Nói Khách Hàng (VoC)
            </button>
            <button
              onClick={() => setActiveSection('competitor')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'competitor'
                  ? 'btn-brand text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Đối Thủ
            </button>
            <button
              onClick={() => setActiveSection('offer')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer shrink-0 ${
                activeSection === 'offer'
                  ? 'btn-brand text-white font-semibold'
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
                  {(result.voc.painPoints || []).map((p, i) => {
                    const hasQuote = p.quote && !p.quote.toLowerCase().includes('không có trích dẫn') && !p.quote.toLowerCase().includes('chưa có trích dẫn');
                    return (
                      <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{p.pain}</span>
                          <MetricBadge
                            type={hasQuote ? 'empirical' : 'qualitative_estimate'}
                            basis={hasQuote ? 'Trích dẫn nguyên văn phản hồi thực tế từ khách hàng' : 'Giả định định tính chưa có trích dẫn trực tiếp'}
                            compact
                          />
                        </div>
                        {p.quote && (
                          <p className="italic text-slate-600 text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                            "{p.quote}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section: 4. Competitor */}
          {(activeSection === 'all' || activeSection === 'competitor') && result.competitor && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-slate-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    4. Nội Dung Đối Thủ & Tình Báo Video
                  </h4>
                </div>
                {onNavigateToCompetitor && (
                  <button
                    type="button"
                    onClick={onNavigateToCompetitor}
                    className="text-[11px] text-slate-700 hover:text-slate-950 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Xem Chi Tiết & Viết Kịch Bản →
                  </button>
                )}
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
                className="px-5 py-2.5 btn-brand text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
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
