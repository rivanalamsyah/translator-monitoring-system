import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { BottomNavigation } from './components/common/BottomNavigation';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TranslatorsList } from './components/admin/TranslatorsList';
import { TasksList } from './components/admin/TasksList';
import { ReportsView } from './components/admin/ReportsView';
import { SettingsView } from './components/admin/SettingsView';

// Translator Components
import { TranslatorDashboard } from './components/translator/TranslatorDashboard';
import { TranslatorTasks } from './components/translator/TranslatorTasks';
import { TranslatorProfileView } from './components/translator/TranslatorProfileView';

// Common Views
import { LeaderboardView } from './components/common/LeaderboardView';

// Modals
import { NewAssignmentModal } from './components/modals/NewAssignmentModal';
import { NewTranslatorModal } from './components/modals/NewTranslatorModal';
import { ReviewSubmissionModal } from './components/modals/ReviewSubmissionModal';
import { PauseReasonModal } from './components/modals/PauseReasonModal';
import { SubmitWorkModal } from './components/modals/SubmitWorkModal';
import { NotificationDrawer } from './components/modals/NotificationDrawer';
import { CustomDialog } from './components/common/CustomDialog';

import { Login } from './components/common/Login';

const MainLayout: React.FC = () => {
  const { currentRole, adminTab, translatorTab, currentUser } = useApp();

  // Dynamic browser tab title in Indonesian
  React.useEffect(() => {
    if (!currentUser) return;
    const tabNames: Record<string, string> = {
      dashboard: 'Dashboard',
      translators: 'Manajemen Penerjemah',
      assignments: 'Manajemen Task Pool',
      reports: 'Laporan Kinerja',
      settings: 'Pengaturan Sistem',
      leaderboard: 'Papan Peringkat',
      tasks: 'Workspace Pengerjaan Task',
      profile: 'Profil & Kapasitas',
    };

    const currentTab = currentRole === 'ADMIN' ? adminTab : translatorTab;
    const label = tabNames[currentTab] || 'Ruang Kerja';
    document.title = `${label} | Sistem Monitoring Penerjemah by Master Translate`;
  }, [currentUser, currentRole, adminTab, translatorTab]);

  if (!currentUser) {
    return <Login />;
  }

  const renderAdminTab = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'translators':
        return <TranslatorsList />;
      case 'assignments':
        return <TasksList />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AdminDashboard />;
    }
  };

  const renderTranslatorTab = () => {
    switch (translatorTab) {
      case 'dashboard':
        return <TranslatorDashboard />;
      case 'tasks':
        return <TranslatorTasks />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'profile':
        return <TranslatorProfileView />;
      default:
        return <TranslatorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-slate-800 transition-colors font-sans antialiased flex">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0">
        <div className="pt-14 md:pt-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentRole === 'ADMIN' ? renderAdminTab() : renderTranslatorTab()}
          </div>
        </div>
      </main>
      <BottomNavigation />

      {/* Modals & Drawers */}
      <NewAssignmentModal />
      <NewTranslatorModal />
      <ReviewSubmissionModal />
      <PauseReasonModal />
      <SubmitWorkModal />
      <NotificationDrawer />
      <CustomDialog />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
