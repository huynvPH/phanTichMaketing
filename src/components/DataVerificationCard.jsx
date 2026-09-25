import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  FileSearch, 
  ChevronDown, 
  ChevronUp, 
  Info 
} from 'lucide-react';

/**
 * DataVerificationCard
 * Báo cáo kiểm định độ tin cậy của dữ liệu phân tích:
 * - Đánh giá mức độ phong phú của dữ liệu đầu vào (Input Health)
 * - Nguy cơ ảo giác (Hallucination Risk)
 * - Tách bạch: Sự thật có dẫn chứng đối chứng (Verified Facts) vs Giả thuyết cần kiểm chứng (Hypotheses & Gaps)
 */
export default function DataVerificationCard({ report, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!report) return null;

  const {
    inputSufficiencyScore = 70,
    qualityRating = 'Fair', // 'Good' | 'Fair' | 'Insufficient'
    hallucinationRisk = 'Medium', // 'Low' | 'Medium' | 'High'
    verifiedInsightsCount = 0,
    unverifiedHypothesesCount = 0,
    dataGapsIdentified = [],
    analystNotice = '',
  } = report;

  const qKey = qualityRating?.toLowerCase();
  const qBadge = (qKey === 'good' || qKey === 'rich' || qKey === 'tốt')
    ? { label: 'Dữ liệu Đầu vào Tốt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
    : (qKey === 'fair' || qKey === 'trung bình')
    ? { label: 'Dữ liệu Mức Trung Bình', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
    : { label: 'Dữ liệu Còn Sơ Sài', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };

  const rKey = hallucinationRisk?.toLowerCase();
  const rBadge = (rKey === 'low' || rKey === 'thấp')
    ? { label: 'Nguy cơ Ảo giác: Thấp', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: ShieldCheck }
    : (rKey === 'medium' || rKey === 'trung bình')
    ? { label: 'Nguy cơ Ảo giác: Trung bình', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertTriangle }
    : { label: 'Nguy cơ Ảo giác: Cao (Cần cẩn trọng)', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertCircle };

  const RiskIcon = rBadge.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-6 transition-all">
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 select-none"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700">
            <FileSearch className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Thẩm Định & Kiểm Chứng Dữ Liệu (Anti-Hallucination Gate)
          </span>

          {/* Badges */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${qBadge.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${qBadge.dot}`}></span>
            {qBadge.label}
          </span>

          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${rBadge.color}`}>
            <RiskIcon className="w-3 h-3" />
            {rBadge.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-[11px] font-medium hidden sm:inline">
            Độ vững chắc: <strong className="text-slate-800">{inputSufficiencyScore}/100</strong>
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expandable content */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Thanh tiến trình độ đầy đủ dữ liệu */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-600 font-medium">Chỉ số Độ Đầy Đủ & Bằng Chứng Đầu Vào:</span>
              <span className="font-bold text-slate-900">{inputSufficiencyScore}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  inputSufficiencyScore >= 75 
                    ? 'bg-emerald-500' 
                    : inputSufficiencyScore >= 50 
                    ? 'bg-amber-500' 
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(Math.max(inputSufficiencyScore, 5), 100)}%` }}
              />
            </div>
          </div>

          {/* Thẻ thống kê 2 cột */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Cột 1: Đã xác thực */}
            <div className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Sự thật có Dẫn chứng Đối chiếu
                </span>
                <span className="px-1.5 py-0.5 rounded font-bold bg-white text-emerald-800 text-[10px] border border-emerald-200">
                  {verifiedInsightsCount} luận điểm
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                Các insight được trích dẫn trực tiếp từ lời nói khách hàng hoặc transcript video đối thủ. Độ tin cậy cao, có thể đưa vào thực thi ngay.
              </p>
            </div>

            {/* Cột 2: Giả thuyết cần kiểm chứng */}
            <div className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  Giả thuyết Cần Kiểm Chứng Thêm
                </span>
                <span className="px-1.5 py-0.5 rounded font-bold bg-white text-amber-800 text-[10px] border border-amber-200">
                  {unverifiedHypothesesCount} giả thuyết
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Các nhận định mang tính suy luận phỏng đoán của AI do dữ liệu đầu vào chưa đề cập. Cần A/B testing hoặc phỏng vấn thêm trước khi dồn ngân sách lớn.
              </p>
            </div>
          </div>

          {/* Lỗ hổng thông tin & Khuyến nghị chuyên gia */}
          {((dataGapsIdentified && dataGapsIdentified.length > 0) || analystNotice) && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              {dataGapsIdentified && dataGapsIdentified.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Các khoảng trống thông tin cần bổ sung (Data Gaps):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-1">
                    {dataGapsIdentified.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analystNotice && (
                <div className="pt-1.5 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] text-slate-700">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Khuyến cáo của AI:</strong> {analystNotice}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
