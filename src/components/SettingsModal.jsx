import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, RefreshCw, Database, Cpu, Server } from 'lucide-react';
import { mergeDynamicModels } from './ModelSelector';
import { fetchNotionTargets } from '../utils/notionClient';

const PROVIDER_CARDS = [
  {
    id: '9router',
    field: 'nineRouterApiKey',
    icon: Server,
    iconColor: 'text-indigo-600',
    label: '9Router Gateway (Đa mô hình: Claude, GPT, Gemini)',
    badge: 'Khuyên dùng',
    placeholder: 'sk-...',
    testLabel: '9Router',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    id: 'gemini',
    field: 'geminiApiKey',
    icon: Cpu,
    iconColor: 'text-sky-600',
    label: 'Google Gemini API (Miễn phí 100%)',
    link: { href: 'https://aistudio.google.com/app/apikey', label: 'Lấy API Key Miễn Phí ↗' },
    placeholder: 'AIzaSy...',
    testLabel: 'Gemini',
    btnColor: 'bg-sky-600 hover:bg-sky-700',
  },
  {
    id: 'openai',
    field: 'openaiApiKey',
    icon: Cpu,
    iconColor: 'text-emerald-600',
    label: 'OpenAI API (GPT-4o, o3-mini)',
    link: { href: 'https://platform.openai.com/api-keys', label: 'Lấy API Key OpenAI ↗' },
    placeholder: 'sk-proj-...',
    testLabel: 'OpenAI',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    id: 'claude',
    field: 'anthropicApiKey',
    icon: Cpu,
    iconColor: 'text-amber-700',
    label: 'Anthropic Claude API (Sonnet, Haiku)',
    link: { href: 'https://console.anthropic.com/settings/keys', label: 'Lấy Claude Key ↗' },
    placeholder: 'sk-ant-...',
    testLabel: 'Claude',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
  },
];

