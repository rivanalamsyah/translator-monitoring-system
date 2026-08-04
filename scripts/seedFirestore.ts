/**
 * Firestore Seeder Script
 * Sistem Monitoring Penerjemah by Master Translate
 *
 * Jalankan sekali untuk seed data awal ke Firestore:
 *   npx tsx scripts/seedFirestore.ts
 *
 * Prasyarat:
 * 1. File .env.local sudah dikonfigurasi dengan VITE_FIREBASE_* yang benar
 * 2. Firebase Admin SDK service account key tersedia (atau gunakan emulator)
 *
 * Catatan: Script ini menggunakan Firebase Admin SDK (server-side).
 * Install dulu: npm install firebase-admin --save-dev
 */

// ─── PERINGATAN: Jalankan hanya sekali! Data akan ditimpa jika sudah ada. ───

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Load env dari .env.local
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  lines.forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('❌ VITE_FIREBASE_PROJECT_ID tidak ditemukan di .env.local');
  process.exit(1);
}

// Inisialisasi dengan Application Default Credentials (gcloud auth login)
admin.initializeApp({
  projectId,
});

const db = admin.firestore();

// ─── Data Seed ───────────────────────────────────────────────────────────────

const TRANSLATORS = [
  {
    id: 'tr-1',
    userId: 'tr-1',
    name: 'Ahmad Rizky',
    email: 'ahmad.rizky@translator.id',
    phone: '+62 812-3456-7890',
    avatarUrl: '',
    languages: ['EN-ID', 'ID-EN'],
    maxCapacityPoints: 20,
    currentLoadPoints: 0,
    remainingCapacityPoints: 20,
    utilizationPercentage: 0,
    status: 'READY',
    completedJobsCount: 48,
    rating: 4.95,
  },
  {
    id: 'tr-2',
    userId: 'tr-2',
    name: 'Siti Rahma',
    email: 'siti.rahma@translator.id',
    phone: '+62 813-9876-5432',
    avatarUrl: '',
    languages: ['JP-ID', 'AR-ID', 'EN-ID'],
    maxCapacityPoints: 18,
    currentLoadPoints: 0,
    remainingCapacityPoints: 18,
    utilizationPercentage: 0,
    status: 'READY',
    completedJobsCount: 62,
    rating: 4.90,
  },
  {
    id: 'tr-3',
    userId: 'tr-3',
    name: 'Budi Santoso',
    email: 'budi.santoso@translator.id',
    phone: '+62 811-2233-4455',
    avatarUrl: '',
    languages: ['ZH-ID', 'EN-ID'],
    maxCapacityPoints: 25,
    currentLoadPoints: 0,
    remainingCapacityPoints: 25,
    utilizationPercentage: 0,
    status: 'READY',
    completedJobsCount: 35,
    rating: 4.85,
  },
  {
    id: 'tr-4',
    userId: 'tr-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@translator.id',
    phone: '+62 815-6677-8899',
    avatarUrl: '',
    languages: ['RU-ID', 'EN-ID'],
    maxCapacityPoints: 20,
    currentLoadPoints: 0,
    remainingCapacityPoints: 20,
    utilizationPercentage: 0,
    status: 'READY',
    completedJobsCount: 29,
    rating: 4.88,
  },
  {
    id: 'tr-5',
    userId: 'tr-5',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@translator.id',
    phone: '+62 817-1122-3344',
    avatarUrl: '',
    languages: ['DE-ID', 'FR-ID'],
    maxCapacityPoints: 15,
    currentLoadPoints: 0,
    remainingCapacityPoints: 15,
    utilizationPercentage: 0,
    status: 'READY',
    completedJobsCount: 41,
    rating: 4.78,
  },
  {
    id: 'tr-6',
    userId: 'tr-6',
    name: 'Kaito Tanaka',
    email: 'kaito.tanaka@translator.id',
    phone: '+62 818-4455-6677',
    avatarUrl: '',
    languages: ['JP-ID', 'EN-ID'],
    maxCapacityPoints: 20,
    currentLoadPoints: 0,
    remainingCapacityPoints: 20,
    utilizationPercentage: 0,
    status: 'ON_LEAVE',
    completedJobsCount: 53,
    rating: 4.92,
  },
];

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

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedTranslators() {
  console.log('📋 Seeding translator_profiles...');
  const batch = db.batch();
  for (const t of TRANSLATORS) {
    const { id, ...data } = t;
    const ref = db.collection('translator_profiles').doc(id);
    batch.set(ref, { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  await batch.commit();
  console.log(`  ✅ ${TRANSLATORS.length} penerjemah di-seed.`);
}

async function seedSystemSettings() {
  console.log('⚙️  Seeding system_settings...');
  await db.collection('system_settings').doc('main').set(SYSTEM_SETTINGS);
  console.log('  ✅ System settings di-seed.');
}

async function seedAdminUser() {
  console.log('👤 Catatan: Buat user admin di Firebase Console > Authentication > Add User');
  console.log('   Email: admin@translator.id | Role: SUPER_ADMIN');
  console.log('   Setelah dibuat, tambahkan custom claim di Cloud Functions atau Firebase Admin:');
  console.log('   admin.auth().setCustomUserClaims(uid, { role: "SUPER_ADMIN" })');
}

async function main() {
  console.log('🚀 Memulai Firestore Seed untuk project:', projectId);
  console.log('══════════════════════════════════════════════');

  await seedTranslators();
  await seedSystemSettings();
  await seedAdminUser();

  console.log('══════════════════════════════════════════════');
  console.log('✅ Seed selesai! Data siap di Firestore.');
  console.log('🔑 Langkah selanjutnya:');
  console.log('   1. Buat user di Firebase Authentication');
  console.log('   2. Set VITE_USE_FIREBASE=true di .env.local');
  console.log('   3. Restart dev server: npm run dev');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
