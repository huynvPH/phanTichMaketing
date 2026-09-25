import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Cpu, ChevronDown, Check, Zap, Server, Cloud, RefreshCw, Search, PlusCircle } from 'lucide-react';
import { readLS, writeLS } from '../utils/projectManager';

export const DEFAULT_AI_MODELS = [
  // Google Gemini
  { id: 'gemini-3.6-flash', provider: 'gemini', name: 'Gemini 3.6 Flash (Khuyên dùng)', tag: 'Google Miễn Phí', category: 'Google' },
  { id: 'gemini-flash-latest', provider: 'gemini', name: 'Gemini Flash Latest', tag: 'Google Miễn Phí', category: 'Google' },
  { id: 'gemini-2.5-pro', provider: 'gemini', name: 'Gemini 2.5 Pro', tag: 'Google Cao Cấp', category: 'Google' },
  
  // 9Router
  { id: 'ag/claude-sonnet-4-6', provider: '9router', name: 'Claude Sonnet (9Router)', tag: '9Router', category: '9Router' },
  { id: 'ag/gemini-3.7-flash-high', provider: '9router', name: 'Gemini 3.7 Flash High (9Router)', tag: '9Router', category: '9Router' },
  { id: 'ag/gemini-3.6-flash-high', provider: '9router', name: 'Gemini 3.6 Flash High (9Router)', tag: '9Router', category: '9Router' },

  // OpenAI
  { id: 'gpt-4o', provider: 'openai', name: 'ChatGPT (GPT-4o OpenAI)', tag: 'OpenAI Direct', category: 'OpenAI' },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini (Tiết kiệm)', tag: 'OpenAI Direct', category: 'OpenAI' },

  // Claude
  { id: 'claude-3-7-sonnet-latest', provider: 'claude', name: 'Claude 3.7 Sonnet (Mới)', tag: 'Anthropic Direct', category: 'Claude' },
  { id: 'claude-3-5-sonnet-20241022', provider: 'claude', name: 'Claude 3.5 Sonnet', tag: 'Anthropic Direct', category: 'Claude' },

  // OpenRouter & Local
  { id: 'deepseek/deepseek-chat', provider: 'openrouter', name: 'DeepSeek V3 (OpenRouter)', tag: 'OpenRouter', category: 'OpenRouter' },
  { id: 'local-model', provider: 'local', name: 'Local AI (Ollama / LM Studio)', tag: 'Offline 0đ', category: 'Cục bộ' },
];

// Gộp danh sách model động mới quét được vào danh sách đã lưu (model mới ghi đè model trùng id), rồi lưu lại
export function mergeDynamicModels(newList) {
  const saved = readLS('marketing_dynamic_models', []);
  const map = new Map();
  saved.forEach((m) => map.set(m.id, m));
  newList.forEach((m) => map.set(m.id, m));
  const merged = Array.from(map.values());
  writeLS('marketing_dynamic_models', merged);
  return merged;
}

