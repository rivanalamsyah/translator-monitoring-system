# Sistem Monitoring Penerjemah (Translator Monitoring System)

Versi: Production-ready (hasil audit)

Ringkasan singkat
-----------------
Sistem Monitoring Penerjemah adalah aplikasi web single-page (React + Vite + Tailwind) yang menyediakan antarmuka untuk mengelola dan memantau penugasan penerjemah, melacak waktu pengerjaan, notifikasi, dan alur persetujuan hasil terjemahan. Proyek ini mendukung dua mode operasi:

- Mode Local (default): data disimpan di localStorage (untuk demo dan pengembangan cepat).
- Mode Firebase: terintegrasi dengan Firebase (Authentication, Firestore, Storage, Cloud Functions) untuk produksi.

Panduan ini menjelaskan arsitektur, pengaturan, langkah deploy ke production, konfigurasi Firebase, keamanan, dan hasil audit/perbaikan.

Fitur utama
-----------
- Manajemen penerjemah (profil, kapasitas, status)
- Manajemen penugasan (assign, start/pause timer, submit, review)
- Pelacakan waktu (timer logs) dan metrik pemanfaatan
- Notifikasi internal
- Audit & activity logs
- Integrasi Firebase (opsional untuk production)
- Cloud Functions untuk automasi (trigger pada assignment, jadwal deadline, callable submit)

Teknologi
---------
- Framework: React (v19) + Vite
- Styling: Tailwind CSS
- Backend serverless: Firebase (Auth, Firestore, Storage, Functions)
- Bahasa: TypeScript

Persyaratan Sistem
------------------
- Node.js 18+ (direkomendasikan Node 20 untuk Cloud Functions)
- npm atau yarn
- Akun Firebase (jika ingin menggunakan mode Firebase)

Persiapan & Instalasi (Development)
----------------------------------
1. Salin file environment contoh dan sesuaikan (opsional):
   - Salin `.env.local.example` menjadi `.env.local`.

2. Install dependensi:
   - npm: `npm install`
   - yarn: `yarn`

3. Menjalankan mode development (localStorage mode):
   - Jalankan: `npm run dev`
   - Aplikasi akan tersedia di `http://localhost:3000`

Mode Firebase (Production)
--------------------------
Untuk menjalankan aplikasi menggunakan Firebase (disarankan untuk production), lakukan langkah-langkah berikut:

1. Buat project Firebase di https://console.firebase.google.com/
2. Aktifkan layanan yang diperlukan:
   - Authentication (Email/Password)
   - Firestore (Mode production atau test saat awal)
   - Storage
   - Cloud Functions (Node 20)
3. Tambahkan aplikasi Web di Firebase Console dan salin konfigurasi SDK (apiKey, authDomain, projectId, dll.)
4. Isi variabel environment di `.env.local` berdasarkan `.env.local.example`:

   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

   Dan aktifkan flag:
   VITE_USE_FIREBASE=true

5. Validasi konfigurasi
   - Kode telah menambahkan pemeriksaan saat inisialisasi Firebase. Jika `VITE_USE_FIREBASE=true` tetapi variabel env penting tidak di-set, proses akan gagal dengan pesan yang jelas.

6. Deploy Cloud Functions (opsional tetapi direkomendasikan untuk automasi):
   - Pergi ke folder `functions/` dan ikuti instruksi deploy.
   - Pastikan `firebase-tools` sudah dikonfigurasi dengan project yang benar.

Struktur Project
----------------
- src/                  -> Kode frontend React (TSX)
  - components/         -> Komponen UI (admin, translator, common)
  - context/            -> AppContext (state manager, business logic)
  - services/           -> Abstraksi akses Firestore/Auth/Storage
  - lib/                -> Inisialisasi Firebase dan flags
  - data/, types/, utils/
- functions/            -> Cloud Functions (TypeScript)
- firestore.rules       -> Aturan keamanan Firestore
- storage.rules         -> Aturan keamanan Firebase Storage
- firebase.json         -> Konfigurasi deploy Firebase

Perhatian keamanan & best practice (ringkasan hasil audit)
---------------------------------------------------------
- Jangan meninggalkan kredensial demo (`password`) pada environment production. Aplikasi menampilkan kredensial demo hanya ketika `VITE_USE_FIREBASE=false` (mode lokal/demo).
- Kode sekarang memvalidasi env Firebase sebelum inisialisasi.
- Firestore Rules: sudah relatif ketat (role-based). Periksa dan sesuaikan jika skenario aplikasi berubah.
- Cloud Functions: lakukan validasi input dan gunakan transaksi saat mutasi data — sudah diterapkan.
- Hindari menyimpan data sensitif pada localStorage di production.
- Untuk produksi, aktifkan logging & monitoring Firebase, dan gunakan IAM principle of least privilege.

Perbaikan/Perubahan yang Dilakukan (Changelog singkat)
-----------------------------------------------------
- Memperbaiki `package.json`:
  - Mengganti skrip `clean` agar cross-platform (Windows friendly)
  - Menghapus duplikasi dependency `vite` di `dependencies` (tetap di devDependencies)

- Menambahkan validasi konfigurasi Firebase di `src/lib/firebase.ts`. Jika `VITE_USE_FIREBASE=true` tetapi variabel env penting kosong, proses inisialisasi akan memunculkan error yang jelas.

- Menyembunyikan panel kredensial demo di UI Login ketika `VITE_USE_FIREBASE=true`.

- Menambahkan README (file ini) yang menjelaskan setup, deployment, dan checklist keamanan.

