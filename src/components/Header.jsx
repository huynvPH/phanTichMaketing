import React from 'react';
import { Sparkles, Settings, FolderGit2, ChevronDown } from 'lucide-react';
import ModelSelector from './ModelSelector';

export default function Header({ currentModel, onModelChange, onOpenSettings, activeProjectName, onOpenProjectSelector }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-default select-none group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-1 ring-black/5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-indigo-500/35">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-white/25 pointer-events-none" />
            <Sparkles className="h-4.5 w-4.5 text-white drop-shadow-xs" />
          </div>
          <h1 className="text-[15px] font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
            <span>Marketing</span>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">AI</span>
            <span className="text-slate-800 font-bold">Hub</span>
          </h1>
        </div>

        {/* Project Selector Trigger */}
        <div className="hidden sm:flex items-center ml-2 pl-3 border-l border-slate-200">
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
