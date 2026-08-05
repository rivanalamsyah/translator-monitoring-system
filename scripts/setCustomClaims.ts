/**
 * Firebase Auth Set Custom User Claims Script
 * TMS - Sistem Monitoring Penerjemah by Master Translate
 *
 * Jalankan script ini untuk menyetel role dan translatorProfileId pada Firebase Authentication user:
 *   npx tsx scripts/setCustomClaims.ts <email> <SUPER_ADMIN|TRANSLATOR> [translatorProfileId]
 *
 * Contoh:
 *   npx tsx scripts/setCustomClaims.ts admin@translator.id SUPER_ADMIN
 *   npx tsx scripts/setCustomClaims.ts ahmad.rizky@translator.id TRANSLATOR tr-1
 */

import * as admin from 'firebase-admin';
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

// Inisialisasi Firebase Admin
admin.initializeApp({
  projectId,
});

async function main() {
  const args = process.argv.slice(2);
  const [email, role, translatorProfileId] = args;

  if (!email || !role) {
    console.log('❌ Argumen tidak valid!');
    console.log('   Penggunaan: npx tsx scripts/setCustomClaims.ts <email> <SUPER_ADMIN|TRANSLATOR> [translatorProfileId]');
    process.exit(1);
  }

  if (role !== 'SUPER_ADMIN' && role !== 'TRANSLATOR') {
    console.error('❌ Role harus berupa SUPER_ADMIN atau TRANSLATOR.');
    process.exit(1);
  }

  if (role === 'TRANSLATOR' && !translatorProfileId) {
    console.error('❌ Role TRANSLATOR membutuhkan translatorProfileId (misal: tr-1).');
    process.exit(1);
  }

  console.log(`🔍 Mencari user dengan email: ${email}...`);
  
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    console.log(`✅ User ditemukan. UID: ${uid}`);

    const claims: Record<string, any> = { role };
    if (translatorProfileId) {
      claims.translatorProfileId = translatorProfileId;
    }

    console.log(`⚙️  Menyetel custom claims:`, claims);
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`🎉 Berhasil menyetel custom claims untuk user ${email}!`);
    
    // Verifikasi claims terbaru
    const updatedUser = await admin.auth().getUser(uid);
    console.log(`📝 Claims saat ini:`, updatedUser.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
    process.exit(1);
  }
}

main();
