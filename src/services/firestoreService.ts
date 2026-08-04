/**
 * Firestore Service — Real-time Listeners & CRUD Operations
 *
 * Semua data operasi Firestore dipusatkan di sini.
 * Dipanggil oleh AppContext saat USE_FIREBASE=true.
 *
 * Koleksi Firestore:
 *   - /translator_profiles   → TranslatorProfile[]
 *   - /assignments           → Assignment[]
 *   - /activity_logs         → ActivityLogItem[]
 *   - /notifications         → SystemNotification[]
 *   - /system_settings/main  → SystemSettings
 *   - /timer_logs            → TimerLog[]
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../lib/firebase';
import {
  TranslatorProfile,
  Assignment,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  TimerLog,
} from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toISO(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return String(value);
}

function mapTranslator(id: string, data: DocumentData): TranslatorProfile {
  return {
    id,
    userId: data.userId || id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    avatar: data.avatarUrl || '',
    languages: data.languages || [],
    maxCapacityPoints: data.maxCapacityPoints || 20,
    currentLoadPoints: data.currentLoadPoints || 0,
    remainingCapacityPoints: data.remainingCapacityPoints || 20,
    utilizationPercentage: data.utilizationPercentage || 0,
    status: data.status || 'READY',
    activeAssignmentId: data.activeAssignmentId,
    completedJobsCount: data.completedJobsCount || 0,
    rating: data.rating || 5.0,
  };
}

function mapAssignment(id: string, data: DocumentData): Assignment {
  return {
    id,
    code: data.code || '',
    title: data.title || '',
    clientName: data.clientName || '',
    documentType: data.documentType || 'General',
    pageCount: data.pageCount || 1,
    languageFrom: data.languageFrom || 'EN-ID',
    languageTo: data.languageTo || 'Indonesia',
    pointMultiplier: data.pointMultiplier || 1.0,
    calculatedPoints: data.calculatedPoints || 0,
    translatorId: data.translatorId,
    translatorName: data.translatorName,
    status: data.status || 'UNASSIGNED',
    priority: data.priority || 'MEDIUM',
    createdAt: toISO(data.createdAt),
    assignedAt: data.assignedAt ? toISO(data.assignedAt) : undefined,
    deadlineAt: toISO(data.deadlineAt),
    startedAt: data.startedAt ? toISO(data.startedAt) : undefined,
    submittedAt: data.submittedAt ? toISO(data.submittedAt) : undefined,
    completedAt: data.completedAt ? toISO(data.completedAt) : undefined,
    estimatedMinutes: data.estimatedMinutes || 0,
    totalWorkingSeconds: data.totalWorkingSeconds || 0,
    totalIdleSeconds: data.totalIdleSeconds || 0,
    sourceFileUrl: data.sourceFileUrl,
    sourceFileName: data.sourceFileName,
    resultFileUrl: data.resultFileUrl,
    resultFileName: data.resultFileName,
    submissionNotes: data.submissionNotes,
    revisionNotes: data.revisionNotes,
    createdBy: data.createdBy || 'Admin',
  };
}

// ─── Subscriptions (Real-time Listeners) ────────────────────────────────────

export function subscribeTranslators(
  callback: (data: TranslatorProfile[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'translator_profiles'), orderBy('name'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapTranslator(d.id, d.data())));
  });
}

export function subscribeAssignments(
  callback: (data: Assignment[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapAssignment(d.id, d.data())));
  });
}

export function subscribeActivityLogs(
  callback: (data: ActivityLogItem[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: toISO(d.data().timestamp),
      } as ActivityLogItem))
    );
  });
}

export function subscribeNotifications(
  userId: string,
  callback: (data: SystemNotification[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  // Ambil notifikasi untuk user spesifik + notifikasi 'ALL'
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const all = snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toISO(d.data().createdAt),
      } as SystemNotification))
      .filter((n) => n.userId === 'ALL' || n.userId === userId);
    callback(all);
  });
}

export function subscribeSettings(
  callback: (data: SystemSettings) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const docRef = doc(db, 'system_settings', 'main');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SystemSettings);
    }
  });
}

export function subscribeTimerLogs(
  translatorId: string | undefined,
  callback: (data: TimerLog[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const constraints = translatorId
    ? [where('translatorId', '==', translatorId), orderBy('startTime', 'desc')]
    : [orderBy('startTime', 'desc')];
  const q = query(collection(db, 'timer_logs'), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        startTime: toISO(d.data().startTime),
        endTime: d.data().endTime ? toISO(d.data().endTime) : undefined,
      } as TimerLog))
    );
  });
}

// ─── Assignments CRUD ────────────────────────────────────────────────────────

export async function fsCreateAssignment(data: Omit<Assignment, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, 'assignments'), {
    ...data,
    createdAt: serverTimestamp(),
    deadlineAt: data.deadlineAt,
  });
  return ref.id;
}

export async function fsUpdateAssignment(id: string, data: Partial<Assignment>): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'assignments', id), data as DocumentData);
}

export async function fsDeleteAssignment(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'assignments', id));
}

// ─── Translators CRUD ────────────────────────────────────────────────────────

export async function fsAddTranslator(data: Omit<TranslatorProfile, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const { avatar, ...rest } = data;
  const ref = await addDoc(collection(db, 'translator_profiles'), {
    ...rest,
    avatarUrl: avatar,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fsUpdateTranslator(id: string, data: Partial<TranslatorProfile>): Promise<void> {
  const db = getFirebaseDb();
  const { avatar, ...rest } = data;
  const updateData: DocumentData = { ...rest };
  if (avatar !== undefined) updateData.avatarUrl = avatar;
  await updateDoc(doc(db, 'translator_profiles', id), updateData);
}

export async function fsDeleteTranslator(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'translator_profiles', id));
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function fsAddActivityLog(data: Omit<ActivityLogItem, 'id'>): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, 'activity_logs'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fsAddNotification(data: Omit<SystemNotification, 'id'>): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function fsMarkNotificationRead(id: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

export async function fsClearNotifications(userId: string): Promise<void> {
  // Catatan: batch delete tidak tersedia di Firestore Web SDK secara langsung.
  // Untuk implementasi production, gunakan Cloud Function.
  console.warn('[TMS] fsClearNotifications: Use a Cloud Function for batch delete in production.');
}

// ─── Timer Logs ────────────────────────────────────────────────────────────────

export async function fsAddTimerLog(data: Omit<TimerLog, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, 'timer_logs'), {
    ...data,
    startTime: serverTimestamp(),
  });
  return ref.id;
}

export async function fsUpdateTimerLog(id: string, data: Partial<TimerLog>): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'timer_logs', id), data as DocumentData);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function fsUpdateSettings(data: SystemSettings): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(doc(db, 'system_settings', 'main'), data, { merge: true });
}
