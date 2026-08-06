/**
 * Firebase initialization — Sistem Monitoring Penerjemah by Master Translate
 *
 * Menggunakan environment variables dengan prefix VITE_FIREBASE_*.
 * Pastikan .env.local sudah dikonfigurasi sebelum mengaktifkan USE_FIREBASE=true.
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

import { USE_FIREBASE } from './firebaseFlag';

function validateFirebaseConfig(): void {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  const missing = required.filter((k) => !import.meta.env[k]);
  if (USE_FIREBASE && missing.length) {
    throw new Error(`[TMS] Missing Firebase env vars: ${missing.join(', ')}. Please set them in .env.local before enabling VITE_USE_FIREBASE=true`);
  }
}

// Hindari re-inisialisasi saat hot reload
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

/**
 * Lazy-initialize Firebase hanya jika diperlukan.
 * Dipanggil dari services saat USE_FIREBASE=true.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      validateFirebaseConfig();
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}
