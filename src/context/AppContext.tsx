import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import {
  UserRole,
  TranslatorProfile,
  Task,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  TimerLog,
  RewardPointHistory,
  UserProfile,
} from '../types';
import {
  onFirebaseAuthStateChange,
  getUserProfile,
  logoutFromFirebase,
  loginWithFirebase,
} from '../services/authService';
import {
  fsCreateTask,
  fsUpdateTask,
  fsDeleteTask,
  fsAddTranslator,
  fsUpdateTranslator,
  fsDeleteTranslator,
  fsAddActivityLog,
  fsAddNotification,
  fsMarkNotificationRead,
  fsClearNotifications,
  fsAddTimerLog,
  fsUpdateTimerLog,
  fsUpdateSettings,
  fsSubmitAssignmentCallable,
  fsRegisterTranslatorCallable,
  subscribeTranslators,
  subscribeActivityLogs,
  subscribeSettings,
  subscribeTimerLogs,
  subscribeNotifications,
  listenTasks,
  listenRewardPointHistory,
  fsClaimTaskTransaction,
  fsReviewClaimedTask,
} from '../services/firestoreService';
import { useTmsStore, CustomDialogState } from '../store/tmsStore';

interface AppContextType {
  // Navigation & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTranslatorUserId: string;
  setActiveTranslatorUserId: (userId: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  translatorTab: string;
  setTranslatorTab: (tab: string) => void;

  // State Data
  translators: TranslatorProfile[];
  tasks: Task[];
  assignments: Task[];
  claimableTasks: Task[];
  activityLogs: ActivityLogItem[];
  notifications: SystemNotification[];
  settings: SystemSettings;
  timerLogs: TimerLog[];
  rewardPointHistory: RewardPointHistory[];

  // Current Active Translator Profile
  currentTranslatorProfile: TranslatorProfile | undefined;

  // Actions
  startAssignmentTimer: (taskId: string) => Promise<void>;
  pauseAssignmentTimer: (taskId: string, reason: string) => Promise<void>;
  resumeAssignmentTimer: (taskId: string) => Promise<void>;
  submitAssignment: (taskId: string, resultFileUrl: string, notes: string) => void;
  approveAssignment: (taskId: string) => void;
  requestRevision: (taskId: string, notes: string) => void;

  createAssignment: (newDoc: Partial<Task>) => void;
  updateAssignment: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteAssignment: (id: string) => void;

  addTranslator: (newTr: Partial<TranslatorProfile & { password?: string }>) => void;
  updateTranslator: (id: string, updates: Partial<TranslatorProfile>, originalVersion?: number) => void;
  deleteTranslator: (id: string) => void;

  updateSettings: (newSettings: SystemSettings) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Modals controller
  isNewAssignmentModalOpen: boolean;
  setIsNewAssignmentModalOpen: (open: boolean) => void;
  isNewTranslatorModalOpen: boolean;
  setIsNewTranslatorModalOpen: (open: boolean) => void;
  activeReviewAssignment: Task | null;
  setActiveReviewAssignment: (doc: Task | null) => void;
  activePauseAssignment: Task | null;
  setActivePauseAssignment: (doc: Task | null) => void;
  activeSubmitAssignment: Task | null;
  setActiveSubmitAssignment: (doc: Task | null) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;

  // Auth
  currentUser: UserProfile | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;

  // Dialog System
  dialogState: CustomDialogState;
  confirmAction: (options: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    showCancel?: boolean;
    successTitle?: string;
    successMessage?: string;
  }) => void;
  showLoading: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  closeDialog: () => void;
  toggleTranslatorStatus: (id: string) => Promise<void>;

