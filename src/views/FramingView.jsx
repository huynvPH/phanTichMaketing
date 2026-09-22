import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle, Share2, RotateCcw } from 'lucide-react';

export default function FramingView({ 
  currentModel, 
  onSyncToNotion, 
  onSaveResult, 
  onSaveFormData, 
  initialData, 
  initialResult 
}) {
  const emptyForm = {
    decision: '',
    product: '',
    marketingProblem: '',
    audience: '',
    channels: '',
    resources: '',
    competitors: '',
    stoppingCondition: '',
  };

  const [formData, setFormData] = useState(initialData || emptyForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(initialResult || null);

  useEffect(() => {
    setFormData(initialData || emptyForm);
  }, [initialData]);

  useEffect(() => {
    setResult(initialResult || null);
  }, [initialResult]);

  const handleClear = () => {
    const empty = {
      decision: '',
      product: '',
      marketingProblem: '',
      audience: '',
      channels: '',
      resources: '',
      competitors: '',
      stoppingCondition: '',
    };
    setFormData(empty);
    setResult(null);
    if (onSaveFormData) onSaveFormData(empty);
    if (onSaveResult) onSaveResult(null);
  };

  const handleAnalyze = async () => {
    if (!formData.decision && !formData.product && !formData.marketingProblem) {
      alert('Vui lòng điền thông tin đề bài cần phân tích.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'framing',
          model: currentModel,
          rawData: formData,
          metadata: {
            product: formData.product,
            targetAudience: formData.audience,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
      if (onSaveResult) onSaveResult(data.data);
    } catch (err) {
      alert('Lỗi phân tích: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wider">
              Tầng 1: Research - Đề Bài
            </span>
            <h2 className="text-lg font-bold text-slate-900">Định Khung Đề Bài Nghiên Cứu</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Xác định mục tiêu quyết định và phân loại bài toán nghiên cứu</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
            title="Xóa form"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang phân tích...' : 'AI Tinh Chỉnh Đề Bài'}
          </button>
        </div>
      </div>

      {/* 3 Cột Nhập Liệu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột 1 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">1. Đề bài nghiên cứu</h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Doanh nghiệp cần quyết định gì?</label>
              <textarea
                rows={2}
                value={formData.decision}
                onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                placeholder="Ví dụ: Ra mắt sản phẩm mới hay tìm góc tiếp cận video ngắn..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Sản phẩm / Dịch vụ muốn kiểm chứng</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="Tên sản phẩm, tính năng cốt lõi..."
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Vấn đề Marketing cần giải quyết</label>
              <textarea
                rows={2}
                value={formData.marketingProblem}
                onChange={(e) => setFormData({ ...formData, marketingProblem: e.target.value })}
                placeholder="Ví dụ: Chi phí lead tăng, content cũ giảm tương tác..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Nhóm khách hàng nghi ngờ là phù hợp</label>
              <input
                type="text"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder="Độ tuổi, nghề nghiệp, nhu cầu..."
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Cột 2 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">2. Bối cảnh doanh nghiệp</h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Kênh đang vận hành</label>
              <input
                type="text"
                value={formData.channels}
                onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
                placeholder="Facebook, TikTok Shop, Shopee, Website..."
                className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Nguồn lực sản xuất & Ngân sách</label>
              <textarea
                rows={3}
                value={formData.resources}
                onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                placeholder="Nhân sự, ngân sách hàng tháng..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Cột 3 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">3. Phạm vi nghiên cứu</h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Nhóm đối thủ / Mô hình tham chiếu</label>
              <textarea
                rows={2}
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="Tên 2-3 đối thủ mạnh nhất..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Điều kiện dừng nghiên cứu</label>
              <textarea
                rows={3}
                value={formData.stoppingCondition}
                onChange={(e) => setFormData({ ...formData, stoppingCondition: e.target.value })}
                placeholder="Ví dụ: Quét đủ 30 video hoặc 50 review..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kết quả phân tích */}
      {result && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Kết quả Tinh chỉnh Đề bài & Giả thuyết
            </h3>
            <button
              onClick={() => onSyncToNotion('Đề bài nghiên cứu', formData, result)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Xuất sang Notion
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Mục tiêu cốt lõi:</span>
            <p className="text-xs font-semibold text-slate-900 mt-1">{result.clarifiedGoal}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Đã xác định (Fact)
              </div>
              <ul className="space-y-1 text-slate-700">
                {result.solidFacts?.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Giả thuyết cần thử nghiệm
              </div>
              <ul className="space-y-1 text-slate-700">
                {result.hypotheses?.map((h, i) => <li key={i}>• {h}</li>)}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                <HelpCircle className="h-4 w-4 text-indigo-600" /> Câu hỏi cần giải quyết
              </div>
              <ul className="space-y-1 text-slate-700">
                {result.criticalQuestions?.map((q, i) => <li key={i}>• {q}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
