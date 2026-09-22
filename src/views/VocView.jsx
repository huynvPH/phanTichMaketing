import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  HeartHandshake, 
  ShieldAlert, 
  Share2, 
  Copy, 
  Check,
  Flame
} from 'lucide-react';

export default function VocView({ currentModel, onSyncToNotion, onSaveResult, initialData, initialResult }) {
  const [rawText, setRawText] = useState(initialData || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(initialResult || null);
  const [copiedHook, setCopiedHook] = useState(null);

  useEffect(() => {
    setRawText(initialData || '');
  }, [initialData]);

  useEffect(() => {
    setResult(initialResult || null);
  }, [initialResult]);

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung comment/review của khách hàng.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'voc',
          model: currentModel,
          rawData: rawText,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
      if (onSaveResult) onSaveResult(data.data);
    } catch (err) {
      alert('Lỗi phân tích VoC: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedHook(index);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wider">
              Tầng 1: Research - Nhánh 2
            </span>
            <h2 className="text-lg font-bold text-slate-900">Tiếng Nói Khách Hàng (VoC)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Bóc tách nỗi đau, rào cản mua hàng và trích dẫn nguyên văn từ bình luận/review</p>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang bóc tách...' : 'AI Bóc Tách Insight'}
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Dán dữ liệu bình luận, đánh giá Shopee/TikTok Shop, tin nhắn tư vấn (Mỗi dòng 1 ý kiến):
        </label>
        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán các bình luận, phản hồi thực tế của khách hàng tại đây..."
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

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Kết Quả Bóc Tách Insight Khách Hàng</h3>
            <button
              onClick={() => onSyncToNotion('Tiếng nói khách hàng (VoC)', rawText, result)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Xuất sang Notion
            </button>
          </div>

          {result.summary && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
              <span className="font-bold text-slate-900">Tóm tắt tâm lý khách hàng: </span>
              {result.summary}
            </div>
          )}

          {/* 3 Cột: Nỗi đau, Rào cản, Mong muốn */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Nỗi đau */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-rose-700">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600" /> Nỗi đau & Vấn đề
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                  {result.painPoints?.length || 0}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {result.painPoints?.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.id && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          {p.id}
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{p.pain}</span>
                    </div>
                    {p.quote && (
                      <p className="text-[11px] italic text-slate-600 border-l-2 border-rose-400 pl-2 mt-1">
                        "{p.quote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rào cản */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-amber-800">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Rào cản & Nỗi sợ
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                  {result.objections?.length || 0}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {result.objections?.map((o, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {o.id && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          {o.id}
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{o.objection}</span>
                    </div>
                    {o.quote && (
                      <p className="text-[11px] italic text-slate-600 border-l-2 border-amber-400 pl-2 mt-1">
                        "{o.quote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mong muốn */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-emerald-600" /> Kỳ vọng & Động lực
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                  {(result.desires?.length || 0) + (result.buyingTriggers?.length || 0)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {result.desires?.map((d, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">{d.desire}</span>
                    {d.quote && (
                      <p className="text-[11px] italic text-slate-600 border-l-2 border-emerald-400 pl-2">
                        "{d.quote}"
                      </p>
                    )}
                  </div>
                ))}

                {result.buyingTriggers?.map((t, idx) => (
                  <div key={`t-${idx}`} className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Động lực mua:</span>
                    <p className="font-semibold text-slate-900">{t.trigger}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gợi ý Hook Video */}
          {result.marketingHooks?.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" />
                Gợi Ý Câu Hook Mở Đầu Video / Tiêu Đề Bài Viết
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {result.marketingHooks.map((hook, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-800 font-medium">"{hook}"</span>
                    <button
                      onClick={() => copyToClipboard(hook, idx)}
                      className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 shrink-0"
                      title="Copy"
                    >
                      {copiedHook === idx ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
