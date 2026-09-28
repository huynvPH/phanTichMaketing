import { Sparkles, BarChart2, Info } from 'lucide-react';

export default function MetricBadge({
  type = 'qualitative_estimate',
  value,
  basis,
  confidence,
}) {
  const isEmpirical = type === 'empirical';

  return (
    <div className="relative group inline-flex items-center gap-1.5">
      {/* Giá trị chính (nếu được truyền vào) */}
      {value !== undefined && value !== null && (
        <span className="font-bold text-slate-900 tracking-tight text-xs sm:text-sm">
          {value}
        </span>
      )}

      {/* Badge phân loại */}
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-help ${
          isEmpirical
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}
        title={basis}
      >
        {isEmpirical ? (
          <BarChart2 className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
        ) : (
          <Sparkles className="w-2.5 h-2.5 shrink-0 text-purple-600" />
        )}
        <span>
          {isEmpirical ? 'Đo lường' : 'Định tính AI'}
        </span>
        {confidence && (
          <span className="opacity-75 text-[9px]">
            ({confidence === 'High' ? 'Độ tin cậy cao' : confidence === 'Medium' ? 'Trung bình' : 'Sơ bộ'})
          </span>
        )}
      </span>

      {/* Tooltip khi hover (CSS group-hover thuần, không tốn render state) */}
      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 p-2 bg-slate-900 text-slate-100 text-[10px] leading-relaxed rounded-md shadow-lg z-50 pointer-events-none">
        <div className="flex items-center gap-1 font-semibold text-white mb-0.5">
          <Info className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>{isEmpirical ? 'Dữ liệu Thực nghiệm' : 'Định tính từ Mô hình AI'}</span>
        </div>
        <p className="text-slate-300">{basis}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
