import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserRole,
  TranslatorProfile,
  Assignment,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  AssignmentStatus,
  Priority,
  TimerLog,
  UserProfile,
  ClaimableTask,
  RewardPointHistory,
} from '../types';
import { onFirebaseAuthStateChange, getUserProfile, logoutFromFirebase, loginWithFirebase } from '../services/authService';
import {
  INITIAL_SYSTEM_SETTINGS,
} from '../data/initialData';
import {
  fsCreateAssignment,
  fsUpdateAssignment,
  fsDeleteAssignment,
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
  listenClaimableTasks,
  listenRewardPointHistory,
  fsClaimTaskTransaction,
  fsCreateClaimableTask,
  fsUpdateClaimableTask,
  fsAddRewardPointHistory,
  fsReviewClaimedTask,
} from '../services/firestoreService';

export interface CustomDialogState {
  isOpen: boolean;
  type: 'info' | 'success' | 'warning' | 'danger' | 'loading';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

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
  assignments: Assignment[];
  activityLogs: ActivityLogItem[];
  notifications: SystemNotification[];
  settings: SystemSettings;
  timerLogs: TimerLog[];
  claimableTasks: ClaimableTask[];
  rewardPointHistory: RewardPointHistory[];

  // Current Active Translator Profile
  currentTranslatorProfile: TranslatorProfile | undefined;

  // Actions
  startAssignmentTimer: (assignmentId: string) => void;
  pauseAssignmentTimer: (assignmentId: string, reason: string) => void;
  resumeAssignmentTimer: (assignmentId: string) => void;
  submitAssignment: (assignmentId: string, resultFileUrl: string, notes: string) => void;
  approveAssignment: (assignmentId: string) => void;
  requestRevision: (assignmentId: string, notes: string) => void;

  createAssignment: (newDoc: Partial<Assignment>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  reassignAssignment: (assignmentId: string, newTranslatorId: string) => void;

  addTranslator: (newTr: Partial<TranslatorProfile>) => void;
  updateTranslator: (id: string, updates: Partial<TranslatorProfile>, originalVersion?: number) => void;
  deleteTranslator: (id: string) => void;

  updateSettings: (newSettings: SystemSettings) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Modals controller
  isNewAssignmentModalOpen: boolean;
  setIsNewAssignmentModalOpen: (open: boolean) => void;
  isNewTranslatorModalOpen: boolean;
  setIsNewTranslatorModalOpen: (open: boolean) => void;
  activeReviewAssignment: Assignment | null;
  setActiveReviewAssignment: (doc: Assignment | null) => void;
  activePauseAssignment: Assignment | null;
  setActivePauseAssignment: (doc: Assignment | null) => void;
  activeSubmitAssignment: Assignment | null;
  setActiveSubmitAssignment: (doc: Assignment | null) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;

  // Auth additions
  currentUser: UserProfile | null;
  login: (email: string, pass: string) => boolean | Promise<boolean>;
  logout: () => void | Promise<void>;

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
  splitAssignmentIntoTasks: (assignmentId: string, splitByPage: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Persistence key
  const STORAGE_KEY = 'tms_app_state_v1';

  // Load from local storage or fallback to initial
  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved state from localStorage:', e);
    }
    return null;
  };

  const savedState = loadInitialState();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(savedState?.currentUser || null);
  const [currentRole, setCurrentRole] = useState<UserRole>(savedState?.role || 'ADMIN');
  const [activeTranslatorUserId, setActiveTranslatorUserId] = useState<string>(
    savedState?.activeTranslatorUserId || 'u-1'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(savedState?.theme || 'dark');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [translatorTab, setTranslatorTab] = useState<string>('dashboard');

  const [translators, setTranslators] = useState<TranslatorProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [timerLogs, setTimerLogs] = useState<TimerLog[]>([]);
  const [claimableTasks, setClaimableTasks] = useState<ClaimableTask[]>([]);
  const [rewardPointHistory, setRewardPointHistory] = useState<RewardPointHistory[]>([]);

  // Modals state
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isNewTranslatorModalOpen, setIsNewTranslatorModalOpen] = useState(false);
  const [activeReviewAssignment, setActiveReviewAssignment] = useState<Assignment | null>(null);
  const [activePauseAssignment, setActivePauseAssignment] = useState<Assignment | null>(null);
  const [activeSubmitAssignment, setActiveSubmitAssignment] = useState<Assignment | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Dialog State
  const [dialogState, setDialogState] = useState<CustomDialogState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const showLoading = (title: string, message: string) => {
    setDialogState({
      isOpen: true,
      type: 'loading',
      title,
      message,
    });
  };

