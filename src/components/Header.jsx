import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Header({ 
  activeProjectName,
  onOpenProjectSelector,
  activeTabTitle
}) {
  const initial = (activeProjectName || 'Marketing Hub').trim().charAt(0).toUpperCase();

  return (
    <header className="h-14 px-6 bg-white border-b border-zinc-200/80 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left: Breadcrumb / Workspace Selector */}
      <div className="flex items-center gap-2.5 text-[13px]">
        {/* Workspace Pill Trigger */}
        <button
          onClick={onOpenProjectSelector}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-950 font-semibold cursor-pointer group"
          title="Bấm để chuyển đổi hoặc tạo dự án mới"
        >
          <div className="h-6 w-6 rounded-full bg-zinc-950 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <span className="truncate max-w-[180px] tracking-tight">{activeProjectName || 'Dự án Nghiên cứu'}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors shrink-0" />
        </button>

        {/* Breadcrumb Separator */}
        <span className="text-zinc-300 font-light select-none">/</span>

        {/* Current Page Title */}
        <span className="text-zinc-800 font-medium px-1">
          {activeTabTitle || 'Nghiên Cứu Khách Hàng'}
        </span>
      </div>

      {/* Right empty spacer for clean balance */}
      <div />
    </header>
  );
}
