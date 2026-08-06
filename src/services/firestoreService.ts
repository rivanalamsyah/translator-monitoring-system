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
  or,
  serverTimestamp,
  Timestamp,
  DocumentData,
  Unsubscribe,
  writeBatch,
  getDocs,
  runTransaction,
  limit,
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseDb, getFirebaseApp, firebaseConfig } from '../lib/firebase';
import {
  TranslatorProfile,
  Assignment,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  TimerLog,
  ClaimableTask,
  RewardPointHistory,
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
    status: data.status || 'FREE',
    activeAssignmentId: data.activeAssignmentId,
    completedJobsCount: data.completedJobsCount || 0,
    address: data.address || '',
    certifications: data.certifications || [],
    specialties: data.specialties || [],
    paymentAccount: data.paymentAccount || '',
    supportingDocuments: data.supportingDocuments || [],
    availability: data.availability || '',
    updatedAt: data.updatedAt || '',
    version: data.version || 1,
    points: data.points || 0,
    level: data.level || 1,
    xp: data.xp || 0,
    achievements: data.achievements || [],
    onTimeRate: data.onTimeRate !== undefined ? data.onTimeRate : 100,
    accuracyRate: data.accuracyRate !== undefined ? data.accuracyRate : 100,
    revisionRate: data.revisionRate !== undefined ? data.revisionRate : 0,
    performanceTrend: data.performanceTrend || 'STABLE',
  };
}

function mapClaimableTask(id: string, data: DocumentData): ClaimableTask {
  return {
    id,
    orderId: data.orderId || '',
    code: data.code || '',
    title: data.title || '',
    documentType: data.documentType || 'General',
    languageFrom: data.languageFrom || '',
    languageTo: data.languageTo || '',
    pageCount: data.pageCount || 1,
    priority: data.priority || 'MEDIUM',
    difficulty: data.difficulty || 'MEDIUM',
    estimatedMinutes: data.estimatedMinutes || 60,
    deadlineAt: toISO(data.deadlineAt),
    rewardPoints: data.rewardPoints || 0,
    status: data.status || 'AVAILABLE',
    claimedById: data.claimedById,
    claimedByName: data.claimedByName,
    claimedAt: data.claimedAt ? toISO(data.claimedAt) : undefined,
    submittedAt: data.submittedAt ? toISO(data.submittedAt) : undefined,
    completedAt: data.completedAt ? toISO(data.completedAt) : undefined,
    resultFileUrl: data.resultFileUrl,
    resultFileName: data.resultFileName,
    submissionNotes: data.submissionNotes,
    revisionNotes: data.revisionNotes,
  };
}

function mapRewardPointHistory(id: string, data: DocumentData): RewardPointHistory {
  return {
    id,
    translatorId: data.translatorId || '',
    taskId: data.taskId || '',
    taskTitle: data.taskTitle || '',
    points: data.points || 0,
    type: data.type || 'BASE',
    timestamp: toISO(data.timestamp),
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
  const q = query(collection(db, 'translator_profiles'), orderBy('name'), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapTranslator(d.id, d.data())));
  });
}

export function subscribeAssignments(
  translatorId: string | undefined,
  callback: (data: Assignment[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const constraints = translatorId
    ? [where('translatorId', '==', translatorId), orderBy('createdAt', 'desc'), limit(50)]
    : [orderBy('createdAt', 'desc'), limit(50)];
  const q = query(collection(db, 'assignments'), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapAssignment(d.id, d.data())));
  });
}

export function subscribeActivityLogs(
  callback: (data: ActivityLogItem[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
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
  // Filter for unread and limit to recent 50
  const q = query(
    collection(db, 'notifications'),
    where('userId', 'in', ['ALL', userId]),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toISO(d.data().createdAt),
      } as SystemNotification))
    );
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
    ? [where('translatorId', '==', translatorId), orderBy('startTime', 'desc'), limit(50)]
    : [orderBy('startTime', 'desc'), limit(50)];
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

export async function fsAddActivityLog(data: Omit<ActivityLogItem, 'id' | 'timestamp'>): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, 'activity_logs'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fsAddNotification(data: Omit<SystemNotification, 'id' | 'createdAt'>): Promise<void> {
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
  const db = getFirebaseDb();
  const q = query(collection(db, 'notifications'), where('userId', 'in', ['ALL', userId]));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

// ─── Timer Logs ────────────────────────────────────────────────────────────────

export async function fsAddTimerLog(data: Omit<TimerLog, 'id' | 'startTime'>): Promise<string> {
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

// ─── Cloud Functions Callables ───────────────────────────────────────────────

export async function fsSubmitAssignmentCallable(data: {
  assignmentId: string;
  resultFileName: string;
  resultFileUrl: string;
  submissionNotes: string;
}): Promise<any> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'claimable_tasks', data.assignmentId), {
    status: 'WAITING_REVIEW',
    resultFileName: data.resultFileName,
    resultFileUrl: data.resultFileUrl,
    submissionNotes: data.submissionNotes,
    submittedAt: new Date().toISOString(),
  });
  return { success: true };
}

