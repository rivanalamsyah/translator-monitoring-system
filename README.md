# Translator Monitoring System (TMS)

Sistem Monitoring Penerjemah (TMS) adalah platform web Enterprise Single-Page Application (SPA) berbasis **React 19** dan **Firebase** yang dirancang khusus untuk mendigitalisasi, mengotomatiskan, serta memantau seluruh siklus pengerjaan dokumen terjemahan oleh penerjemah (*translators*) secara real-time dan terukur.

Aplikasi ini mengusung pendekatan gamifikasi dengan melacak skor poin, badge pencapaian, tingkat level keaktifan, pemantauan timer pengerjaan, dan pembatasan beban kerja (*workload capacity*).

---

## 🚀 Fitur Utama Sistem

* **Task Pool & Claiming System:** Penerjemah dapat secara mandiri mengklaim tugas yang dipublikasikan oleh Admin tanpa perlu penugasan manual, dengan pembatasan kapasitas beban kerja aktif.
* **Live Timer & Time Tracking:** Penghitung waktu pengerjaan nyata (*live timer*) dengan fitur Start, Pause, Resume, dan Auto-idle Detection.
* **Batas Jam Kerja & Hari Libur:** Validasi terenkripsi di mana pengerjaan timer hanya dapat diaktifkan pada jam operasional kantor (Senin-Jumat: 08.00-12.00 & 13.00-16.00; Sabtu: 08.00-12.00 & 13.00-14.00; Minggu: Libur).
* **Manajemen Beban Kerja (Kapasitas Halaman):** Setiap penerjemah dibatasi beban pengerjaan aktifnya maksimal 20 halaman dokumen secara bersamaan guna menjamin SLA dan kualitas hasil kerja.
* **Real-time Leaderboard & Gamifikasi:** Sistem peringkat berdasarkan akumulasi poin, level, dan badge (Newbie, Professional, Expert, Legend).
* **Ekspor Laporan Modern (PDF & Excel):** Cetak laporan formal berdesain premium yang dilengkapi Kop Surat resmi, logo dinamis, dan tabel bergaris zebra.
* **Arsitektur Real-time Sync:** sinkronisasi otomatis status penugasan, log waktu, dan notifikasi langsung ke klien menggunakan Firebase Firestore Listeners.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

### Frontend (Client-Side)
* **Core Framework:** React (v19.0.0)
* **Build Tool & Bundler:** Vite (v6.0)
* **Styling & Design System:** Tailwind CSS (v3.4) & Vanilla CSS
* **Ikonografi:** Lucide React
* **Ekspor Dokumen:**
  * **jsPDF (v2.5):** Untuk render grafik vector Kop Surat dan tabel berhalaman dinamis.
  * **SheetJS / XLSX (v0.18):** Untuk ekspor data tabulasi ke Excel Spreadsheet.
* **State Management:** React Context API & Zustand (Local UI state)

### Backend & Database (Server-Side)
* **Autentikasi Pengguna:** Firebase Authentication (dengan sinkronisasi RBAC Custom Claims).
* **Database Utama:** Firebase Cloud Firestore (dengan aturan keamanan Role-Based Access Control terenkripsi).
* **Penyimpanan Berkas:** Google Cloud Storage / Firebase Storage (untuk unggah hasil berkas dokumen).

---

## 📂 Struktur Proyek

```text
├── .firebase/                # Firebase local cache & hosting configs
├── scripts/
│   ├── seedFirestore.ts     # Idempotent database seeder (1 Admin & 15 Penerjemah)
│   └── setCustomClaims.ts   # Utilitas pengatur klaim otorisasi (claims role) admin/penerjemah
├── src/
│   ├── assets/               # Aset gambar logo internal dan avatar fallback
│   ├── components/
│   │   ├── admin/           # Menu Panel Admin (Dashboard, List Tugas, Laporan)
│   │   ├── common/          # Sidebar, BottomNav, CustomDialog, Tabel Leaderboard
│   │   ├── modals/          # Formulir penambahan data, jeda, dan serah pekerjaan
│   │   └── translator/      # Menu Panel Penerjemah (Workspace & Profil)
│   ├── context/
│   │   └── AppContext.tsx   # Global Context, Handlers Timer, dan validasi jam kerja
│   ├── lib/
│   │   ├── firebase.ts      # Konfigurasi inisialisasi Firebase Web SDK
│   │   └── firebaseFlag.ts  # Bendera opsi mode database (Lokal vs Firebase)
│   ├── services/
│   │   ├── authService.ts   # Autentikasi sesi login/logout Firebase
│   │   └── firestoreService.ts # Listeners realtime, mutasi tugas, dan status translator
│   ├── types/
│   │   └── index.ts         # Definisi tipe data TypeScript (.d.ts / interfaces)
│   └── utils/
│       └── formatters.ts    # Formatting lokal durasi detik, rupiah, dan format tanggal
├── AUTH.md                  # Daftar lengkap akun kredensial pengujian sistem
├── firestore.rules          # Aturan keamanan database Firestore (Security Rules)
├── firestore.indexes.json   # Pengindeksan komposit query Firestore
└── firebase.json            # Konfigurasi hosting dan rules Firebase CLI
```