export default function ModelSelector({ currentModel, onModelChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customModelId, setCustomModelId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  // Dynamic models stored in browser localStorage
  const [dynamicModels, setDynamicModels] = useState(() => readLS('marketing_dynamic_models', []));

  const loadSavedDynamicModels = () => {
    const saved = readLS('marketing_dynamic_models', null);
    if (saved) setDynamicModels(saved);
  };

  useEffect(() => {
    window.addEventListener('marketing_models_updated', loadSavedDynamicModels);
    return () => window.removeEventListener('marketing_models_updated', loadSavedDynamicModels);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge default models with dynamic models (removing duplicates by id)
  const allModels = useMemo(() => {
    const map = new Map();
    // Default models first
    DEFAULT_AI_MODELS.forEach((m) => map.set(m.id, m));
    // Dynamic models override or add
    dynamicModels.forEach((m) => {
      if (!map.has(m.id)) {
        map.set(m.id, {
          ...m,
          tag: m.tag || (m.provider === 'gemini' ? 'Google' : m.provider.toUpperCase()),
          category: m.category || m.provider.toUpperCase(),
        });
      }
    });
    return Array.from(map.values());
  }, [dynamicModels]);

  // Selected Model Object
  const selectedModel = useMemo(() => {
    const found = allModels.find((m) => m.id === currentModel);
    if (found) return found;
    // If not found in presets, create dynamic representation
    return {
      id: currentModel,
      name: currentModel,
      tag: 'Tùy chỉnh',
      provider: currentModel.startsWith('gemini') ? 'gemini' : currentModel.startsWith('ag/') ? '9router' : 'custom',
    };
  }, [allModels, currentModel]);

  // Filtered models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return allModels;
    const q = searchQuery.toLowerCase();
    return allModels.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q))
    );
  }, [allModels, searchQuery]);

  // Handle Refresh: Scan providers for new models
  const handleRefreshModels = async () => {
    setIsRefreshing(true);
    try {
      const providersToScan = ['gemini', '9router'];
      const newDiscovered = [];

      for (const prov of providersToScan) {
        try {
          const res = await fetch('/api/ai/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: prov }),
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.models)) {
            newDiscovered.push(...data.models);
          }
        } catch {}
      }

      if (newDiscovered.length > 0) {
        setDynamicModels(mergeDynamicModels(newDiscovered));
      }
    } catch (e) {
      console.warn('Lỗi làm mới models:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add custom model ID manually
  const handleAddCustomModel = (e) => {
    e.preventDefault();
    if (!customModelId.trim()) return;
    const cleanId = customModelId.trim();
    let detectedProvider = 'local';
    if (cleanId.startsWith('gemini')) detectedProvider = 'gemini';
    else if (cleanId.startsWith('gpt-') || cleanId.startsWith('o1') || cleanId.startsWith('o3')) detectedProvider = 'openai';
    else if (cleanId.startsWith('claude')) detectedProvider = 'claude';
    else if (cleanId.startsWith('ag/')) detectedProvider = '9router';
    else if (cleanId.includes('/')) detectedProvider = 'openrouter';

    const newModel = {
      id: cleanId,
      name: cleanId,
      provider: detectedProvider,
      tag: 'Tùy chỉnh',
      category: 'Tùy chỉnh',
    };

    const updated = [newModel, ...dynamicModels.filter((m) => m.id !== cleanId)];
    setDynamicModels(updated);
    writeLS('marketing_dynamic_models', updated);

    onModelChange(cleanId);
    setCustomModelId('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 flex items-center gap-2 px-3.5 rounded-lg border transition-all shadow-xs text-xs font-medium cursor-pointer ${
          isOpen
            ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/10'
            : 'bg-white hover:bg-slate-50 hover:border-slate-400 border-slate-300 text-slate-800'
        }`}
      >
        <Cpu className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
        <span className="text-slate-500 text-[11px]">Model:</span>
        <span className="font-semibold text-slate-900 max-w-[140px] truncate">{selectedModel.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
          {selectedModel.tag}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
          {/* Header & Refresh */}
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Danh Sách Model ({allModels.length})
            </span>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer transition disabled:opacity-50"
              title="Quét lại các models khả dụng từ API Key của bạn"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Đang quét...' : 'Làm mới'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm model (flash, gpt, sonnet...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Scrollable Model List */}
          <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
            {filteredModels.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-400 text-xs">
                Không tìm thấy model nào khớp với "{searchQuery}"
              </div>
            ) : (
              filteredModels.map((model) => {
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
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      {model.provider === '9router' ? (
                        <Server className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                      ) : model.provider === 'local' ? (
                        <Zap className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-600'}`} />
                      ) : (
                        <Cloud className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                      )}
                      <div className="truncate">
                        <span className="block truncate text-xs">{model.name}</span>
                        <span className="block text-[10px] text-slate-400 truncate">{model.id}</span>
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
              })
            )}
          </div>

          {/* Custom Model Input Footer */}
          <form onSubmit={handleAddCustomModel} className="p-2 border-t border-slate-100 bg-slate-50/70 rounded-b-xl flex gap-1.5">
            <input
              type="text"
              value={customModelId}
              onChange={(e) => setCustomModelId(e.target.value)}
              placeholder="Nhập ID model khác..."
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customModelId.trim()}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <PlusCircle className="h-3 w-3" />
              <span>Dùng</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
