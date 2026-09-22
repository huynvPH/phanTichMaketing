import React, { useState, useRef, useEffect } from 'react';
import { Cpu, ChevronDown, Check, Zap, Server, Cloud } from 'lucide-react';

export const AI_MODELS = [
  { id: 'gemini-3.6-flash', provider: 'gemini', name: 'Gemini 3.6 Flash (Google Free)', tag: 'Google Miễn Phí', category: 'Trực tiếp' },
  { id: 'gpt-4o', provider: 'openai', name: 'ChatGPT (GPT-4o OpenAI)', tag: 'OpenAI Direct', category: 'Trực tiếp' },
  { id: 'claude-3-5-sonnet-20241022', provider: 'claude', name: 'Claude 3.5 Sonnet', tag: 'Anthropic Direct', category: 'Trực tiếp' },
  { id: 'local-model', provider: 'local', name: 'Local AI (Ollama / LM Studio)', tag: 'Offline 0đ', category: 'Cục bộ' },
  { id: 'ag/claude-sonnet-4-6', provider: '9router', name: 'Claude Sonnet (9Router)', tag: '9Router', category: 'Khác' },
];

export default function ModelSelector({ currentModel, onModelChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedModel = AI_MODELS.find((m) => m.id === currentModel) || AI_MODELS[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all shadow-xs text-xs font-medium cursor-pointer ${
          isOpen
            ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/10'
            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
        }`}
      >
        <Cpu className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
        <span className="text-slate-500 text-[11px]">Model:</span>
        <span className="font-semibold text-slate-900">{selectedModel.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {selectedModel.tag}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
            <span>Chọn Mô Hình AI</span>
            <span className="text-[9px] text-emerald-600 font-normal">● Sẵn sàng</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
            {AI_MODELS.map((model) => {
              const isSelected = model.id === currentModel;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between transition group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {model.provider === '9router' ? (
                      <Server className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    ) : model.provider === 'local' ? (
                      <Zap className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-600'}`} />
                    ) : (
                      <Cloud className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    )}
                    <div className="truncate">
                      <span className="block truncate text-xs">{model.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {model.tag}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
