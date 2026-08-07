/**
 * Firestore & Auth Seeder Script
 * Sistem Monitoring Penerjemah by Master Translate
 *
 * Jalankan untuk seed data awal komprehensif ke Firestore & Auth:
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
  pointRules: {
    basePointsPerPage: 10,
    difficultyMultipliers: { EASY: 1.0, MEDIUM: 1.2, HARD: 1.5 },
    speedBonusPoints: 15,
    qualityBonusPoints: 20,
    revisionPenaltyPoints: 5,
    latePenaltyPoints: 10,
  }
};

// 1 Admin + 15 Translators
const USERS_TO_SEED = [
  {
    name: 'Administrator',
    email: 'admin@example.com',
    password: 'Admin@2026Secure!',
    role: 'super_admin',
    customClaimRole: 'ADMIN',
  },
  // 15 Translators
  { name: 'Andi Pratama', email: 'andi.pratama@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 450, level: 3, completedJobs: 12, languages: ['EN-ID', 'ID-EN'], status: 'FREE' },
  { name: 'Putri Maharani', email: 'putri.maharani@example.co', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 820, level: 5, completedJobs: 18, languages: ['EN-ID', 'ZH-ID'], status: 'FREE' },
  { name: 'Rina Lestari', email: 'rina.lestari@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 1150, level: 7, completedJobs: 24, languages: ['EN-ID', 'DE-ID'], status: 'FREE' },
  { name: 'Fajar Nugroho', email: 'fajar.nugroho@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 300, level: 2, completedJobs: 8, languages: ['EN-ID', 'AR-ID'], status: 'FREE' },
  { name: 'Dewi Anggraini', email: 'dewi.anggraini@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 180, level: 2, completedJobs: 5, languages: ['EN-ID', 'FR-ID'], status: 'FREE' },
  { name: 'Hendra Wijaya', email: 'hendra.wijaya@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 650, level: 4, completedJobs: 15, languages: ['EN-ID', 'JP-ID'], status: 'BUSY' },
  { name: 'Rian Hidayat', email: 'rian.hidayat@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 250, level: 2, completedJobs: 7, languages: ['EN-ID', 'ID-EN'], status: 'BREAK' },
  { name: 'Siti Aminah', email: 'siti.aminah@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 510, level: 3, completedJobs: 13, languages: ['EN-ID', 'JP-ID', 'ZH-ID'], status: 'FREE' },
  { name: 'Budi Santoso', email: 'budi.santoso@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 920, level: 6, completedJobs: 20, languages: ['EN-ID', 'RU-ID'], status: 'FREE' },
  { name: 'Eka Saputra', email: 'eka.saputra@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 120, level: 1, completedJobs: 3, languages: ['EN-ID', 'ID-EN'], status: 'FREE' },
  { name: 'Fitriani Siregar', email: 'fitriani.siregar@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 70, level: 1, completedJobs: 2, languages: ['EN-ID', 'AR-ID'], status: 'FREE' },
  { name: 'Adi Kurniawan', email: 'adi.kurniawan@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 340, level: 2, completedJobs: 9, languages: ['EN-ID', 'DE-ID'], status: 'FREE' },
  { name: 'Mega Utami', email: 'mega.utami@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 880, level: 5, completedJobs: 19, languages: ['EN-ID', 'JP-ID'], status: 'FREE' },
  { name: 'Gede Putra', email: 'gede.putra@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 420, level: 3, completedJobs: 11, languages: ['EN-ID', 'RU-ID'], status: 'FREE' },
  { name: 'Yulia Fitri', email: 'yulia.fitri@example.com', password: 'Translator@2026!', role: 'translator', customClaimRole: 'PENERJEMAH', points: 210, level: 2, completedJobs: 6, languages: ['EN-ID', 'FR-ID'], status: 'FREE' },
];

async function seedDatabase() {
  console.log('ℹ️  Memulai pembersihan data lama untuk seeding ulang bersih...');

  // Hapus data lama di sub-collections tertentu jika diperlukan untuk konsistensi
  const collectionsToClean = ['users', 'translator_profiles', 'tasks', 'taskTimers', 'taskHistory', 'reward_point_history', 'system_settings'];
  for (const col of collectionsToClean) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  🗑️  Koleksi "${col}" dibersihkan.`);
  }

  console.log('⚙️  Seeding system_settings...');
  await db.collection('system_settings').doc('main').set(SYSTEM_SETTINGS);
  console.log('  ✅ System settings di-seed.');

  const createdUIDs: Record<string, string> = {};

  for (const userData of USERS_TO_SEED) {
    console.log(`👤 Mendaftarkan user: ${userData.name} (${userData.email})...`);
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(userData.email);
      console.log(`  ℹ️  User Auth sudah terdaftar (UID: ${userRecord.uid}).`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
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
    createdUIDs[userData.name] = uid;

    // Custom claims
    const claims: Record<string, any> = { role: userData.customClaimRole };
    if (userData.role === 'translator') {
      claims.translatorProfileId = uid;
    }
    await auth.setCustomUserClaims(uid, claims);
    console.log(`  ✅ Custom claims disetel: role = ${userData.customClaimRole}`);

    // Create user document
    await db.collection('users').doc(uid).set({
      uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // 30 hari lalu
    });

    // Create translator profiles
    if (userData.role === 'translator') {
      const maxCap = userData.maxCapacityPoints || 20;
      const curLoad = userData.status === 'BUSY' ? 12 : 0;
      const remCap = maxCap - curLoad;
      const util = Math.round((curLoad / maxCap) * 100);

      await db.collection('translator_profiles').doc(uid).set({
        userId: uid,
        name: userData.name,
        email: userData.email,
        phone: '+62 812-9988-7766',
        avatar: '',
        languages: userData.languages || ['EN-ID'],
        maxCapacityPoints: maxCap,
        currentLoadPoints: curLoad,
        remainingCapacityPoints: remCap,
        utilizationPercentage: util,
        status: userData.status || 'FREE',
        completedJobsCount: userData.completedJobs || 0,
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        points: userData.points || 0,
        level: userData.level || 1,
        xp: ((userData.points || 0) % 100),
        achievements: userData.points && userData.points > 500 ? ['CEPAT_AKURAT', 'PAHLAWAN_DEADLINE'] : ['NEWBIE'],
      });
      console.log(`  ✅ Translator profile document disimpan di Firestore (points: ${userData.points || 0}).`);

      // Seed reward point history untuk translator ini
      if (userData.points && userData.points > 0) {
        const historyRef = db.collection('reward_point_history').doc();
        await historyRef.set({
          translatorId: uid,
          taskId: 'task-completed-history',
          taskTitle: 'Arsip Dokumen Hukum Bisnis Internasional',
          points: userData.points,
          type: 'BASE',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        });
      }
    }
  }

  // ─── Seed Tasks (12 Tasks across lifecycle stages) ─────────────────────────
  console.log('⚙️  Seeding sample tasks...');

  const sampleTasks = [
    // 4 COMPLETED Tasks
    {
      code: 'TASK-2026-001',
      title: 'Perjanjian Kerahasiaan Non-Disclosure Agreement (NDA)',
      clientName: 'PT GoTo Gojek Tokopedia',
      documentType: 'Legal',
      pageCount: 8,
      languageFrom: 'EN-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.0,
      rewardPoints: 80,
      status: 'COMPLETED',
      priority: 'MEDIUM',
      translatorName: 'Andi Pratama',
      translatorId: createdUIDs['Andi Pratama'],
      sourceFileName: 'NDA_GOTO_Draft.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/nda-goto-source',
      resultFileName: 'NDA_GOTO_Draft_Terjemahan.pdf',
      resultFileUrl: 'https://drive.google.com/file/d/nda-goto-result',
      totalWorkingSeconds: 7200,
      effectiveWorkSeconds: 7200,
      totalIdleSeconds: 600,
      completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      code: 'TASK-2026-002',
      title: 'Laporan Keuangan Tahunan Q4 2025',
      clientName: 'PT Bank Central Asia Tbk',
      documentType: 'Finance',
      pageCount: 15,
      languageFrom: 'ID-EN',
      languageTo: 'Inggris',
      pointMultiplier: 1.2,
      rewardPoints: 180,
      status: 'COMPLETED',
      priority: 'HIGH',
      translatorName: 'Rina Lestari',
      translatorId: createdUIDs['Rina Lestari'],
      sourceFileName: 'Laporan_Keuangan_BCA_Q4.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/bca-finance-source',
      resultFileName: 'BCA_Annual_Report_Q4_EN.pdf',
      resultFileUrl: 'https://drive.google.com/file/d/bca-finance-result',
      totalWorkingSeconds: 15400,
      effectiveWorkSeconds: 14000,
      totalIdleSeconds: 1400,
      completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    },
    {
      code: 'TASK-2026-003',
      title: 'Manual Panduan Mesin Hidrolik Pabrik',
      clientName: 'Toyota Motor Manufacturing',
      documentType: 'Technical',
      pageCount: 20,
      languageFrom: 'JP-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 2.0,
      rewardPoints: 400,
      status: 'COMPLETED',
      priority: 'URGENT',
      translatorName: 'Putri Maharani',
      translatorId: createdUIDs['Putri Maharani'],
      sourceFileName: 'Hydraulic_Press_Manual_JP.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/toyota-manual-source',
      resultFileName: 'Panduan_Hidrolik_Toyota_ID.pdf',
      resultFileUrl: 'https://drive.google.com/file/d/toyota-manual-result',
      totalWorkingSeconds: 22000,
      effectiveWorkSeconds: 20000,
      totalIdleSeconds: 2000,
      completedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      code: 'TASK-2026-004',
      title: 'Perjanjian Ekstradisi Bilateral Indonesia - Jerman',
      clientName: 'Kementerian Luar Negeri RI',
      documentType: 'Legal',
      pageCount: 12,
      languageFrom: 'DE-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.5,
      rewardPoints: 180,
      status: 'COMPLETED',
      priority: 'HIGH',
      translatorName: 'Rina Lestari',
      translatorId: createdUIDs['Rina Lestari'],
      sourceFileName: 'Extradition_Treaty_DE_ID.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/kemlu-de-source',
      resultFileName: 'Perjanjian_Ekstradisi_DE_ID_Terjemahan.pdf',
      resultFileUrl: 'https://drive.google.com/file/d/kemlu-de-result',
      totalWorkingSeconds: 12000,
      effectiveWorkSeconds: 11000,
      totalIdleSeconds: 1000,
      completedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },

    // 3 WAITING_CLAIM (Available in Pool)
    {
      code: 'TASK-2026-005',
      title: 'Panduan Praktis Mitigasi Gempa dan Tsunami',
      clientName: 'BNPB Indonesia',
      documentType: 'General',
      pageCount: 10,
      languageFrom: 'EN-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.0,
      rewardPoints: 100,
      status: 'WAITING_CLAIM',
      priority: 'MEDIUM',
      sourceFileName: 'Disaster_Mitigation_Guide.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/bnpb-mitigation-source',
    },
    {
      code: 'TASK-2026-006',
      title: 'Kontrak Kerjasama Investasi Kilang Minyak',
      clientName: 'Pertamina Rosneft',
      documentType: 'Legal',
      pageCount: 25,
      languageFrom: 'RU-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.8,
      rewardPoints: 450,
      status: 'WAITING_CLAIM',
      priority: 'HIGH',
      sourceFileName: 'Oil_Refinery_Contract_RU.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/pertamina-ru-source',
    },
    {
      code: 'TASK-2026-007',
      title: 'Dokumentasi API Core Banking System',
      clientName: 'PT Bank Mandiri (Persero) Tbk',
      documentType: 'Technical',
      pageCount: 18,
      languageFrom: 'ID-EN',
      languageTo: 'Inggris',
      pointMultiplier: 1.0,
      rewardPoints: 180,
      status: 'WAITING_CLAIM',
      priority: 'MEDIUM',
      sourceFileName: 'API_Mandiri_CoreBanking_v2.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/mandiri-api-source',
    },

    // 2 WORKING (In Progress)
    {
      code: 'TASK-2026-008',
      title: 'Pendaftaran Hak Paten Baterai Solid-State',
      clientName: 'Samsung SDI Indonesia',
      documentType: 'Technical',
      pageCount: 12,
      languageFrom: 'EN-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.0,
      rewardPoints: 120,
      status: 'WORKING',
      priority: 'HIGH',
      translatorName: 'Hendra Wijaya',
      translatorId: createdUIDs['Hendra Wijaya'],
      claimedById: createdUIDs['Hendra Wijaya'],
      claimedByName: 'Hendra Wijaya',
      claimedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 jam lalu
      startedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      sourceFileName: 'SolidState_Battery_Patent.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/samsung-patent-source',
      totalWorkingSeconds: 7200,
      effectiveWorkSeconds: 7200,
    },
    {
      code: 'TASK-2026-009',
      title: 'Brosur Informasi Medis Vaksin Malaria',
      clientName: 'World Health Organization (WHO)',
      documentType: 'Medical',
      pageCount: 6,
      languageFrom: 'EN-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.0,
      rewardPoints: 60,
      status: 'WORKING',
      priority: 'MEDIUM',
      translatorName: 'Andi Pratama',
      translatorId: createdUIDs['Andi Pratama'],
      claimedById: createdUIDs['Andi Pratama'],
      claimedByName: 'Andi Pratama',
      claimedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 jam lalu
      startedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      sourceFileName: 'Malaria_Vaccine_Brochure_WHO.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/who-malaria-source',
      totalWorkingSeconds: 1200,
      effectiveWorkSeconds: 1200,
    },

    // 1 PAUSED
    {
      code: 'TASK-2026-010',
      title: 'Peraturan Pajak Transaksi Kripto Lintas Negara',
      clientName: 'Direktorat Jenderal Pajak RI',
      documentType: 'Financial',
      pageCount: 14,
      languageFrom: 'EN-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 1.0,
      rewardPoints: 140,
      status: 'PAUSED',
      priority: 'MEDIUM',
      translatorName: 'Rian Hidayat',
      translatorId: createdUIDs['Rian Hidayat'],
      claimedById: createdUIDs['Rian Hidayat'],
      claimedByName: 'Rian Hidayat',
      claimedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      pausedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // jeda 2 jam lalu
      sourceFileName: 'Crypto_Taxation_Bilateral_EN.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/djp-crypto-source',
      totalWorkingSeconds: 14400,
      effectiveWorkSeconds: 14400,
      totalIdleSeconds: 3600,
      pauseCount: 1,
    },

    // 1 WAITING_REVIEW (Submitted, waiting approval)
    {
      code: 'TASK-2026-011',
      title: 'Kurikulum Nasional Pendidikan Dasar V2',
      clientName: 'Kementerian Pendidikan & Kebudayaan',
      documentType: 'General',
      pageCount: 16,
      languageFrom: 'ID-EN',
      languageTo: 'Inggris',
      pointMultiplier: 1.0,
      rewardPoints: 160,
      status: 'WAITING_REVIEW',
      priority: 'HIGH',
      translatorName: 'Siti Aminah',
      translatorId: createdUIDs['Siti Aminah'],
      claimedById: createdUIDs['Siti Aminah'],
      claimedByName: 'Siti Aminah',
      claimedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      sourceFileName: 'Kurikulum_Merdeka_SD_Mandatory.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/kemendikbud-curriculum-source',
      resultFileName: 'Merdeka_Curriculum_Elementary_EN.pdf',
      resultFileUrl: 'https://drive.google.com/file/d/kemendikbud-curriculum-result',
      totalWorkingSeconds: 28800,
      effectiveWorkSeconds: 25000,
      totalIdleSeconds: 3800,
      submissionNotes: 'Saya telah menyelesaikan seluruh modul utama. Terjemahan istilah kurikulum merdeka mengikuti standar Depdikbud.',
    },

    // 1 REVISION
    {
      code: 'TASK-2026-012',
      title: 'Katalog Produk Kosmetik Ekspor Kelapa Sawit',
      clientName: 'PT Unilever Indonesia Tbk',
      documentType: 'Marketing',
      pageCount: 7,
      languageFrom: 'JP-ID',
      languageTo: 'Indonesia',
      pointMultiplier: 2.0,
      rewardPoints: 140,
      status: 'REVISION',
      priority: 'MEDIUM',
      translatorName: 'Mega Utami',
      translatorId: createdUIDs['Mega Utami'],
      claimedById: createdUIDs['Mega Utami'],
      claimedByName: 'Mega Utami',
      claimedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      sourceFileName: 'Cosmetics_PalmOil_Katalog_JP.pdf',
      sourceFileUrl: 'https://drive.google.com/file/d/unilever-cosmetics-source',
      resultFileName: 'Katalog_Kosmetik_Unilever_ID.pdf',
      resultFileUrl: 'https://drive.google.com/file/d/unilever-cosmetics-result',
      totalWorkingSeconds: 10800,
      effectiveWorkSeconds: 10800,
      revisionNotes: 'Tolong perbaiki penerjemahan pada istilah kimia di halaman 3 & 4 agar menggunakan penulisan baku SNI.',
    },
  ];

  for (const t of sampleTasks) {
    const docRef = db.collection('tasks').doc();
    const taskId = docRef.id;

    await docRef.set({
      ...t,
      id: taskId,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    });
    console.log(`  📁 Task ${t.code} di-seed (Status: ${t.status}).`);

    // Seed task timers untuk task pengerjaan aktif
    if (t.status === 'WORKING') {
      // 1. Completed work log
      const workLogRef1 = db.collection('taskTimers').doc();
      await workLogRef1.set({
        taskId,
        translatorId: t.translatorId,
        type: 'WORK',
        startTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        durationSeconds: 7200,
      });

      // 2. Active work log (ongoing)
      const workLogRef2 = db.collection('taskTimers').doc();
      await workLogRef2.set({
        taskId,
        translatorId: t.translatorId,
        type: 'WORK',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 menit lalu
        durationSeconds: 0,
      });
    }

    if (t.status === 'PAUSED') {
      // 1. Completed work log
      const workLogRef = db.collection('taskTimers').doc();
      await workLogRef.set({
        taskId,
        translatorId: t.translatorId,
        type: 'WORK',
        startTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        durationSeconds: 14400,
      });

      // 2. Active pause log (ongoing)
      const pauseLogRef = db.collection('taskTimers').doc();
      await pauseLogRef.set({
        taskId,
        translatorId: t.translatorId,
        type: 'PAUSE',
        startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        durationSeconds: 0,
        reason: 'Jeda istirahat makan siang',
      });
    }

    // Seed task activity logs
    if (t.translatorId) {
      const historyRef = db.collection('taskHistory').doc();
      await historyRef.set({
        timestamp: t.claimedAt || new Date().toISOString(),
        userId: t.translatorId,
        userName: t.translatorName,
        userRole: 'PENERJEMAH',
        action: 'Mengklaim Task',
        details: `Mengklaim task pool ${t.code} secara sukses.`,
        taskId,
        taskTitle: t.title,
        type: 'ASSIGNMENT',
      });
    }
  }

  console.log('══════════════════════════════════════════════');
}

async function main() {
  console.log('🚀 Memulai Pembersihan & Seeding Database Komprehensif...');
  console.log('Project ID:', projectId);
  console.log('══════════════════════════════════════════════');

  try {
    await seedDatabase();
    console.log('🎉 Seeder komprehensif selesai dengan sukses!');
  } catch (err) {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