  const showSuccess = (title: string, message: string) => {
    setDialogState({
      isOpen: true,
      type: 'success',
      title,
      message,
      showCancel: false,
    });
  };

  const showError = (title: string, message: string) => {
    setDialogState({
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
    setDialogState({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      showCancel: options.showCancel !== false,
      onCancel: options.onCancel,
      onConfirm: async () => {
        setDialogState((prev) => ({
          ...prev,
          type: 'loading',
          title: 'Sedang Memproses...',
          message: 'Permintaan Anda sedang diproses oleh sistem.',
        }));

        try {
          await options.onConfirm();
          setDialogState({
            isOpen: true,
            type: 'success',
            title: options.successTitle || 'Proses Berhasil!',
            message: options.successMessage || 'Tindakan Anda telah berhasil diselesaikan.',
            showCancel: false,
            confirmText: 'Tutup',
          });
        } catch (err: any) {
          console.error('[TMS Dialog Error]', err);
          setDialogState({
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

  // Apply dark mode class to html document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ── Firebase Auth State Sync ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
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
            setCurrentUser(profile);
            setCurrentRole(profile.role);
            if (profile.role === 'PENERJEMAH') {
              setActiveTranslatorUserId(profile.id);
            }
          } else {
            await logoutFromFirebase();
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('[TMS] Gagal mensinkronisasi data profil dari Firestore:', err);
          setCurrentUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Firebase Real-time Subscriptions (MODE: Firebase) ────────────────────
  useEffect(() => {
    if (!currentUser) return;

    let unsubFns: (() => void)[] = [];
    const isTranslator = currentUser?.role === 'PENERJEMAH';
    const translatorIdFilter = isTranslator ? (currentUser?.id || activeTranslatorUserId) : undefined;

    try {
      unsubFns.push(
        subscribeTranslators((data) => setTranslators(data)),
        subscribeSettings((data) => setSettings(data)),
        subscribeTimerLogs(translatorIdFilter, (data) => setTimerLogs(data)),
        subscribeNotifications(currentUser.id, (data) => setNotifications(data)),
        listenClaimableTasks(!isTranslator, translatorIdFilter, (data) => setClaimableTasks(data)),
        listenRewardPointHistory((data) => setRewardPointHistory(data))
      );

      if (currentUser?.role === 'ADMIN') {
        unsubFns.push(
          subscribeActivityLogs((data) => setActivityLogs(data))
        );
      }

      console.log('[TMS] Firebase real-time listeners aktif.');
    } catch (err) {
      console.error('[TMS] Gagal menginisialisasi Firebase listeners:', err);
    }

    // Cleanup saat component unmount
    return () => {
      unsubFns.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  // Synchronize assignments state with claimableTasks to support legacy code seamlessly
  useEffect(() => {
    const mapped = claimableTasks.map((t) => ({
      ...t,
      translatorId: t.claimedById,
      translatorName: t.claimedByName,
      calculatedPoints: t.rewardPoints,
      pointMultiplier: 1.0,
      totalWorkingSeconds: t.effectiveWorkSeconds || 0,
      totalIdleSeconds: t.totalPauseDuration || 0,
      status: t.status === 'AVAILABLE' ? 'UNASSIGNED' : t.status === 'CLAIMED' ? 'ASSIGNED' : t.status,
    } as any));
    setAssignments(mapped);
  }, [claimableTasks]);

  // ── Firebase Login/Logout ──────────────────────
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const profile = await loginWithFirebase(email, pass);
      if (profile) {
        setCurrentUser(profile);
        setCurrentRole(profile.role);
        if (profile.role === 'PENERJEMAH') {
          setActiveTranslatorUserId(profile.id);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('[TMS] Firebase login error:', err);
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
          console.error('[TMS] Firebase logout error:', err);
        } finally {
          setCurrentUser(null);
           setCurrentRole('ADMIN');
           setActiveTranslatorUserId('u-admin');
        }
      }
    });
  };

  // Persist state changes
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
  }, [
    currentRole,
    activeTranslatorUserId,
    theme,
    currentUser,
  ]);

  // Current active translator profile
  const currentTranslatorProfile = translators.find(
    (t) => t.userId === activeTranslatorUserId || t.id === activeTranslatorUserId
  );

  // REALTIME TIMER TICK ENGINE
  useEffect(() => {
    const interval = setInterval(() => {
      // Tick assignments
      setAssignments((prevAssignments) => {
        return prevAssignments.map((a) => {
          if (a.status === 'WORKING') {
            const activeLog = timerLogs.find((l) => l.assignmentId === a.id && l.type === 'WORK' && !l.endTime);
            if (activeLog) {
              const currentSessionSecs = Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
              return {
                ...a,
                totalWorkingSeconds: (a.effectiveWorkSeconds || 0) + currentSessionSecs,
              };
            }
          } else if (a.status === 'PAUSED') {
            const activeLog = timerLogs.find((l) => l.assignmentId === a.id && l.type === 'PAUSE' && !l.endTime);
            if (activeLog) {
              const currentPauseSecs = Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
              return {
                ...a,
                totalIdleSeconds: (a.totalPauseDuration || 0) + currentPauseSecs,
              };
            }
          }
          return a;
        });
      });

      // Tick claimableTasks
      setClaimableTasks((prevTasks) => {
        return prevTasks.map((t) => {
          if (t.status === 'WORKING') {
            const activeLog = timerLogs.find((l) => l.assignmentId === t.id && l.type === 'WORK' && !l.endTime);
            if (activeLog) {
              const currentSessionSecs = Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
              return {
                ...t,
                effectiveWorkSeconds: (t.effectiveWorkSeconds || 0) + currentSessionSecs,
              };
            }
          } else if (t.status === 'PAUSED') {
            const activeLog = timerLogs.find((l) => l.assignmentId === t.id && l.type === 'PAUSE' && !l.endTime);
            if (activeLog) {
              const currentPauseSecs = Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000);
              return {
                ...t,
                totalPauseDuration: (t.totalPauseDuration || 0) + currentPauseSecs,
              };
            }
          }
          return t;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerLogs]);

  // AUTO-PAUSE WHEN TAB IS HIDDEN
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Find active job that is WORKING
        const activeAss = assignments.find((a) => a.status === 'WORKING');
        if (activeAss) {
          pauseAssignmentTimer(activeAss.id, 'Otomatis jeda karena tab tidak aktif (hidden)');
        }
        const activeTask = claimableTasks.find((t) => t.status === 'WORKING' && t.claimedById === currentTranslatorProfile?.id);
        if (activeTask) {
          pauseAssignmentTimer(activeTask.id, 'Otomatis jeda karena tab tidak aktif (hidden)');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [assignments, claimableTasks, currentTranslatorProfile?.id]);

  // RECALCULATE TRANSLATOR STATUS & WORKLOAD AUTOMATICALLY
  // ACTION: Start Assignment Timer
  const startAssignmentTimer = async (assignmentId: string) => {
    let doc = assignments.find((a) => a.id === assignmentId);
    let isClaimableTask = false;
    if (!doc) {
      const task = claimableTasks.find((t) => t.id === assignmentId);
      if (task) {
        isClaimableTask = true;
        doc = {
          id: task.id,
          code: task.code,
          title: task.title,
          translatorId: task.claimedById,
          translatorName: task.claimedByName,
        } as any;
      }
    }
    if (!doc) return;

    const nowStr = new Date().toISOString();
    if (isClaimableTask) {
      await fsUpdateClaimableTask(assignmentId, {
        status: 'WORKING',
        startedAt: nowStr,
      });
    } else {
      await fsUpdateAssignment(assignmentId, {
        status: 'WORKING',
        startedAt: doc.startedAt || nowStr,
      });
    }

    if (doc.translatorId) {
      await fsUpdateTranslator(doc.translatorId, { status: 'BUSY' });
    }

    await fsAddActivityLog({
      userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
      action: 'Memulai Pengukur Waktu',
      details: `Memulai pengerjaan terjemahan untuk ${doc.code || assignmentId}`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'TIMER',
    });

    await fsAddTimerLog({
      assignmentId,
      translatorId: doc.translatorId || '',
      type: 'WORK',
      durationSeconds: 0,
    });
  };

  // ACTION: Pause Assignment Timer
  const pauseAssignmentTimer = async (assignmentId: string, reason: string) => {
    let doc = assignments.find((a) => a.id === assignmentId);
    let isClaimableTask = false;
    if (!doc) {
      const task = claimableTasks.find((t) => t.id === assignmentId);
      if (task) {
        isClaimableTask = true;
        doc = {
          id: task.id,
          code: task.code,
          title: task.title,
          translatorId: task.claimedById,
          translatorName: task.claimedByName,
        } as any;
      }
    }
    if (!doc) return;

    const activeLog = timerLogs.find((log) => log.assignmentId === assignmentId && log.type === 'WORK' && !log.endTime);
    const nowStr = new Date().toISOString();
    if (activeLog) {
      const duration = Math.max(0, Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000));
      await fsUpdateTimerLog(activeLog.id, {
        endTime: nowStr,
        durationSeconds: duration,
      });
    }

    await fsAddTimerLog({
      assignmentId,
      translatorId: doc.translatorId || '',
      type: 'PAUSE',
      durationSeconds: 0,
      reason,
    });

    // Recalculate
    const relatedLogs = timerLogs.map(l => l.assignmentId === assignmentId && !l.endTime && l.id === activeLog?.id ? { ...l, endTime: nowStr, durationSeconds: Math.max(0, Math.round((Date.now() - new Date(l.startTime).getTime()) / 1000)) } : l);
    const filteredWorkLogs = relatedLogs.filter(l => l.assignmentId === assignmentId && l.type === 'WORK');
    const filteredPauseLogs = relatedLogs.filter(l => l.assignmentId === assignmentId && l.type === 'PAUSE');
    
    let totalWorkSecs = 0;
    filteredWorkLogs.forEach(l => { totalWorkSecs += l.durationSeconds || 0; });
    
    let totalPauseSecs = 0;
    filteredPauseLogs.forEach(l => { totalPauseSecs += l.durationSeconds || 0; });

    if (isClaimableTask) {
      await fsUpdateClaimableTask(assignmentId, {
        status: 'PAUSED',
        pausedAt: nowStr,
        effectiveWorkSeconds: totalWorkSecs,
        totalPauseDuration: totalPauseSecs,
        pauseCount: filteredPauseLogs.length,
      });
    } else {
      await fsUpdateAssignment(assignmentId, {
        status: 'PAUSED',
        effectiveWorkSeconds: totalWorkSecs,
        totalPauseDuration: totalPauseSecs,
        pauseCount: filteredPauseLogs.length,
        totalWorkingSeconds: totalWorkSecs,
        totalIdleSeconds: totalPauseSecs,
      });
    }

    if (doc.translatorId) {
      await fsUpdateTranslator(doc.translatorId, { status: 'BREAK' });
    }

    await fsAddActivityLog({
      userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
      action: 'Menangguhkan Pengukur Waktu',
      details: `Menangguhkan pengukur waktu untuk ${doc.code}. Alasan: "${reason}"`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'TIMER',
    });
  };

  // ACTION: Resume Assignment Timer
  const resumeAssignmentTimer = async (assignmentId: string) => {
    let doc = assignments.find((a) => a.id === assignmentId);
    let isClaimableTask = false;
    if (!doc) {
      const task = claimableTasks.find((t) => t.id === assignmentId);
      if (task) {
        isClaimableTask = true;
        doc = {
          id: task.id,
          code: task.code,
          title: task.title,
          translatorId: task.claimedById,
          translatorName: task.claimedByName,
        } as any;
      }
    }
    if (!doc) return;

    const activeLog = timerLogs.find((log) => log.assignmentId === assignmentId && log.type === 'PAUSE' && !log.endTime);
    const nowStr = new Date().toISOString();
    if (activeLog) {
      const duration = Math.max(0, Math.round((Date.now() - new Date(activeLog.startTime).getTime()) / 1000));
      await fsUpdateTimerLog(activeLog.id, {
        endTime: nowStr,
        durationSeconds: duration,
      });
    }

    await fsAddTimerLog({
      assignmentId,
      translatorId: doc.translatorId || '',
      type: 'WORK',
      durationSeconds: 0,
    });

    // Recalculate
    const relatedLogs = timerLogs.map(l => l.assignmentId === assignmentId && !l.endTime && l.id === activeLog?.id ? { ...l, endTime: nowStr, durationSeconds: Math.max(0, Math.round((Date.now() - new Date(l.startTime).getTime()) / 1000)) } : l);
    const filteredWorkLogs = relatedLogs.filter(l => l.assignmentId === assignmentId && l.type === 'WORK');
    const filteredPauseLogs = relatedLogs.filter(l => l.assignmentId === assignmentId && l.type === 'PAUSE');
    
    let totalWorkSecs = 0;
    filteredWorkLogs.forEach(l => { totalWorkSecs += l.durationSeconds || 0; });
    
    let totalPauseSecs = 0;
    filteredPauseLogs.forEach(l => { totalPauseSecs += l.durationSeconds || 0; });

    if (isClaimableTask) {
      await fsUpdateClaimableTask(assignmentId, {
        status: 'WORKING',
        pausedAt: null as any,
        effectiveWorkSeconds: totalWorkSecs,
        totalPauseDuration: totalPauseSecs,
      });
    } else {
      await fsUpdateAssignment(assignmentId, {
        status: 'WORKING',
        effectiveWorkSeconds: totalWorkSecs,
        totalPauseDuration: totalPauseSecs,
        totalWorkingSeconds: totalWorkSecs,
        totalIdleSeconds: totalPauseSecs,
      });
    }

    if (doc.translatorId) {
      await fsUpdateTranslator(doc.translatorId, { status: 'BUSY' });
    }

    await fsAddActivityLog({
      userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
      action: 'Melanjutkan Pengukur Waktu',
      details: `Melanjutkan pengerjaan aktif untuk ${doc.code}`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'TIMER',
    });
  };

  // ACTION: Submit Assignment Work
  const submitAssignment = async (assignmentId: string, resultFileUrl: string, notes: string) => {
    let doc = assignments.find((a) => a.id === assignmentId);
    let isClaimableTask = false;
    if (!doc) {
      const task = claimableTasks.find((t) => t.id === assignmentId);
      if (task) {
        isClaimableTask = true;
        doc = {
          id: task.id,
          code: task.code,
          title: task.title,
          translatorId: task.claimedById,
          translatorName: task.claimedByName,
        } as any;
      }
    }
    if (!doc) return;

    confirmAction({
      title: 'Kirim Hasil Pekerjaan?',
      message: 'Apakah Anda yakin ingin menyerahkan hasil terjemahan Anda? Status tugas akan berubah menjadi Menunggu Tinjauan.',
      type: 'info',
      confirmText: 'Kirim',
      successTitle: 'Berhasil Dikirim!',
      successMessage: `Tugas "${doc.title}" berhasil diserahkan untuk ditinjau oleh Admin.`,
      onConfirm: async () => {
        if (isClaimableTask) {
          await fsSubmitAssignmentCallable({
            assignmentId,
            resultFileName: 'Google Drive Link',
            resultFileUrl,
            submissionNotes: notes,
          });
        } else {
          await fsUpdateAssignment(assignmentId, {
            status: 'WAITING_REVIEW',
            resultFileUrl,
            resultFileName: 'Google Drive Link',
            submissionNotes: notes,
            submittedAt: new Date().toISOString(),
          });
        }

        if (doc.translatorId) {
          await fsUpdateTranslator(doc.translatorId, { status: 'FREE' });
        }

        await fsAddActivityLog({
          userId: currentUser?.role === 'ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
          userName: currentUser?.role === 'ADMIN' ? 'Admin' : (currentTranslatorProfile?.name || 'Translator'),
          userRole: currentUser?.role === 'ADMIN' ? 'ADMIN' : 'PENERJEMAH',
          action: 'Mengirimkan Terjemahan',
          details: `Menyerahkan tautan hasil terjemahan Google Drive: ${resultFileUrl}. Menunggu tinjauan.`,
          assignmentId,
          assignmentTitle: doc.title,
          type: 'SUBMISSION',
        });
      }
    });
  };

  // ACTION: Approve Assignment
  const approveAssignment = async (assignmentId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;
    confirmAction({
      title: 'Setujui Hasil Terjemahan?',
      message: `Apakah Anda yakin ingin menyetujui hasil terjemahan untuk tugas "${doc.title}"? Status tugas akan diubah menjadi Selesai.`,
      type: 'success',
      confirmText: 'Setujui',
      successTitle: 'Tugas Disetujui!',
successMessage: `Tugas "${doc.title}" disetujui dan dinyatakan selesai.`,
      onConfirm: async () => {
        await fsUpdateAssignment(assignmentId, {
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        });
        if (doc.translatorId) {
          await fsAddNotification({
            userId: doc.translatorId,
            title: 'Terjemahan Disetujui!',
            message: `Pengiriman tugas Anda untuk ${doc.code} telah disetujui oleh Admin.`,
            type: 'SUCCESS',
            assignmentId,
            read: false,
          });
        }
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Menyetujui Hasil Terjemahan',
          details: `Admin menyetujui penyelesaian untuk ${doc.code}.`,
          assignmentId,
          assignmentTitle: doc.title,
          type: 'REVIEW',
        });
      }
    });
  };

  // ACTION: Request Revision
  const requestRevision = async (assignmentId: string, notes: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;
    confirmAction({
      title: 'Minta Revisi Dokumen?',
      message: `Apakah Anda yakin ingin mengembalikan tugas "${doc.title}" kepada penerjemah untuk direvisi dengan catatan: "${notes}"?`,
      type: 'danger',
      confirmText: 'Minta Revisi',
      successTitle: 'Revisi Diminta',
      successMessage: `Permintaan revisi tugas "${doc.title}" berhasil dikirim ke penerjemah.`,
      onConfirm: async () => {
        await fsUpdateAssignment(assignmentId, {
          status: 'REVISION',
          revisionNotes: notes,
        });
        if (doc.translatorId) {
          await fsAddNotification({
            userId: doc.translatorId,
            title: 'Permintaan Revisi',
            message: `Admin meminta revisi untuk ${doc.code}. Catatan: ${notes}`,
            type: 'ALERT',
            assignmentId,
            read: false,
          });
        }
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Meminta Revisi',
          details: `Revisi diperlukan untuk ${doc.code}. Catatan: ${notes}`,
          assignmentId,
          assignmentTitle: doc.title,
          type: 'REVIEW',
        });
      }
    });
  };

  // CRUD Assignments (Tasks)
  const createAssignment = async (newDoc: Partial<Assignment & { difficulty?: 'EASY' | 'MEDIUM' | 'HARD' }>) => {
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
        
        // Calculate points dynamically based on settings rules
        const rules = settings.pointRules;
        const basePoints = rules?.basePointsPerPage ?? 1;
        const diffMultiplier = rules?.difficultyMultipliers?.[newDoc.difficulty || 'MEDIUM'] ?? 1.0;
        const rewardPoints = Math.round(pageCount * basePoints * diffMultiplier);

        const taskData = {
          orderId: `ORDER-${Date.now()}`,
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
          status: (newDoc.status as string) === 'DRAFT' ? 'DRAFT' : 'AVAILABLE',
          sourceFileName: newDoc.sourceFileName || 'Document_Source.pdf',
          sourceFileUrl: newDoc.sourceFileUrl || '#',
          effectiveWorkSeconds: 0,
          totalPauseDuration: 0,
          pauseCount: 0,
        };

        const id = await fsCreateClaimableTask(taskData as any);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Membuat Tugas Baru',
          details: `Menambahkan tugas baru ${code} (${rewardPoints} poin, ${pageCount} hlm).`,
          assignmentId: id,
          assignmentTitle: taskData.title,
          type: 'SYSTEM',
        });
      }
    });
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    await fsUpdateAssignment(id, updates);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Admin',
      userRole: 'ADMIN',
      action: 'Memperbarui Penugasan',
      details: `Mengubah properti penugasan ${id}`,
      type: 'ASSIGNMENT',
    });
  };

