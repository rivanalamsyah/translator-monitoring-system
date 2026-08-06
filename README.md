# Sistem Monitoring Penerjemah (Translator Monitoring System)

Sistem Monitoring Penerjemah (TMS) adalah aplikasi web modern single-page (SPA) berbasis **React (v19) + Vite + Tailwind CSS** yang dirancang untuk mengelola penugasan penerjemah secara efisien. Sistem ini menyediakan pemantauan waktu pengerjaan secara langsung (live timer), melacak kapasitas beban kerja (workload points), mengelola notifikasi, serta menyediakan alur persetujuan hasil terjemahan (approval workflow) bagi Super Admin.

Aplikasi ini mendukung dua mode operasi:
1. **Mode Lokal (Default):** Menggunakan `localStorage` browser untuk menyimpan data (ideal untuk demonstrasi, evaluasi, dan pengembangan cepat tanpa konfigurasi eksternal).
2. **Mode Firebase (Production):** Menggunakan infrastruktur backend serverless dari Firebase (Authentication, Firestore, Cloud Storage, Hosting, dan Cloud Functions) untuk lingkungan produksi yang aman, real-time, dan terskala.

---

## Fitur Utama

- **Manajemen Profil Penerjemah:** Memantau kapasitas beban kerja maksimal, beban kerja aktif, persentase utilisasi, performa rating, dan status ketersediaan penerjemah secara dinamis.
- **Manajemen Penugasan (Assignment Lifecycle):** Alur lengkap mulai dari pembuatan tugas (`UNASSIGNED`/`ASSIGNED`), pengerjaan (`WORKING`/`PAUSED`), pengiriman hasil (`WAITING_REVIEW`), revisi (`REVISION`), hingga penyelesaian (`COMPLETED`).
- **Pelacakan Waktu Nyata (Live Time Tracking):** Timer bawaan yang menghitung waktu kerja (`totalWorkingSeconds`) dan waktu jeda (`totalIdleSeconds`) per tugas, lengkap dengan riwayat log timer (`timer_logs`).
- **Notifikasi Sistem:** Notifikasi real-time untuk memberi tahu penerjemah ketika ada tugas baru atau revisi, serta memberi tahu admin saat hasil terjemahan telah diunggah.
- **Audit & Activity Logs:** Pencatatan log aktivitas pengguna secara instan untuk transparansi operasional.
- **Triggers Cloud Functions:** Otomatisasi sinkronisasi data kapasitas penerjemah saat tugas dibuat, diubah, dibatalkan, atau dialihkan (reassigned), serta pengiriman notifikasi otomatis mendekati batas waktu pengerjaan (deadline).

---

## Hasil Audit & Perbaikan (Changelog Perbaikan)

Sebagai hasil audit profesional yang komprehensif, beberapa perbaikan penting telah diimplementasikan demi menjamin kestabilan dan keamanan aplikasi pada tingkat produksi:

1. **Perbaikan Sinkronisasi State ke Firestore (TMS Core Sync):**
   * **Masalah:** Sebelumnya, ketika mode Firebase aktif (`VITE_USE_FIREBASE=true`), tombol kontrol timer (start, pause, resume) dan pengiriman form hanya memperbarui state React lokal di memory. Data perubahan tidak pernah ditulis ke Firestore, sehingga seketika terhapus ketika snapshot Firestore baru datang.
   * **Solusi:** Memperbarui semua fungsi aksi mutasi di `AppContext.tsx` untuk menulis langsung ke Firestore (`fsUpdateAssignment`, `fsAddTimerLog`, `fsAddActivityLog`, dll.). Data lokal kini otomatis tersinkronisasi berkat listener real-time dari Firestore (`onSnapshot`).
2. **Pencegahan Error Keamanan (Permission Denied):**
   * **Masalah:** Sesuai aturan keamanan `firestore.rules`, akun penerjemah dilarang membaca logs audit dan tugas milik penerjemah lain. Ketika penerjemah melakukan login, query tanpa filter memicu error fatal "Permission Denied" dari Firestore SDK.
   * **Solusi:** Menambahkan filter pencarian berbasis `translatorId` pada subscription `subscribeAssignments` dan `subscribeTimerLogs` ketika user ber-role `TRANSLATOR` masuk. Serta membatasi subscription `subscribeActivityLogs` khusus untuk `SUPER_ADMIN`.
3. **Penyelarasan Skema Notifikasi:**
   * **Masalah:** Terjadi perbedaan penamaan field penerima notifikasi antara frontend (`userId`) dengan Cloud Functions dan rules database (`targetUserId`).
   * **Solusi:** Menyatukan skema menggunakan field `userId` di semua platform (frontend, Cloud Functions, dan `firestore.rules`). Serta mengizinkan pengguna menghapus/memperbarui notifikasinya sendiri (untuk fitur "Clear All" dan "Mark as Read").
