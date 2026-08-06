# Sistem Monitoring Penerjemah (Translator Monitoring System)

Sistem Monitoring Penerjemah (TMS) adalah aplikasi web modern single-page (SPA) berbasis **React (v19) + Vite + Tailwind CSS** yang dirancang untuk mengelola penugasan penerjemah secara efisien. Sistem ini menyediakan pemantauan waktu pengerjaan secara langsung (live timer), melacak kapasitas beban kerja (workload points), mengelola notifikasi, serta menyediakan alur persetujuan hasil terjemahan (approval workflow) bagi Super Admin.

Aplikasi ini mendukung dua mode operasi:
1. **Mode Lokal (Default):** Menggunakan `localStorage` browser untuk menyimpan data (ideal untuk demonstrasi, evaluasi, dan pengembangan cepat tanpa konfigurasi eksternal).
2. **Mode Firebase (Production):** Menggunakan infrastruktur backend serverless dari Firebase (Authentication, Firestore, Hosting) untuk lingkungan produksi yang aman, real-time, dan terskala.

---

## Desain & Antarmuka (Design System)

- **Tema Warna:** *Blush Workspace* (Clean, minimalis, perpaduan warna pink-white dengan kontras abu-abu lembut).
- **Sistem Ikon:** Konsisten menggunakan **Lucide Icons** dengan gaya outline (18–20 px pada tombol/menu, 24–32 px pada card statistik).
- **Aturan UI/UX:** Bebas dari emoji di seluruh antarmuka (termasuk dashboard, leaderboard, badge, status, notifikasi, tombol, maupun kartu statistik) untuk menjaga kesan bisnis yang profesional.
- **Responsivitas:** Mendukung tampilan Desktop (dengan sidebar yang dapat diciutkan) dan Mobile (dengan Bottom Navigation modern dan profesional).

---

## Akun Demo & Kredensial

Gunakan akun berikut untuk melakukan uji coba sistem (baik untuk login di emulators maupun Firebase Production):

### 1. Akun Super Admin (Akses Penuh)
- **Nama:** Administrator
- **Role:** `super_admin` (Admin Panel dengan 6 Menu)
- **Email:** `admin@example.com`
- **Password:** `Admin@2026Secure!`

### 2. Akun Translator (Ruang Kerja Penerjemah)
- **Role:** `translator` (Translator Panel dengan 4 Menu)
- **Status Awal:** `FREE` (Siap Menerima Tugas)
- **Password:** `Translator@2026!` (Berlaku untuk semua translator)
- **Email Akun:**
  - Andi Pratama: `andi.pratama@example.com`
  - Putri Maharani: `putri.maharani@example.co` (Domain `.co`)
  - Rina Lestari: `rina.lestari@example.com`
  - Fajar Nugroho: `fajar.nugroho@example.com`
  - Dewi Anggraini: `dewi.anggraini@example.com`

---

## Menu Dashboard

### Dashboard Admin (6 Menu)
1. **Dashboard** (`LayoutDashboard`): Ringkasan status operasional penerjemah dan aktivitas penugasan secara *real-time*.
2. **Tugas** (`ClipboardList`): Mengelola pembuatan tugas baru dan alokasi penerjemah.
3. **Penerjemah** (`Users`): Daftar profil penerjemah aktif dan metrik kapasitas beban kerja.
4. **Leaderboard** (`Trophy`): Peringkat pencapaian poin pengerjaan penerjemah.
5. **Laporan** (`BarChart3`): Analisis kinerja, SLA, dan visualisasi distribusi tugas.
6. **Pengaturan** (`Settings`): Aturan poin per halaman, status auto-assign, dan preferensi notifikasi.

### Dashboard Translator (4 Menu)
1. **Dashboard** (`LayoutDashboard`): Monitor tugas aktif pengerjaan saat ini dengan kontrol start, pause, resume, dan submit.
2. **Tugas** (`ClipboardList`): Pool Task yang tersedia untuk diklaim (*Task Claiming System*).
3. **Leaderboard** (`Trophy`): Papan skor performa dan tingkatan badge pencapaian.
4. **Profil** (`UserCircle`): Detail kontak, sertifikasi, kemampuan bahasa, dan sisa kapasitas beban kerja.

