import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Gem, ShieldCheck, Gift, Clock, Share2, RotateCcw } from 'lucide-react';

export default function OfferView({ 
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
      alert('Vui lòng nhập dữ liệu quảng cáo và offer thị trường.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'offer',
          model: currentModel,
          rawData: rawText,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
      if (onSaveResult) onSaveResult(data.data);
    } catch (err) {
      alert('Lỗi phân tích Offer: ' + err.message);
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
              Tầng 1: Research - Nhánh 4
            </span>
            <h2 className="text-lg font-bold text-slate-900">Quảng Cáo & Lời Chào Hàng (Offer Intelligence)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Bóc tách ưu đãi, combo giá đối thủ và thiết kế lời chào hàng không thể từ chối</p>
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
            {loading ? 'Đang phân tích...' : 'AI Bóc Tách Offer'}
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Dữ liệu quảng cáo từ Meta Ads Library, TikTok Shop, Landing page (Lời hứa, giá, quà tặng kèm, cam kết):
        </label>
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán thông tin về giá bán, quà tặng đi kèm, cam kết hoàn tiền của các đối thủ đang chạy quảng cáo..."
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
              <Gem className="h-4 w-4 text-indigo-600" />
              Báo Cáo Bóc Tách Thị Trường & Gợi Ý Offer Vượt Trội
            </h3>
            <button
              onClick={() => onSyncToNotion('Quảng cáo & Grand Slam Offer', rawText, result)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Xuất sang Notion
            </button>
          </div>

          {result.summary && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-xs">
              <span className="font-bold text-slate-900">Tổng quan thị trường: </span>
              {result.summary}
            </div>
          )}

          {/* Grid: Lời hứa, Giá cả, Bằng chứng */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Lời hứa */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100">
                Lời hứa thị trường đang dùng
              </span>
              <div className="space-y-1.5">
                {result.marketPromises?.map((p, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="font-medium text-slate-900 block">"{p.promise}"</span>
                    <span className="text-[10px] text-slate-500 block">Tần suất: {p.frequency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Khoảng giá */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100">
                Khoảng giá & Ưu đãi phổ biến
              </span>
              <p className="text-slate-700 leading-relaxed">
                {result.pricingAndDiscounts || 'Phân khúc giá và hình thức ưu đãi thường gặp trên thị trường.'}
              </p>
            </div>

            {/* Social Proof */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100">
                Bằng chứng (Proof) hay gặp
              </span>
              <ul className="space-y-1 text-slate-700">
                {result.socialProofs?.map((proof, idx) => (
                  <li key={idx}>• {proof}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Grand Slam Offer Nâng Cấp */}
          {result.improvedOfferIdea && (
            <div className="p-4 rounded-xl bg-white border-2 border-indigo-500 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2">
                  <Gem className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">Đề Xuất Lời Chào Hàng Nâng Cấp (Grand Slam Offer)</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                  Khuyên dùng
                </span>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 text-xs">
                <span className="font-bold text-indigo-950 block mb-0.5">Gói sản phẩm cốt lõi (Core Offer):</span>
                <p className="font-semibold text-indigo-900">{result.improvedOfferIdea.coreOffer}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5 text-amber-600" /> Quà tặng kèm (Bonuses)
                  </span>
                  <ul className="space-y-0.5 text-slate-700">
                    {result.improvedOfferIdea.bonuses?.map((b, idx) => <li key={idx}>+ {b}</li>)}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Cam kết bảo hành
                  </span>
                  <p className="text-slate-700">{result.improvedOfferIdea.riskReversal}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-rose-800 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-rose-600" /> Lý do mua ngay (Urgency)
                  </span>
                  <p className="text-slate-700">{result.improvedOfferIdea.urgencyScarcity}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