  // Gamification & Task Claiming
  claimTask: (taskId: string) => Promise<void>;
  submitClaimedTask: (taskId: string, resultFileUrl: string, notes: string) => void;
  reviewClaimedTask: (taskId: string, approved: boolean, notes?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const STORAGE_KEY = 'tms_app_state_v1';

  // Read state from Zustand store
  const store = useTmsStore();

  const currentUser = useTmsStore((s) => s.currentUser);
  const currentRole = useTmsStore((s) => s.currentRole);
  const activeTranslatorUserId = useTmsStore((s) => s.activeTranslatorUserId);
  const theme = useTmsStore((s) => s.theme);
  const adminTab = useTmsStore((s) => s.adminTab);
  const translatorTab = useTmsStore((s) => s.translatorTab);

  const translators = useTmsStore((s) => s.translators);
  const tasks = useTmsStore((s) => s.tasks);
  const activityLogs = useTmsStore((s) => s.activityLogs);
  const notifications = useTmsStore((s) => s.notifications);
  const settings = useTmsStore((s) => s.settings);
  const timerLogs = useTmsStore((s) => s.timerLogs);
  const rewardPointHistory = useTmsStore((s) => s.rewardPointHistory);

  const isNewAssignmentModalOpen = useTmsStore((s) => s.isNewAssignmentModalOpen);
  const isNewTranslatorModalOpen = useTmsStore((s) => s.isNewTranslatorModalOpen);
  const activeReviewAssignment = useTmsStore((s) => s.activeReviewAssignment);
  const activePauseAssignment = useTmsStore((s) => s.activePauseAssignment);
  const activeSubmitAssignment = useTmsStore((s) => s.activeSubmitAssignment);
  const isNotificationDrawerOpen = useTmsStore((s) => s.isNotificationDrawerOpen);
  const dialogState = useTmsStore((s) => s.dialogState);

  const currentTranslatorProfile = translators.find(
    (t) => t.userId === activeTranslatorUserId || t.id === activeTranslatorUserId
  );

  const closeDialog = () => {
    store.setDialogState({ isOpen: false });
  };

  const showLoading = (title: string, message: string) => {
    store.setDialogState({
      isOpen: true,
      type: 'loading',
      title,
      message,
    });
  };

  const showSuccess = (title: string, message: string) => {
    store.setDialogState({
      isOpen: true,
      type: 'success',
      title,
      message,
      showCancel: false,
    });
  };

  const showError = (title: string, message: string) => {
    store.setDialogState({
      isOpen: true,
      type: 'danger',
      title,
      message,
      showCancel: false,
    });
  };

  const confirmAction = (options: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    showCancel?: boolean;
    successTitle?: string;
    successMessage?: string;
  }) => {
    store.setDialogState({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      showCancel: options.showCancel !== false,
      onCancel: options.onCancel,
      onConfirm: async () => {
        store.setDialogState((prev) => ({
          ...prev,
          type: 'loading',
          title: 'Sedang Memproses...',
          message: 'Permintaan Anda sedang diproses oleh sistem.',
        }));

        try {
          await options.onConfirm();
          store.setDialogState({
            isOpen: true,
            type: 'success',
            title: options.successTitle || 'Proses Berhasil!',
            message: options.successMessage || 'Tindakan Anda telah berhasil diselesaikan.',
            showCancel: false,
            confirmText: 'Tutup',
          });
        } catch (err: any) {
          console.error('[AppContext confirmAction Error]', err);
          store.setDialogState({
            isOpen: true,
            type: 'danger',
            title: 'Gagal Memproses',
            message: err?.message || 'Terjadi kesalahan sistem saat memproses tindakan Anda.',
            showCancel: false,
            confirmText: 'Tutup',
          });
        }
      },
    });
  };

  // Theme support
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    store.setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // ── Firebase Auth State Sync ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChange(async (firebaseUser) => {
      if (!firebaseUser) {
        store.setCurrentUser(null);
      } else {
        try {
          let profile = null;
          let retries = 3;
          while (retries > 0) {
            try {
              profile = await getUserProfile(firebaseUser.uid, firebaseUser.email || '');
              break;
            } catch (err: any) {
              if (err.code === 'permission-denied' && retries > 1) {
                retries--;
                await new Promise((resolve) => setTimeout(resolve, 150));
              } else {
                throw err;
              }
            }
          }

          if (profile) {
            store.setCurrentUser(profile);
            store.setCurrentRole(profile.role);
            if (profile.role === 'PENERJEMAH') {
              store.setActiveTranslatorUserId(profile.id);
            }
          } else {
            await logoutFromFirebase();
            store.setCurrentUser(null);
          }
        } catch (err) {
          console.error('[TMS] Gagal sinkronisasi profil dari Firestore:', err);
          store.setCurrentUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Firebase Real-time Subscriptions ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    let unsubFns: (() => void)[] = [];
    const isTranslator = currentUser?.role === 'PENERJEMAH';
    const translatorIdFilter = isTranslator ? (currentUser?.id || activeTranslatorUserId) : undefined;

    try {
      unsubFns.push(
        subscribeTranslators((data) => store.setTranslators(data)),
        subscribeSettings((data) => store.setSettings(data)),
        subscribeTimerLogs(translatorIdFilter, (data) => store.setTimerLogs(data)),
        subscribeNotifications(currentUser.id, (data) => store.setNotifications(data)),
        listenTasks(!isTranslator, translatorIdFilter, (data) => store.setTasks(data)),
        listenRewardPointHistory(translatorIdFilter, (data) => store.setRewardPointHistory(data))
      );

      if (currentUser?.role === 'ADMIN') {
        unsubFns.push(
          subscribeActivityLogs((data) => store.setActivityLogs(data))
        );
      }

      console.log('[TMS] Firebase real-time listeners active.');
    } catch (err) {
      console.error('[TMS] Gagal init Firebase listeners:', err);
    }

    return () => {
      unsubFns.forEach((unsub) => unsub());
    };
  }, [currentUser?.id, currentUser?.role, activeTranslatorUserId]);

