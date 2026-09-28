import React from 'react';
import { 
  Compass, 
  Layers, 
  CalendarDays, 
  Database, 
  Swords,
  BookOpen,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
  PanelLeftClose,
  Settings
} from 'lucide-react';

export const TAB_GROUPS = [
  {
    title: 'AGENT',
    tabs: [
      {
        id: 'all_in_one',
        title: 'Nghiên Cứu Khách Hàng',
        icon: Compass,
      },
      {
        id: 'competitor_videos',
        title: 'Tình Báo Video Đối Thủ',
        icon: Swords,
      },
    ],
  },
  {
    title: 'STRATEGY',
    tabs: [
      {
        id: 'strategy',
        title: 'Chiến Lược Nội Dung',
        icon: Layers,
      },
    ],
  },
  {
    title: 'WORKFLOW',
    tabs: [
      {
        id: 'calendar',
        title: 'Lịch Nội Dung Đa Kênh',
        icon: CalendarDays,
      },
    ],
  },
  {
    title: 'SYSTEM',
    tabs: [
      {
        id: 'notion',
        title: 'Đồng Bộ Notion',
        icon: Database,
      },
      {
        id: 'settings',
        title: 'Cài Đặt API',
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  themeMode,
  onThemeChange,
  onClose
}) {
  return (
    <aside className="w-64 h-full bg-white border-r border-zinc-200/80 flex flex-col justify-between shrink-0 select-none sticky top-0 self-stretch z-20">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Logo Header */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-zinc-200/80 shrink-0">
          <div className="text-emerald-600 flex items-center justify-center">
            {/* Minimalist Asterisk Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
            </svg>
          </div>
          <span className="font-semibold text-zinc-950 text-sm tracking-tight">
            Marketing AI
          </span>
        </div>

        {/* Navigation Groups */}
        <nav className="p-3 space-y-4 overflow-y-auto flex-1">
          {TAB_GROUPS.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="px-3 pb-1">
                <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase block">
                  {group.title}
                </span>
              </div>

              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => onSelectTab(tab.id)}
                      className={`w-full h-9 text-left px-3 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 stroke-[1.8] ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                      <span className="truncate">{tab.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Dock */}
      <div className="p-3 border-t border-zinc-100 space-y-2 shrink-0 bg-white">
        {/* Documentation Link */}
        <a
          href="https://github.com/huynvPH/phanTichMaketing#readme"
          target="_blank"
          rel="noreferrer"
          className="w-full h-9 flex items-center justify-between px-3 text-[13px] font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-zinc-500 stroke-[1.8]" />
            <span>Tài liệu hướng dẫn</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-400 stroke-[1.8]" />
        </a>

        {/* User Avatar + Theme Switcher Dock */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between px-1">
          {/* User status avatar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-7 w-7 rounded-full bg-emerald-600 text-white text-[11px] font-semibold flex items-center justify-center">
                M
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
          </div>

          {/* Theme Selector Pill */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/60">
            <button
              type="button"
              onClick={() => onThemeChange('system')}
              className={`p-1 rounded-md transition-colors ${themeMode === 'system' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}`}
              title="Theo hệ thống"
              aria-label="Theo hệ thống"
              aria-pressed={themeMode === 'system'}
            >
              <Monitor className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={`p-1 rounded-md transition-colors ${themeMode === 'light' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}`}
              title="Sáng"
              aria-label="Sáng"
              aria-pressed={themeMode === 'light'}
            >
              <Sun className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={`p-1 rounded-md transition-colors ${themeMode === 'dark' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}`}
              title="Tối"
              aria-label="Tối"
              aria-pressed={themeMode === 'dark'}
            >
              <Moon className="h-3.5 w-3.5 stroke-[1.8]" />
            </button>
          </div>

          {/* Collapse sidebar toggle icon */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            title="Đóng thanh bên"
            aria-label="Đóng thanh bên"
          >
            <PanelLeftClose className="h-4 w-4 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
