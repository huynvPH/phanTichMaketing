import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

export default function NotionSyncModal({ isOpen, onClose, exportData, config, onOpenSettings }) {
  const [title, setTitle] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [targetType, setTargetType] = useState('page');
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    if (isOpen && exportData) {
      setTitle(exportData.title || `Báo cáo nghiên cứu - ${new Date().toLocaleDateString('vi-VN')}`);
      setSyncResult(null);
      fetchTargets();
    }
  }, [isOpen, exportData]);

  const fetchTargets = () => {
    setLoadingTargets(true);
    fetch('/api/notion/targets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.targets) {
          setTargets(data.targets);
          if (!selectedTarget && data.targets.length > 0) {
            setSelectedTarget(data.targets[0].id);
            setTargetType(data.targets[0].type);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTargets(false));
  };

  const handleSync = async () => {
    if (!config.hasNotion) {
      alert('Bạn chưa cấu hình Notion Token.');
      return;
    }
    const targetId = selectedTarget || config.notionParentId;
    if (!targetId) {
      alert('Vui lòng chọn hoặc nhập Trang Notion đích.');
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/notion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          targetType,
          title,
          moduleName: exportData.moduleName,
          rawData: exportData.rawData,
          analysisJson: exportData.analysisJson,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSyncResult(data);

      const prev = JSON.parse(localStorage.getItem('notion_synced_reports') || '[]');
      const updated = [
        {
          title,
          module: exportData.moduleName,
          url: data.url,
          timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        },
        ...prev,
      ].slice(0, 30);
      localStorage.setItem('notion_synced_reports', JSON.stringify(updated));
    } catch (err) {
      alert('Lỗi xuất Notion: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen || !exportData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Xuất Báo Cáo Sang Notion</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {!config.hasNotion ? (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <p>Chưa cấu hình Notion Token. Vui lòng nhập token trong cài đặt.</p>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold transition"
            >
              Cài đặt Notion
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-slate-700 font-semibold block">Tiêu đề trang Notion:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-semibold block">Chọn trang Notion cha:</label>
                <button
                  type="button"
                  onClick={fetchTargets}
                  disabled={loadingTargets}
                  className="text-indigo-600 hover:underline text-[10px]"
                >
                  <RefreshCw className={`h-3 w-3 inline ${loadingTargets ? 'animate-spin' : ''}`} /> Làm mới
                </button>
              </div>

              {targets.length > 0 ? (
                <select
                  value={selectedTarget}
                  onChange={(e) => {
                    const sel = targets.find((t) => t.id === e.target.value);
                    setSelectedTarget(e.target.value);
                    if (sel) setTargetType(sel.type);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none"
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>[{t.type}] {t.title}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nhập Page ID Notion..."
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none"
                />
              )}
            </div>

            {syncResult && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {syncResult.message}
                </span>
                {syncResult.url && (
                  <a
                    href={syncResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    <span>Mở bài viết trên Notion ↗</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
          >
            Đóng
          </button>
          {config.hasNotion && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
            >
              {syncing ? 'Đang đẩy...' : 'Xác Nhận Xuất'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