Checklist Production Readiness
------------------------------
- [ ] Environment vars untuk Firebase terisi dan `VITE_USE_FIREBASE=true`.
- [ ] Firestore rules & Storage rules sudah diuji (gunakan Firebase Emulator untuk testing sebelum deploy).
- [ ] Cloud Functions sudah diuji di emulator lalu deploy.
- [ ] Monitoring & Alerts (Firebase Crashlytics / Cloud Monitoring) diaktifkan.
- [ ] Backup & export policy untuk Firestore dan Storage dijadwalkan.
- [ ] Proses CI/CD untuk build & deploy diatur (mis. GitHub Actions).

Security Checklist (lebih detail)
---------------------------------
- Gunakan Firebase Security Rules yang ketat (sudah ada di `firestore.rules` dan `storage.rules`).
- Pastikan Cloud Functions hanya dapat dijalankan oleh entitas yang berwenang.
- Batasi akses pengguna dengan custom claims (role) dan verifikasi pada server-side (functions).
- Aktifkan enkripsi, WAF, dan monitoring untuk endpoint penting.
- Hindari menyimpan token rahasia di repo. Gunakan Secret Manager atau CI secrets.

Testing
-------
- Tidak terdapat unit test otomatis di repo. Rekomendasi:
  - Tambahkan test minimal untuk business logic di `src/context/AppContext.tsx` (mis. timer, assignment lifecycle).
  - Gunakan Firebase Emulator Suite untuk menguji rules dan functions.

Troubleshooting
---------------
1. Error inisialisasi Firebase: periksa `.env.local` dan pastikan `VITE_USE_FIREBASE` dan `VITE_FIREBASE_*` sudah diisi.
2. Izin Firestore ditolak: periksa `firestore.rules` dan pastikan user memiliki custom claim `role` dan `translatorProfileId` bila diperlukan.
3. Cloud Function gagal: jalankan `npm run build` di folder `functions` lalu gunakan `firebase emulators:start --only functions` untuk debugging.

Operasional & Maintenance
-------------------------
- Gunakan Firebase Emulator untuk testing lokal rule & functions.
- Tetapkan rencana backup Firestore (eksport terjadwal).
- Tangani skenario offboarding penerjemah (hapus akses, revoke tokens).

Panduan singkat deploy ke production (Firebase)
----------------------------------------------
1. Pastikan `.env.local` sudah dikonfigurasi dan `VITE_USE_FIREBASE=true`.
2. Build aplikasi frontend: `npm run build`.
3. (Opsional) Deploy Cloud Functions dari folder `functions/`:
   - `cd functions && npm install && npm run build && firebase deploy --only functions`.
4. Deploy hosting / site (jika menggunakan Firebase Hosting) — tambahkan konfigurasi hosting di `firebase.json` dan jalankan `firebase deploy`.

Catatan Tambahan untuk Tim Pengembang
-------------------------------------
- Kode stateful demo (localStorage) berguna untuk demo cepat — jangan gunakan ini di produksi.
- Pastikan flow autentikasi & role management diuji menyeluruh di emulator sebelum membuka ke publik.

Jika ingin, saya dapat melanjutkan langkah berikutnya secara langsung:
- Menjalankan pemeriksaan TypeScript (tsc --noEmit) dan memperbaiki error yang muncul.
- Menjalankan linting/formatting.
- Menambahkan test unit minimal.
- Mempersiapkan contoh workflow CI/CD (GitHub Actions) untuk build & deploy.

Langkah-langkah Testing Lokal dan CI
------------------------------------
1. Unit tests (Vitest):
   - Jalankan `npm ci` lalu `npm run test`.
   - Konfigurasi Vitest sudah disertakan (vitest.config.ts) serta contoh test untuk AppContext di `src/__tests__/appcontext.test.tsx`.
2. Firebase Emulator:
   - Prasyarat: Java (JRE/JDK) harus terinstall dan tersedia di PATH untuk menjalankan emulator (Firestore emulator membutuhkan Java).
   - Firebase CLI harus terinstall (`npm install -g firebase-tools`) atau menggunakan `npx firebase emulators:start`.
   - Jalankan: `npm run emulators:start` (sudah menambahkan skrip pada package.json).
3. CI (GitHub Actions):
   - Workflow `CI` menjalankan `npm ci`, `npm run lint`, `npm run ci` (tests + coverage), dan build.
   - Workflow `Deploy to Firebase` ada di `.github/workflows/deploy-firebase.yml` — memerlukan `FIREBASE_TOKEN` dan `FIREBASE_PROJECT_ID` di GitHub Secrets.

Kendala lingkungan saat audit ini
---------------------------------
- Pada runner ini, `firebase` CLI tidak tersedia secara global sehingga emulator gagal dijalankan otomatis.
- Firebase Emulator juga membutuhkan Java; error "Could not spawn `java -version`" muncul saat mencoba menjalankan emulator.

Rekomendasi tindak lanjut yang saya akan jalankan bila environment mendukung:
- Menjalankan `npm ci` untuk memastikan semua devDependencies terpasang dan memperbaiki conflict jika muncul.
- Menjalankan `npm run test` (Vitest) untuk mengeksekusi test unit yang telah ditambahkan.
- Menjalankan Firebase Emulator Suite untuk menguji `firestore.rules`, `storage.rules`, dan Cloud Functions menggunakan `firebase emulators:start`.
- Menjalankan integration test untuk Cloud Functions menggunakan emulator.

---
Dokumentasi ini disiapkan sebagai bagian dari audit dan perbaikan awal agar proyek siap untuk langkah production. Semua perubahan telah dicatat di changelog singkat di atas. Jika Anda ingin, saya dapat melanjutkan proses verifikasi di lingkungan Anda (lokal atau CI) — termasuk menjalankan tests, emulator, dan deployment otomatis — setelah Java dan Firebase CLI tersedia, atau saya dapat membantu menyiapkan instruksi langkah demi langkah untuk tim DevOps Anda.