  // ── LINEAR & CORRECT TIMER TICK ENGINE ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      store.setTasks(
        store.tasks.map((t) => {
          if (t.status === 'WORKING') {
            const activeLog = timerLogs.find((l) => l.taskId === t.id && l.type === 'WORK' && !l.endTime);
            if (activeLog) {
              const currentSessionSecs = Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
              const completedWorkSecs = timerLogs
                .filter((l) => l.taskId === t.id && l.type === 'WORK' && l.endTime && l.id !== activeLog.id)
                .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
              
              const calculatedEffective = completedWorkSecs + currentSessionSecs;
              return {
                ...t,
                effectiveWorkSeconds: calculatedEffective,
                totalWorkingSeconds: calculatedEffective,
              };
            }
          } else if (t.status === 'PAUSED') {
            const activeLog = timerLogs.find((l) => l.taskId === t.id && l.type === 'PAUSE' && !l.endTime);
            if (activeLog) {
              const currentPauseSecs = Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
              const completedPauseSecs = timerLogs
                .filter((l) => l.taskId === t.id && l.type === 'PAUSE' && l.endTime && l.id !== activeLog.id)
                .reduce((sum, l) => sum + (l.durationSeconds || 0), 0);

              const calculatedPause = completedPauseSecs + currentPauseSecs;
              return {
                ...t,
                totalPauseDuration: calculatedPause,
                totalIdleSeconds: calculatedPause,
              };
            }
          }
          return t;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timerLogs, store.tasks]);

  // AUTO-PAUSE WHEN TAB IS HIDDEN
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const state = useTmsStore.getState();
        const currentTrProfile = state.translators.find(
          (t) => t.userId === state.activeTranslatorUserId || t.id === state.activeTranslatorUserId
        );
        const activeTask = state.tasks.find((t) => t.status === 'WORKING' && t.claimedById === currentTrProfile?.id);
        if (activeTask) {
          pauseAssignmentTimer(activeTask.id, 'Otomatis jeda karena tab tidak aktif (hidden)');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ACTION: Start Timer
  const startAssignmentTimer = async (taskId: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nowStr = new Date().toISOString();
    await fsUpdateTask(taskId, {
      status: 'WORKING',
      startedAt: task.startedAt || nowStr,
    });

    if (task.translatorId || task.claimedById) {
      await fsUpdateTranslator(task.translatorId || task.claimedById || '', { status: 'BUSY' });
    }

    await fsAddActivityLog({
      userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
      action: 'Memulai Timer',
      details: `Memulai pengerjaan tugas ${task.code} - ${task.title}`,
      taskId,
      taskTitle: task.title,
      type: 'TIMER',
    });

    await fsAddTimerLog({
      taskId,
      translatorId: task.translatorId || task.claimedById || '',
      type: 'WORK',
      durationSeconds: 0,
    });
  };

  // ACTION: Pause Timer
  const pauseAssignmentTimer = async (taskId: string, reason: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const activeLog = timerLogs.find((log) => log.taskId === taskId && log.type === 'WORK' && !log.endTime);
    const nowStr = new Date().toISOString();
    if (activeLog) {
      const duration = Math.max(0, Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000));
      await fsUpdateTimerLog(activeLog.id, {
        endTime: nowStr,
        durationSeconds: duration,
      });
    }

    await fsAddTimerLog({
      taskId,
      translatorId: task.translatorId || task.claimedById || '',
      type: 'PAUSE',
      durationSeconds: 0,
      reason,
    });

    // Recalculate working and pause times from log baselines
    const updatedLogs = timerLogs.map(l => l.taskId === taskId && !l.endTime && l.id === activeLog?.id ? { ...l, endTime: nowStr, durationSeconds: Math.max(0, Math.round((Date.now() - new Date(l.startTime).getTime()) / 1000)) } : l);
    const filteredWorkLogs = updatedLogs.filter(l => l.taskId === taskId && l.type === 'WORK');
    const filteredPauseLogs = updatedLogs.filter(l => l.taskId === taskId && l.type === 'PAUSE');
    
    let totalWorkSecs = 0;
    filteredWorkLogs.forEach(l => { totalWorkSecs += l.durationSeconds || 0; });
    
    let totalPauseSecs = 0;
    filteredPauseLogs.forEach(l => { totalPauseSecs += l.durationSeconds || 0; });

    await fsUpdateTask(taskId, {
      status: 'PAUSED',
      pausedAt: nowStr,
      effectiveWorkSeconds: totalWorkSecs,
      totalPauseDuration: totalPauseSecs,
      pauseCount: filteredPauseLogs.length,
    });

    if (task.translatorId || task.claimedById) {
      await fsUpdateTranslator(task.translatorId || task.claimedById || '', { status: 'BREAK' });
    }

    await fsAddActivityLog({
      userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
      action: 'Menangguhkan Timer',
      details: `Menangguhkan timer tugas ${task.code}. Alasan: "${reason}"`,
      taskId,
      taskTitle: task.title,
      type: 'TIMER',
    });
  };