  const deleteAssignment = async (id: string) => {
    const doc = assignments.find((a) => a.id === id);
    confirmAction({
      title: 'Hapus Penugasan?',
      message: `Apakah Anda yakin ingin menghapus penugasan "${doc?.title || id}"? Tindakan ini tidak dapat dibatalkan.`,
      type: 'danger',
      confirmText: 'Hapus',
      successTitle: 'Penugasan Dihapus',
      successMessage: `Tugas "${doc?.title || id}" berhasil dihapus dari sistem.`,
      onConfirm: async () => {
        await fsDeleteAssignment(id);
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Menghapus Penugasan',
          details: `Menghapus penugasan ${id}`,
          type: 'ASSIGNMENT',
        });
      }
    });
  };

  const reassignAssignment = async (assignmentId: string, newTranslatorId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    const newTr = translators.find((t) => t.id === newTranslatorId);

    if (!doc || !newTr) return;

    // VALIDATION: Check if translator is OFFLINE or ON_LEAVE
    if (newTr.status === 'OFFLINE' || newTr.status === 'ON_LEAVE') {
      showError(
        'Gagal Mengalihkan',
        `Tidak dapat mengalihkan penugasan: Penerjemah ${newTr.name} saat ini sedang ${newTr.status === 'OFFLINE' ? 'Offline' : 'Cuti'}.`
      );
      return;
    }

    confirmAction({
      title: 'Alihkan Penugasan?',
      message: `Apakah Anda yakin ingin mengalihkan dokumen "${doc.title}" kepada ${newTr.name}?`,
      type: 'warning',
      confirmText: 'Alihkan',
      successTitle: 'Berhasil Dialihkan',
      successMessage: `Tugas "${doc.title}" berhasil dialihkan kepada ${newTr.name}.`,
      onConfirm: async () => {
        await fsUpdateAssignment(assignmentId, {
          translatorId: newTr.id,
          translatorName: newTr.name,
          status: 'ASSIGNED',
          assignedAt: new Date().toISOString(),
        });
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Mengalihkan Dokumen',
          details: `Mengalihkan ${doc.code} kepada ${newTr.name}`,
          assignmentId,
          assignmentTitle: doc.title,
          type: 'REASSIGN',
        });
        await fsAddNotification({
          userId: newTr.id,
          title: 'Dokumen Dialihkan kepada Anda',
          message: `Anda ditugaskan untuk menangani ${doc.code} - ${doc.title}.`,
          type: 'INFO',
          assignmentId,
          read: false,
        });
      }
    });
  };

  // Helper update translator logic
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
      message: `Apakah Anda yakin ingin mendaftarkan penerjemah baru "${newTr.name}"? Sistem akan membuat kredensial akun masuk dan profil Firestore.`,
      type: 'info',
      confirmText: 'Daftarkan',
      successTitle: 'Penerjemah Terdaftar!',
      successMessage: `Akun dan profil untuk "${newTr.name}" berhasil dibuat.`,
      onConfirm: async () => {
        const isFirebase = import.meta.env.VITE_USE_FIREBASE === 'true';
        
        if (isFirebase) {
          await fsRegisterTranslatorCallable({
            email: newTr.email || '',
            password: newTr.password || '',
            name: newTr.name || '',
            phone: newTr.phone || '',
            languages: newTr.languages || ['EN-ID'],
            maxCapacityPoints: newTr.maxCapacityPoints || 20,
          });
        } else {
          const userId = `u-${Date.now()}`;
          const profileData = {
            userId,
            name: newTr.name || 'New Translator',
            email: newTr.email || 'translator@domain.com',
            phone: newTr.phone || '+62 812-0000-0000',
            avatar: newTr.avatar || '',
            languages: newTr.languages || ['EN-ID'],
            maxCapacityPoints: newTr.maxCapacityPoints || 20,
            currentLoadPoints: 0,
            remainingCapacityPoints: newTr.maxCapacityPoints || 20,
            utilizationPercentage: 0,
            status: 'FREE' as const,
            completedJobsCount: 0,
          };
          await fsAddTranslator(profileData);
        }

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

    // 1. Validasi Akses
    const isAdmin = currentRole === 'ADMIN';
    const isOwner = currentUser?.role === 'PENERJEMAH' && (currentUser?.id === tr.userId || currentUser?.id === tr.id);
    if (!isAdmin && !isOwner) {
      showError('Akses Ditolak', 'Anda tidak memiliki izin untuk mengubah profil ini.');
      return;
    }

    // 2. Validasi Form
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

    // Increment versi & set updatedAt
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

    // 3. Penanganan Konflik Konkurensi
    if (originalVersion !== undefined && tr.version !== undefined && tr.version !== originalVersion) {
      confirmAction({
        title: 'Konflik Konkurensi!',
        message: `Data profil ini telah diperbarui oleh pengguna lain (Versi ${tr.version}, Diperbarui: ${tr.updatedAt ? new Date(tr.updatedAt).toLocaleString() : 'N/A'}) sejak Anda membuka form edit.\n\nApakah Anda tetap ingin menimpa perubahan tersebut?`,
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

    // Direct save
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
    const task = claimableTasks.find((t) => t.id === taskId);
    if (!task || !currentTranslatorProfile) return;

    confirmAction({
      title: 'Ambil Task Ini?',
      message: `Anda akan mengambil task "${task.title}" (${task.pageCount} hal, ${task.rewardPoints} poin). Task hanya bisa diambil oleh satu penerjemah.`,
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
    const task = claimableTasks.find((t) => t.id === taskId);
    if (!task || !currentTranslatorProfile) return;

    confirmAction({
      title: 'Kirim Hasil Task?',
      message: `Apakah Anda yakin ingin menyerahkan hasil terjemahan untuk task "${task.title}"?`,
      type: 'info',
      confirmText: 'Kirim Hasil',
      successTitle: 'Hasil Task Dikirim',
      successMessage: `Hasil task "${task.title}" berhasil dikirim dan menunggu review admin.`,
      onConfirm: async () => {
        await fsSubmitAssignmentCallable({
          assignmentId: taskId,
          resultFileName: 'Hasil Terjemahan',
          resultFileUrl,
          submissionNotes: notes,
        });
        await fsAddActivityLog({
          userId: currentTranslatorProfile.userId,
          userName: currentTranslatorProfile.name,
          userRole: 'PENERJEMAH',
          action: 'Mengirimkan Hasil Task',
          details: `Mengirim hasil task ${task.code} untuk direview admin.`,
          type: 'SUBMISSION',
        });
      },
    });
  };

  const reviewClaimedTask = (taskId: string, approved: boolean, notes?: string) => {
    const task = claimableTasks.find((t) => t.id === taskId);
    if (!task) return;

    confirmAction({
      title: approved ? 'Setujui Hasil Task?' : 'Minta Revisi Task?',
      message: approved
        ? `Setujui hasil terjemahan untuk task "${task.title}"? Penerjemah akan mendapat ${task.rewardPoints} Reward Points.`
        : `Kembalikan task "${task.title}" untuk direvisi dengan catatan: "${notes}"?`,
      type: approved ? 'success' : 'danger',
      confirmText: approved ? 'Setujui & Beri Poin' : 'Minta Revisi',
      successTitle: approved ? 'Task Disetujui' : 'Revisi Diminta',
      successMessage: approved
        ? `Task "${task.title}" disetujui. Reward ${task.rewardPoints} poin telah diberikan.`
        : `Permintaan revisi untuk task "${task.title}" berhasil dikirim.`,
      onConfirm: async () => {
        await fsReviewClaimedTask(taskId, approved, notes);
        await fsAddActivityLog({
          userId: currentUser?.id || 'admin-1',
          userName: currentUser?.name || 'Admin',
          userRole: 'ADMIN',
          action: approved ? 'Menyetujui Task' : 'Meminta Revisi Task',
          details: `${approved ? 'Menyetujui' : 'Meminta revisi'} task ${task.code} - ${task.title}.`,
          type: 'REVIEW',
        });
      },
    });
  };

  const splitAssignmentIntoTasks = async (assignmentId: string, splitByPage: boolean) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    confirmAction({
      title: 'Pecah Dokumen Menjadi Task?',
      message: splitByPage
        ? `Dokumen "${assignment.title}" (${assignment.pageCount} hal) akan dipecah menjadi ${assignment.pageCount} task per halaman. Task akan otomatis tersedia untuk diklaim penerjemah.`
        : `Dokumen "${assignment.title}" akan dipecah menjadi 1 task dokumen penuh. Task akan otomatis tersedia untuk diklaim penerjemah.`,
      type: 'warning',
      confirmText: 'Pecah & Publikasikan',
      successTitle: 'Task Berhasil Dipublikasikan',
      successMessage: `Task dari dokumen "${assignment.title}" kini tersedia untuk diklaim oleh penerjemah.`,
      onConfirm: async () => {
        const basePoints = assignment.calculatedPoints || assignment.pageCount;
        if (splitByPage && assignment.pageCount > 1) {
          for (let page = 1; page <= assignment.pageCount; page++) {
            const pointsPerPage = parseFloat((basePoints / assignment.pageCount).toFixed(1));
            await fsCreateClaimableTask({
              orderId: assignmentId,
              code: `${assignment.code}-P${page}`,
              title: `${assignment.title} (Hal. ${page})`,
              documentType: assignment.documentType,
              languageFrom: assignment.languageFrom,
              languageTo: assignment.languageTo,
              pageCount: 1,
              priority: assignment.priority,
              difficulty: 'MEDIUM',
              estimatedMinutes: Math.round(assignment.estimatedMinutes / assignment.pageCount),
              deadlineAt: assignment.deadlineAt,
              rewardPoints: pointsPerPage,
              status: 'AVAILABLE',
            });
          }
        } else {
          await fsCreateClaimableTask({
            orderId: assignmentId,
            code: `${assignment.code}-T1`,
            title: assignment.title,
            documentType: assignment.documentType,
            languageFrom: assignment.languageFrom,
            languageTo: assignment.languageTo,
            pageCount: assignment.pageCount,
            priority: assignment.priority,
            difficulty: 'MEDIUM',
            estimatedMinutes: assignment.estimatedMinutes,
            deadlineAt: assignment.deadlineAt,
            rewardPoints: basePoints,
            status: 'AVAILABLE',
          });
        }
        // Update assignment status
        await fsUpdateAssignment(assignmentId, { status: 'UNASSIGNED' });
        await fsAddActivityLog({
          userId: 'admin-1',
          userName: 'Admin',
          userRole: 'ADMIN',
          action: 'Memecah Dokumen Menjadi Task',
          details: `Memecah ${assignment.code} menjadi ${splitByPage ? assignment.pageCount + ' task per halaman' : '1 task dokumen'}. Task tersedia untuk diklaim.`,
          assignmentId,
          assignmentTitle: assignment.title,
          type: 'ASSIGNMENT',
        });
      },
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activeTranslatorUserId,
        setActiveTranslatorUserId,
        theme,
        toggleTheme,
        adminTab,
        setAdminTab,
        translatorTab,
        setTranslatorTab,

        translators,
        assignments,
        activityLogs,
        notifications,
        settings,
        timerLogs,
        claimableTasks,
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
        reassignAssignment,

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
        splitAssignmentIntoTasks,

        isNewAssignmentModalOpen,
        setIsNewAssignmentModalOpen,
        isNewTranslatorModalOpen,
        setIsNewTranslatorModalOpen,
        activeReviewAssignment,
        setActiveReviewAssignment,
        activePauseAssignment,
        setActivePauseAssignment,
        activeSubmitAssignment,
        setActiveSubmitAssignment,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,

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
