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

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
  console.error('\nTips Perbaikan untuk Menjalankan Script Database Seeding:');
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

// ─── Data Seed ───────────────────────────────────────────────────────────────

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