  // ACTION: Resume Timer
  const resumeAssignmentTimer = async (taskId: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const activeLog = timerLogs.find((log) => log.taskId === taskId && log.type === 'PAUSE' && !log.endTime);
    const nowStr = new Date().toISOString();
    if (activeLog) {
      const duration = Math.max(0, Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000));
      await fsUpdateTimerLog(activeLog.id, {
        endTime: nowStr,
        durationSeconds: duration,
      });
    }

    await fsAddTimerLog({
      taskId,
      translatorId: task.translatorId || task.claimedById || '',
      type: 'WORK',
      durationSeconds: 0,
    });

    const updatedLogs = timerLogs.map(l => l.taskId === taskId && !l.endTime && l.id === activeLog?.id ? { ...l, endTime: nowStr, durationSeconds: Math.max(0, Math.round((Date.now() - new Date(l.startTime).getTime()) / 1000)) } : l);
    const filteredWorkLogs = updatedLogs.filter(l => l.taskId === taskId && l.type === 'WORK');
    const filteredPauseLogs = updatedLogs.filter(l => l.taskId === taskId && l.type === 'PAUSE');
    
    let totalWorkSecs = 0;
    filteredWorkLogs.forEach(l => { totalWorkSecs += l.durationSeconds || 0; });
    
    let totalPauseSecs = 0;
    filteredPauseLogs.forEach(l => { totalPauseSecs += l.durationSeconds || 0; });

    await fsUpdateTask(taskId, {
      status: 'WORKING',
      pausedAt: null as any,
      effectiveWorkSeconds: totalWorkSecs,
      totalPauseDuration: totalPauseSecs,
    });

    if (task.translatorId || task.claimedById) {
      await fsUpdateTranslator(task.translatorId || task.claimedById || '', { status: 'BUSY' });
    }

