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
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-medium transition cursor-pointer group"
            title="Bấm để chuyển đổi hoặc tạo dự án mới"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-[11px] text-slate-400">Dự án:</span>
            <span className="font-bold text-slate-800 group-hover:text-indigo-700 max-w-[160px] truncate">
              {activeProjectName || 'Dự án Chính'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Mobile Project Selector Button */}
        <button
          onClick={onOpenProjectSelector}
          className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold cursor-pointer"
        >
          <FolderGit2 className="h-3.5 w-3.5" />
        </button>

        {/* Custom Modern Model Combobox */}
        <ModelSelector currentModel={currentModel} onModelChange={onModelChange} />

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-xs cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5 text-slate-500" />
          <span>Cài đặt API</span>
        </button>
      </div>
    </header>
  );
}
