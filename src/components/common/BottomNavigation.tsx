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

    return (
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', paddingTop: '0.5rem' }}
      >
        <div className="max-w-md mx-auto px-2 flex justify-between items-center h-14">
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

          {/* Task */}
          <button
            onClick={() => handleAdminTabChange('assignments')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
              activeTab === 'assignments' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="h-[20px] w-[20px] mb-0.5" />
            <span className="text-[9px] font-bold">Task</span>
          </button>

          {/* Translator */}
          <button
            onClick={() => handleAdminTabChange('translators')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
              activeTab === 'translators' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="h-[20px] w-[20px] mb-0.5" />
            <span className="text-[9px] font-bold">Translator</span>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => handleAdminTabChange('leaderboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
              activeTab === 'leaderboard' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Trophy className="h-[20px] w-[20px] mb-0.5" />
            <span className="text-[9px] font-bold">Leaderboard</span>
          </button>

          {/* Laporan */}
          <button
            onClick={() => handleAdminTabChange('reports')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-colors ${
              activeTab === 'reports' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieChart className="h-[20px] w-[20px] mb-0.5" />
            <span className="text-[9px] font-bold">Laporan</span>
          </button>
        </div>
      </div>
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