4. **Penanganan Reassignment di Cloud Functions:**
   * **Masalah:** Fungsi trigger `onAssignmentUpdate` sebelumnya hanya mendeteksi perubahan status pengerjaan, namun tidak menyesuaikan kapasitas utilisasi jika admin mengalihkan tugas (reassign) ke penerjemah lain.
   * **Solusi:** Memperbarui trigger fungsi di Cloud Functions untuk mendeteksi perubahan `translatorId`. Secara otomatis, poin beban kerja tugas akan dikurangi dari penerjemah lama dan ditambahkan ke penerjemah baru melalui Firestore Transaction.
5. **Koreksi Dependensi Terkorup di `package.json`:**
   * **Masalah:** `@testing-library/user-event` disetel pada versi yang tidak ada (`^14.8.0`), menyebabkan install npm gagal.
   * **Solusi:** Menurunkan dan mengunci versi ke `^14.5.2` yang stabil, dan berhasil menyelesaikan instalasi dengan `--legacy-peer-deps`.
6. **Penambahan Konfigurasi Firebase Hosting & Isolasi TypeScript:**
   * **Masalah:** Konfigurasi hosting tidak tersedia di `firebase.json` dan compiler TypeScript fungsi (`functions/tsc`) bentrok dengan tipe React root.
   * **Solusi:** Menambahkan konfigurasi hosting SPA di `firebase.json` dan menambahkan `typeRoots` di `functions/tsconfig.json` untuk mengisolasi lingkungan typings.

---

## Panduan Langkah demi Langkah Implementasi Firebase

Ikuti panduan berikut untuk menghubungkan dan mendeploy aplikasi ke Firebase Anda:

### Langkah 1: Persiapan Project di Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru (misal: `translator-monitoring-system`).
2. Aktifkan layanan berikut:
   - **Authentication:** Masuk ke menu Build > Authentication > Get Started. Aktifkan metode login **Email/Password**.
   - **Cloud Firestore:** Masuk ke Build > Firestore Database > Create Database. Pilih lokasi server database terdekat dan mulailah dalam **Production Mode**.
   - **Storage:** Masuk ke Build > Storage > Get Started. Pilih mode default untuk bucket penyimpanan foto profil/avatar.
   - **Cloud Functions:** Masuk ke Build > Functions (Memerlukan upgrade proyek ke paket pay-as-you-go **Blaze**, namun memiliki kuota gratis bulanan yang melimpah).

### Langkah 2: Setup Kredensial Environment Lokal
1. Buat aplikasi Web di Firebase Console (Project Settings > General > Add App > Web App).
2. Salin objek konfigurasi Firebase SDK yang diberikan.
3. Buat file baru bernama `.env.local` di root direktori proyek ini (salin dari `.env` atau `.env.local.example`):
   ```env
   # Firebase SDK Config
   VITE_FIREBASE_API_KEY=AIzaSyAxxx...
   VITE_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=project-id
   VITE_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456

   # Aktifkan Integrasi Firebase
   VITE_USE_FIREBASE=true
   ```

### Langkah 3: Setup Firebase CLI & Inisialisasi
1. Pastikan Anda memiliki Firebase Tools CLI terinstal secara global:
   ```bash
   npm install -g firebase-tools
   ```
2. Login ke akun Google Firebase Anda lewat terminal:
   ```bash
   firebase login
   ```
3. Hubungkan proyek lokal dengan proyek Firebase di cloud:
   ```bash
   firebase use --add <nama-project-id-firebase-anda>
   ```

### Langkah 4: Seeding Database Awal
Kami menyediakan script otomatis untuk mengisi database Firestore Anda dengan data awal (profil penerjemah dan aturan poin halaman):
1. Unduh kunci akun layanan (Service Account Key JSON) dari Firebase Console > Project Settings > Service Accounts.
2. Atur kredensial aplikasi default Google di komputer Anda menggunakan Google Cloud CLI, ATAU jalankan perintah seed langsung:
   ```bash
   npx tsx scripts/seedFirestore.ts
   ```
   *Catatan: Pastikan environment Firebase di `.env.local` sudah terisi lengkap sebelum menjalankan seeder.*

### Langkah 5: Membuat Akun Pengguna & Menyematkan Claims Role
Agar aturan keamanan database berjalan, setiap pengguna Firebase Auth harus memiliki custom claims `role` (`SUPER_ADMIN` atau `TRANSLATOR`).
1. Buat user baru di menu **Firebase Console > Authentication > Users > Add User**.
   * Contoh Admin: `admin@translator.id`
   * Contoh Penerjemah: `ahmad.rizky@translator.id`
2. Jalankan script claim helper yang telah kami sediakan untuk mendaftarkan role mereka:
   ```bash
   # Untuk Admin:
   npx tsx scripts/setCustomClaims.ts admin@translator.id SUPER_ADMIN

   # Untuk Penerjemah (Hubungkan dengan ID profile penerjemah di Firestore, misal tr-1):
   npx tsx scripts/setCustomClaims.ts ahmad.rizky@translator.id TRANSLATOR tr-1
   ```

