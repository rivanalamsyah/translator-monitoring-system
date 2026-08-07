/**
 * Firestore & Auth Seeder Script
 * Sistem Monitoring Penerjemah by Master Translate
 *
 * Jalankan sekali untuk seed data awal ke Firestore & Auth:
 *   npx tsx scripts/seedFirestore.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

// Cek ketersediaan kredensial
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
const auth = getAuth();

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

const USERS_TO_SEED = [
  {
    name: 'Administrator',
    email: 'admin@example.com',
    password: 'Admin@2026Secure!',
    role: 'super_admin',
    customClaimRole: 'ADMIN',
  },
  {
    name: 'Andi Pratama',
    email: 'andi.pratama@example.com',
    password: 'Translator@2026!',
    role: 'translator',
    customClaimRole: 'PENERJEMAH',
  },
  {
    name: 'Putri Maharani',
    email: 'putri.maharani@example.co',
    password: 'Translator@2026!',
    role: 'translator',
    customClaimRole: 'PENERJEMAH',
  },
  {
    name: 'Rina Lestari',
    email: 'rina.lestari@example.com',
    password: 'Translator@2026!',
    role: 'translator',
    customClaimRole: 'PENERJEMAH',
  },
  {
    name: 'Fajar Nugroho',
    email: 'fajar.nugroho@example.com',
    password: 'Translator@2026!',
    role: 'translator',
    customClaimRole: 'PENERJEMAH',
  },
  {
    name: 'Dewi Anggraini',
    email: 'dewi.anggraini@example.com',
    password: 'Translator@2026!',
    role: 'translator',
    customClaimRole: 'PENERJEMAH',
  },
];

async function seedDatabase() {
  // Force run the seeder to ensure all accounts, custom claims, and profiles are synced.
  console.log('ℹ️  Bypassed idempotency check to force synchronization.');

  console.log('⚙️  Seeding system_settings...');
  await db.collection('system_settings').doc('main').set(SYSTEM_SETTINGS);
  console.log('  ✅ System settings di-seed.');

  for (const userData of USERS_TO_SEED) {
    console.log(`👤 Mendaftarkan user: ${userData.name} (${userData.email})...`);
    let userRecord;
    try {
      // Check if user already exists in Auth
      userRecord = await auth.getUserByEmail(userData.email);
      console.log(`  ℹ️  User Auth sudah terdaftar (UID: ${userRecord.uid}).`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Create auth user (hashes password in Firebase Auth)
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
        });
        console.log(`  ✅ User Auth berhasil dibuat (UID: ${userRecord.uid}).`);
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;

    // Set custom claim roles matching firestore rules needs (ADMIN/PENERJEMAH)
    const claims: Record<string, any> = { role: userData.customClaimRole };
    if (userData.role === 'translator') {
      claims.translatorProfileId = uid;
    }
    await auth.setCustomUserClaims(uid, claims);
    console.log(`  ✅ Custom claims disetel: role = ${userData.customClaimRole}`);

    // Create user document in Firestore (uses exact RBAC roles: super_admin / translator)
    await db.collection('users').doc(uid).set({
      uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    console.log(`  ✅ User document disimpan di Firestore (role: ${userData.role}).`);

    // For translators, also provision /translator_profiles document
    if (userData.role === 'translator') {
      await db.collection('translator_profiles').doc(uid).set({
        userId: uid,
        name: userData.name,
        email: userData.email,
        phone: '+62 812-0000-0000',
        avatar: '',
        languages: ['EN-ID', 'ID-EN'],
        maxCapacityPoints: 20,
        currentLoadPoints: 0,
        remainingCapacityPoints: 20,
        utilizationPercentage: 0,
        status: 'FREE',
        completedJobsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      });
      console.log('  ✅ Translator profile document disimpan di Firestore (status: FREE).');
    }
  }
}

async function main() {
  console.log('🚀 Memulai Firestore & Auth Seeder...');
  console.log('Project ID:', projectId);
  console.log('══════════════════════════════════════════════');

  try {
    await seedDatabase();
    console.log('══════════════════════════════════════════════');
    console.log('🎉 Seeder selesai dengan sukses!');
  } catch (err) {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
