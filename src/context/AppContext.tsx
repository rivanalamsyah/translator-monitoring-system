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
  INITIAL_TRANSLATORS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SYSTEM_SETTINGS,
} from '../data/initialData';
import avatarMale from '../assets/avatar_male.png';
import avatarFemale from '../assets/avatar_female.png';
import { USE_FIREBASE } from '../lib/firebaseFlag';

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
  submitAssignment: (assignmentId: string, resultFileName: string, notes: string) => void;
  approveAssignment: (assignmentId: string) => void;
  requestRevision: (assignmentId: string, notes: string) => void;
  
  createAssignment: (newDoc: Partial<Assignment>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  reassignAssignment: (assignmentId: string, newTranslatorId: string) => void;

  addTranslator: (newTr: Partial<TranslatorProfile>) => void;
  updateTranslator: (id: string, updates: Partial<TranslatorProfile>) => void;
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

const MASTER_USERS: UserProfile[] = [
  {
    id: 'u-admin',
    name: 'Super Admin',
    email: 'admin@translator.id',
    role: 'SUPER_ADMIN',
    avatar: avatarMale,
    phone: '+62 812-0000-0000',
  },
  {
    id: 'tr-1',
    name: 'Ahmad Rizky',
    email: 'ahmad.rizky@translator.id',
    role: 'TRANSLATOR',
    avatar: avatarMale,
    phone: '+62 812-3456-7890',
  },
  {
    id: 'tr-2',
    name: 'Siti Rahma',
    email: 'siti.rahma@translator.id',
    role: 'TRANSLATOR',
    avatar: avatarFemale,
    phone: '+62 813-9876-5432',
  }
];

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




  const [translators, setTranslators] = useState<TranslatorProfile[]>(
    savedState?.translators || INITIAL_TRANSLATORS
  );
  const [assignments, setAssignments] = useState<Assignment[]>(
    savedState?.assignments || INITIAL_ASSIGNMENTS
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(
    savedState?.activityLogs || INITIAL_ACTIVITY_LOGS
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(
    savedState?.notifications || INITIAL_NOTIFICATIONS
  );
  const [settings, setSettings] = useState<SystemSettings>(
    savedState?.settings || INITIAL_SYSTEM_SETTINGS
  );
  const [timerLogs, setTimerLogs] = useState<TimerLog[]>(savedState?.timerLogs || []);

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
    if (!USE_FIREBASE) return; // Skip jika mode localStorage

    // Lazy-import services agar tidak dieksekusi saat mode localStorage
    let unsubFns: (() => void)[] = [];

    const initFirebase = async () => {
      try {
        const {
          subscribeTranslators,
          subscribeAssignments,
          subscribeActivityLogs,
          subscribeSettings,
        } = await import('../services/firestoreService');

        unsubFns.push(
          subscribeTranslators((data) => setTranslators(data)),
          subscribeAssignments((data) => setAssignments(data)),
          subscribeActivityLogs((data) => setActivityLogs(data)),
          subscribeSettings((data) => setSettings(data)),
        );

        // Subscribe notifikasi hanya jika ada user aktif
        if (currentUser) {
          const { subscribeNotifications } = await import('../services/firestoreService');
          unsubFns.push(
            subscribeNotifications(currentUser.id, (data) => setNotifications(data))
          );
        }

        console.log('[TMS] Firebase real-time listeners aktif.');
      } catch (err) {
        console.error('[TMS] Gagal menginisialisasi Firebase listeners:', err);
      }
    };

    initFirebase();

    // Cleanup saat component unmount
    return () => {
      unsubFns.forEach((unsub) => unsub());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [USE_FIREBASE, currentUser?.id]);

  // ── Firebase Login/Logout (Override saat USE_FIREBASE=true) ──────────────
  const login = USE_FIREBASE
    ? async (email: string, pass: string): Promise<boolean> => {
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
      }
    : (email: string, pass: string): boolean => {
        if (pass !== 'password') return false;
        const matched = MASTER_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
          setCurrentRole(matched.role);
          if (matched.role === 'TRANSLATOR') {
            setActiveTranslatorUserId(matched.id);
          } else {
            setActiveTranslatorUserId('u-admin');
          }
          return true;
        }
        return false;
      };

  const logout = USE_FIREBASE
    ? async () => {
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
      }
    : () => {
        setCurrentUser(null);
        setCurrentRole('SUPER_ADMIN');
        setActiveTranslatorUserId('u-admin');
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
          translators,
          assignments,
          activityLogs,
          notifications,
          settings,
          timerLogs,
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
    translators,
    assignments,
    activityLogs,
    notifications,
    settings,
    timerLogs,
    currentUser,
  ]);

  // Current active translator profile
  const currentTranslatorProfile = translators.find(
    (t) => t.userId === activeTranslatorUserId || t.id === activeTranslatorUserId
  ) || translators[0];

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
  useEffect(() => {
    setTranslators((prevTranslators) => {
      return prevTranslators.map((tr) => {
        // Find all non-completed assignments for this translator
        const trAssignments = assignments.filter(
          (a) => a.translatorId === tr.id && a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
        );

        // Sum current load points
        const currentLoad = trAssignments.reduce((acc, curr) => acc + curr.calculatedPoints, 0);
        const remCap = tr.maxCapacityPoints - currentLoad;
        const util = Math.round((currentLoad / tr.maxCapacityPoints) * 100);

        // Determine priority status
        let newStatus = tr.status;
        if (tr.status !== 'OFFLINE' && tr.status !== 'ON_LEAVE') {
          const hasWorking = trAssignments.some((a) => a.status === 'WORKING');
          const hasPaused = trAssignments.some((a) => a.status === 'PAUSED');
          const hasRevision = trAssignments.some((a) => a.status === 'REVISION');
          const hasReview = trAssignments.some((a) => a.status === 'WAITING_REVIEW');
          const hasAssigned = trAssignments.some((a) => a.status === 'ASSIGNED');

          if (hasWorking) newStatus = 'WORKING';
          else if (hasPaused) newStatus = 'PAUSED';
          else if (hasRevision) newStatus = 'REVISION';
          else if (hasReview) newStatus = 'WAITING_REVIEW';
          else if (hasAssigned) newStatus = 'ASSIGNED';
          else newStatus = 'READY';
        }

        const activeAss = trAssignments.find(
          (a) => a.status === 'WORKING' || a.status === 'PAUSED' || a.status === 'REVISION'
        );

        return {
          ...tr,
          currentLoadPoints: parseFloat(currentLoad.toFixed(1)),
          remainingCapacityPoints: parseFloat(remCap.toFixed(1)),
          utilizationPercentage: util,
          status: newStatus,
          activeAssignmentId: activeAss?.id,
        };
      });
    });
  }, [assignments]);

  // Helper logger
  const logActivity = (
    action: string,
    details: string,
    type: ActivityLogItem['type'],
    assignmentId?: string,
    assignmentTitle?: string
  ) => {
    const activeUser =
      currentRole === 'SUPER_ADMIN'
        ? { id: 'admin-1', name: 'Super Admin', role: 'SUPER_ADMIN' as UserRole }
        : {
            id: currentTranslatorProfile?.userId || 'u-1',
            name: currentTranslatorProfile?.name || 'Translator',
            role: 'TRANSLATOR' as UserRole,
          };

    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      action,
      details,
      assignmentId,
      assignmentTitle,
      type,
    };

    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (
    userId: string,
    title: string,
    message: string,
    type: SystemNotification['type'],
    assignmentId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
      assignmentId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // ACTION: Start Assignment Timer
  const startAssignmentTimer = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((doc) => {
        if (doc.id === assignmentId) {
          return {
            ...doc,
            status: 'WORKING',
            startedAt: doc.startedAt || new Date().toISOString(),
          };
        }
        return doc;
      })
    );

    const doc = assignments.find((a) => a.id === assignmentId);
    logActivity('Memulai Pengukur Waktu', `Memulai pengerjaan terjemahan untuk ${doc?.code || assignmentId}`, 'TIMER', assignmentId, doc?.title);
    
    // Add timer log
    setTimerLogs((prev) => [
      {
        id: `tlog-${Date.now()}`,
        assignmentId,
        translatorId: doc?.translatorId || '',
        type: 'WORK',
        startTime: new Date().toISOString(),
        durationSeconds: 0,
      },
      ...prev,
    ]);
  };

  // ACTION: Pause Assignment Timer
  const pauseAssignmentTimer = (assignmentId: string, reason: string) => {
    setAssignments((prev) =>
      prev.map((doc) => {
        if (doc.id === assignmentId) {
          return { ...doc, status: 'PAUSED' };
        }
        return doc;
      })
    );

    const doc = assignments.find((a) => a.id === assignmentId);
    logActivity('Menangguhkan Pengukur Waktu', `Menangguhkan pengukur waktu untuk ${doc?.code}. Alasan: "${reason}"`, 'TIMER', assignmentId, doc?.title);

    const nowStr = new Date().toISOString();
    setTimerLogs((prev) => {
      const updated = prev.map((log) => {
        if (log.assignmentId === assignmentId && log.type === 'WORK' && !log.endTime) {
          const duration = Math.max(0, Math.round((Date.now() - new Date(log.startTime).getTime()) / 1000));
          return {
            ...log,
            endTime: nowStr,
            durationSeconds: duration,
          };
        }
        return log;
      });
      return [
        {
          id: `tlog-${Date.now()}`,
          assignmentId,
          translatorId: doc?.translatorId || '',
          type: 'PAUSE',
          startTime: nowStr,
          durationSeconds: 0,
          reason,
        },
        ...updated,
      ];
    });
  };

  // ACTION: Resume Assignment Timer
  const resumeAssignmentTimer = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((doc) => {
        if (doc.id === assignmentId) {
          return { ...doc, status: 'WORKING' };
        }
        return doc;
      })
    );

    const doc = assignments.find((a) => a.id === assignmentId);
    logActivity('Melanjutkan Pengukur Waktu', `Melanjutkan pengerjaan aktif untuk ${doc?.code}`, 'TIMER', assignmentId, doc?.title);

    const nowStr = new Date().toISOString();
    setTimerLogs((prev) => {
      const updated = prev.map((log) => {
        if (log.assignmentId === assignmentId && log.type === 'PAUSE' && !log.endTime) {
          const duration = Math.max(0, Math.round((Date.now() - new Date(log.startTime).getTime()) / 1000));
          return {
            ...log,
            endTime: nowStr,
            durationSeconds: duration,
          };
        }
        return log;
      });
      return [
        {
          id: `tlog-${Date.now()}`,
          assignmentId,
          translatorId: doc?.translatorId || '',
          type: 'WORK',
          startTime: nowStr,
          durationSeconds: 0,
        },
        ...updated,
      ];
    });
  };

  // ACTION: Submit Assignment Work
  const submitAssignment = (assignmentId: string, resultFileName: string, notes: string) => {
    setAssignments((prev) =>
      prev.map((doc) => {
        if (doc.id === assignmentId) {
          return {
            ...doc,
            status: 'WAITING_REVIEW',
            resultFileName,
            resultFileUrl: '#',
            submissionNotes: notes,
            submittedAt: new Date().toISOString(),
          };
        }
        return doc;
      })
    );

    const nowStr = new Date().toISOString();
    setTimerLogs((prev) =>
      prev.map((log) => {
        if (log.assignmentId === assignmentId && !log.endTime) {
          const duration = Math.max(0, Math.round((Date.now() - new Date(log.startTime).getTime()) / 1000));
          return {
            ...log,
            endTime: nowStr,
            durationSeconds: duration,
          };
        }
        return log;
      })
    );

    const doc = assignments.find((a) => a.id === assignmentId);
    logActivity('Mengirimkan Terjemahan', `Mengunggah berkas selesai ${resultFileName}. Menunggu tinjauan.`, 'SUBMISSION', assignmentId, doc?.title);

    addNotification(
      'ALL',
      'Terjemahan Dikirim untuk Ditinjau',
      `${doc?.translatorName} telah mengirimkan terjemahan untuk ${doc?.code} - ${doc?.title}.`,
      'INFO',
      assignmentId
    );
  };

  // ACTION: Approve Assignment
  const approveAssignment = (assignmentId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;

    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id === assignmentId) {
          return {
            ...item,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    // Increment completed jobs count for translator
    if (doc.translatorId) {
      setTranslators((prev) =>
        prev.map((tr) => (tr.id === doc.translatorId ? { ...tr, completedJobsCount: tr.completedJobsCount + 1 } : tr))
      );
      addNotification(
        doc.translatorId,
        'Terjemahan Disetujui! 🎉',
        `Pengiriman tugas Anda untuk ${doc.code} telah disetujui oleh Super Admin.`,
        'SUCCESS',
        assignmentId
      );
    }

    logActivity('Menyetujui Hasil Terjemahan', `Super Admin menyetujui penyelesaian untuk ${doc.code}.`, 'REVIEW', assignmentId, doc.title);
  };

  // ACTION: Request Revision
  const requestRevision = (assignmentId: string, notes: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    if (!doc) return;

    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id === assignmentId) {
          return {
            ...item,
            status: 'REVISION',
            revisionNotes: notes,
          };
        }
        return item;
      })
    );

    if (doc.translatorId) {
      addNotification(
        doc.translatorId,
        'Permintaan Revisi',
        `Super Admin meminta revisi untuk ${doc.code}. Catatan: ${notes}`,
        'ALERT',
        assignmentId
      );
    }

    logActivity('Meminta Revisi', `Revisi diperlukan untuk ${doc.code}. Catatan: ${notes}`, 'REVIEW', assignmentId, doc.title);
  };

  // CRUD Assignments
  const createAssignment = (newDoc: Partial<Assignment>) => {
    // VALIDATION: Check if translator is OFFLINE or ON_LEAVE
    if (newDoc.translatorId) {
      const targetTr = translators.find((t) => t.id === newDoc.translatorId);
      if (targetTr && (targetTr.status === 'OFFLINE' || targetTr.status === 'ON_LEAVE')) {
        alert(`Tidak dapat membuat penugasan: Penerjemah ${targetTr.name} saat ini sedang ${targetTr.status === 'OFFLINE' ? 'Offline' : 'Cuti'}.`);
        return;
      }
    }

    const id = `doc-${Date.now()}`;
    const code = `DOC-2026-${Math.floor(100 + Math.random() * 900)}`;

    const pageCount = newDoc.pageCount || 10;
    const pointMultiplier = newDoc.pointMultiplier || 1.0;
    const calculatedPoints = parseFloat((pageCount * pointMultiplier).toFixed(1));

    const assignment: Assignment = {
      id,
      code,
      title: newDoc.title || 'Untitled Document',
      clientName: newDoc.clientName || 'General Client',
      documentType: newDoc.documentType || 'General',
      pageCount,
      languageFrom: newDoc.languageFrom || 'EN-ID',
      languageTo: newDoc.languageTo || 'Indonesian',
      pointMultiplier,
      calculatedPoints,
      translatorId: newDoc.translatorId,
      translatorName: newDoc.translatorName,
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

    setAssignments((prev) => [assignment, ...prev]);

    logActivity('Membuat Penugasan', `Menambahkan penugasan baru ${code} (${assignment.calculatedPoints} poin).`, 'ASSIGNMENT', id, assignment.title);

    if (assignment.translatorId) {
      addNotification(
        assignment.translatorId,
        'Penugasan Baru Diberikan 📋',
        `Anda telah ditugaskan untuk proyek ${code}: ${assignment.title}.`,
        'INFO',
        id
      );
    }
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    logActivity('Memperbarui Penugasan', `Mengubah properti penugasan ${id}`, 'ASSIGNMENT', id);
  };

  const deleteAssignment = (id: string) => {
    const doc = assignments.find((a) => a.id === id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    logActivity('Menghapus Penugasan', `Menghapus penugasan ${doc?.code || id}`, 'ASSIGNMENT', id);
  };

  const reassignAssignment = (assignmentId: string, newTranslatorId: string) => {
    const doc = assignments.find((a) => a.id === assignmentId);
    const newTr = translators.find((t) => t.id === newTranslatorId);

    if (!doc || !newTr) return;

    // VALIDATION: Check if translator is OFFLINE or ON_LEAVE
    if (newTr.status === 'OFFLINE' || newTr.status === 'ON_LEAVE') {
      alert(`Tidak dapat mengalihkan penugasan: Penerjemah ${newTr.name} saat ini sedang ${newTr.status === 'OFFLINE' ? 'Offline' : 'Cuti'}.`);
      return;
    }

    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id === assignmentId) {
          return {
            ...item,
            translatorId: newTr.id,
            translatorName: newTr.name,
            status: 'ASSIGNED',
            assignedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    logActivity(
      'Mengalihkan Dokumen',
      `Mengalihkan ${doc.code} kepada ${newTr.name}`,
      'REASSIGN',
      assignmentId,
      doc.title
    );

    addNotification(
      newTr.id,
      'Dokumen Dialihkan kepada Anda',
      `Anda ditugaskan untuk menangani ${doc.code} - ${doc.title}.`,
      'INFO',
      assignmentId
    );
  };

  // CRUD Translators
  const addTranslator = (newTr: Partial<TranslatorProfile>) => {
    const id = `tr-${Date.now()}`;
    const userId = `u-${Date.now()}`;

    const profile: TranslatorProfile = {
      id,
      userId,
      name: newTr.name || 'New Translator',
      email: newTr.email || 'translator@domain.com',
      phone: newTr.phone || '+62 812-0000-0000',
      avatar: newTr.avatar || avatarMale,
      languages: newTr.languages || ['EN-ID'],
      maxCapacityPoints: newTr.maxCapacityPoints || 20,
      currentLoadPoints: 0,
      remainingCapacityPoints: newTr.maxCapacityPoints || 20,
      utilizationPercentage: 0,
      status: 'READY',
      completedJobsCount: 0,
      rating: 5.0,
    };

    setTranslators((prev) => [...prev, profile]);
    logActivity('Menambahkan Penerjemah', `Membuat profil penerjemah baru untuk ${profile.name}`, 'SYSTEM');
  };

  const updateTranslator = (id: string, updates: Partial<TranslatorProfile>) => {
    setTranslators((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    logActivity('Memperbarui Penerjemah', `Memperbarui profil penerjemah untuk ${id}`, 'SYSTEM');
  };

  const deleteTranslator = (id: string) => {
    const tr = translators.find((t) => t.id === id);
    setTranslators((prev) => prev.filter((t) => t.id !== id));
    logActivity('Menghapus Penerjemah', `Menghapus profil penerjemah ${tr?.name || id}`, 'SYSTEM');
  };

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    logActivity('Memperbarui Pengaturan Sistem', 'Mengubah aturan bahasa dan ambang batas sistem.', 'SYSTEM');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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
