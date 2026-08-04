import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TranslatorsList } from './components/admin/TranslatorsList';
import { AssignmentsList } from './components/admin/AssignmentsList';
import { TimerMonitoring } from './components/admin/TimerMonitoring';
import { WorkloadOverview } from './components/admin/WorkloadOverview';
import { ReportsView } from './components/admin/ReportsView';
import { SettingsView } from './components/admin/SettingsView';

// Translator Components
import { TranslatorDashboard } from './components/translator/TranslatorDashboard';
import { MyAssignmentsView } from './components/translator/MyAssignmentsView';
import { TranslatorHistoryView } from './components/translator/TranslatorHistoryView';
import { TranslatorProfileView } from './components/translator/TranslatorProfileView';

// Modals
import { NewAssignmentModal } from './components/modals/NewAssignmentModal';
import { NewTranslatorModal } from './components/modals/NewTranslatorModal';
import { ReviewSubmissionModal } from './components/modals/ReviewSubmissionModal';
import { PauseReasonModal } from './components/modals/PauseReasonModal';
import { SubmitWorkModal } from './components/modals/SubmitWorkModal';
import { NotificationDrawer } from './components/modals/NotificationDrawer';

import { Login } from './components/common/Login';

const MainLayout: React.FC = () => {
  const { currentRole, adminTab, translatorTab, currentUser } = useApp();

  if (!currentUser) {
    return <Login />;
  }

  // Dynamic browser tab title based on navigation in Indonesian
  React.useEffect(() => {
    const tabNames: Record<string, string> = {
      dashboard: 'Pusat Kendali',
      translators: 'Direktori Penerjemah',
      assignments: 'Daftar Penugasan',
      timers: 'Pemantau Waktu',
      workload: 'Beban Kerja & Kapasitas',
      reports: 'Laporan Kinerja',
      settings: 'Pengaturan Sistem',
      history: 'Riwayat Kerja & Statistik',
      profile: 'Profil & Kapasitas',
    };

    const currentTab = currentRole === 'SUPER_ADMIN' ? adminTab : translatorTab;
    const label = tabNames[currentTab] || 'Ruang Kerja';
    document.title = `${label} | Sistem Monitoring Penerjemah by Master Translate`;
  }, [currentUser, currentRole, adminTab, translatorTab]);

  const renderAdminTab = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'translators':
        return <TranslatorsList />;
      case 'assignments':
        return <AssignmentsList />;
      case 'timers':
        return <TimerMonitoring />;
      case 'workload':
        return <WorkloadOverview />;
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
      case 'assignments':
        return <MyAssignmentsView />;
      case 'history':
        return <TranslatorHistoryView />;
      case 'profile':
        return <TranslatorProfileView />;
      default:
        return <TranslatorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 transition-colors font-sans antialiased flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {currentRole === 'SUPER_ADMIN' ? renderAdminTab() : renderTranslatorTab()}
        </main>
      </div>

      {/* Modals & Drawers */}
      <NewAssignmentModal />
      <NewTranslatorModal />
      <ReviewSubmissionModal />
      <PauseReasonModal />
      <SubmitWorkModal />
      <NotificationDrawer />
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
