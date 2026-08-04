export type UserRole = 'SUPER_ADMIN' | 'TRANSLATOR';

export type TranslatorStatus =
  | 'READY'
  | 'ASSIGNED'
  | 'WORKING'
  | 'PAUSED'
  | 'WAITING_REVIEW'
  | 'REVISION'
  | 'OFFLINE'
  | 'ON_LEAVE';

export type AssignmentStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'WORKING'
  | 'PAUSED'
  | 'WAITING_REVIEW'
  | 'REVISION'
  | 'COMPLETED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Language {
  id: string;
  code: string;
  name: string;
  pointMultiplier: number; // e.g. EN=1.0, AR=1.5, JP=2.0, ZH=2.0
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
}

export interface TranslatorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  languages: string[]; // Language codes, e.g., ['EN-ID', 'ID-EN']
  maxCapacityPoints: number; // e.g. 20.0
  currentLoadPoints: number;
  remainingCapacityPoints: number;
  utilizationPercentage: number;
  status: TranslatorStatus;
  activeAssignmentId?: string;
  completedJobsCount: number;
  rating: number; // e.g. 4.9
}

export interface Assignment {
  id: string;
  code: string; // e.g. DOC-2026-081
  title: string;
  clientName: string;
  documentType: 'Legal' | 'Financial' | 'Medical' | 'Marketing' | 'Technical' | 'Academic' | 'General';
  pageCount: number;
  languageFrom: string;
  languageTo: string;
  pointMultiplier: number;
  calculatedPoints: number;
  translatorId?: string;
  translatorName?: string;
  status: AssignmentStatus;
  priority: Priority;
  createdAt: string;
  assignedAt?: string;
  deadlineAt: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  estimatedMinutes: number;
  totalWorkingSeconds: number;
  totalIdleSeconds: number;
  sourceFileUrl?: string;
  sourceFileName?: string;
  resultFileUrl?: string;
  resultFileName?: string;
  submissionNotes?: string;
  revisionNotes?: string;
  createdBy: string;
}

export interface TimerLog {
  id: string;
  assignmentId: string;
  translatorId: string;
  type: 'WORK' | 'PAUSE';
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  reason?: string; // reason for pause
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  assignmentId?: string;
  assignmentTitle?: string;
  type: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'TIMER' | 'SUBMISSION' | 'REVIEW' | 'SYSTEM' | 'REASSIGN';
}

export interface SystemNotification {
  id: string;
  userId: string; // 'ALL' or specific translator user ID
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  createdAt: string;
  read: boolean;
  assignmentId?: string;
}

export interface LanguagePointRule {
  languageCode: string;
  languageName: string;
  pointsPerPage: number;
}

export interface SystemSettings {
  autoAssignEnabled: boolean;
  defaultCapacityPoints: number;
  overdueAlertThresholdMinutes: number;
  languageRules: LanguagePointRule[];
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}
