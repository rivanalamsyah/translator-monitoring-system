import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  MoreHorizontal,
  Trophy,
  User,
  Clock,
  BarChart3,
  PieChart,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const {
    currentRole,
    adminTab,
    setAdminTab,
    translatorTab,
    setTranslatorTab,
    notifications,
    claimableTasks,
    setIsNotificationDrawerOpen,
    logout,
  } = useApp();

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const availableCount = claimableTasks.filter((t) => t.status === 'WAITING_CLAIM').length;

  const handleAdminTabChange = (tab: string) => {
    setAdminTab(tab);
    setIsMoreOpen(false);
  };

  const handleTranslatorTabChange = (tab: string) => {
    setTranslatorTab(tab);
    setIsMoreOpen(false);
  };

  if (currentRole === 'ADMIN') {
    const activeTab = adminTab;
    const isMoreActive = ['leaderboard', 'reports', 'settings'].includes(activeTab);

    return (
      <>
        {/* Bottom Nav Bar */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg"
          style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', paddingTop: '0.5rem' }}
        >
          <div className="max-w-md mx-auto px-4 flex justify-between items-center h-14">
            {/* Dashboard */}
            <button
              onClick={() => handleAdminTabChange('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
                activeTab === 'dashboard' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutDashboard className="h-[20px] w-[20px] mb-0.5" />
              <span className="text-[9px] font-bold">Dashboard</span>
            </button>

            {/* Orders/Task */}
            <button
              onClick={() => handleAdminTabChange('assignments')}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
                activeTab === 'assignments' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileText className="h-[20px] w-[20px] mb-0.5" />
              <span className="text-[9px] font-bold">Task</span>
            </button>

            {/* Customers (Translators) */}
            <button
              onClick={() => handleAdminTabChange('translators')}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
                activeTab === 'translators' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="h-[20px] w-[20px] mb-0.5" />
              <span className="text-[9px] font-bold">Translator</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative text-slate-400 hover:text-slate-600"
            >
              <div className="relative">
                <Bell className="h-[20px] w-[20px] mb-0.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold">Notifikasi</span>
            </button>

            {/* More */}
            <button
              onClick={() => setIsMoreOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
                isMoreActive || isMoreOpen ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <MoreHorizontal className="h-[20px] w-[20px] mb-0.5" />
              <span className="text-[9px] font-bold">Lainnya</span>
            </button>
          </div>
        </div>

        {/* More Options Drawer Sheet */}
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-t-2xl shadow-xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Menu Lainnya</h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 rounded bg-slate-100 text-slate-400 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                {/* Leaderboard */}
                <button
                  onClick={() => handleAdminTabChange('leaderboard')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                    activeTab === 'leaderboard' ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <Trophy className="h-4.5 w-4.5 text-pink-500" />
                  <span className="text-xs font-semibold">Leaderboard</span>
                </button>

                {/* Reports */}
                <button
                  onClick={() => handleAdminTabChange('reports')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                    activeTab === 'reports' ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <PieChart className="h-4.5 w-4.5 text-pink-500" />
                  <span className="text-xs font-semibold">Laporan</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => handleAdminTabChange('settings')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                    activeTab === 'settings' ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="h-4.5 w-4.5 text-pink-500" />
                  <span className="text-xs font-semibold">Pengaturan</span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 text-left font-bold col-span-2"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span className="text-xs font-bold">Keluar Sesi</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Translators bottom navigation
  const activeTab = translatorTab;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', paddingTop: '0.5rem' }}
    >
      <div className="max-w-md mx-auto px-4 flex justify-between items-center h-14">
        {/* Dashboard */}
        <button
          onClick={() => handleTranslatorTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
            activeTab === 'dashboard' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="h-[20px] w-[20px] mb-0.5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>

        {/* Available Tasks */}
        <button
          onClick={() => handleTranslatorTabChange('tasks')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
            activeTab === 'tasks' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <FileText className="h-[20px] w-[20px] mb-0.5" />
            {availableCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-pink-500 text-[8px] font-bold text-white ring-2 ring-white">
                {availableCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold">Task</span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => handleTranslatorTabChange('leaderboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
            activeTab === 'leaderboard' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="h-[20px] w-[20px] mb-0.5" />
          <span className="text-[9px] font-bold">Leaderboard</span>
        </button>

        {/* Profile / History */}
        <button
          onClick={() => handleTranslatorTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
            activeTab === 'profile' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="h-[20px] w-[20px] mb-0.5" />
          <span className="text-[9px] font-bold">Profil</span>
        </button>
      </div>
    </div>
  );
};
