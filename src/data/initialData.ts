import {
  TranslatorProfile,
  Assignment,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  LanguagePointRule,
} from '../types';
import avatarMale from '../assets/avatar_male.png';
import avatarFemale from '../assets/avatar_female.png';

export const INITIAL_LANGUAGE_RULES: LanguagePointRule[] = [
  { languageCode: 'EN-ID', languageName: 'Inggris → Indonesia', pointsPerPage: 1.0 },
  { languageCode: 'ID-EN', languageName: 'Indonesia → Inggris', pointsPerPage: 1.0 },
  { languageCode: 'AR-ID', languageName: 'Arab → Indonesia', pointsPerPage: 1.5 },
  { languageCode: 'JP-ID', languageName: 'Jepang → Indonesia', pointsPerPage: 2.0 },
  { languageCode: 'ZH-ID', languageName: 'Mandarin → Indonesia', pointsPerPage: 2.0 },
  { languageCode: 'DE-ID', languageName: 'Jerman → Indonesia', pointsPerPage: 1.5 },
  { languageCode: 'RU-ID', languageName: 'Rusia → Indonesia', pointsPerPage: 1.8 },
  { languageCode: 'FR-ID', languageName: 'Prancis → Indonesia', pointsPerPage: 1.5 },
];

export const INITIAL_TRANSLATORS: TranslatorProfile[] = [];

export const INITIAL_ASSIGNMENTS: Assignment[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  autoAssignEnabled: true,
  defaultCapacityPoints: 20,
  overdueAlertThresholdMinutes: 60,
  languageRules: INITIAL_LANGUAGE_RULES,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
};