---

## Struktur Proyek & Analisis File

Berikut adalah file inti yang digunakan dalam sistem (file mati/tidak digunakan telah dihapus):

```text
├── public/
│   ├── assets/               # Aset statis favicon dan logo utama
│   ├── icons/                # Ikon manifest untuk PWA
│   └── offline.html          # Halaman fallback offline PWA
├── scripts/
│   ├── seedFirestore.ts     # Script pengisi data awal Firestore (Idempotent)
│   └── setCustomClaims.ts   # Script utility pengatur custom claims pengguna Auth
├── src/
│   ├── assets/               # Aset gambar lokal (logo, avatar fallback)
│   ├── components/
│   │   ├── admin/           # Menu operasional Admin (Dashboard, List, Laporan)
│   │   ├── common/          # Sidebar, BottomNav, CustomDialog, Badge, Leaderboard
│   │   ├── modals/          # Modal input data baru dan formulir pengerjaan
│   │   └── translator/      # Menu operasional Penerjemah (Dashboard, Profile)
│   ├── context/
│   │   └── AppContext.tsx   # Pengelola State Utama & Sinkronisasi Firestore
│   ├── services/
│   │   ├── authService.ts   # Login/Logout Auth Firebase
│   │   └── firestoreService.ts # Real-time Listeners & Aksi Mutasi Firestore
│   ├── lib/
│   │   ├── firebase.ts      # Inisialisasi Firebase Web SDK
│   │   └── firebaseFlag.ts  # Konfigurasi mode operasi (Lokal vs Firebase)
│   ├── types/
│   │   └── index.ts         # Definisi Interface TypeScript
│   └── utils/
│       └── formatters.ts    # Pemformat durasi, waktu, mata uang, dan status
├── firestore.rules          # Aturan Keamanan Database Firestore (RBAC)
├── firebase.json            # Konfigurasi Firebase Hosting & Firestore Rules
└── firestore.indexes.json   # Composite Indexes untuk query Firestore
```

---

## Langkah Instalasi & Pengoperasian Lokal

### 1. Kloning dan Instalasi
Pastikan Node.js terinstal di perangkat Anda, kemudian jalankan:
```bash
# Install dependency dengan mengabaikan konflik peer dependency React 18/19 pada pustaka tes
npm install --legacy-peer-deps
```

### 2. Jalankan Mode Pengembangan (Local Storage)
Secara default, `VITE_USE_FIREBASE=false` dapat disetel pada file `.env` untuk menjalankan simulasi database lokal menggunakan `localStorage` browser:
```bash
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:3000`.

### 3. Jalankan Mode Firebase (Production)
Untuk menggunakan backend Firebase, setel environment variables di `.env.local`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=master-translator-monitoring.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=master-translator-monitoring
VITE_FIREBASE_STORAGE_BUCKET=master-translator-monitoring.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=765738883690
VITE_FIREBASE_APP_ID=1:765738883690:web:d6eba0a6a59e3bf5814813

VITE_USE_FIREBASE=true
```

#### Menjalankan Script Database Seeder:
1. Unduh file **Kunci Akun Layanan (Service Account Key JSON)** dari Firebase Console proyek Anda (**Project Settings > Service Accounts**).
2. Simpan file tersebut di folder root proyek ini dengan nama `service-account.json`.
3. Jalankan perintah seeder untuk membuat akun pertama:
   ```bash
   npx tsx scripts/seedFirestore.ts
   ```

---

## Kompilasi Produksi (Production Build)

Kompilasi kode frontend menjadi bundle statis yang dioptimalkan beserta Service Worker PWA:
```bash
npm run build
```
Hasil build akan tersimpan di folder `dist/` dan siap dideploy ke Firebase Hosting.