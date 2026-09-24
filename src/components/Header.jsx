import React from 'react';
import { Sparkles, Settings, FolderGit2, ChevronDown } from 'lucide-react';
import ModelSelector from './ModelSelector';

export default function Header({ currentModel, onModelChange, onOpenSettings, activeProjectName, onOpenProjectSelector }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">Marketing AI Hub</h1>
          <p className="text-[10px] text-slate-400">Nghiên cứu thị trường ➔ Chiến lược ➔ Lịch nội dung có truy vết</p>
        </div>

        {/* Project Selector Trigger */}
        <div className="hidden sm:flex items-center ml-3 pl-3 border-l border-slate-200">
          <button
            onClick={onOpenProjectSelector}
            className="h-9 flex items-center gap-2 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 text-xs font-medium transition-all shadow-xs cursor-pointer group"
            title="Bấm để chuyển đổi hoặc tạo dự án mới"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] text-slate-500">Dự án:</span>
            <span className="font-semibold text-slate-900 group-hover:text-indigo-600 max-w-[150px] truncate">
              {activeProjectName || 'Dự án Chính'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Mobile Project Selector Button */}
        <button
          onClick={onOpenProjectSelector}
          className="sm:hidden h-9 flex items-center gap-1.5 px-3 rounded-lg bg-white text-indigo-700 border border-slate-300 text-xs font-semibold cursor-pointer shadow-xs"
        >
          <FolderGit2 className="h-3.5 w-3.5 text-indigo-600" />
        </button>

        {/* Custom Modern Model Combobox */}
        <ModelSelector currentModel={currentModel} onModelChange={onModelChange} />

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="h-9 flex items-center gap-2 px-3.5 rounded-lg bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 border border-slate-300 text-xs font-medium transition-all shadow-xs cursor-pointer group"
        >
          <Settings className="h-3.5 w-3.5 text-indigo-600 group-hover:rotate-45 transition-transform duration-200 shrink-0" />
          <span className="font-semibold text-slate-900">Cài đặt API</span>
        </button>
      </div>
    </header>
  );
}
