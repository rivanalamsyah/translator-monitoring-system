export type UserRole = 'ADMIN' | 'PENERJEMAH';

export type TranslatorStatus =
  | 'FREE'
  | 'BUSY'
  | 'BREAK'
  | 'OFFLINE';

export type TaskStatus =
  | 'DRAFT'
  | 'WAITING_CLAIM'
  | 'WORKING'
  | 'PAUSED'
  | 'WAITING_REVIEW'
  | 'REVISION'
  | 'COMPLETED'
  | 'CANCELLED';

// Keep AssignmentStatus as alias for backward compatibility during migration
export type AssignmentStatus = TaskStatus;

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Language {
  id: string;
  code: string;
  name: string;
  pointMultiplier: number;
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
  maxCapacityPoints: number;
  currentLoadPoints: number;
  remainingCapacityPoints: number;
  utilizationPercentage: number;
  status: TranslatorStatus;
  activeTaskId?: string;
  activeAssignmentId?: string; // backward compatibility alias
  completedJobsCount: number;
  address?: string;
  certifications?: string[];
  specialties?: string[];
  paymentAccount?: string;
  supportingDocuments?: string[];
  availability?: string;
  updatedAt?: string;
  version?: number;
  points?: number;
  level?: number;
  xp?: number;
  achievements?: string[];
  onTimeRate?: number;
  accuracyRate?: number;
  revisionRate?: number;
  performanceTrend?: 'UP' | 'DOWN' | 'STABLE';
}

export interface Task {
  id: string;
  code: string; // e.g. TASK-DOC-001
  title: string;
  clientName: string;
  documentType: string;
  pageCount: number;
  languageFrom: string;
  languageTo: string;
  pointMultiplier: number;
  calculatedPoints: number;
  rewardPoints: number; // calculatedPoints & rewardPoints can be the same
  translatorId?: string;
  translatorName?: string;
  claimedById?: string;
  claimedByName?: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  claimedAt?: string;
  assignedAt?: string; // backward compatibility alias
  deadlineAt: string;
  startedAt?: string;
  pausedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  estimatedMinutes: number;
  totalWorkingSeconds: number;
  totalIdleSeconds: number;
  pauseCount?: number;
  totalPauseDuration?: number;
  effectiveWorkSeconds?: number;
  sourceFileUrl?: string;
  sourceFileName?: string;
  resultFileUrl?: string;
  resultFileName?: string;
  submissionNotes?: string;
  revisionNotes?: string;
  createdBy: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

// Keep Assignment alias for backward compatibility during migration
export type Assignment = Task;
export type ClaimableTask = Task;

export interface TimerLog {
  id: string;
  taskId: string;
  assignmentId?: string; // backward compatibility alias
  translatorId: string;
  type: 'WORK' | 'PAUSE';
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  reason?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  taskId?: string;
  assignmentId?: string; // backward compatibility alias
  taskTitle?: string;
  assignmentTitle?: string; // backward compatibility alias
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
  taskId?: string;
  assignmentId?: string; // backward compatibility alias
}

export interface LanguagePointRule {
  languageCode: string;
  languageName: string;
  pointsPerPage: number;
}

export interface PointRuleConfig {
  basePointsPerPage: number;
  difficultyMultipliers: { EASY: number; MEDIUM: number; HARD: number };
  speedBonusPoints: number;
  qualityBonusPoints: number;
  revisionPenaltyPoints: number;
  latePenaltyPoints: number;
}

export interface SystemSettings {
  autoAssignEnabled: boolean;
  defaultCapacityPoints: number;
  overdueAlertThresholdMinutes: number;
  languageRules: LanguagePointRule[];
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  pointRules?: PointRuleConfig;
}

export interface RewardPointHistory {
  id: string;
  translatorId: string;
  taskId: string;
  taskTitle: string;
  points: number;
  type: 'BASE' | 'SPEED_BONUS' | 'QUALITY_BONUS' | 'LATE_PENALTY' | 'REVISION_PENALTY';
  timestamp: string;
}

export interface MonthlyLeaderboard {
  id: string; // YYYY-MM
  period: string; // YYYY-MM
  rankings: {
    translatorId: string;
    translatorName: string;
    points: number;
    tasksCompletedCount: number;
    pagesCount: number;
    effectiveWorkSeconds: number;
    averageSecondsPerPage: number;
  }[];
  createdAt: string;
}
