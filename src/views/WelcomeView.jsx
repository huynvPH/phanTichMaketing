import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Layers, 
  CalendarDays, 
  ShieldCheck, 
  Cpu, 
  Database,
  CheckCircle2,
  Settings
} from 'lucide-react';
import Scene from '../components/Scene';

export default function WelcomeView({ onGetStarted, onOpenSettings }) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleStart = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('marketing_has_seen_welcome', 'true');
      } catch {}
    }
    onGetStarted();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#070707] text-white flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* 3D Rotating Topology Field (from ThreeUI exact source) */}
      <div className="absolute inset-0 z-0 opacity-70">
        <Scene />
      </div>

      {/* Ambient Gradient Overlays for High Contrast Readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070707]/70 via-transparent to-[#070707] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900/90 border border-zinc-700/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight block">
              Marketing AI Hub
            </span>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">
              Multi-LLM Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800/80 transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cài đặt API</span>
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-10 text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-700/50 text-[11px] font-medium text-zinc-300 mb-6 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Hệ thống Nghiên Cứu & Chiến Lược Thực Chiến Chuẩn 3 Tầng</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] mb-6">
          Nghiên cứu thị trường sâu sắc. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            Chiến lược sắc bén. Thực thi chuẩn xác.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mb-10 leading-relaxed font-normal">
          Nền tảng trí tuệ nhân tạo chuyên biệt cho Marketer & Nhà sáng lập: Bóc tách tâm lý khách hàng thô (VoC), giải mã đối thủ, thiết kế Grand Slam Offer và tự động hóa toàn bộ lịch nội dung đa kênh.
        </p>

        {/* 3 Core Tiers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10 text-left">
          {/* Tier 1 */}
          <div className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/40 transition-all duration-300 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                TẦNG 1: CUSTOMER RESEARCH
              </span>
              <h3 className="text-sm font-semibold text-white mb-2">
                Nghiên Cứu Khách Hàng & Đối Thủ
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Khai thác nỗi đau thầm kín (Pain Points), rào cản mua hàng, bóc tách phụ đề video YouTube và cào bình luận thực tế với bằng chứng kiểm chứng minh bạch.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>5 Nhánh phân tích chuyên sâu</span>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/40 transition-all duration-300 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                TẦNG 2: STRATEGY
              </span>
              <h3 className="text-sm font-semibold text-white mb-2">
                Chiến Lược Nội Dung & Lời Chào Hàng
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Đóng gói thông điệp bán hàng cốt lõi (Grand Slam Offer), cấu trúc ma trận trụ cột nội dung và tìm kiếm ngách tiếp cận đại dương xanh (Blue Ocean).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kế thừa trực tiếp từ Tầng 1</span>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition-all duration-300 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                TẦNG 3: EXECUTION
              </span>
              <h3 className="text-sm font-semibold text-white mb-2">
                Lịch Nội Dung & Đồng Bộ Notion
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sinh lịch đăng 30 ngày bao quát toàn phễu (TOFU, MOFU, BOFU), xuất file Excel/CSV chuẩn UTF-8 tiếng Việt và đồng bộ 1-click lên Notion.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Xuất Excel, CSV & Notion Block</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-zinc-400 mb-8">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Đa LLM: OpenAI, Claude, Gemini, DeepSeek</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Bảo mật dữ liệu 100% Cục bộ</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Quản lý Đa Thương hiệu (Workspace)</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleStart}
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Bắt đầu ngay (Get Started)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={onOpenSettings}
            type="button"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-sm border border-zinc-700/60 transition-all backdrop-blur-md cursor-pointer"
          >
            Thiết lập API Keys
          </button>
        </div>

        {/* Remember Checkbox */}
        <div className="mt-5 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span>Không hiển thị lại trang này ở lần truy cập sau</span>
          </label>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
        <span>© Marketing AI Research Hub • Phiên bản Doanh Nghiệp</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            Trực tiếp & Cục bộ
          </span>
          <span>Bản quyền nội bộ</span>
        </div>
      </footer>
    </div>
  );
}
