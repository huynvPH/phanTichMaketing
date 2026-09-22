import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, RefreshCw, ExternalLink, Database, Cpu, Server } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onConfigUpdated }) {
  const [formData, setFormData] = useState({
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    openrouterApiKey: '',
    openrouterModel: 'deepseek/deepseek-chat',
    nineRouterApiKey: '',
    nineRouterBaseUrl: 'http://localhost:20128/v1',
    nineRouterModel: 'ag/claude-sonnet-4-6',
    localBaseUrl: 'http://localhost:20128/v1',
    localModel: 'ag/claude-sonnet-4-6',
    notionToken: '',
    notionParentId: '',
    notionParentType: 'page',
  });

  const [testResults, setTestResults] = useState({});
  const [loadingTest, setLoadingTest] = useState({});
  const [saving, setSaving] = useState(false);
  const [notionTargets, setNotionTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

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
            nineRouterBaseUrl: localKeys.nineRouterBaseUrl || data.nineRouterBaseUrl || 'http://localhost:20128/v1',
            nineRouterModel: localKeys.nineRouterModel || data.nineRouterModel || 'ag/claude-sonnet-4-6',
            openaiApiKey: localKeys.openaiApiKey || (data.maskedOpenAI ? prev.openaiApiKey : ''),
            anthropicApiKey: localKeys.anthropicApiKey || (data.maskedClaude ? prev.anthropicApiKey : ''),
            geminiApiKey: localKeys.geminiApiKey || (data.maskedGemini ? prev.geminiApiKey : ''),
            openrouterApiKey: localKeys.openrouterApiKey || prev.openrouterApiKey || '',
            notionToken: localKeys.notionToken || prev.notionToken || '',
            notionParentId: localKeys.notionParentId || data.notionParentId || '',
            notionParentType: localKeys.notionParentType || data.notionParentType || 'page',
          }));
        })
        .catch(console.error);

      loadNotionPages();
    }
  }, [isOpen]);

  const loadNotionPages = () => {
    setLoadingTargets(true);
    fetch('/api/notion/targets')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.targets) {
          setNotionTargets(res.targets);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTargets(false));
  };

  const handleTest = async (provider) => {
    setLoadingTest((prev) => ({ ...prev, [provider]: true }));
    try {
      let apiKey = '';
      let model = '';
      let customBaseUrl = '';

      if (provider === '9router') {
        apiKey = formData.nineRouterApiKey;
        model = formData.nineRouterModel;
        customBaseUrl = formData.nineRouterBaseUrl;
      } else if (provider === 'openai') apiKey = formData.openaiApiKey;
      else if (provider === 'claude') apiKey = formData.anthropicApiKey;
      else if (provider === 'gemini') apiKey = formData.geminiApiKey;
      else if (provider === 'notion') apiKey = formData.notionToken;

      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model, customBaseUrl }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [provider]: data }));

      // Lưu trữ danh sách models tìm thấy vào localStorage và thông báo cho ModelSelector
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        try {
          const saved = localStorage.getItem('marketing_dynamic_models');
          const existing = saved ? JSON.parse(saved) : [];
          const map = new Map();
          existing.forEach((m) => map.set(m.id, m));
          data.models.forEach((m) => map.set(m.id, m));
          const merged = Array.from(map.values());
          localStorage.setItem('marketing_dynamic_models', JSON.stringify(merged));
          window.dispatchEvent(new Event('marketing_models_updated'));
        } catch (e) {
          console.warn('Lỗi lưu dynamic models:', e);
        }
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Luôn lưu vào localStorage của trình duyệt (Hoạt động 100% trên Vercel & Serverless)
      try {
        const toSave = {
          openaiApiKey: formData.openaiApiKey,
          anthropicApiKey: formData.anthropicApiKey,
          geminiApiKey: formData.geminiApiKey,
          openrouterApiKey: formData.openrouterApiKey,
          nineRouterApiKey: formData.nineRouterApiKey,
          nineRouterBaseUrl: formData.nineRouterBaseUrl,
          nineRouterModel: formData.nineRouterModel,
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
      if (formData.nineRouterBaseUrl) payload.nineRouterBaseUrl = formData.nineRouterBaseUrl;
      if (formData.nineRouterModel) payload.nineRouterModel = formData.nineRouterModel;
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
    } catch (err) {
      alert('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setSaving(false);
    }
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
          {/* 9Router */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Server className="h-4 w-4 text-indigo-600" /> 9Router Gateway (Đa mô hình: Claude, GPT, Gemini)
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Khuyên dùng
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk-..."
                value={formData.nineRouterApiKey}
                onChange={(e) => setFormData({ ...formData, nineRouterApiKey: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleTest('9router')}
                disabled={loadingTest['9router']}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
              >
                {loadingTest['9router'] ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Kiểm tra 9Router'}
              </button>
            </div>
            {testResults['9router'] && (
              <p className={`text-[11px] flex items-center gap-1 ${testResults['9router'].success ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                {testResults['9router'].success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {testResults['9router'].message}
              </p>
            )}
          </div>

          {/* Google Gemini (Free API) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-sky-600" /> Google Gemini API (Miễn phí 100%)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline text-[11px] font-normal"
              >
                Lấy API Key Miễn Phí ↗
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleTest('gemini')}
                disabled={loadingTest.gemini}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition"
              >
                {loadingTest.gemini ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Kiểm tra Gemini'}
              </button>
            </div>
            {testResults.gemini && (
              <p className={`text-[11px] flex items-center gap-1 ${testResults.gemini.success ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                {testResults.gemini.success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {testResults.gemini.message}
              </p>
            )}
          </div>

          {/* OpenAI (ChatGPT) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-emerald-600" /> OpenAI API (GPT-4o, o3-mini)
              </span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline text-[11px] font-normal"
              >
                Lấy API Key OpenAI ↗
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk-proj-..."
                value={formData.openaiApiKey}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleTest('openai')}
                disabled={loadingTest.openai}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
              >
                {loadingTest.openai ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Kiểm tra OpenAI'}
              </button>
            </div>
            {testResults.openai && (
              <p className={`text-[11px] flex items-center gap-1 ${testResults.openai.success ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                {testResults.openai.success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {testResults.openai.message}
              </p>
            )}
          </div>

          {/* Anthropic Claude */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-amber-700" /> Anthropic Claude API (Sonnet, Haiku)
              </span>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline text-[11px] font-normal"
              >
                Lấy Claude Key ↗
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk-ant-..."
                value={formData.anthropicApiKey}
                onChange={(e) => setFormData({ ...formData, anthropicApiKey: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleTest('claude')}
                disabled={loadingTest.claude}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition"
              >
                {loadingTest.claude ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Kiểm tra Claude'}
              </button>
            </div>
            {testResults.claude && (
              <p className={`text-[11px] flex items-center gap-1 ${testResults.claude.success ? 'text-emerald-700 font-semibold' : 'text-rose-600'}`}>
                {testResults.claude.success ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {testResults.claude.message}
              </p>
            )}
          </div>

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
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
          >
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
          </button>
        </div>
      </div>
    </div>
  );
}