---

## 🚀 Panduan Kloning & Instalasi Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di lingkungan lokal Anda:

### 1. Kloning Repositori
Kloning repositori proyek ini dari GitHub ke komputer lokal Anda:
```bash
git clone https://github.com/rivanalamsyah/translator-monitoring-system.git
cd translator-monitoring-system
```

### 2. Instalasi Dependency
Pasang seluruh pustaka pustaka pendukung proyek dengan menggunakan perintah berikut (ditambahkan parameter `--legacy-peer-deps` untuk menghindari konflik library pengujian):
```bash
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env` atau `.env.local` pada folder root proyek, kemudian lengkapi dengan konfigurasi Firebase App Anda:
```env
VITE_FIREBASE_API_KEY=AIzaSyA5Xxxxxxx_xxxxxx
VITE_FIREBASE_AUTH_DOMAIN=master-translator-monitoring.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=master-translator-monitoring
VITE_FIREBASE_STORAGE_BUCKET=master-translator-monitoring.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=765738883690
VITE_FIREBASE_APP_ID=1:765738883690:web:d6eba0a6a59e3bf5814813

# Setel ke true untuk mengaktifkan koneksi Firebase backend.
# Setel ke false jika hanya ingin mensimulasikan data via LocalStorage browser.
VITE_USE_FIREBASE=true
```

### 4. Menjalankan Server Pengembangan Lokal
Jalankan aplikasi dalam mode pengembangan lokal:
```bash
npm run dev
```
Aplikasi Anda akan berjalan di alamat **`http://localhost:3000`** (atau port lain yang tertera di terminal).

---

## 🗄️ Langkah Mengisi Data Awal Database (Seeding Firestore)

Untuk mengisi database Firestore Anda dengan **1 akun administrator utama**, **15 akun penerjemah demo**, serta riwayat poin dan beberapa sampel data penugasan, ikuti panduan berikut:

1. Masuk ke **Firebase Console** proyek Anda.
2. Navigasikan ke **Project Settings > Service Accounts**, lalu klik **Generate New Private Key**. Unduh berkas kunci tersebut.
3. Simpan berkas JSON tersebut di dalam direktori root proyek ini dengan nama **`service-account.json`**.
4. Jalankan perintah seeder di terminal Anda:
   ```bash
   npx tsx scripts/seedFirestore.ts
   ```
5. Setelah seeder selesai, Anda dapat menggunakan akun-akun tersebut untuk masuk ke sistem. Daftar lengkap kredensial demo tercantum pada file **[AUTH.md](file:///d:/translator-monitoring-system/AUTH.md)**.

---

## 📦 Kompilasi & Deployment Produksi (Build & Deploy)

### Kompilasi Statis
Kompilasi kode program ke dalam berkas statis siap rilis di folder `dist/`:
```bash
npm run build
```

### Deploy ke Firebase Hosting
Pastikan Anda sudah login ke Firebase CLI (`firebase login`), kemudian jalankan deploy:
```bash
firebase deploy --only hosting
```

---

## 📬 Kontak Pengembang (Developer Contact)

Jika Anda memiliki pertanyaan, kendala teknis, atau ingin mendiskusikan pengembangan lebih lanjut untuk platform ini, silakan hubungi pengembang utama:

* **Nama:** Rivan Alamsyah
* **GitHub:** [@rivanalamsyah](https://github.com/rivanalamsyah)
* **Email:** [alamsyahrivan14@gmail.com](mailto:alamsyahrivan14@gmail.com)