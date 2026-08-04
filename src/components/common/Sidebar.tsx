import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  BarChart3,
  Settings,
  CheckCircle2,
  User,
  PieChart,
  LogOut,
} from 'lucide-react';
import { AvatarImage } from './AvatarImage';
export const Sidebar: React.FC = () => {
  const { currentRole, adminTab, setAdminTab, translatorTab, setTranslatorTab, currentTranslatorProfile, logout } = useApp();

  const adminNavItems = [
    { id: 'dashboard', label: 'Pusat Kendali', icon: LayoutDashboard },
    { id: 'translators', label: 'Penerjemah', icon: Users },
    { id: 'assignments', label: 'Penugasan', icon: FileText },
    { id: 'timers', label: 'Pemantau Waktu', icon: Clock },
    { id: 'workload', label: 'Beban Kerja & Poin', icon: PieChart },
    { id: 'reports', label: 'Laporan Kinerja', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
  ];

  const translatorNavItems = [
    { id: 'dashboard', label: 'Pusat Kendali Aktif', icon: LayoutDashboard },
    { id: 'assignments', label: 'Tugas Saya', icon: FileText },
    { id: 'history', label: 'Riwayat Kerja & Statistik', icon: CheckCircle2 },
    { id: 'profile', label: 'Profil & Kapasitas', icon: User },
  ];

  const items = currentRole === 'SUPER_ADMIN' ? adminNavItems : translatorNavItems;
  const currentTab = currentRole === 'SUPER_ADMIN' ? adminTab : translatorTab;
  const setTab = currentRole === 'SUPER_ADMIN' ? setAdminTab : setTranslatorTab;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white p-4 flex flex-col justify-between hidden md:flex sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AvatarImage
                src={
                  currentRole === 'SUPER_ADMIN'
                    ? undefined
                    : currentTranslatorProfile?.avatar
                }
                name={
                  currentRole === 'SUPER_ADMIN'
                    ? 'Admin'
                    : currentTranslatorProfile?.name
                }
                gender={currentRole === 'SUPER_ADMIN' ? 'male' : 'auto'}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-pink-500/20"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="overflow-hidden">
              <h3 className="truncate text-xs font-bold text-slate-800">
                {currentRole === 'SUPER_ADMIN' ? 'Sistem Super Admin' : currentTranslatorProfile?.name}
              </h3>
              <p className="truncate text-[11px] text-slate-500">
                {currentRole === 'SUPER_ADMIN'
                  ? 'Administrator Sistem'
                  : `Penerjemah • ${currentTranslatorProfile?.languages.join(', ')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {currentRole === 'SUPER_ADMIN' ? 'Operasi Komando' : 'Ruang Kerja Penerjemah'}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-pink-50 text-pink-600 font-semibold border-l-2 border-pink-500 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-pink-600'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-pink-500' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
};
