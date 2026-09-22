import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, Trophy, Share2, RotateCcw } from 'lucide-react';

export default function CompetitorView({ 
  currentModel, 
  onSyncToNotion, 
  onSaveResult, 
  onSaveRawText, 
  initialData, 
  initialResult 
}) {
  const [rawText, setRawText] = useState(initialData || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(initialResult || null);

  useEffect(() => {
    setRawText(initialData || '');
  }, [initialData]);

  useEffect(() => {
    setResult(initialResult || null);
  }, [initialResult]);

  const handleClear = () => {
    setRawText('');
    setResult(null);
    if (onSaveRawText) onSaveRawText('');
    if (onSaveResult) onSaveResult(null);
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      alert('Vui lòng nhập nội dung bóc tách đối thủ.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'competitor',
          model: currentModel,
          rawData: rawText,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
      if (onSaveResult) onSaveResult(data.data);
    } catch (err) {
      alert('Lỗi phân tích đối thủ: ' + err.message);
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
              Tầng 1: Research - Nhánh 3
            </span>
            <h2 className="text-lg font-bold text-slate-900">Nội Dung Đối Thủ (Competitor Intelligence)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Phát hiện định dạng chiến thắng (Winning Formats) và cảnh báo chủ đề bão hòa</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
            title="Xóa ô nhập"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang phân tích...' : 'AI Bóc Tách Đối Thủ'}
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Mô tả nội dung, kịch bản, Hook mở đầu và CTA của các đối thủ bạn theo dõi:
        </label>
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán thông tin quan sát kênh TikTok/Facebook của đối thủ: cách họ mở đầu video, kiểu kịch bản, lời kêu gọi mua hàng..."
          className="w-full p-3 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 leading-relaxed font-sans"
        />
        {rawText && (
          <div className="flex justify-end">
            <button onClick={() => setRawText('')} className="text-[11px] text-slate-400 hover:text-rose-600">
              Xóa ô nhập
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              Chiến Lược Nội Dung & Góc Tiếp Cận Đối Thủ
            </h3>
            <button
              onClick={() => onSyncToNotion('Nội dung đối thủ', rawText, result)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Xuất sang Notion
            </button>
          </div>

          {result.summary && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
              <span className="font-bold text-slate-900">Tổng quan bối cảnh: </span>
              {result.summary}
            </div>
          )}

          {/* Grid: Winning Formats vs Saturated Themes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Winning Formats */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-emerald-600" /> Định Dạng Chiến Thắng (Nên học hỏi)
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {result.winningFormats?.map((wf, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1">
                    <span className="font-bold text-slate-900 block">{wf.format}</span>
                    <p className="text-slate-700"><b className="text-emerald-800">Tại sao hiệu quả:</b> {wf.reason}</p>
                    {wf.hookStyle && <p className="text-[11px] text-slate-600"><b>Phong cách Hook:</b> {wf.hookStyle}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Saturated Themes */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-rose-800">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" /> Chủ Đề Bão Hòa (Nên tránh/đổi góc)
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {result.saturatedThemes?.map((st, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-200 space-y-1">
                    <span className="font-bold text-rose-900 block">{st.theme}</span>
                    <p className="text-slate-700"><b className="text-rose-800">Lời khuyên:</b> {st.warning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blue Ocean Angles */}
          {result.blueOceanAngles?.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-indigo-600" />
                Góc Tiếp Cận Mới (Khoảng Trống Đại Dương Xanh)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {result.blueOceanAngles.map((angle, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-1">
                    <span className="font-bold text-indigo-900 block">{angle.angle}</span>
                    <p className="text-slate-700">{angle.executionIdea}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA đề xuất */}
          {result.suggestedCTAs?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs space-y-1.5">
              <span className="font-bold text-slate-900 block">Gợi ý CTA kêu gọi hành động tự nhiên:</span>
              <div className="flex flex-wrap gap-2">
                {result.suggestedCTAs.map((cta, cIdx) => (
                  <span key={cIdx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                    {cta}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
