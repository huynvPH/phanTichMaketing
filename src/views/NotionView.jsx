import React, { useState, useEffect } from 'react';
import { Database, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export default function NotionView({ config, onOpenSettings }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncedItems, setSyncedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notion_synced_reports') || '[]');
    } catch {
      return [];
    }
  });

  const fetchTargets = () => {
    setLoading(true);
    fetch('/api/notion/targets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.targets) {
          setTargets(data.targets);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (config.hasNotion) {
      fetchTargets();
    }
  }, [config.hasNotion]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Trung Tâm Đồng Bộ Notion</h2>
          <p className="text-xs text-slate-500">Quản lý các báo cáo nghiên cứu đã xuất sang không gian làm việc Notion</p>
        </div>

        <div className="flex items-center gap-2">
          {config.hasNotion && (
            <button
              onClick={fetchTargets}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Cài đặt Notion Token
          </button>
        </div>
      </div>

      {/* Accessible Pages */}
      {config.hasNotion ? (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Các Trang / Database được cấp quyền ({targets.length})
            </span>
            <button onClick={fetchTargets} className="text-indigo-600 hover:underline">
              Cập nhật lại
            </button>
          </div>

          {targets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {targets.map((t) => (
                <div key={t.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {t.type}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{t.title}</span>
                  </div>
                  {t.url && (
                    <a href={t.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-800 p-0.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500">
              Chưa tìm thấy trang Notion nào được cấp quyền. Bạn nhớ vào trang Notion và chọn "Add connections" cho Integration nhé!
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Chưa kết nối Notion Token
          </span>
          <p className="text-amber-800">
            Hãy bấm vào nút <b>"Cài đặt API"</b> ở trên để nhập Notion Token và kết nối trang làm việc của bạn.
          </p>
        </div>
      )}

      {/* History */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-indigo-600" />
            Lịch Sử Báo Cáo Đã Đẩy Lên Notion
          </span>
          {syncedItems.length > 0 && (
            <button
              onClick={() => {
                localStorage.removeItem('notion_synced_reports');
                setSyncedItems([]);
              }}
              className="text-slate-400 hover:text-rose-600"
            >
              Xóa lịch sử
            </button>
          )}
        </div>

        {syncedItems.length > 0 ? (
          <div className="space-y-2 text-xs">
            {syncedItems.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">{item.title}</span>
                  <span className="text-[10px] text-slate-500">{item.module} • {item.timestamp}</span>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-indigo-700 font-medium border border-slate-200"
                  >
                    <span>Mở trang</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">Chưa có báo cáo nào được xuất trong phiên này.</p>
        )}
      </div>
    </div>
  );
}
