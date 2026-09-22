import React, { useState, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, Calendar, Layers, Share2, HelpCircle, RotateCcw } from 'lucide-react';

export default function SearchDemandView({ 
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
      alert('Vui lòng nhập danh sách từ khóa tìm kiếm.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'search',
          model: currentModel,
          rawData: rawText,
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
              Tầng 1: Research - Nhánh 1
            </span>
            <h2 className="text-lg font-bold text-slate-900">Nhu Cầu Tìm Kiếm (Search Demand)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Phân loại từ khóa theo ý định tìm kiếm (Search Intent) và hành trình mua hàng</p>
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
            {loading ? 'Đang phân tích...' : 'AI Phân Loại Intent'}
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Danh sách cụm từ tìm kiếm (Google, TikTok Search, YouTube - mỗi dòng 1 từ khóa):
        </label>
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán các từ khóa tìm kiếm tại đây..."
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
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Bản Đồ Phân Loại Ý Định Tìm Kiếm
            </h3>
            <button
              onClick={() => onSyncToNotion('Nhu cầu tìm kiếm', rawText, result)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Xuất sang Notion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs space-y-1">
              <span className="font-bold text-slate-900">Tổng quan nhu cầu:</span>
              <p className="text-slate-700 leading-relaxed">{result.summary}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs space-y-1">
              <span className="font-bold text-slate-900">Tính mùa vụ:</span>
              <p className="text-slate-700 leading-relaxed">{result.seasonality || 'Nhu cầu ổn định quanh năm.'}</p>
            </div>
          </div>

          {/* Clusters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.intentClusters?.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-900">{item.theme}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {item.stage || 'Giai đoạn'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-600">
                  <span>Ý định: <b className="text-indigo-700">{item.searchIntent}</b></span>
                  <span>Ưu tiên: <b className="text-slate-900">{item.priority || 'Trung bình'}</b></span>
                </div>

                {item.questions?.length > 0 && (
                  <ul className="space-y-0.5 text-slate-600 text-[11px]">
                    {item.questions.map((q, qIdx) => (
                      <li key={qIdx}>? {q}</li>
                    ))}
                  </ul>
                )}

                <div className="p-2 rounded bg-indigo-50/50 text-[11px] text-indigo-900">
                  <b>Format đề xuất: </b> {item.recommendedContent}
                </div>
              </div>
            ))}
          </div>

          {/* Content Gaps */}
          {result.contentGaps?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1 text-xs">
              <span className="font-bold text-amber-900 block">Lỗ hổng nội dung thị trường chưa giải quyết tốt:</span>
              <ul className="space-y-1 text-amber-800">
                {result.contentGaps.map((gap, gIdx) => (
                  <li key={gIdx}>• {gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
