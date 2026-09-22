import { 
  Compass, 
  Layers, 
  CalendarDays, 
  Database, 
  ChevronRight,
  Swords
} from 'lucide-react';

export const TAB_GROUPS = [
  {
    title: 'TẦNG 1: CUSTOMER RESEARCH',
    badge: 'Nghiên Cứu',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    tabs: [
      {
        id: 'all_in_one',
        title: 'Nghiên Cứu Khách Hàng',
        sub: 'Phân tích Insight toàn diện',
        icon: Compass,
      },
      {
        id: 'competitor_videos',
        title: 'Tình Báo Video Đối Thủ',
        sub: 'Quét link & Bóc tách kịch bản',
        icon: Swords,
      },
    ],
  },
  {
    title: 'TẦNG 2: STRATEGY',
    badge: 'Chiến Lược',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tabs: [
      {
        id: 'strategy',
        title: 'Chiến Lược Nội Dung',
        sub: 'Pillars & Phân bổ kênh',
        icon: Layers,
      },
    ],
  },
  {
    title: 'TẦNG 3: EXECUTION',
    badge: 'Kế Hoạch',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tabs: [
      {
        id: 'calendar',
        title: 'Lịch Nội Dung',
        sub: 'Đa kênh có truy vết insight',
        icon: CalendarDays,
      },
    ],
  },
  {
    title: 'HỆ THỐNG',
    badge: 'Xuất',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    tabs: [
      {
        id: 'notion',
        title: 'Đồng Bộ Notion',
        sub: 'Lịch sử & Xuất báo cáo',
        icon: Database,
      },
    ],
  },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
      <nav className="space-y-4">
        {TAB_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-2 pb-1 flex items-center justify-between gap-2 min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {group.title}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-semibold border whitespace-nowrap shrink-0 ${group.badgeColor}`}>
                {group.badge}
              </span>
            </div>

            <div className="space-y-0.5">
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs ring-1 ring-indigo-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <div className="truncate">
                        <span className="text-xs block truncate leading-tight">{tab.title}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{tab.sub}</span>
                      </div>
                    </div>

                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isActive ? 'text-indigo-600' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
        Quy trình 3 Tầng Thực Chiến v1.0
      </div>
    </aside>
  );
}