    await fsAddActivityLog({
      userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
      action: 'Melanjutkan Timer',
      details: `Melanjutkan timer tugas ${task.code}`,
      taskId,
      taskTitle: task.title,
      type: 'TIMER',
    });
  };

  // ACTION: Submit Work
  const submitAssignment = async (taskId: string, resultFileUrl: string, notes: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    confirmAction({
      title: 'Kirim Hasil Pekerjaan?',
      message: 'Apakah Anda yakin menyerahkan hasil terjemahan? Status tugas akan berubah menjadi Menunggu Review.',
      type: 'info',
      confirmText: 'Kirim',
      successTitle: 'Hasil Dikirim!',
      successMessage: `Tugas "${task.title}" berhasil diserahkan untuk ditinjau oleh Admin.`,
      onConfirm: async () => {
        await fsSubmitAssignmentCallable({
          assignmentId: taskId,
          resultFileName: 'Google Drive Link',
          resultFileUrl,
          submissionNotes: notes,
        });

        const translatorId = task.translatorId || task.claimedById;
        if (translatorId) {
          await fsUpdateTranslator(translatorId, { status: 'FREE' });
        }

        await fsAddActivityLog({
          userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
          userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
          userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
          action: 'Mengirimkan Terjemahan',
          details: `Menyerahkan tautan Google Drive: ${resultFileUrl}. Menunggu tinjauan.`,
          taskId,
          taskTitle: task.title,
          type: 'SUBMISSION',
        });
      }
    });
  };

  // ACTION: Approve Task
  const approveAssignment = async (taskId: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    confirmAction({
      title: 'Setujui Hasil Terjemahan?',
      message: `Apakah Anda yakin menyetujui hasil terjemahan untuk tugas "${task.title}"? Status tugas akan diubah menjadi Selesai.`,
      type: 'success',
      confirmText: 'Setujui',
      successTitle: 'Tugas Disetujui!',
      successMessage: `Tugas "${task.title}" disetujui dan dinyatakan selesai.`,
      onConfirm: async () => {
        await fsReviewClaimedTask(taskId, true);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Menyetujui Hasil Terjemahan',
          details: `Admin menyetujui penyelesaian untuk tugas ${task.code}.`,
          taskId,
          taskTitle: task.title,
          type: 'REVIEW',
        });
      }
    });
  };

  // ACTION: Request Revision
  const requestRevision = async (taskId: string, notes: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return;

    confirmAction({
      title: 'Minta Revisi Dokumen?',
      message: `Apakah Anda yakin mengembalikan tugas "${task.title}" kepada penerjemah untuk direvisi?`,
      type: 'danger',
      confirmText: 'Minta Revisi',
      successTitle: 'Revisi Diminta',
      successMessage: `Permintaan revisi tugas "${task.title}" berhasil dikirim ke penerjemah.`,
      onConfirm: async () => {
        await fsReviewClaimedTask(taskId, false, notes);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Meminta Revisi',
          details: `Revisi diperlukan untuk tugas ${task.code}. Catatan: ${notes}`,
          taskId,
          taskTitle: task.title,
          type: 'REVIEW',
        });
      }
    });
  };

  // CRUD Tasks
  const createAssignment = async (newDoc: Partial<Task>) => {
    confirmAction({
      title: 'Konfirmasi Buat Tugas',
      message: `Apakah Anda yakin ingin membuat tugas baru "${newDoc.title}"?`,
      type: 'warning',
      confirmText: 'Buat Tugas',
      successTitle: 'Tugas Dibuat!',
      successMessage: `Tugas "${newDoc.title}" berhasil dibuat dan didaftarkan ke pool.`,
      onConfirm: async () => {
        const code = `TASK-2026-${Math.floor(100 + Math.random() * 900)}`;
        const pageCount = newDoc.pageCount || 10;
        
        const rules = settings.pointRules;
        const basePoints = rules?.basePointsPerPage ?? 1;
        const diffMultiplier = rules?.difficultyMultipliers?.[newDoc.difficulty || 'MEDIUM'] ?? 1.0;
        const rewardPoints = Math.round(pageCount * basePoints * diffMultiplier);

        const taskData = {
          code,
          title: newDoc.title || 'Untitled Document',
          documentType: newDoc.documentType || 'General',
          pageCount,
          languageFrom: newDoc.languageFrom || 'EN-ID',
          languageTo: newDoc.languageTo || 'Indonesia',
          priority: newDoc.priority || 'MEDIUM',
          difficulty: newDoc.difficulty || 'MEDIUM',
          estimatedMinutes: Math.round(pageCount * 25),
          deadlineAt: newDoc.deadlineAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          rewardPoints,
          status: newDoc.status || 'WAITING_CLAIM',
          sourceFileName: newDoc.sourceFileName || 'Document_Source.pdf',
          sourceFileUrl: newDoc.sourceFileUrl || '#',
          totalWorkingSeconds: 0,
          totalIdleSeconds: 0,
          effectiveWorkSeconds: 0,
          totalPauseDuration: 0,
          pauseCount: 0,
          createdBy: currentUser?.name || 'Admin',
        };

        const id = await fsCreateTask(taskData as any);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Membuat Tugas Baru',
          details: `Menambahkan tugas baru ${code} (${rewardPoints} poin, ${pageCount} hlm).`,
          taskId: id,
          taskTitle: taskData.title,
          type: 'SYSTEM',
        });
      }
    });
  };

  const updateAssignment = async (id: string, updates: Partial<Task>) => {
    await fsUpdateTask(id, updates);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Admin',
      userRole: 'ADMIN',
      action: 'Memperbarui Tugas',
      details: `Mengubah properti tugas ${id}`,
      type: 'ASSIGNMENT',
    });
  };

  const deleteAssignment = async (id: string) => {
    const docObj = store.tasks.find((t) => t.id === id);
    confirmAction({
      title: 'Hapus Tugas?',
      message: `Apakah Anda yakin ingin menghapus tugas "${docObj?.title || id}"? Tindakan ini tidak dapat dibatalkan.`,
      type: 'danger',
      confirmText: 'Hapus',
      successTitle: 'Tugas Dihapus',
      successMessage: `Tugas "${docObj?.title || id}" berhasil dihapus dari sistem.`,
      onConfirm: async () => {
        await fsDeleteTask(id);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Menghapus Tugas',
          details: `Menghapus tugas ${id}`,
          type: 'ASSIGNMENT',
        });
      }
    });
  };

  const proceedUpdateTranslator = async (
    id: string,
    updates: Partial<TranslatorProfile>,
    nextVersion: number,
    changes: string[],
    activeUser: any
  ) => {
    const tr = translators.find((t) => t.id === id);
    if (!tr) return;

    const finalUpdates = {
      ...updates,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
    };

    const detailsText = changes.length > 0 ? changes.join(', ') : 'Tidak ada perubahan data';
    const logDetails = `Mengubah profil penerjemah ${tr.name} (ID: ${id}). Perubahan: [${detailsText}]. Versi baru: ${nextVersion}`;

    await fsUpdateTranslator(id, finalUpdates);
    await fsAddActivityLog({
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      action: 'Memperbarui Profil Penerjemah',
      details: logDetails,
      type: 'SYSTEM',
    });
  };

  // CRUD Translators
  const addTranslator = async (newTr: Partial<TranslatorProfile & { password?: string }>) => {
    confirmAction({
      title: 'Daftarkan Penerjemah?',
      message: `Apakah Anda yakin mendaftarkan penerjemah baru "${newTr.name}"? Sistem akan membuat kredensial akun masuk dan profil Firestore.`,
      type: 'info',
      confirmText: 'Daftarkan',
      successTitle: 'Penerjemah Terdaftar!',
      successMessage: `Akun dan profil untuk "${newTr.name}" berhasil dibuat.`,
      onConfirm: async () => {
        await fsRegisterTranslatorCallable({
          email: newTr.email || '',
          password: newTr.password || '',
          name: newTr.name || '',
          phone: newTr.phone || '',
          languages: newTr.languages || ['EN-ID'],
          maxCapacityPoints: newTr.maxCapacityPoints || 20,
        });

        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Menambahkan Penerjemah',
          details: `Membuat profil penerjemah baru untuk ${newTr.name}`,
          type: 'SYSTEM',
        });
      }
    });
  };

  const updateTranslator = async (id: string, updates: Partial<TranslatorProfile>, originalVersion?: number) => {
    const tr = translators.find((t) => t.id === id);
    if (!tr) return;

    const isAdmin = currentRole === 'ADMIN';
    const isOwner = currentUser?.role === 'PENERJEMAH' && (currentUser?.id === tr.userId || currentUser?.id === tr.id);
    if (!isAdmin && !isOwner) {
      showError('Akses Ditolak', 'Anda tidak memiliki izin untuk mengubah profil ini.');
      return;
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      showError('Validasi Gagal', 'Nama lengkap tidak boleh kosong.');
      return;
    }
    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        showError('Validasi Gagal', 'Format email tidak valid.');
        return;
      }
    }
    if (updates.phone !== undefined && !updates.phone.trim()) {
      showError('Validasi Gagal', 'Nomor WhatsApp/telepon tidak boleh kosong.');
      return;
    }

    const nextVersion = (tr.version || 1) + 1;
    const changes: string[] = [];
    Object.keys(updates).forEach((k) => {
      const key = k as keyof TranslatorProfile;
      const oldValue = tr[key];
      const newValue = updates[key];
      if (newValue !== undefined && JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push(`${key}: "${oldValue}" -> "${newValue}"`);
      }
    });

    const activeUser =
      currentRole === 'ADMIN'
        ? { id: 'admin-1', name: 'Admin', role: 'ADMIN' as UserRole }
        : {
          id: currentTranslatorProfile?.userId || 'u-1',
          name: currentTranslatorProfile?.name || 'Translator',
          role: 'PENERJEMAH' as UserRole,
        };

    if (originalVersion !== undefined && tr.version !== undefined && tr.version !== originalVersion) {
      confirmAction({
        title: 'Konflik Konkurensi!',
        message: `Data profil ini telah diperbarui oleh pengguna lain (Versi ${tr.version}). Apakah Anda tetap ingin menimpa perubahan tersebut?`,
        type: 'danger',
        confirmText: 'Timpa Perubahan',
        successTitle: 'Profil Diperbarui',
        successMessage: `Profil penerjemah "${tr.name}" berhasil diperbarui dengan menimpa perubahan sebelumnya.`,
        onConfirm: async () => {
          await proceedUpdateTranslator(id, updates, nextVersion, changes, activeUser);
        }
      });
      return;
    }

    confirmAction({
      title: 'Simpan Perubahan?',
      message: `Apakah Anda yakin ingin memperbarui data profil "${tr.name}"?`,
      type: 'info',
      confirmText: 'Simpan',
      successTitle: 'Profil Diperbarui!',
      successMessage: `Profil penerjemah "${tr.name}" berhasil diperbarui.`,
      onConfirm: async () => {
        await proceedUpdateTranslator(id, updates, nextVersion, changes, activeUser);
      }
    });
  };

  const deleteTranslator = async (id: string) => {
    const tr = translators.find((t) => t.id === id);
    confirmAction({
      title: 'Hapus Penerjemah?',
      message: `Apakah Anda yakin ingin menghapus profil penerjemah "${tr?.name || id}"? Akun dan profil akan dihapus secara permanen.`,
      type: 'danger',
      confirmText: 'Hapus',
      successTitle: 'Penerjemah Dihapus',
      successMessage: `Profil penerjemah "${tr?.name || id}" berhasil dihapus dari sistem.`,
      onConfirm: async () => {
        await fsDeleteTranslator(id);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Menghapus Penerjemah',
          details: `Menghapus profil penerjemah ${tr?.name || id}`,
          type: 'SYSTEM',
        });
      }
    });
  };

  const toggleTranslatorStatus = async (id: string) => {
    const tr = translators.find((t) => t.id === id);
    if (!tr) return;
    const newStatus = tr.status === 'FREE' ? 'BUSY' : 'FREE';

    const updates: Partial<TranslatorProfile> = {
      status: newStatus,
    };

    const isAdmin = currentRole === 'ADMIN';
    if (isAdmin) {
      updates.updatedAt = new Date().toISOString();
    }

    await fsUpdateTranslator(id, updates);

    const activeUser = isAdmin
      ? { id: 'admin-1', name: 'Admin', role: 'ADMIN' as UserRole }
      : {
          id: currentTranslatorProfile?.userId || 'u-1',
          name: currentTranslatorProfile?.name || 'Translator',
          role: 'PENERJEMAH' as UserRole,
        };

    await fsAddActivityLog({
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      action: 'Mengubah Status Penerjemah',
      details: `Mengubah status langsung ${tr.name} menjadi ${newStatus === 'FREE' ? 'FREE' : 'BUSY'} via dashboard.`,
      type: 'SYSTEM',
    });
  };

  const updateSettings = async (newSettings: SystemSettings) => {
    await fsUpdateSettings(newSettings);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Admin',
      userRole: 'ADMIN',
      action: 'Memperbarui Pengaturan Sistem',
      details: 'Memperbarui pengaturan sistem.',
      type: 'SYSTEM',
    });
  };

  const markNotificationRead = async (id: string) => {
    await fsMarkNotificationRead(id);
  };

  const clearAllNotifications = async () => {
    if (currentUser) {
      await fsClearNotifications(currentUser.id);
    }
  };

  // ── Gamification & Task Claiming ─────────────────────────────────────────

  const claimTask = async (taskId: string): Promise<void> => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task || !currentTranslatorProfile) return;

    confirmAction({
      title: 'Ambil Task Ini?',
      message: `Anda akan mengambil task "${task.title}" (${task.pageCount} hal, ${task.rewardPoints} poin). Task otomatis terkunci untuk Anda.`,
      type: 'info',
      confirmText: 'Ambil Task',
      successTitle: 'Task Berhasil Diambil',
      successMessage: `Task "${task.title}" telah berhasil diklaim. Mulai kerjakan sekarang!`,
      onConfirm: async () => {
        await fsClaimTaskTransaction(
          taskId,
          currentTranslatorProfile.id,
          currentTranslatorProfile.name
        );
        await fsAddNotification({
          userId: currentTranslatorProfile.userId,
          title: 'Task Berhasil Diklaim',
          message: `Task "${task.title}" berhasil Anda klaim. Segera kerjakan sebelum deadline!`,
          type: 'SUCCESS',
          read: false,
        });
        await fsAddActivityLog({
          userId: currentTranslatorProfile.userId,
          userName: currentTranslatorProfile.name,
          userRole: 'PENERJEMAH',
          action: 'Mengklaim Task',
          details: `Mengklaim task ${task.code} - ${task.title} (${task.rewardPoints} poin).`,
          type: 'ASSIGNMENT',
        });
      },
    });
  };

  const submitClaimedTask = (taskId: string, resultFileUrl: string, notes: string) => {
    submitAssignment(taskId, resultFileUrl, notes);
  };

  const reviewClaimedTask = (taskId: string, approved: boolean, notes?: string) => {
    if (approved) {
      approveAssignment(taskId);
    } else {
      requestRevision(taskId, notes || 'Revisi diperlukan oleh Admin.');
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const profile = await loginWithFirebase(email, pass);
      if (profile) {
        store.setCurrentUser(profile);
        store.setCurrentRole(profile.role);
        if (profile.role === 'PENERJEMAH') {
          store.setActiveTranslatorUserId(profile.id);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('[TMS] Login error:', err);
      return false;
    }
  };

  const logout = async () => {
    confirmAction({
      title: 'Keluar Sesi?',
      message: 'Apakah Anda yakin ingin keluar dari aplikasi monitoring penerjemah ini?',
      type: 'danger',
      confirmText: 'Keluar Sesi',
      successTitle: 'Berhasil Keluar',
      successMessage: 'Sesi Anda telah diakhiri secara aman.',
      onConfirm: async () => {
        try {
          await logoutFromFirebase();
        } catch (err) {
          console.error('[TMS] Logout error:', err);
        } finally {
          store.setCurrentUser(null);
          store.setCurrentRole('ADMIN');
          store.setActiveTranslatorUserId('u-admin');
        }
      }
    });
  };

  // Persist local UI settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          role: currentRole,
          activeTranslatorUserId,
          theme,
          currentUser,
        })
      );
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [currentRole, activeTranslatorUserId, theme, currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole: store.setCurrentRole,
        activeTranslatorUserId,
        setActiveTranslatorUserId: store.setActiveTranslatorUserId,
        theme,
        toggleTheme,
        adminTab,
        setAdminTab: store.setAdminTab,
        translatorTab,
        setTranslatorTab: store.setTranslatorTab,

        translators,
        tasks,
        assignments: tasks,
        claimableTasks: tasks,
        activityLogs,
        notifications,
        settings,
        timerLogs,
        rewardPointHistory,

        currentTranslatorProfile,

        startAssignmentTimer,
        pauseAssignmentTimer,
        resumeAssignmentTimer,
        submitAssignment,
        approveAssignment,
        requestRevision,

        createAssignment,
        updateAssignment,
        deleteAssignment,

        addTranslator,
        updateTranslator,
        deleteTranslator,
        toggleTranslatorStatus,

        updateSettings,
        markNotificationRead,
        clearAllNotifications,

        claimTask,
        submitClaimedTask,
        reviewClaimedTask,

        isNewAssignmentModalOpen,
        setIsNewAssignmentModalOpen: store.setIsNewAssignmentModalOpen,
        isNewTranslatorModalOpen,
        setIsNewTranslatorModalOpen: store.setIsNewTranslatorModalOpen,
        activeReviewAssignment,
        setActiveReviewAssignment: store.setActiveReviewAssignment,
        activePauseAssignment,
        setActivePauseAssignment: store.setActivePauseAssignment,
        activeSubmitAssignment,
        setActiveSubmitAssignment: store.setActiveSubmitAssignment,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen: store.setIsNotificationDrawerOpen,

        currentUser,
        login,
        logout,

        dialogState,
        confirmAction,
        showLoading,
        showSuccess,
        showError,
        closeDialog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
