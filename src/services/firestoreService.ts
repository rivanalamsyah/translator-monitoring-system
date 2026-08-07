/**
 * Firestore Service — Real-time Listeners & CRUD Operations
 *
 * Semua data operasi Firestore dipusatkan di sini.
 * Koleksi Firestore sesuai spesifikasi:
 *   - /users               → Profil Pengguna & Penerjemah (filtered by role)
 *   - /tasks               → Seluruh pekerjaan/tugas (Task Pool)
 *   - /taskTimers          → Catatan waktu kerja (TimerLog)
 *   - /taskHistory         → Audit trail aktivitas tugas (ActivityLogItem)
 *   - /languages           → Daftar bahasa & pengali poin
 *   - /documentTypes       → Daftar jenis dokumen
 *   - /notifications       → Notifikasi sistem
 *   - /settings            → Konfigurasi sistem
 *   - /reward_point_history → Riwayat distribusi poin
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
  Task,
  ActivityLogItem,
  SystemNotification,
  SystemSettings,
  TimerLog,
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
    avatar: data.avatarUrl || data.avatar || '',
    languages: data.languages || [],
    maxCapacityPoints: data.maxCapacityPoints || 20,
    currentLoadPoints: data.currentLoadPoints || 0,
    remainingCapacityPoints: data.remainingCapacityPoints || 20,
    utilizationPercentage: data.utilizationPercentage || 0,
    status: data.status || 'FREE',
    activeTaskId: data.activeTaskId || data.activeAssignmentId,
    activeAssignmentId: data.activeTaskId || data.activeAssignmentId,
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

function mapTask(id: string, data: DocumentData): Task {
  return {
    id,
    code: data.code || '',
    title: data.title || '',
    clientName: data.clientName || '',
    documentType: data.documentType || 'General',
    pageCount: data.pageCount || 1,
    languageFrom: data.languageFrom || '',
    languageTo: data.languageTo || '',
    pointMultiplier: data.pointMultiplier || 1.0,
    calculatedPoints: data.calculatedPoints || data.rewardPoints || 0,
    rewardPoints: data.rewardPoints || data.calculatedPoints || 0,
    translatorId: data.translatorId || data.claimedById,
    translatorName: data.translatorName || data.claimedByName,
    status: data.status || 'DRAFT',
    priority: data.priority || 'MEDIUM',
    createdAt: toISO(data.createdAt),
    claimedAt: data.claimedAt ? toISO(data.claimedAt) : undefined,
    assignedAt: data.claimedAt ? toISO(data.claimedAt) : undefined,
    deadlineAt: toISO(data.deadlineAt),
    startedAt: data.startedAt ? toISO(data.startedAt) : undefined,
    pausedAt: data.pausedAt ? toISO(data.pausedAt) : undefined,
    submittedAt: data.submittedAt ? toISO(data.submittedAt) : undefined,
    completedAt: data.completedAt ? toISO(data.completedAt) : undefined,
    estimatedMinutes: data.estimatedMinutes || 60,
    totalWorkingSeconds: data.totalWorkingSeconds || 0,
    totalIdleSeconds: data.totalIdleSeconds || 0,
    pauseCount: data.pauseCount || 0,
    totalPauseDuration: data.totalPauseDuration || 0,
    effectiveWorkSeconds: data.effectiveWorkSeconds || 0,
    sourceFileUrl: data.sourceFileUrl,
    sourceFileName: data.sourceFileName,
    resultFileUrl: data.resultFileUrl,
    resultFileName: data.resultFileName,
    submissionNotes: data.submissionNotes,
    revisionNotes: data.revisionNotes,
    createdBy: data.createdBy || 'Admin',
    difficulty: data.difficulty || 'MEDIUM',
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

// ─── Subscriptions (Real-time Listeners) ────────────────────────────────────

export function subscribeTranslators(
  callback: (data: TranslatorProfile[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  // Query translator_profiles directly so both Admin and Translators can read it
  const q = query(
    collection(db, 'translator_profiles'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapTranslator(d.id, d.data())));
  });
}

export function subscribeTasks(
  translatorId: string | undefined,
  callback: (data: Task[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const constraints = translatorId
    ? [where('translatorId', '==', translatorId), orderBy('createdAt', 'desc'), limit(100)]
    : [orderBy('createdAt', 'desc'), limit(100)];
  const q = query(collection(db, 'tasks'), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapTask(d.id, d.data())));
  });
}

// Backward compatibility alias
export function subscribeAssignments(
  translatorId: string | undefined,
  callback: (data: Task[]) => void
): Unsubscribe {
  return subscribeTasks(translatorId, callback);
}

export function subscribeActivityLogs(
  callback: (data: ActivityLogItem[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'taskHistory'), orderBy('timestamp', 'desc'), limit(50));
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
  const q = query(collection(db, 'taskTimers'), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        taskId: d.data().taskId || d.data().assignmentId || '',
        assignmentId: d.data().taskId || d.data().assignmentId || '',
        ...d.data(),
        startTime: toISO(d.data().startTime),
        endTime: d.data().endTime ? toISO(d.data().endTime) : undefined,
      } as TimerLog))
    );
  });
}

// ─── Tasks CRUD ─────────────────────────────────────────────────────────────

export async function fsCreateTask(data: Omit<Task, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fsUpdateTask(id: string, data: Partial<Task>): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'tasks', id), data as DocumentData);
}

export async function fsDeleteTask(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'tasks', id));
}

// Backward compatibility wrappers
export async function fsCreateAssignment(data: Omit<Task, 'id'>) { return fsCreateTask(data); }
export async function fsUpdateAssignment(id: string, data: Partial<Task>) { return fsUpdateTask(id, data); }
export async function fsDeleteAssignment(id: string) { return fsDeleteTask(id); }
export async function fsCreateClaimableTask(data: Omit<Task, 'id'>) { return fsCreateTask(data); }
export async function fsUpdateClaimableTask(id: string, data: Partial<Task>) { return fsUpdateTask(id, data); }
export async function fsDeleteClaimableTask(id: string) { return fsDeleteTask(id); }

// ─── Translators (Users with role PENERJEMAH) CRUD ────────────────────────────

export async function fsAddTranslator(data: Omit<TranslatorProfile, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const { avatar, ...rest } = data;
  const ref = await addDoc(collection(db, 'users'), {
    ...rest,
    role: 'PENERJEMAH',
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
  
  // Update translator_profiles
  await updateDoc(doc(db, 'translator_profiles', id), updateData);
  
  // Sync name & email to users
  const userUpdate: DocumentData = {};
  if (data.name !== undefined) userUpdate.name = data.name;
  if (data.email !== undefined) userUpdate.email = data.email;
  if (Object.keys(userUpdate).length > 0) {
    await updateDoc(doc(db, 'users', id), userUpdate);
  }
}

export async function fsDeleteTranslator(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'users', id));
  await deleteDoc(doc(db, 'translator_profiles', id));
}

// ─── Activity Logs (taskHistory) ─────────────────────────────────────────────

export async function fsAddActivityLog(data: Omit<ActivityLogItem, 'id' | 'timestamp'>): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, 'taskHistory'), {
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
  const ref = await addDoc(collection(db, 'taskTimers'), {
    ...data,
    startTime: serverTimestamp(),
  });
  return ref.id;
}

export async function fsUpdateTimerLog(id: string, data: Partial<TimerLog>): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, 'taskTimers', id), data as DocumentData);
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
  await updateDoc(doc(db, 'tasks', data.assignmentId), {
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

    // Write unified users collection
    await setDoc(doc(db, 'users', newUid), {
      id: newUid,
      userId: newUid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'PENERJEMAH',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    // Write translator_profiles collection
    await setDoc(doc(db, 'translator_profiles', newUid), {
      userId: newUid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: '',
      languages: data.languages,
      maxCapacityPoints: data.maxCapacityPoints,
      currentLoadPoints: 0,
      remainingCapacityPoints: data.maxCapacityPoints,
      utilizationPercentage: 0,
      status: 'FREE',
      completedJobsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      points: 0,
      level: 1,
      xp: 0,
      achievements: ['NEWBIE'],
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
  const taskRef = doc(db, 'tasks', taskId);
  const translatorRef = doc(db, 'translator_profiles', translatorId);

  await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Tugas tidak ditemukan.');
    }

    const taskData = taskDoc.data();
    if (taskData.status !== 'WAITING_CLAIM' && taskData.status !== 'AVAILABLE') {
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
      translatorId: translatorId,
      translatorName: translatorName,
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
      activeTaskId: taskId,
      activeAssignmentId: taskId,
    });
  });
}

export async function fsReviewClaimedTask(
  taskId: string,
  approved: boolean,
  revisionNotes?: string
): Promise<void> {
  const db = getFirebaseDb();
  const taskRef = doc(db, 'tasks', taskId);
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

    const translatorId = taskData.translatorId || taskData.claimedById;
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

      const basePoints = taskData.rewardPoints || taskData.calculatedPoints || 0;
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
        status: newLoad === 0 ? 'FREE' : 'BUSY',
        activeTaskId: '',
        activeAssignmentId: '',
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

      // Update translator status back to BUSY but remaining revision tasks can still be worked on
      transaction.update(translatorRef, {
        status: 'BUSY'
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

export function listenTasks(
  isAdmin: boolean,
  translatorId: string | undefined,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  let q;
  if (isAdmin) {
    q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(100));
  } else {
    if (translatorId) {
      q = query(
        collection(db, 'tasks'),
        or(
          where('status', '==', 'WAITING_CLAIM'),
          where('status', '==', 'AVAILABLE'),
          where('translatorId', '==', translatorId),
          where('claimedById', '==', translatorId)
        ),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    } else {
      q = query(
        collection(db, 'tasks'),
        or(
          where('status', '==', 'WAITING_CLAIM'),
          where('status', '==', 'AVAILABLE')
        ),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }
  }
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push(mapTask(doc.id, doc.data()));
    });
    callback(tasks);
  });
}

// Backward compatibility wrapper
export function listenClaimableTasks(
  isAdmin: boolean,
  translatorId: string | undefined,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  return listenTasks(isAdmin, translatorId, callback);
}

export function listenRewardPointHistory(
  translatorId: string | undefined,
  callback: (history: RewardPointHistory[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = translatorId
    ? query(
        collection(db, 'reward_point_history'),
        where('translatorId', '==', translatorId),
        orderBy('timestamp', 'desc'),
        limit(50)
      )
    : query(
        collection(db, 'reward_point_history'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
  return onSnapshot(q, (snapshot) => {
    const history: RewardPointHistory[] = [];
    snapshot.forEach((doc) => {
      history.push(mapRewardPointHistory(doc.id, doc.data()));
    });
    callback(history);
  });
}
