/**
 * Feature flag untuk mode operasi aplikasi.
 * - false (default): Gunakan localStorage (tidak perlu konfigurasi Firebase)
 * - true: Gunakan Firestore real-time + Firebase Auth + Storage
 *
 * Ubah nilai VITE_USE_FIREBASE di file .env.local untuk mengaktifkan.
 */
export const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