export default function SettingsModal({ isOpen, onClose, onConfigUpdated }) {
  const [formData, setFormData] = useState({
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    nineRouterApiKey: '',
    notionToken: '',
    notionParentId: '',
    notionParentType: 'page',
  });

  const [testResults, setTestResults] = useState({});
  const [loadingTest, setLoadingTest] = useState({});
  const [notionTargets, setNotionTargets] = useState([]);

  useEffect(() => {
    if (isOpen) {
      let localKeys = {};
      try {
        const saved = localStorage.getItem('marketing_client_keys');
        if (saved) localKeys = JSON.parse(saved);
      } catch {}

      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          setFormData((prev) => ({
            ...prev,
            nineRouterApiKey: localKeys.nineRouterApiKey || data.nineRouterApiKey || '',
            openaiApiKey: localKeys.openaiApiKey || (data.maskedOpenAI ? prev.openaiApiKey : ''),
            anthropicApiKey: localKeys.anthropicApiKey || (data.maskedClaude ? prev.anthropicApiKey : ''),
            geminiApiKey: localKeys.geminiApiKey || (data.maskedGemini ? prev.geminiApiKey : ''),
            notionToken: localKeys.notionToken || prev.notionToken || '',
            notionParentId: localKeys.notionParentId || data.notionParentId || '',
            notionParentType: localKeys.notionParentType || data.notionParentType || 'page',
          }));
        })
        .catch(console.error);

      loadNotionPages();
    }
  }, [isOpen]);

  const loadNotionPages = async () => {
    setNotionTargets(await fetchNotionTargets());
  };

  const handleTest = async (provider) => {
    setLoadingTest((prev) => ({ ...prev, [provider]: true }));
    try {
      let apiKey = '';

      if (provider === '9router') apiKey = formData.nineRouterApiKey;
      else if (provider === 'openai') apiKey = formData.openaiApiKey;
      else if (provider === 'claude') apiKey = formData.anthropicApiKey;
      else if (provider === 'gemini') apiKey = formData.geminiApiKey;
      else if (provider === 'notion') apiKey = formData.notionToken;

      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [provider]: data }));

      // Lưu trữ danh sách models tìm thấy vào localStorage và thông báo cho ModelSelector
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        mergeDynamicModels(data.models);
        window.dispatchEvent(new Event('marketing_models_updated'));
      }

      if (provider === 'notion' && data.success) {
        loadNotionPages();
      }
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [provider]: { success: false, message: err.message } }));
    } finally {
      setLoadingTest((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    // 1. Luôn lưu vào localStorage của trình duyệt (Hoạt động 100% trên Vercel & Serverless)
    try {
      const toSave = {
        openaiApiKey: formData.openaiApiKey,
        anthropicApiKey: formData.anthropicApiKey,
        geminiApiKey: formData.geminiApiKey,
        nineRouterApiKey: formData.nineRouterApiKey,
        notionToken: formData.notionToken,
        notionParentId: formData.notionParentId,
        notionParentType: formData.notionParentType,
      };
      localStorage.setItem('marketing_client_keys', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Lỗi lưu localStorage:', e);
    }

    // 2. Gửi lưu server (dành cho local development)
    const payload = {};
    if (formData.nineRouterApiKey) payload.nineRouterApiKey = formData.nineRouterApiKey;
    if (formData.openaiApiKey) payload.openaiApiKey = formData.openaiApiKey;
    if (formData.anthropicApiKey) payload.anthropicApiKey = formData.anthropicApiKey;
    if (formData.geminiApiKey) payload.geminiApiKey = formData.geminiApiKey;
    if (formData.notionToken) payload.notionToken = formData.notionToken;
    payload.notionParentId = formData.notionParentId;
    payload.notionParentType = formData.notionParentType;

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    if (onConfigUpdated) onConfigUpdated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Cài Đặt Kết Nối API</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {PROVIDER_CARDS.map((p) => (
            <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <p.icon className={`h-4 w-4 ${p.iconColor}`} /> {p.label}
                </span>
                {p.badge && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {p.badge}
                  </span>
                )}
                {p.link && (
                  <a
                    href={p.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline text-[11px] font-normal"
                  >
                    {p.link.label}
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={p.placeholder}
                  value={formData[p.field]}
                  onChange={(e) => setFormData({ ...formData, [p.field]: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => handleTest(p.id)}
                  disabled={loadingTest[p.id]}
                  className={`px-3 py-1.5 rounded-lg ${p.btnColor} text-white font-semibold transition`}
                >
                  {loadingTest[p.id] ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : `Kiểm tra ${p.testLabel}`}
                </button>
              </div>
              {testResults[p.id] && (
                <p className={`text-[11px] flex items-center gap-1 ${testResults[p.id].success ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                  {testResults[p.id].success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {testResults[p.id].message}
                </p>
              )}
            </div>
          ))}

          {/* Notion */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-slate-700" /> Notion Integration Token
              </span>
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline text-[11px] font-normal"
              >
                Lấy Token Notion ↗
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                placeholder="secret_..."
                value={formData.notionToken}
                onChange={(e) => setFormData({ ...formData, notionToken: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleTest('notion')}
                disabled={loadingTest.notion}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition"
              >
                {loadingTest.notion ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Kiểm tra'}
              </button>
            </div>

            {testResults.notion && (
              <p className={`text-[11px] flex items-center gap-1 ${testResults.notion.success ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                {testResults.notion.success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {testResults.notion.message}
              </p>
            )}

            {/* Target selector */}
            {notionTargets.length > 0 && (
              <div className="pt-1">
                <span className="text-slate-600 text-[11px] block mb-1">Trang Notion mặc định:</span>
                <select
                  value={formData.notionParentId}
                  onChange={(e) => {
                    const sel = notionTargets.find((t) => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      notionParentId: e.target.value,
                      notionParentType: sel ? sel.type : 'page',
                    });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none"
                >
                  <option value="">-- Chọn một Trang/Database từ Notion --</option>
                  {notionTargets.map((t) => (
                    <option key={t.id} value={t.id}>[{t.type}] {t.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg btn-brand text-white font-semibold transition"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
}