### Langkah 6: Pengujian Lokal dengan Firebase Emulator (Sangat Direkomendasikan)
Gunakan emulator untuk memverifikasi keamanan aturan database secara lokal sebelum deploy ke server produksi:
1. Pastikan Java JRE/JDK sudah terinstal di komputer Anda.
2. Jalankan emulator lokal:
   ```bash
   npm run emulators:start
   ```

---

## Panduan Deployment ke Production

Setelah pengujian lokal berhasil, deploy seluruh aset dan aturan ke Firebase Cloud:

### 1. Deploy Aturan & Indeks Firestore & Storage
Deploy konfigurasi security rules dan composite index:
```bash
firebase deploy --only firestore,storage
```

### 2. Deploy Cloud Functions
Masuk ke folder functions, instal dependensi, kompilasi TypeScript, dan deploy fungsi backend:
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 3. Build & Deploy Frontend (Firebase Hosting)
Kompilasi kode React frontend dan unggah file statis ke Hosting:
```bash
# Build frontend
npm run build

# Deploy Hosting
firebase deploy --only hosting
```
Setelah deploy selesai, Firebase CLI akan menampilkan URL situs web produksi Anda (misal: `https://project-id.web.app`).

---

## Struktur Proyek

```text
├── .github/workflows/       # Workflow CI/CD otomatis (GitHub Actions)
├── assets/                  # Aset statis media utama
├── dist/                    # Output build produksi frontend (dibuat saat build)
├── functions/               # Backend Serverless Cloud Functions (Node.js + TS)
│   ├── src/index.ts         # Logika utama trigger & Callable Functions
│   └── tsconfig.json        # Isolasi compiler TypeScript functions
├── scripts/
│   ├── seedFirestore.ts     # Script pengisi data awal Firestore
│   └── setCustomClaims.ts   # Script utility pengatur role pengguna Auth
├── src/                     # Aplikasi Frontend React (TypeScript)
│   ├── components/          # Komponen UI (Admin, Translator, Common)
│   ├── context/
│   │   └── AppContext.tsx   # Pengelola State Global & Pengendali Aksi
│   ├── services/
│   │   ├── authService.ts   # Integrasi Auth & Login/Logout Firebase
│   │   ├── firestoreService.ts # Akses CRUD & Subscription Real-time
│   │   └── storageService.ts   # Upload file media ke Cloud Storage
│   ├── lib/
│   │   ├── firebase.ts      # Lazy-initializer Firebase SDK
│   │   └── firebaseFlag.ts  # Switcher Mode (Lokal vs Firebase)
│   └── index.css            # Styling utama Tailwind CSS
├── firestore.rules          # Aturan Keamanan Database Firestore
├── storage.rules            # Aturan Keamanan Bucket Storage
├── firebase.json            # File Utama Konfigurasi Layanan Firebase
└── firestore.indexes.json   # Definisi Index Komposit untuk Query Terfilter
```

---

## Pengujian & Verifikasi Kualitas Kode

Proyek ini dilengkapi dengan unit testing menggunakan **Vitest** dan **Testing Library**:
- **Menjalankan Tes Unit:**
  ```bash
  npm run test
  ```
- **Menjalankan Linter / Compiler Check:**
  ```bash
  npm run lint
  ```
- **Melacak Cakupan Kode (Coverage):**
  ```bash
  npm run ci
  ```

---

## Pemeliharaan & Operasional Produksi

- **Backup Rutin:** Jadwalkan ekspor data Firestore otomatis ke Cloud Storage menggunakan Cloud Scheduler dan Cloud Functions untuk mengantisipasi kehilangan data.
- **Monitoring Error:** Aktifkan Google Cloud Logging untuk memantau logs Cloud Functions dan performa SLA dari Cron Job deadline (`deadlineCronJob`).
- **Offboarding Penerjemah:** Saat menghapus penerjemah, pastikan untuk menonaktifkan akun mereka di Firebase Authentication dan mengubah status profil mereka ke `OFFLINE` untuk mencegah alokasi penugasan baru.


Langkah 1: Buat Akun di Firebase Authentication
Pertama, kita harus mendaftarkan email dan password untuk masuk ke aplikasi.

Buka Firebase Console > Authentication.
Pastikan Anda berada di tab Users.
Klik tombol Add User (Tambah pengguna) di sebelah kanan.
Buat akun pertama (Admin):
Masukkan Email: admin@mastertranslate.com (atau email pilihan Anda).
Masukkan Password: PasswordAdmin123! (atau password pilihan Anda).
Klik Add user.
PENTING: Setelah dibuat, salin (copy) kode acak yang ada di kolom User UID milik akun admin tersebut (misal: abc123xyz...). Simpan kode ini untuk Langkah 2.
Klik Add User sekali lagi untuk membuat akun kedua (Penerjemah):
Masukkan Email: translator@mastertranslate.com.
Masukkan Password: PasswordTranslator123!.
Klik Add user.
PENTING: Salin kode User UID milik akun penerjemah tersebut. Simpan kode ini untuk Langkah 2.