import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Cpu, 
  Server, 
  Save, 
  ExternalLink,
  Check
} from 'lucide-react';
import ModelSelector, { mergeDynamicModels } from '../components/ModelSelector';
import { fetchNotionTargets } from '../utils/notionClient';

const PROVIDER_CARDS = [
  {
    id: '9router',
    field: 'nineRouterApiKey',
    icon: Server,
    iconColor: 'text-zinc-900',
    label: '9Router Gateway (Đa mô hình: Claude, GPT, Gemini)',
    badge: 'Khuyên dùng',
    placeholder: 'sk-...',
    testLabel: '9Router',
  },
  {
    id: 'gemini',
    field: 'geminiApiKey',
    icon: Cpu,
    iconColor: 'text-zinc-900',
    label: 'Google Gemini API (Miễn phí 100%)',
    link: { href: 'https://aistudio.google.com/app/apikey', label: 'Lấy API Key Miễn Phí ↗' },
    placeholder: 'AIzaSy...',
    testLabel: 'Gemini',
  },
  {
    id: 'openai',
    field: 'openaiApiKey',
    icon: Cpu,
    iconColor: 'text-zinc-900',
    label: 'OpenAI API (GPT-4o, o3-mini)',
    link: { href: 'https://platform.openai.com/api-keys', label: 'Lấy API Key OpenAI ↗' },
    placeholder: 'sk-proj-...',
    testLabel: 'OpenAI',
  },
  {
    id: 'claude',
    field: 'anthropicApiKey',
    icon: Cpu,
    iconColor: 'text-zinc-900',
    label: 'Anthropic Claude API (Sonnet, Haiku)',
    link: { href: 'https://console.anthropic.com/settings/keys', label: 'Lấy Claude Key ↗' },
    placeholder: 'sk-ant-...',
    testLabel: 'Claude',
  },
];

export default function SettingsView({ currentModel, onModelChange, onConfigUpdated }) {
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
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
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
  }, []);

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
    if (e) e.preventDefault();
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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title Header */}
      <div className="border-b border-zinc-200/80 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Hệ Thống & Kết Nối API
          </span>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Cài Đặt Kết Nối API
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl leading-relaxed">
            Quản lý khóa API của các nhà cung cấp AI và kết nối Notion để phục vụ nghiên cứu, bóc tách dữ liệu và đồng bộ báo cáo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            type="button"
            className="h-9 px-4.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Đã lưu thành công</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Active Model Setting Card */}
        {onModelChange && (
          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-between gap-4">
            <span className="font-semibold text-zinc-900 text-xs">Mô hình AI đang kích hoạt</span>
            <div className="shrink-0">
              <ModelSelector currentModel={currentModel} onModelChange={onModelChange} />
            </div>
          </div>
        )}

        {/* AI Provider Cards */}
        <div className="space-y-4">
          <div className="border-b border-zinc-100 pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Các Nhà Cung Cấp AI Model
            </h2>
          </div>

          <div className="space-y-3">
            {PROVIDER_CARDS.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p.icon className="h-4 w-4 text-zinc-700" />
                    <span className="text-xs font-semibold text-zinc-900">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
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
                        className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition"
                      >
                        {p.link.label}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder={p.placeholder}
                    value={formData[p.field]}
                    onChange={(e) => setFormData({ ...formData, [p.field]: e.target.value })}
                    className="flex-1 h-9 px-3 text-xs rounded-lg border border-zinc-200 focus:border-zinc-950 focus:outline-none text-zinc-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleTest(p.id)}
                    disabled={loadingTest[p.id]}
                    className="h-9 px-3.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {loadingTest[p.id] ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      `Kiểm tra ${p.testLabel}`
                    )}
                  </button>
                </div>

                {testResults[p.id] && (
                  <p className={`text-[11px] flex items-center gap-1.5 ${
                    testResults[p.id].success ? 'text-emerald-700 font-medium' : 'text-rose-600'
                  }`}>
                    {testResults[p.id].success ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    {testResults[p.id].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notion Integration */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-zinc-100 pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Tích Hợp Không Gian Làm Việc Notion
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-zinc-700" />
                <span className="text-xs font-semibold text-zinc-900">Notion Integration Token</span>
              </div>
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition"
              >
                Lấy Token Notion ↗
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                placeholder="ntn_... hoặc secret_..."
                value={formData.notionToken}
                onChange={(e) => setFormData({ ...formData, notionToken: e.target.value })}
                className="flex-1 h-9 px-3 text-xs rounded-lg border border-zinc-200 focus:border-zinc-950 focus:outline-none text-zinc-900 bg-white"
              />
              <button
                type="button"
                onClick={() => handleTest('notion')}
                disabled={loadingTest['notion']}
                className="h-9 px-3.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {loadingTest['notion'] ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Kiểm tra Notion'}
              </button>
            </div>

            {testResults['notion'] && (
              <p className={`text-[11px] flex items-center gap-1.5 ${
                testResults['notion'].success ? 'text-emerald-700 font-medium' : 'text-rose-600'
              }`}>
                {testResults['notion'].success ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                {testResults['notion'].message}
              </p>
            )}

            {/* Target Database Selection */}
            {notionTargets.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Chọn Trang hoặc Database để xuất báo cáo
                </label>
                <select
                  value={formData.notionParentId}
                  onChange={(e) => {
                    const sel = notionTargets.find((t) => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      notionParentId: e.target.value,
                      notionParentType: sel?.type || 'page',
                    });
                  }}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950"
                >
                  <option value="">-- Chọn đích đến để đồng bộ --</option>
                  {notionTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.type.toUpperCase()}] {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="pt-4 border-t border-zinc-200/80 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          * Các API Key được lưu an toàn trực tiếp trên trình duyệt & máy chủ nội bộ.
        </span>
        <button
          onClick={handleSave}
          type="button"
          className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Đã lưu thành công</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Lưu Cấu Hình</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
