/**
 * Clear Database Script
 * Sistem Monitoring Penerjemah by Master Translate
 *
 * Jalankan script ini untuk menghapus seluruh data operasional, audit logs,
 * dan seluruh user di Firebase Authentication, kemudian melakukan inisialisasi ulang
 * data konfigurasi wajib (system_settings).
 *
 * Jalankan dengan:
 *   npx tsx scripts/clearDatabase.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Query } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';

// Load env dari .env.local jika ada, fallback ke .env
const envFile = path.join(process.cwd(), '.env.local');
const fallbackEnvFile = path.join(process.cwd(), '.env');
const targetEnv = fs.existsSync(envFile) ? envFile : fallbackEnvFile;

if (fs.existsSync(targetEnv)) {
  const lines = fs.readFileSync(targetEnv, 'utf-8').split('\n');
  lines.forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('❌ VITE_FIREBASE_PROJECT_ID tidak ditemukan di environment (.env atau .env.local).');
  process.exit(1);
}

// Cek ketersediaan kredensial sebelum inisialisasi untuk menghindari crash asinkron
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
const hasServiceAccount = fs.existsSync(serviceAccountPath);
const hasGoogleCredsEnv = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (!hasServiceAccount && !hasGoogleCredsEnv && !hasEmulator) {
  console.error('\n❌ Kredensial Firebase Admin SDK tidak ditemukan!');
  console.error('\nTips Perbaikan untuk Menjalankan Script Pembersihan Database:');
  console.error('1. Unduh file Kunci Akun Layanan (Service Account Key JSON) dari Firebase Console > Project Settings > Service Accounts.');
  console.error('2. Simpan file tersebut di folder root proyek ini dengan nama "service-account.json".');
  console.error('3. Pastikan "service-account.json" sudah terdaftar di .gitignore agar tidak terunggah ke repositori.');
  console.error('4. Jalankan kembali script ini.');
  process.exit(1);
}

// Inisialisasi Firebase Admin
if (hasServiceAccount) {
  console.log('🔑 Menggunakan service-account.json untuk autentikasi...');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
} else {
  console.log('ℹ️  Menggunakan Application Default Credentials / Emulator...');
  initializeApp({
    projectId,
  });
}

const db = getFirestore();
const auth = getAuth();

const SYSTEM_SETTINGS = {
  autoAssignEnabled: true,
  defaultCapacityPoints: 20,
  overdueAlertThresholdMinutes: 60,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  languageRules: [
    { languageCode: 'EN-ID', languageName: 'Inggris → Indonesia', pointsPerPage: 1.0 },
    { languageCode: 'ID-EN', languageName: 'Indonesia → Inggris', pointsPerPage: 1.0 },
    { languageCode: 'AR-ID', languageName: 'Arab → Indonesia', pointsPerPage: 1.5 },
    { languageCode: 'JP-ID', languageName: 'Jepang → Indonesia', pointsPerPage: 2.0 },
    { languageCode: 'ZH-ID', languageName: 'Mandarin → Indonesia', pointsPerPage: 2.0 },
    { languageCode: 'DE-ID', languageName: 'Jerman → Indonesia', pointsPerPage: 1.5 },
    { languageCode: 'RU-ID', languageName: 'Rusia → Indonesia', pointsPerPage: 1.8 },
    { languageCode: 'FR-ID', languageName: 'Prancis → Indonesia', pointsPerPage: 1.5 },
  ],
};

const COLLECTIONS_TO_CLEAR = [
  'translator_profiles',
  'assignments',
  'activity_logs',
  'notifications',
  'timer_logs',
  'audit_logs',
  'users',
  'system_settings',
];

async function deleteCollection(collectionPath: string, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query: Query, resolve: () => void, reject: (err: any) => void) {
  try {
    const snapshot = await query.get();
    const batchSize = snapshot.size;
    if (batchSize === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function deleteAllAuthUsers() {
  console.log('👤 Menghapus seluruh user dari Firebase Authentication...');
  let nextPageToken: string | undefined = undefined;
  let totalDeleted = 0;

  try {
    do {
      const listUsersResult = await auth.listUsers(100, nextPageToken);
      const uids = listUsersResult.users.map((user) => user.uid);

      if (uids.length > 0) {
        const deleteUsersResult = await auth.deleteUsers(uids);
        totalDeleted += deleteUsersResult.successCount;
        console.log(`  - Berhasil menghapus ${deleteUsersResult.successCount} user.`);
        if (deleteUsersResult.failureCount > 0) {
          console.error(`  - Gagal menghapus ${deleteUsersResult.failureCount} user.`);
        }
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`✅ Selesai menghapus total ${totalDeleted} user.`);
  } catch (error) {
    console.error('❌ Gagal menghapus user Auth:', error);
  }
}

async function main() {
  console.log('🚀 Memulai Pembersihan Database (Reset ke Fresh Installation)...');
  console.log('Project ID:', projectId);
  console.log('═══════════════════════════════════════════════════════════');

  // 1. Hapus seluruh data Firestore
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    console.log(`🗑️  Membersihkan koleksi: ${collectionName}...`);
    try {
      await deleteCollection(collectionName);
      console.log(`  ✅ Koleksi ${collectionName} berhasil dibersihkan.`);
    } catch (err) {
      console.error(`  ❌ Gagal membersihkan koleksi ${collectionName}:`, err);
    }
  }

  // 2. Inisialisasi ulang system_settings
  console.log('⚙️  Melakukan inisialisasi ulang system_settings/main...');
  try {
    await db.collection('system_settings').doc('main').set(SYSTEM_SETTINGS);
    console.log('  ✅ Inisialisasi system_settings berhasil.');
  } catch (err) {
    console.error('  ❌ Gagal menginisialisasi system_settings:', err);
  }

  // 3. Hapus seluruh user di Firebase Auth
  await deleteAllAuthUsers();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 Database dan Auth berhasil direset ke kondisi bersih (Fresh Installation)!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan fatal:', err);
  process.exit(1);
});
