import { create } from 'zustand';
import {
  UserProfile,
  UserRole,
  TranslatorProfile,
  Task,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  TimerLog,
  RewardPointHistory,
} from '../types';
import { INITIAL_SYSTEM_SETTINGS } from '../data/initialData';

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

export interface TmsState {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  activeTranslatorUserId: string;
  theme: 'dark' | 'light';
  adminTab: string;
  translatorTab: string;

  translators: TranslatorProfile[];
  tasks: Task[];
  activityLogs: ActivityLogItem[];
  notifications: SystemNotification[];
  settings: SystemSettings;
  timerLogs: TimerLog[];
  rewardPointHistory: RewardPointHistory[];

  isNewAssignmentModalOpen: boolean;
  isNewTranslatorModalOpen: boolean;
  activeReviewAssignment: Task | null;
  activePauseAssignment: Task | null;
  activeSubmitAssignment: Task | null;
  isNotificationDrawerOpen: boolean;
  dialogState: CustomDialogState;

  // State Mutators
  setCurrentUser: (user: UserProfile | null) => void;
  setCurrentRole: (role: UserRole) => void;
  setActiveTranslatorUserId: (id: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAdminTab: (tab: string) => void;
  setTranslatorTab: (tab: string) => void;
  
  setTranslators: (translators: TranslatorProfile[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActivityLogs: (logs: ActivityLogItem[]) => void;
  setNotifications: (notifications: SystemNotification[]) => void;
  setSettings: (settings: SystemSettings) => void;
  setTimerLogs: (logs: TimerLog[]) => void;
  setRewardPointHistory: (history: RewardPointHistory[]) => void;

  setIsNewAssignmentModalOpen: (open: boolean) => void;
  setIsNewTranslatorModalOpen: (open: boolean) => void;
  setActiveReviewAssignment: (task: Task | null) => void;
  setActivePauseAssignment: (task: Task | null) => void;
  setActiveSubmitAssignment: (task: Task | null) => void;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  setDialogState: (update: Partial<CustomDialogState> | ((prev: CustomDialogState) => CustomDialogState)) => void;
}

const STORAGE_KEY = 'tms_app_state_v1';

// Load initial settings from localStorage if available
const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load initial Zustand state:', e);
  }
  return null;
};

const savedState = loadSavedState();

export const useTmsStore = create<TmsState>((set) => ({
  currentUser: savedState?.currentUser || null,
  currentRole: savedState?.role || 'ADMIN',
  activeTranslatorUserId: savedState?.activeTranslatorUserId || 'u-1',
  theme: savedState?.theme || 'light',
  adminTab: 'dashboard',
  translatorTab: 'dashboard',

  translators: [],
  tasks: [],
  activityLogs: [],
  notifications: [],
  settings: INITIAL_SYSTEM_SETTINGS,
  timerLogs: [],
  rewardPointHistory: [],

  isNewAssignmentModalOpen: false,
  isNewTranslatorModalOpen: false,
  activeReviewAssignment: null,
  activePauseAssignment: null,
  activeSubmitAssignment: null,
  isNotificationDrawerOpen: false,
  dialogState: {
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentRole: (role) => set({ currentRole: role }),
  setActiveTranslatorUserId: (id) => set({ activeTranslatorUserId: id }),
  setTheme: (theme) => set({ theme }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  setTranslatorTab: (tab) => set({ translatorTab: tab }),

  setTranslators: (translators) => set({ translators }),
  setTasks: (tasks) => set({ tasks }),
  setActivityLogs: (activityLogs) => set({ activityLogs }),
  setNotifications: (notifications) => set({ notifications }),
  setSettings: (settings) => set({ settings }),
  setTimerLogs: (timerLogs) => set({ timerLogs }),
  setRewardPointHistory: (rewardPointHistory) => set({ rewardPointHistory }),

  setIsNewAssignmentModalOpen: (open) => set({ isNewAssignmentModalOpen: open }),
  setIsNewTranslatorModalOpen: (open) => set({ isNewTranslatorModalOpen: open }),
  setActiveReviewAssignment: (task) => set({ activeReviewAssignment: task }),
  setActivePauseAssignment: (task) => set({ activePauseAssignment: task }),
  setActiveSubmitAssignment: (task) => set({ activeSubmitAssignment: task }),
  setIsNotificationDrawerOpen: (open) => set({ isNotificationDrawerOpen: open }),
  
  setDialogState: (update) => set((state) => {
    const nextVal = typeof update === 'function' ? update(state.dialogState) : update;
    return {
      dialogState: {
        ...state.dialogState,
        ...nextVal,
      },
    };
  }),
}));
