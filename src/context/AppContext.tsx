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
} from '../types';
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
  subscribeTranslators,
  subscribeAssignments,
  subscribeActivityLogs,
  subscribeSettings,
  subscribeTimerLogs,
  subscribeNotifications,
} from '../services/firestoreService';

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
  const [currentRole, setCurrentRole] = useState<UserRole>(savedState?.role || 'SUPER_ADMIN');
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

  // Modals state
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isNewTranslatorModalOpen, setIsNewTranslatorModalOpen] = useState(false);
  const [activeReviewAssignment, setActiveReviewAssignment] = useState<Assignment | null>(null);
  const [activePauseAssignment, setActivePauseAssignment] = useState<Assignment | null>(null);
  const [activeSubmitAssignment, setActiveSubmitAssignment] = useState<Assignment | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

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

  // ── Firebase Real-time Subscriptions (MODE: Firebase) ────────────────────
  useEffect(() => {
    if (!currentUser) return;

    let unsubFns: (() => void)[] = [];
    const isTranslator = currentUser?.role === 'TRANSLATOR';
    const translatorIdFilter = isTranslator ? (currentUser?.id || activeTranslatorUserId) : undefined;

    try {
      unsubFns.push(
        subscribeTranslators((data) => setTranslators(data)),
        subscribeAssignments(translatorIdFilter, (data) => setAssignments(data)),
        subscribeSettings((data) => setSettings(data)),
        subscribeTimerLogs(translatorIdFilter, (data) => setTimerLogs(data)),
        subscribeNotifications(currentUser.id, (data) => setNotifications(data))
      );

      if (currentUser?.role === 'SUPER_ADMIN') {
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

  // ── Firebase Login/Logout ──────────────────────
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const { loginWithFirebase } = await import('../services/authService');
      const profile = await loginWithFirebase(email, pass);
      if (profile) {
        setCurrentUser(profile);
        setCurrentRole(profile.role);
        if (profile.role === 'TRANSLATOR') {
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
    try {
      const { logoutFromFirebase } = await import('../services/authService');
      await logoutFromFirebase();
    } catch (err) {
      console.error('[TMS] Firebase logout error:', err);
    } finally {
      setCurrentUser(null);
      setCurrentRole('SUPER_ADMIN');
      setActiveTranslatorUserId('u-admin');
    }
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
      setAssignments((prevAssignments) => {
        let changed = false;
        const updated = prevAssignments.map((doc) => {
          if (doc.status === 'WORKING') {
            changed = true;
            return {
              ...doc,
              totalWorkingSeconds: doc.totalWorkingSeconds + 1,
            };
          } else if (doc.status === 'PAUSED') {
            changed = true;
            return {
              ...doc,
              totalIdleSeconds: doc.totalIdleSeconds + 1,
            };
          }
          return doc;
        });
        return changed ? updated : prevAssignments;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // RECALCULATE TRANSLATOR STATUS & WORKLOAD AUTOMATICALLY
  // ACTION: Start Assignment Timer
  const startAssignmentTimer = async (assignmentId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;
    const nowStr = new Date().toISOString();
    await fsUpdateAssignment(assignmentId, {
      status: 'WORKING',
      startedAt: doc.startedAt || nowStr,
    });
    await fsAddActivityLog({
      userId: currentUser?.role === 'SUPER_ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TRANSLATOR',
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
    const doc = assignments.find((a) => a.id === assignmentId);
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
    await fsUpdateAssignment(assignmentId, { status: 'PAUSED' });
    await fsAddActivityLog({
      userId: currentUser?.role === 'SUPER_ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TRANSLATOR',
      action: 'Menangguhkan Pengukur Waktu',
      details: `Menangguhkan pengukur waktu untuk ${doc.code}. Alasan: "${reason}"`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'TIMER',
    });
  };

  // ACTION: Resume Assignment Timer
  const resumeAssignmentTimer = async (assignmentId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
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
    await fsUpdateAssignment(assignmentId, { status: 'WORKING' });
    await fsAddActivityLog({
      userId: currentUser?.role === 'SUPER_ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TRANSLATOR',
      action: 'Melanjutkan Pengukur Waktu',
      details: `Melanjutkan pengerjaan aktif untuk ${doc.code}`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'TIMER',
    });
  };

  // ACTION: Submit Assignment Work
  const submitAssignment = async (assignmentId: string, resultFileUrl: string, notes: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;
    await fsSubmitAssignmentCallable({
      assignmentId,
      resultFileName: 'Google Drive Link',
      resultFileUrl,
      submissionNotes: notes,
    });
    await fsAddActivityLog({
      userId: currentUser?.role === 'SUPER_ADMIN' ? 'admin-1' : (currentTranslatorProfile?.userId || 'u-1'),
      userName: currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : (currentTranslatorProfile?.name || 'Translator'),
      userRole: currentUser?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TRANSLATOR',
      action: 'Mengirimkan Terjemahan',
      details: `Menyerahkan tautan hasil terjemahan Google Drive: ${resultFileUrl}. Menunggu tinjauan.`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'SUBMISSION',
    });
  };

  // ACTION: Approve Assignment
  const approveAssignment = async (assignmentId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;
    await fsUpdateAssignment(assignmentId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });
    if (doc.translatorId) {
      await fsAddNotification({
        userId: doc.translatorId,
        title: 'Terjemahan Disetujui! 🎉',
        message: `Pengiriman tugas Anda untuk ${doc.code} telah disetujui oleh Super Admin.`,
        type: 'SUCCESS',
        assignmentId,
        read: false,
      });
    }
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Menyetujui Hasil Terjemahan',
      details: `Super Admin menyetujui penyelesaian untuk ${doc.code}.`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'REVIEW',
    });
  };

  // ACTION: Request Revision
  const requestRevision = async (assignmentId: string, notes: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;
    await fsUpdateAssignment(assignmentId, {
      status: 'REVISION',
      revisionNotes: notes,
    });
    if (doc.translatorId) {
      await fsAddNotification({
        userId: doc.translatorId,
        title: 'Permintaan Revisi',
        message: `Super Admin meminta revisi untuk ${doc.code}. Catatan: ${notes}`,
        type: 'ALERT',
        assignmentId,
        read: false,
      });
    }
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Meminta Revisi',
      details: `Revisi diperlukan untuk ${doc.code}. Catatan: ${notes}`,
      assignmentId,
      assignmentTitle: doc.title,
      type: 'REVIEW',
    });
  };

  // CRUD Assignments
  const createAssignment = async (newDoc: Partial<Assignment>) => {
    // VALIDATION: Check if translator is OFFLINE or ON_LEAVE
    if (newDoc.translatorId) {
      const targetTr = translators.find((t) => t.id === newDoc.translatorId);
      if (targetTr && (targetTr.status === 'OFFLINE' || targetTr.status === 'ON_LEAVE')) {
        alert(`Tidak dapat membuat penugasan: Penerjemah ${targetTr.name} saat ini sedang ${targetTr.status === 'OFFLINE' ? 'Offline' : 'Cuti'}.`);
        return;
      }
    }

    const code = `DOC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const pageCount = newDoc.pageCount || 10;
    const pointMultiplier = newDoc.pointMultiplier || 1.0;
    const calculatedPoints = parseFloat((pageCount * pointMultiplier).toFixed(1));

    const assignmentData = {
      code,
      title: newDoc.title || 'Untitled Document',
      clientName: newDoc.clientName || 'General Client',
      documentType: newDoc.documentType || 'General',
      pageCount,
      languageFrom: newDoc.languageFrom || 'EN-ID',
      languageTo: newDoc.languageTo || 'Indonesian',
      pointMultiplier,
      calculatedPoints,
      translatorId: newDoc.translatorId || '',
      translatorName: newDoc.translatorName || '',
      status: newDoc.translatorId ? 'ASSIGNED' : 'UNASSIGNED',
      priority: newDoc.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      assignedAt: newDoc.translatorId ? new Date().toISOString() : undefined,
      deadlineAt: newDoc.deadlineAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      estimatedMinutes: Math.round(pageCount * 25),
      totalWorkingSeconds: 0,
      totalIdleSeconds: 0,
      sourceFileName: newDoc.sourceFileName || 'Document_Source.pdf',
      sourceFileUrl: '#',
      createdBy: 'Super Admin',
    };
    const id = await fsCreateAssignment(assignmentData as any);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Membuat Penugasan',
      details: `Menambahkan penugasan baru ${code} (${calculatedPoints} poin).`,
      assignmentId: id,
      assignmentTitle: assignmentData.title,
      type: 'ASSIGNMENT',
    });
    if (newDoc.translatorId) {
      await fsAddNotification({
        userId: newDoc.translatorId,
        title: 'Penugasan Baru Diberikan 📋',
        message: `Anda telah ditugaskan untuk proyek ${code}: ${assignmentData.title}.`,
        type: 'INFO',
        assignmentId: id,
        read: false,
      });
    }
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    await fsUpdateAssignment(id, updates);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Memperbarui Penugasan',
      details: `Mengubah properti penugasan ${id}`,
      type: 'ASSIGNMENT',
    });
  };

  const deleteAssignment = async (id: string) => {
    await fsDeleteAssignment(id);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Menghapus Penugasan',
      details: `Menghapus penugasan ${id}`,
      type: 'ASSIGNMENT',
    });
  };

  const reassignAssignment = async (assignmentId: string, newTranslatorId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    const newTr = translators.find((t) => t.id === newTranslatorId);

    if (!doc || !newTr) return;

    // VALIDATION: Check if translator is OFFLINE or ON_LEAVE
    if (newTr.status === 'OFFLINE' || newTr.status === 'ON_LEAVE') {
      alert(`Tidak dapat mengalihkan penugasan: Penerjemah ${newTr.name} saat ini sedang ${newTr.status === 'OFFLINE' ? 'Offline' : 'Cuti'}.`);
      return;
    }

    await fsUpdateAssignment(assignmentId, {
      translatorId: newTr.id,
      translatorName: newTr.name,
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
    });
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
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
  };

  // CRUD Translators
  const addTranslator = async (newTr: Partial<TranslatorProfile>) => {
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
      status: 'READY' as const,
      completedJobsCount: 0,
      rating: 5.0,
    };
    await fsAddTranslator(profileData);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Menambahkan Penerjemah',
      details: `Membuat profil penerjemah baru untuk ${profileData.name}`,
      type: 'SYSTEM',
    });
  };

  const updateTranslator = async (id: string, updates: Partial<TranslatorProfile>, originalVersion?: number) => {
    const tr = translators.find((t) => t.id === id);
    if (!tr) return;

    // 1. Validasi Akses
    const isAdmin = currentRole === 'SUPER_ADMIN';
    const isOwner = currentUser?.role === 'TRANSLATOR' && (currentUser?.id === tr.userId || currentUser?.id === tr.id);
    if (!isAdmin && !isOwner) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengubah profil ini.');
      return;
    }

    // 2. Validasi Form
    if (updates.name !== undefined && !updates.name.trim()) {
      alert('Validasi Gagal: Nama lengkap tidak boleh kosong.');
      return;
    }
    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        alert('Validasi Gagal: Format email tidak valid.');
        return;
      }
    }
    if (updates.phone !== undefined && !updates.phone.trim()) {
      alert('Validasi Gagal: Nomor WhatsApp/telepon tidak boleh kosong.');
      return;
    }

    // 3. Penanganan Konflik Konkurensi
    if (originalVersion !== undefined && tr.version !== undefined && tr.version !== originalVersion) {
      const confirmOverwrite = window.confirm(
        `Konflik Terdeteksi!\nData profil ini telah diperbarui oleh pengguna lain (Versi ${tr.version}, Diperbarui: ${tr.updatedAt ? new Date(tr.updatedAt).toLocaleString() : 'N/A'}) sejak Anda membuka form edit.\n\nApakah Anda ingin menimpa perubahan tersebut?`
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    // Increment versi & set updatedAt
    const nextVersion = (tr.version || 1) + 1;
    const nowStr = new Date().toISOString();
    const finalUpdates = {
      ...updates,
      version: nextVersion,
      updatedAt: nowStr,
    };

    // 4. Catatan Audit Log Perubahan Detail
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
      currentRole === 'SUPER_ADMIN'
        ? { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' as UserRole }
        : {
          id: currentTranslatorProfile?.userId || 'u-1',
          name: currentTranslatorProfile?.name || 'Translator',
          role: 'TRANSLATOR' as UserRole,
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

  const deleteTranslator = async (id: string) => {
    const tr = translators.find((t) => t.id === id);
    await fsDeleteTranslator(id);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
      action: 'Menghapus Penerjemah',
      details: `Menghapus profil penerjemah ${tr?.name || id}`,
      type: 'SYSTEM',
    });
  };

  const updateSettings = async (newSettings: SystemSettings) => {
    await fsUpdateSettings(newSettings);
    await fsAddActivityLog({
      userId: 'admin-1',
      userName: 'Super Admin',
      userRole: 'SUPER_ADMIN',
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

        updateSettings,
        markNotificationRead,
        clearAllNotifications,

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