export async function fsRegisterTranslatorCallable(data: {
  email: string;
  password?: string;
  name: string;
  phone: string;
  languages: string[];
  maxCapacityPoints: number;
}): Promise<any> {
  const password = data.password || 'penerjemah123';
  const tempAppName = `temp-register-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, password);
    const newUid = userCredential.user.uid;

    await signOut(tempAuth);

    const db = getFirebaseDb();

    // Write users collection
    await setDoc(doc(db, 'users', newUid), {
      id: newUid,
      name: data.name,
      email: data.email,
      role: 'PENERJEMAH',
      createdAt: new Date().toISOString(),
    });

    // Write translator profiles collection
    await setDoc(doc(db, 'translator_profiles', newUid), {
      id: newUid,
      userId: newUid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      languages: data.languages,
      maxCapacityPoints: data.maxCapacityPoints,
      currentLoadPoints: 0,
      remainingCapacityPoints: data.maxCapacityPoints,
      utilizationPercentage: 0,
      status: 'FREE',
      completedJobsCount: 0,
      createdAt: new Date().toISOString(),
    });

    return { success: true, uid: newUid };
  } catch (error) {
    console.error('Error in fsRegisterTranslatorCallable local flow:', error);
    throw error;
  } finally {
    await deleteApp(tempApp);
  }
}

export async function fsClaimTaskTransaction(
  taskId: string,
  translatorId: string,
  translatorName: string
): Promise<void> {
  const db = getFirebaseDb();
  const taskRef = doc(db, 'claimable_tasks', taskId);
  const translatorRef = doc(db, 'translator_profiles', translatorId);

  await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Tugas tidak ditemukan.');
    }

    const taskData = taskDoc.data();
    if (taskData.status !== 'AVAILABLE') {
      throw new Error('Tugas ini sudah diambil oleh penerjemah lain.');
    }

    const translatorDoc = await transaction.get(translatorRef);
    if (!translatorDoc.exists()) {
      throw new Error('Profil penerjemah tidak ditemukan.');
    }

    const translatorData = translatorDoc.data();
    const currentLoad = translatorData.currentLoadPoints || 0;
    const maxCapacity = translatorData.maxCapacityPoints || 20;
    const taskLoad = taskData.pageCount || 1;

    if (currentLoad + taskLoad > maxCapacity) {
      throw new Error('Beban kerja Anda melebihi kapasitas maksimal.');
    }

    const nowStr = new Date().toISOString();

    // Update Task status to WORKING
    transaction.update(taskRef, {
      status: 'WORKING',
      claimedById: translatorId,
      claimedByName: translatorName,
      claimedAt: nowStr,
      startedAt: nowStr,
    });

    // Update Translator load state
    transaction.update(translatorRef, {
      currentLoadPoints: currentLoad + taskLoad,
      remainingCapacityPoints: maxCapacity - (currentLoad + taskLoad),
      utilizationPercentage: Math.round(((currentLoad + taskLoad) / maxCapacity) * 100),
      status: 'BUSY',
    });
  });
}

export async function fsReviewClaimedTask(
  taskId: string,
  approved: boolean,
  revisionNotes?: string
): Promise<void> {
  const db = getFirebaseDb();
  const taskRef = doc(db, 'claimable_tasks', taskId);
  const settingsRef = doc(db, 'system_settings', 'main');

  await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Tugas tidak ditemukan.');
    }
    const taskData = taskDoc.data();
    if (taskData.status !== 'WAITING_REVIEW') {
      throw new Error('Tugas tidak sedang menunggu review.');
    }

    const translatorId = taskData.claimedById;
    if (!translatorId) {
      throw new Error('Tugas tidak memiliki penerjemah terasosiasi.');
    }

    const translatorRef = doc(db, 'translator_profiles', translatorId);
    const translatorDoc = await transaction.get(translatorRef);
    if (!translatorDoc.exists()) {
      throw new Error('Profil penerjemah tidak ditemukan.');
    }
    const translatorData = translatorDoc.data();

    const nowStr = new Date().toISOString();

    if (approved) {
      // 1. Get points configuration
      const settingsDoc = await transaction.get(settingsRef);
      const pointRules = settingsDoc.exists() ? settingsDoc.data()?.pointRules : null;
      const speedBonusPoints = pointRules?.speedBonusPoints ?? 5;

      // 2. Check Speed Bonus eligibility
      const workSecs = taskData.effectiveWorkSeconds || 0;
      const estSecs = (taskData.estimatedMinutes || 60) * 60;
      const speedBonusEligible = workSecs > 0 && workSecs <= estSecs;
      const speedBonus = speedBonusEligible ? speedBonusPoints : 0;

      const basePoints = taskData.rewardPoints || 0;
      const totalPointsEarned = basePoints + speedBonus;

      const currentPoints = translatorData.points || 0;
      const newPoints = currentPoints + totalPointsEarned;
      const newLevel = Math.floor(newPoints / 100) + 1;
      const newCompletedCount = (translatorData.completedJobsCount || 0) + 1;

      // 3. Decrement workload load points
      const taskPages = taskData.pageCount || 1;
      const maxCapacity = translatorData.maxCapacityPoints || 20;
      const newLoad = Math.max(0, (translatorData.currentLoadPoints || 0) - taskPages);

      // Update translator profile
      transaction.update(translatorRef, {
        points: newPoints,
        level: newLevel,
        completedJobsCount: newCompletedCount,
        currentLoadPoints: newLoad,
        remainingCapacityPoints: maxCapacity - newLoad,
        utilizationPercentage: Math.round((newLoad / maxCapacity) * 100),
        status: 'FREE',
      });

      // Update Task status
      transaction.update(taskRef, {
        status: 'COMPLETED',
        completedAt: nowStr,
      });

      // Create reward point history - BASE
      const baseHistoryRef = doc(collection(db, 'reward_point_history'));
      transaction.set(baseHistoryRef, {
        id: baseHistoryRef.id,
        translatorId,
        taskId,
        taskTitle: taskData.title,
        points: basePoints,
        type: 'BASE',
        timestamp: serverTimestamp(),
      });

      // Create reward point history - SPEED_BONUS (if eligible)
      if (speedBonus > 0) {
        const speedHistoryRef = doc(collection(db, 'reward_point_history'));
        transaction.set(speedHistoryRef, {
          id: speedHistoryRef.id,
          translatorId,
          taskId,
          taskTitle: taskData.title,
          points: speedBonus,
          type: 'SPEED_BONUS',
          timestamp: serverTimestamp(),
        });
      }

      // Add Notification
      const notifRef = doc(collection(db, 'notifications'));
      transaction.set(notifRef, {
        id: notifRef.id,
        userId: translatorId,
        title: 'Task Disetujui! Poin Diterima',
        message: `Task "${taskData.title}" disetujui! Anda mendapatkan ${basePoints} Poin Utama ${speedBonus > 0 ? `+ ${speedBonus} Poin Bonus Cepat` : ''}.`,
        type: 'SUCCESS',
        createdAt: nowStr,
        read: false,
      });

    } else {
      // Reject / Request Revision
      transaction.update(taskRef, {
        status: 'REVISION',
        revisionNotes: revisionNotes || '',
      });

      // Add Notification
      const notifRef = doc(collection(db, 'notifications'));
      transaction.set(notifRef, {
        id: notifRef.id,
        userId: translatorId,
        title: 'Revisi Diperlukan',
        message: `Task "${taskData.title}" memerlukan revisi. Catatan: ${revisionNotes || '-'}`,
        type: 'ALERT',
        createdAt: nowStr,
        read: false,
      });
    }
  });
}

export async function fsCreateClaimableTask(task: Omit<ClaimableTask, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, 'claimable_tasks'), {
    ...task,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function fsUpdateClaimableTask(id: string, updates: Partial<ClaimableTask>): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'claimable_tasks', id), updates);
}

export async function fsAddRewardPointHistory(history: Omit<RewardPointHistory, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, 'reward_point_history'), {
    ...history,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export function listenClaimableTasks(
  isAdmin: boolean,
  translatorId: string | undefined,
  callback: (tasks: ClaimableTask[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  let q;
  if (isAdmin) {
    q = query(collection(db, 'claimable_tasks'), orderBy('createdAt', 'desc'), limit(50));
  } else {
    if (translatorId) {
      q = query(
        collection(db, 'claimable_tasks'),
        or(
          where('status', '==', 'AVAILABLE'),
          where('claimedById', '==', translatorId)
        ),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, 'claimable_tasks'),
        where('status', '==', 'AVAILABLE'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }
  }
  return onSnapshot(q, (snapshot) => {
    const tasks: ClaimableTask[] = [];
    snapshot.forEach((doc) => {
      tasks.push(mapClaimableTask(doc.id, doc.data()));
    });
    callback(tasks);
  });
}

export function listenRewardPointHistory(callback: (history: RewardPointHistory[]) => void): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'reward_point_history'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const history: RewardPointHistory[] = [];
    snapshot.forEach((doc) => {
      history.push(mapRewardPointHistory(doc.id, doc.data()));
    });
    callback(history);
  });
}
