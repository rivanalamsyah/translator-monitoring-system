import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  UserCheck,
  Bell,
  Plus,
  Clock,
  Layers,
  Menu,
  X,
  LayoutDashboard,
  Users,
  FileText,
  PieChart,
  BarChart3,
  Settings,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { formatClock } from '../../utils/formatters';
import logoImg from '../../assets/logo.png';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    currentRole,
    setCurrentRole,
    activeTranslatorUserId,
    setActiveTranslatorUserId,
    translators,
    assignments,
    notifications,
    setIsNewAssignmentModalOpen,
    setIsNotificationDrawerOpen,
    currentTranslatorProfile,
    adminTab,
    setAdminTab,
    translatorTab,
    setTranslatorTab,
  } = useApp();

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

  const mobileNavItems = currentRole === 'SUPER_ADMIN' ? adminNavItems : translatorNavItems;
  const currentTab = currentRole === 'SUPER_ADMIN' ? adminTab : translatorTab;
  const setTab = currentRole === 'SUPER_ADMIN' ? setAdminTab : setTranslatorTab;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md transition-colors">
      {/* Left: Brand logo & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors md:hidden"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <img
          src={logoImg}
          alt="Master Translate Logo"
          className="h-9 w-auto object-contain shrink-0"
        />
      </div>      

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currentRole === 'SUPER_ADMIN' ? 'Operasi Komando' : 'Ruang Kerja Penerjemah'}
              </div>
              <nav className="space-y-1">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${isActive
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

            {/* Quick Profile Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
              <p className="font-semibold text-slate-800 truncate">
                {currentRole === 'SUPER_ADMIN' ? 'Sistem Super Admin' : currentTranslatorProfile?.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {currentRole === 'SUPER_ADMIN' ? 'Administrator' : 'Penerjemah'}
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
