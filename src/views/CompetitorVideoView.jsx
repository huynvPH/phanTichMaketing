import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Share2,
  Film,
  Link as LinkIcon,
  FileText,
  Upload,
  ShieldAlert,
  Compass,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import MetricBadge from '../components/MetricBadge';
import DataVerificationCard from '../components/DataVerificationCard';

export default function CompetitorVideoView({
  currentModel,
  researchContext,
  onSaveCompetitorData,
  onNavigateToStrategy,
  onSyncToNotion
}) {
  const [inputMode, setInputMode] = useState('links'); // 'links' | 'scripts' | 'direct' | 'upload'
  const [linksText, setLinksText] = useState('');
  const [scriptsText, setScriptsText] = useState('');
  const [directAnalysisText, setDirectAnalysisText] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Result: theo dự án đang chọn (không dùng key localStorage global)
  const result = researchContext?.competitorVideo || null;

  const [rawTextOutput, setRawTextOutput] = useState(() => {
    try {
      return localStorage.getItem('marketing_competitor_raw') || '';
    } catch {
      return '';
    }
  });

  const [transcriptNotice, setTranscriptNotice] = useState(null);

  // Tự động đếm số lượng link
  const detectedLinks = linksText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('http://') || l.startsWith('https://'));

  // Đánh giá sơ bộ chất lượng dữ liệu đầu vào (Input Health Gatekeeper)
  const getInputHealth = () => {
    if (inputMode === 'links') {
      const count = detectedLinks.length;
      if (count === 0) return null;
      if (count < 3) return { status: 'low', text: `Mới có ${count} link. Khuyến nghị nạp từ 3-10 link để nhận diện motif chính xác, tránh phỏng đoán.` };
      if (count <= 7) return { status: 'medium', text: `${count} link video. Đủ để bóc tách các motif phổ biến nhất ngành.` };
      return { status: 'good', text: `${count} link video. Mẫu dữ liệu phong phú, độ chính xác phân tích cao!` };
    }
    const txt = (inputMode === 'scripts' ? scriptsText : directAnalysisText).trim();
    const wordCount = txt ? txt.split(/\s+/).length : 0;
    if (wordCount === 0) return null;
    if (wordCount < 60) return { status: 'low', text: `Dữ liệu khá ngắn (${wordCount} từ). AI sẽ phải dùng nhiều giả định định tính.` };
    if (wordCount < 200) return { status: 'medium', text: `Độ dài trung bình (${wordCount} từ). Đủ để trích xuất luận điểm.` };
    return { status: 'good', text: `Dữ liệu phong phú (${wordCount} từ). Bằng chứng đối chiếu vững chắc!` };
  };
  const inputHealth = getInputHealth();

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn làm mới phần Tình Báo Video Đối Thủ?')) {
      setLinksText('');
      setScriptsText('');
      setDirectAnalysisText('');
      setRawTextOutput('');
      setTranscriptNotice(null);
      try {
        localStorage.removeItem('marketing_competitor_raw');
      } catch {}
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setLinksText((prev) => (prev ? `${prev}\n${content}` : content));
        setInputMode('links');
      }
    };
    reader.readAsText(file);
  };

  // Tự động cào Transcript từ các link YouTube/Shorts đã nhập (kèm Fallback khi máy chủ Vercel bị chặn IP)
  const handleAutoFetchTranscripts = async () => {
    if (detectedLinks.length === 0) {
      alert('Vui lòng dán ít nhất 1 link video YouTube hoặc YouTube Shorts.');
      return;
    }

    setFetchingTranscript(true);
    setTranscriptNotice(null);
    try {
      const res = await fetch('/api/competitor/fetch-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: detectedLinks }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Lỗi khi trích xuất phụ đề.');
      }

      if (data.combinedText) {
        setScriptsText((prev) => {
          if (prev.trim()) {
            return `${prev}\n\n=== PHỤ ĐỀ / TRANSCRIPT TỰ ĐỘNG CÀO ===\n${data.combinedText}`;
          }
          return data.combinedText;
        });
        setInputMode('scripts');
        setTranscriptNotice({
          type: 'success',
          text: `Đã trích xuất thành công lời thoại của ${data.successCount}/${data.total} video! Bạn có thể xem hoặc chỉnh sửa trực tiếp bên dưới.`,
        });
      } else {
        setInputMode('scripts');
        setTranscriptNotice({
          type: 'warning',
          text: 'YouTube có thể đang hạn chế quét tự động qua IP máy chủ đám mây hoặc video chưa bật phụ đề. Bạn hãy dán trực tiếp lời thoại hoặc nội dung tóm tắt của video vào ô dưới đây để tiếp tục phân tích!',
        });
      }
    } catch (err) {
      setInputMode('scripts');
      setTranscriptNotice({
        type: 'warning',
        text: `Không thể tự động tải phụ đề (${err.message}). Bạn hãy dán trực tiếp lời thoại hoặc ghi chú phân tích video vào ô dưới đây để tiếp tục!`,
      });
    } finally {
      setFetchingTranscript(false);
    }
  };

  const handleStartPipeline = async () => {
    const hasLinks = detectedLinks.length > 0;
    const hasScripts = scriptsText.trim().length > 0;
    const hasDirect = directAnalysisText.trim().length > 0;

    if (!hasLinks && !hasScripts && !hasDirect) {
      alert('Vui lòng dán link video, transcript hoặc viết bài/ghi chú phân tích đối thủ!');
      return;
    }

    setLoading(true);
    setProcessingStep(1);

    // Giả lập trực quan các bước xử lý pipeline
    const stepTimer1 = setTimeout(() => setProcessingStep(2), 900);
    const stepTimer2 = setTimeout(() => setProcessingStep(3), 1800);
    const stepTimer3 = setTimeout(() => setProcessingStep(4), 2700);

    try {
      // 1. Phân tích Link trước nếu có
      let parsedLinksData = [];
      if (hasLinks) {
        try {
          const parseRes = await fetch('/api/competitor/parse-links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: detectedLinks }),
          });
          const parseJson = await parseRes.json();
          if (parseJson.success) {
            parsedLinksData = parseJson.videos;
          }
        } catch {}
      }

      // 2. Gọi AI thực thi 4-step pipeline
      const payloadData = {
        videoLinks: hasLinks ? detectedLinks : [],
        parsedVideos: parsedLinksData,
        manualScriptsOrCaptions: hasScripts ? scriptsText : '',
        directAnalysis: hasDirect ? directAnalysisText : '',
        industry: targetIndustry || 'Chưa xác định',
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'competitor_video_pipeline',
          model: currentModel,
          rawData: payloadData,
          metadata: {
            industry: targetIndustry || 'Chưa xác định',
            source: 'Competitor Video Pipeline 4-Step',
            linkCount: detectedLinks.length,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra trong quá trình phân tích video.');
      }

      if (data.rawText) {
        setRawTextOutput(data.rawText);
        try {
          localStorage.setItem('marketing_competitor_raw', data.rawText);
        } catch {}
      }

      const analyzed = data.data;

      // Đồng bộ vào kho dữ liệu Tầng 1 (result sẽ tự cập nhật qua researchContext)
      if (onSaveCompetitorData && analyzed) {
        onSaveCompetitorData(analyzed, payloadData);
      }
    } catch (err) {
      alert('Lỗi xử lý video đối thủ: ' + err.message);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
      setProcessingStep(1);
    }
  };

  const copyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Tầng 1: Customer Research • Nhánh Tình Báo
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tình Báo Video Đối Thủ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Quét hàng loạt link video hoặc kênh đối thủ. Tự động tách âm thanh (Transcript), bóc tách 3s đầu (Visual Hook), gom cụm kịch bản và khai phá khoảng trống thị trường.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(linksText || scriptsText || result) && (
            <button
              onClick={handleReset}
              type="button"
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Làm mới
            </button>
          )}

          <button
            onClick={handleStartPipeline}
            disabled={loading}
            type="button"
            className="px-4 py-2 btn-brand text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang chạy Pipeline 4 bước...' : 'Bắt đầu Quét & Phân Tích'}
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'links', icon: LinkIcon, label: `Dán Link Video / Kênh (${detectedLinks.length})` },
              { id: 'scripts', icon: FileText, label: 'Dán Lời Thoại / Transcript' },
              { id: 'direct', icon: Edit3, label: 'Viết Phân Tích Trực Tiếp' },
              { id: 'upload', icon: Upload, label: 'Tải File Link (.txt / .csv)' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setInputMode(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  inputMode === id
                    ? 'btn-brand text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              placeholder="Ngành hàng (VD: Mỹ phẩm, Gia dụng...)"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white"
            />
          </div>
        </div>

        {/* Notice Fallback khi lấy transcript gặp sự cố trên cloud */}
        {transcriptNotice && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            transcriptNotice.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/95 border-amber-200 text-amber-900'
          }`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
              transcriptNotice.type === 'success' ? 'text-emerald-600' : 'text-amber-600'
            }`} />
            <div className="flex-1 leading-relaxed font-medium">
              {transcriptNotice.text}
            </div>
            <button
              type="button"
              onClick={() => setTranscriptNotice(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mode 1: Dán links */}
        {inputMode === 'links' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="font-medium">
                Dán danh sách các link video TikTok, Reels, YouTube Shorts hoặc link Kênh (mỗi dòng 1 link):
              </label>
              <span className="text-[11px] text-slate-400">
                {detectedLinks.length > 0 ? `Đã nhận diện ${detectedLinks.length} link` : 'Hỗ trợ hàng chục link'}
              </span>
            </div>
            <textarea
              rows={7}
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder="https://www.tiktok.com/@doithu/video/739123456789...&#10;https://www.tiktok.com/@kenhdoithu&#10;https://www.youtube.com/shorts/abcd1234...&#10;https://www.facebook.com/reel/12345678..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed font-mono"
            />
            
            {/* Quick Action: Auto Fetch Transcripts */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/70">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFetchTranscripts}
                  disabled={fetchingTranscript || detectedLinks.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
                  title="Tự động bóc tách phụ đề/lời thoại từ YouTube/Shorts"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${fetchingTranscript ? 'animate-spin' : ''}`} />
                  {fetchingTranscript ? 'Đang trích xuất Transcript...' : '⚡ Cào Lời Thoại / Transcript Tự Động (YouTube/Shorts)'}
                </button>
              </div>
              <span className="text-[11px] text-amber-900/80 font-medium">
                Tự động lấy toàn bộ lời thoại và nạp vào kịch bản để AI phân tích chuẩn xác
              </span>
            </div>
          </div>
        )}

        {/* Mode 2: Dán scripts */}
        {inputMode === 'scripts' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Dán trực tiếp nội dung kịch bản, lời thoại bóc tách hoặc tóm tắt các video của đối thủ:
            </label>
            <textarea
              rows={7}
              value={scriptsText}
              onChange={(e) => setScriptsText(e.target.value)}
              placeholder="Video 1: Cảnh mở đầu bôi kem lên mặt, câu thoại 'Đừng bao giờ mua kem này nếu bạn sợ hết mụn...', sau đó đưa giấy kiểm nghiệm...&#10;&#10;Video 2: Review so sánh giữa 2 sản phẩm A và B..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed font-sans"
            />
          </div>
        )}

        {/* Mode 3: Viết phân tích trực tiếp */}
        {inputMode === 'direct' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="font-medium">
                Tự viết hoặc dán nội dung phân tích đối thủ cạnh tranh & chiến dịch của họ:
              </label>
              <span className="text-[11px] text-slate-400">Viết tự do / Không cần link video</span>
            </div>
            <textarea
              rows={7}
              value={directAnalysisText}
              onChange={(e) => setDirectAnalysisText(e.target.value)}
              placeholder="• Tên các đối thủ đầu ngành: Brand X, Brand Y...&#10;• Định dạng video họ hay làm: Dạng drama người thứ 3, bóc phốt mỹ phẩm trộn, chuyên gia da liễu mặc áo blouse...&#10;• Điểm yếu của đối thủ: Khách hay chê giao hàng chậm, mùi nồng, bao bì dễ vỡ, dịch vụ CSKH kém...&#10;• Điểm mạnh: Giá rẻ, livestream tặng quà dồn dập, hook mở đầu giật gân...&#10;• Ý tưởng muốn AI khai phá kịch bản phản đòn..."
              className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none text-slate-900 bg-white leading-relaxed font-sans"
            />
          </div>
        )}

        {/* Mode 3: Tải file */}
        {inputMode === 'upload' && (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
            <Upload className="h-8 w-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Kéo thả hoặc bấm để tải file danh sách link video (.txt, .csv)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mỗi dòng một link video hoặc kịch bản
              </p>
            </div>
            <label className="inline-block px-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shadow-xs">
              Chọn File Từ Máy Tính
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Input Health Indicator */}
        {inputHealth && (
          <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors ${
            inputHealth.status === 'low' 
              ? 'bg-rose-50/70 border-rose-200 text-rose-800' 
              : inputHealth.status === 'medium' 
              ? 'bg-amber-50/70 border-amber-200 text-amber-800' 
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 shrink-0 ${
                inputHealth.status === 'low' ? 'text-rose-600' : inputHealth.status === 'medium' ? 'text-amber-600' : 'text-emerald-600'
              }`} />
              <span>
                <strong>Kiểm định đầu vào:</strong> {inputHealth.text}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current shrink-0">
              {inputHealth.status === 'low' ? 'Dữ liệu ít' : inputHealth.status === 'medium' ? 'Đạt yêu cầu' : 'Chuẩn cao'}
            </span>
          </div>
        )}

        {/* Pipeline 4-step Visual Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-2.5">
            Quy trình tự động hóa 4 bước:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">1. Auto Scraper</span>
              <span className="text-slate-500">Quét link & lọc Top video view cao</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">2. Tách Lớp</span>
              <span className="text-slate-500">Bóc âm thanh & ảnh 3s đầu (Hook)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">3. Gom Cụm</span>
              <span className="text-slate-500">Phân loại các motif kịch bản</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">4. AI Tổng Lực</span>
              <span className="text-slate-500">Top Hook & Đại dương xanh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="p-8 border border-indigo-200 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white text-center space-y-5 shadow-xs">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-100 text-indigo-600 mb-1">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {processingStep === 1 && 'Bước 1/4: Đang nạp danh sách & trích xuất metadata video...'}
              {processingStep === 2 && 'Bước 2/4: Đang tách lớp lời thoại (Transcript) & Quét khung hình 3 giây đầu...'}
              {processingStep === 3 && 'Bước 3/4: Đang phân nhóm & gom cụm các motif kịch bản (Clustering)...'}
              {processingStep === 4 && 'Bước 4/4: AI đang tổng hợp Top 5 Hook, Đại dương đỏ & Đại dương xanh...'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Hệ thống đang xử lý phân tích hàng loạt video đối thủ. Vui lòng đợi trong giây lát.
            </p>
          </div>
          {/* Visual Step Progress Dots */}
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            {[1, 2, 3, 4].map((stepIdx) => (
              <div
                key={stepIdx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  processingStep >= stepIdx ? 'bg-indigo-600' : 'bg-slate-200'
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
                <h3 className="text-sm font-bold text-slate-900">Báo Cáo Tình Báo Video (Dạng Văn Bản Tự Do)</h3>
                <p className="text-xs text-slate-500">AI đã hoàn thành phân tích. Toàn bộ nội dung phân tích chi tiết được lưu giữ an toàn bên dưới.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyText(rawTextOutput, 'raw_video')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedIndex === 'raw_video' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedIndex === 'raw_video' ? 'Đã sao chép' : 'Sao chép toàn bộ'}
              </button>
              <button
                type="button"
                onClick={handleStartPipeline}
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

      {/* Results Section */}
      {result && !loading && (
        <div className="space-y-6 pt-2">
          {/* Header Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                Báo Cáo Tình Báo Video Đối Thủ
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Bức Tranh Cạnh Tranh & Công Thức Viral
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {onSyncToNotion && (
                <button
                  onClick={() => onSyncToNotion('Tình Báo Video Đối Thủ', { links: detectedLinks }, result)}
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
                  Kế thừa sang Tầng 2: Chiến Lược
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Data Verification & Anti-Hallucination Card */}
          <DataVerificationCard report={result.dataVerificationReport} />

          {/* Executive Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Nhận Định Cục Diện Cạnh Tranh
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {result.summary || 'Đã phân tích toàn bộ dữ liệu video đối thủ.'}
            </p>
          </div>

          {/* Strategic Analysis Article */}
          {result.strategicAnalysisArticle && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Bài Viết Phân Tích Chiến Lược Đối Thủ (Bóc Tách Tử Huyệt)
                </h3>
                <button
                  type="button"
                  onClick={() => copyText(result.strategicAnalysisArticle, 'article')}
                  className="text-slate-500 hover:text-slate-900 transition text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 'article' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  Sao chép bài viết
                </button>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed font-sans space-y-2 bg-slate-50/70 p-4 rounded-lg border border-slate-200 whitespace-pre-line">
                {result.strategicAnalysisArticle}
              </div>
            </div>
          )}

          {/* 1. Video Motif Clustering */}
          {result.videoClusters && result.videoClusters.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Phân Nhóm & Gom Cụm Motif Kịch Bản (Clustering)
                </h3>
                <span className="text-[11px] text-slate-400">Các dạng video chiếm sóng ngành</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.videoClusters.map((c, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <MetricBadge 
                        type={c.metricType || 'qualitative_estimate'}
                        value={c.percentage !== undefined ? `${c.percentage}%` : null}
                        basis={c.metricBasis || 'Ước lượng định tính tỷ trọng motif dựa trên các video mẫu nạp vào'}
                        compact
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{c.description}</p>
                    <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500">
                      Hiệu quả: <strong className="text-slate-800">{c.effectiveness}</strong>
                    </div>
                    {c.verbatimPattern && (
                      <p className="text-[10px] italic text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                        "{c.verbatimPattern}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Top 5 Winning Hooks */}
          {result.topHooks && result.topHooks.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Top 5 Công Thức Hook Thắng Lớn Nhất Ngành (3 Giây Đầu)
                </h3>
                <span className="text-[11px] text-slate-400">Có nút sao chép nhanh</span>
              </div>

              <div className="space-y-3">
                {result.topHooks.map((h, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{h.rank || idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{h.hookType}</span>
                      </div>
                      {(h.retentionMetric || h.retentionScore) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Giữ chân 3s:</span>
                          <MetricBadge
                            type={h.retentionMetric?.metricType || 'qualitative_estimate'}
                            value={h.retentionMetric?.score || h.retentionScore}
                            basis={h.retentionMetric?.basis || 'Đánh giá định tính dựa trên sức hút tâm lý câu hook, không phải đo lường Platform Studio'}
                            confidence={h.retentionMetric?.confidence || 'Medium'}
                            compact
                          />
                        </div>
                      )}
                    </div>

                    {/* Câu thoại hook mẫu */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          Kịch bản 3 giây đầu:
                        </span>
                        <p className="font-semibold text-slate-800 italic">
                          "{h.exampleScript}"
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(h.exampleScript, idx)}
                        className="text-slate-500 hover:text-slate-900 transition p-1 cursor-pointer shrink-0"
                        title="Sao chép câu hook"
                      >
                        {copiedIndex === idx ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <strong className="text-slate-700">Khung hình / Visual:</strong> {h.visualDescription}
                      </div>
                      <div>
                        <strong className="text-slate-700">Đòn bẩy tâm lý:</strong> {h.psychologyTrigger}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Red Ocean & 4. Blue Ocean */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Red Ocean */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldAlert className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Vùng Bão Hòa (Đại Dương Đỏ - Cần Tránh)
                </h4>
              </div>
              <div className="space-y-2.5">
                {(result.redOceanThemes || []).map((ro, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">{ro.theme}</span>
                    <p className="text-[11px] text-slate-600">{ro.fatigueReason}</p>
                    <p className="text-[10px] text-slate-500 font-medium">⚠️ {ro.avoidanceAdvice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Blue Ocean */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Compass className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  4. Khoảng Trống Cơ Hội (Đại Dương Xanh - Nên Làm)
                </h4>
              </div>
              <div className="space-y-2.5">
                {(result.blueOceanAngles || []).map((bo, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">{bo.angle}</span>
                    <p className="text-[11px] text-slate-600">{bo.executionIdea}</p>
                    <p className="text-[10px] text-slate-700 font-semibold">💡 {bo.whyItWins}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Kịch Bản Mẫu Phản Công */}
          {result.counterAttackScript && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                5. Kịch Bản Mẫu Phản Công (Đánh Bại Video Win Của Đối Thủ)
              </h3>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                <span className="font-bold text-slate-900 text-sm block">
                  {result.counterAttackScript.title}
                </span>

                <div className="p-3 rounded bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Mở đầu (3s đầu):
                  </span>
                  <p className="font-semibold text-slate-800 italic">
                    "{result.counterAttackScript.hook3s}"
                  </p>
                </div>

                {result.counterAttackScript.bodyOutline && (
                  <div className="space-y-1 text-slate-700">
                    <span className="text-[11px] font-semibold text-slate-600 block">Dàn ý thân bài:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {result.counterAttackScript.bodyOutline.map((b, bi) => <li key={bi}>{b}</li>)}
                    </ul>
                  </div>
                )}

                {result.counterAttackScript.callToAction && (
                  <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200">
                    <strong>Kêu gọi hành động:</strong> {result.counterAttackScript.callToAction}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Kịch Bản Quay Dựng 60s Hoàn Chỉnh (Viết Chi Tiết) */}
          {result.fullProductionScript && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      6. Kịch Bản Quay Dựng 60 Giây Chi Tiết (Sẵn Sàng Bấm Máy)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {result.fullProductionScript.title} {result.fullProductionScript.concept && `• ${result.fullProductionScript.concept}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const scenesText = (result.fullProductionScript.scenes || [])
                      .map((s, idx) => `CẢNH ${idx + 1} [${s.time}] - ${s.stage}\n• Hình ảnh/Góc quay: ${s.visual}\n• Lời thoại: "${s.audio}"\n• Chữ màn hình: ${s.textOnScreen}\n• Âm thanh: ${s.soundEffect || 'Nhạc nền'}`)
                      .join('\n\n');
                    copyText(`${result.fullProductionScript.title}\nConcept: ${result.fullProductionScript.concept || ''}\n\n${scenesText}`, 'full_script');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  {copiedIndex === 'full_script' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  Sao Chép Toàn Bộ Kịch Bản Quay
                </button>
              </div>

              <div className="space-y-3">
                {(result.fullProductionScript.scenes || []).map((sc, sci) => (
                  <div key={sci} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-slate-900 bg-white border border-slate-200 text-[11px]">
                          {sc.time}
                        </span>
                        <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                          {sc.stage}
                        </span>
                      </div>
                      {sc.soundEffect && (
                        <span className="text-[10px] text-slate-500 italic">
                          🎵 {sc.soundEffect}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Khung Hình & Hành Động (Visual):
                        </span>
                        <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                          {sc.visual}
                        </p>
                        {sc.textOnScreen && (
                          <div className="text-[11px] text-slate-600 font-medium pt-0.5">
                            <span className="text-slate-400 font-normal">Text màn hình: </span>
                            <span className="font-bold text-slate-900">"{sc.textOnScreen}"</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Lời Thoại Nhân Vật (Audio / Voice):
                        </span>
                        <p className="text-slate-900 font-semibold italic leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                          "{sc.audio}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                Tiếp tục: Kế Thừa Sang Tầng 2 (Chiến Lược Nội Dung)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
