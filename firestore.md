# Panduan Firebase — Sistem Monitoring Penerjemah by Master Translate

> **Versi Dokumen:** 1.0.0 | **Terakhir Diperbarui:** Agustus 2026
> Bahasa Indonesia | Target: Developer Baru dan Berpengalaman

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Arsitektur Firebase](#2-arsitektur-firebase-di-proyek-ini)
3. [Persiapan Awal](#3-persiapan-awal)
4. [Membuat Firebase Project](#4-membuat-firebase-project)
5. [Mendaftarkan Aplikasi Web](#5-mendaftarkan-aplikasi-web)
6. [Konfigurasi Environment Variables](#6-konfigurasi-environment-variables-env)
7. [Instalasi Firebase SDK](#7-instalasi-firebase-sdk)
8. [Struktur Folder](#8-struktur-folder--file-konfigurasi)
9. [Firebase Authentication](#9-firebase-authentication)
10. [Cloud Firestore Database](#10-cloud-firestore-database)
11. [Firestore Security Rules](#11-firestore-security-rules)
12. [Firebase Storage](#12-firebase-storage)
13. [Cloud Functions](#13-cloud-functions)
14. [Firebase Hosting](#14-firebase-hosting)
15. [Firebase Emulator Suite](#15-firebase-emulator-suite)
16. [Service Account](#16-service-account--backend-integration)
17. [Variabel Environment Lengkap](#17-variabel-environment-lengkap)
18. [Mengaktifkan Mode Firebase](#18-mengaktifkan-mode-firebase-feature-flag)
19. [Deployment ke Production](#19-deployment-ke-production)
20. [Checklist Keamanan](#20-checklist-keamanan-production)
21. [Troubleshooting](#21-troubleshooting)
22. [Optimasi Performa](#22-optimasi-performa)
23. [FAQ](#23-faq)

---

## 1. Pendahuluan

Proyek **Sistem Monitoring Penerjemah by Master Translate** mendukung dua mode:

| Mode | Keterangan | Kapan Digunakan |
|------|-----------|-----------------|
| localStorage (default) | Data disimpan di browser | Development, demo |
| Firebase | Data real-time di cloud | Production, multi-user |

Untuk beralih ke Firebase, ubah VITE_USE_FIREBASE=true di .env.local.

### Layanan Firebase yang Digunakan

`
Firebase Project
├── Authentication      Login/logout dengan Email & Password
├── Cloud Firestore     Database real-time NoSQL
├── Firebase Storage    Upload avatar & file dokumen terjemahan
├── Cloud Functions     Business logic server-side
└── Firebase Hosting    Deploy frontend (opsional)
`

---

## 2. Arsitektur Firebase di Proyek Ini

`
Frontend (React + Vite)
    src/lib/firebase.ts          Inisialisasi Firebase App (lazy)
    src/lib/firebaseFlag.ts      Feature flag: VITE_USE_FIREBASE
    src/services/authService.ts       Login, logout, auth state
    src/services/firestoreService.ts  CRUD + real-time listeners
    src/services/storageService.ts    Upload/delete file

Backend (Cloud Functions — functions/src/index.ts)
    createAssignmentTrigger    Firestore onCreate: hitung beban kerja
    onAssignmentUpdate         Firestore onUpdate: sinkron status & poin
    submitAssignmentCallable   HTTPS Callable: submit hasil terjemahan
    deadlineCronJob            Scheduler tiap 15 menit: alert deadline
`

---

## 3. Persiapan Awal

### Buat Akun Google

1. Buka https://accounts.google.com
2. Klik **Buat Akun** pilih **Untuk keperluan pribadi**
3. Isi nama, username, password, verifikasi telepon

Gunakan akun yang akan menjadi pemilik project Firebase.
Untuk production, gunakan akun perusahaan/organisasi.

### Masuk ke Firebase Console

1. Buka https://console.firebase.google.com
2. Klik **Sign in with Google**
3. Setujui Terms of Service Firebase

---

## 4. Membuat Firebase Project

### Langkah-langkah

1. Klik **Add project** di Firebase Console

2. **Langkah 1/3 - Nama Project**
   - Isi nama: master-translate-tms
   - Project ID dibuat otomatis (misal: master-translate-tms-a1b2c)
   - Catat Project ID ini sebagai nilai VITE_FIREBASE_PROJECT_ID

3. **Langkah 2/3 - Google Analytics**
   - Aktifkan jika ingin analytics (opsional untuk proyek ini)

4. **Langkah 3/3 - Selesai**
   - Klik **Create project**, tunggu 30-60 detik
   - Klik **Continue**

### Menu Dashboard Firebase

`
Authentication    Kelola user & metode login
Firestore         Lihat, edit, query data
Storage           Upload & kelola file
Functions         Deploy & monitor Cloud Functions
Hosting           Deploy website
Project Settings  API Keys, SDK config
Analytics         Usage & traffic
`

---

## 5. Mendaftarkan Aplikasi Web

1. Klik ikon **</>** (Web) di dashboard project

2. Isi form:
   - **App nickname:** TMS Web App
   - Centang **Also set up Firebase Hosting** jika ingin deploy di Firebase
   - Klik **Register app**

3. Firebase menampilkan firebaseConfig:

`javascript
const firebaseConfig = {
  apiKey:            "AIzaSyD_XXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "master-translate-tms.firebaseapp.com",
  projectId:         "master-translate-tms",
  storageBucket:     "master-translate-tms.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abcdef1234567890abcdef",
  measurementId:     "G-XXXXXXXXXX"
};
`

4. Salin semua nilai - akan diisi ke .env.local
5. Klik **Continue to console**

PENTING: Jangan hardcode nilai ini di source code!
Gunakan environment variables via .env.local yang sudah ada di .gitignore.

---

## 6. Konfigurasi Environment Variables (.env)

### Dua File yang Digunakan

| File | Tujuan | Di-commit ke Git? |
|------|--------|-------------------|
| .env | Template placeholder (sudah ada di repo) | Ya |
| .env.local | Nilai nyata API keys | Tidak pernah |

### Setup Langkah demi Langkah

**Langkah 1 - Salin template:**
`ash
cp .env .env.local
`

**Langkah 2 - Edit .env.local dengan nilai dari Firebase Console:**
`ash
# .env.local -- JANGAN COMMIT FILE INI!

VITE_FIREBASE_API_KEY=AIzaSyD_XXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=master-translate-tms.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=master-translate-tms
VITE_FIREBASE_STORAGE_BUCKET=master-translate-tms.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef

# Aktifkan Firebase (ubah ke 'true' setelah setup selesai)
VITE_USE_FIREBASE=false
`

**Langkah 3 - Verifikasi .gitignore:**
`
.env.local
.env.*.local
serviceAccountKey.json
`

Prefix VITE_ wajib untuk semua variabel yang diakses dari frontend Vite.
Variabel tanpa prefix VITE_ tidak dapat dibaca di React/Vite.

---

## 7. Instalasi Firebase SDK

### Firebase SDK (Frontend - sudah terinstal di proyek ini)

`ash
# Verifikasi instalasi
npm list firebase

# Install jika belum ada
npm install firebase
`

### Firebase CLI (Tools Deploy & Emulator)

`ash
# Install global
npm install -g firebase-tools

# Verifikasi
firebase --version

# Login ke Firebase
firebase login

# Hubungkan dengan project
firebase use master-translate-tms
`

### Inisialisasi Ulang (jika diperlukan)

`ash
firebase init
`

Pilih layanan saat firebase init:
- Firestore (rules & indexes)
- Functions
- Hosting
- Storage
- Emulators

---

## 8. Struktur Folder & File Konfigurasi

`
translator-monitoring-system/
    .env                         Template env (di-commit ke repo)
    .env.local                   Nilai nyata (TIDAK di-commit)
    firebase.json                Konfigurasi layanan Firebase
    firestore.rules              Security rules Firestore
    firestore.indexes.json       Composite indexes Firestore
    storage.rules                Security rules Storage
    functions/
        src/index.ts             Semua Cloud Functions
    src/
        lib/
            firebase.ts          Inisialisasi Firebase App (lazy)
            firebaseFlag.ts      Feature flag USE_FIREBASE
        services/
            authService.ts       Firebase Authentication
            firestoreService.ts  Firestore CRUD & real-time listeners
            storageService.ts    Firebase Storage upload/delete
`

### Penjelasan firebase.json

`json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [{ "source": "functions", "codebase": "default" }],
  "hosting": {
    "public": "dist",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "storage": { "rules": "storage.rules" }
}
`

### src/lib/firebase.ts - Inisialisasi Lazy

Firebase diinisialisasi secara lazy (hanya saat pertama kali dibutuhkan)
untuk menghindari re-inisialisasi saat hot reload:

`	ypescript
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export function getFirebaseApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

export function getFirebaseAuth()    { return getAuth(getFirebaseApp()); }
export function getFirebaseDb()      { return getFirestore(getFirebaseApp()); }
export function getFirebaseStorage() { return getStorage(getFirebaseApp()); }
`

---

## 9. Firebase Authentication

### Mengaktifkan Authentication di Console

1. Buka **Authentication** di sidebar kiri
2. Klik tab **Sign-in method**
3. Klik **Add new provider**

#### Email & Password (Digunakan di proyek ini)

1. Klik **Email/Password**
2. Toggle **Enable** ke ON
3. Klik **Save**

#### Google Sign-In (Opsional)

1. Klik **Google**
2. Toggle **Enable** ke ON
3. Isi **Project support email**
4. Klik **Save**

### Membuat Akun Administrator Pertama

#### Cara 1 - Via Firebase Console

1. Buka **Authentication** -> **Users** -> **Add user**
2. Isi email dan password yang kuat (minimal 12 karakter)
3. Catat UID yang dihasilkan

#### Cara 2 - Via Admin SDK (Direkomendasikan untuk Production)

`ash
# Jalankan sekali dari root proyek
node -e "
const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });

admin.auth().createUser({
  email: 'admin@mastertranslate.id',
  password: 'GantiPassword!2024',
  displayName: 'Super Admin',
}).then(user => {
  console.log('UID:', user.uid);
  return admin.auth().setCustomUserClaims(user.uid, { role: 'SUPER_ADMIN' });
}).then(() => {
  console.log('Admin berhasil dibuat!');
  process.exit(0);
});
"
`

#### Buat Dokumen Firestore untuk Admin

Di Firebase Console -> Firestore, tambahkan dokumen:

`
Koleksi: users
Dokumen ID: {UID dari Authentication}

Fields:
  name:      "Super Admin"
  email:     "admin@mastertranslate.id"
  role:      "SUPER_ADMIN"
  avatarUrl: ""
  phone:     ""
  createdAt: <Timestamp>
`

### Custom Claims untuk Role-Based Access

Custom claims ditambahkan ke Firebase ID Token dan dibaca di Security Rules:

`	ypescript
// Set via Admin SDK - dijalankan di server
await admin.auth().setCustomUserClaims(uid, {
  role: 'SUPER_ADMIN',           // atau 'TRANSLATOR'
  translatorProfileId: 'tr-001', // hanya untuk TRANSLATOR
});
`

Di Security Rules dibaca via 
equest.auth.token:

`javascript
function isSuperAdmin() {
  return request.auth.token.role == 'SUPER_ADMIN';
}
`

PENTING: Custom claims baru berlaku setelah token refresh.
User perlu logout-login, atau panggil:
`	ypescript
await auth.currentUser?.getIdToken(true); // force refresh
`

### Authorized Domains

Domain yang boleh trigger Firebase Auth:
1. Buka **Authentication** -> **Settings** -> **Authorized domains**
2. Tambahkan domain Anda:
   - localhost (sudah ada by default)
   - your-project.web.app
   - yourdomain.com (custom domain)

### Implementasi Kode

#### Login

`	ypescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export async function loginWithFirebase(email: string, password: string) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;

  return { id: uid, ...userSnap.data() } as UserProfile;
}
`

#### Logout

`	ypescript
import { signOut } from 'firebase/auth';

export async function logoutFromFirebase() {
  await signOut(getFirebaseAuth());
}
`

#### Auth State Listener

`	ypescript
import { onAuthStateChanged } from 'firebase/auth';

const unsubscribe = onAuthStateChanged(auth, (user) => {
  if (user) {
    // User sedang login
  } else {
    // User sudah logout
  }
});

return () => unsubscribe(); // Wajib cleanup saat component unmount!
`

#### Reset Password

`	ypescript
import { sendPasswordResetEmail } from 'firebase/auth';

await sendPasswordResetEmail(auth, 'user@example.com');
// Email berisi link reset dikirim ke alamat tersebut
`

#### Proteksi Halaman Berdasarkan Role

`	ypescript
const ProtectedRoute = ({ requiredRole, children }) => {
  const { currentUser, currentRole } = useApp();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentRole !== requiredRole) return <Navigate to="/unauthorized" replace />;
  return children;
};

// Penggunaan:
<ProtectedRoute requiredRole="SUPER_ADMIN">
  <AdminDashboard />
</ProtectedRoute>
`

---

## 10. Cloud Firestore Database

### Membuat Database

1. Buka **Firestore Database** -> **Create database**
2. Mode: **Production mode** (pilih ini untuk keamanan!)
3. Lokasi: sia-southeast1 (Singapura, latency terendah untuk Indonesia)
4. Klik **Enable**

PERINGATAN: Lokasi database tidak bisa diubah setelah dibuat!

### Koleksi dan Struktur Dokumen

#### /users/{uid} - Data Login User

`	ypescript
{
  name:      string,   // "Super Admin"
  email:     string,   // "admin@mastertranslate.id"
  role:      string,   // "SUPER_ADMIN" | "TRANSLATOR"
  avatarUrl: string,   // URL dari Firebase Storage
  phone:     string,
  createdAt: Timestamp,
}
`

#### /translator_profiles/{profileId} - Profil dan Beban Kerja Penerjemah

`	ypescript
{
  userId:                   string,    // Referensi ke users/{uid}
  name:                     string,    // "Ahmad Rizky"
  email:                    string,
  phone:                    string,
  avatarUrl:                string,
  languages:                string[],  // ["EN-ID", "JP-ID"]
  maxCapacityPoints:        number,    // 20.0
  currentLoadPoints:        number,    // Dihitung otomatis oleh Cloud Functions
  remainingCapacityPoints:  number,
  utilizationPercentage:    number,    // 0-100 persen
  status:                   string,    // "READY"|"WORKING"|"PAUSED"|...
  activeAssignmentId:       string | null,
  completedJobsCount:       number,
  rating:                   number,    // 0.0 - 5.0
  createdAt:                Timestamp,
}
`

#### /assignments/{assignmentId} - Tugas Terjemahan

`	ypescript
{
  code:                string,    // "TRJ-2024-001"
  title:               string,    // "Annual Report PT XYZ"
  clientName:          string,
  documentType:        string,    // "Legal"|"Medical"|"Technical"|"General"
  pageCount:           number,
  languageFrom:        string,    // "EN"
  languageTo:          string,    // "ID"
  pointMultiplier:     number,    // 1.0 - 3.0
  calculatedPoints:    number,    // pageCount * pointMultiplier
  translatorId:        string,    // Referensi ke translator_profiles/{id}
  translatorName:      string,    // Denormalisasi untuk performa
  status:              string,    // "UNASSIGNED"|"ASSIGNED"|"WORKING"|...
  priority:            string,    // "LOW"|"MEDIUM"|"HIGH"|"URGENT"
  createdAt:           Timestamp,
  deadlineAt:          Timestamp,
  assignedAt:          Timestamp | null,
  startedAt:           Timestamp | null,
  submittedAt:         Timestamp | null,
  completedAt:         Timestamp | null,
  estimatedMinutes:    number,
  totalWorkingSeconds: number,
  totalIdleSeconds:    number,
  sourceFileUrl:       string | null,
  resultFileUrl:       string | null,
  submissionNotes:     string,
  revisionNotes:       string,
  isDeadlineAlertSent: boolean,
}
`

#### /timer_logs/{logId} - Log Waktu Pengerjaan

`	ypescript
{
  assignmentId:    string,             // Referensi ke assignments/{id}
  translatorId:    string,             // Referensi ke translator_profiles/{id}
  type:            "WORK" | "PAUSE",
  startTime:       Timestamp,
  endTime:         Timestamp | null,   // null = sesi masih aktif
  durationSeconds: number,
  reason:          string,             // Alasan pause
}
`

#### /notifications/{notifId} - Notifikasi Sistem

`	ypescript
{
  userId:       string,    // UID penerima, atau "ALL" untuk broadcast
  title:        string,
  message:      string,
  type:         "INFO" | "SUCCESS" | "ALERT" | "ERROR",
  assignmentId: string | null,
  read:         boolean,
  createdAt:    Timestamp,
}
`

#### /system_settings/main - Pengaturan Global (Singleton)

`	ypescript
{
  maxCapacityPoints:  number,   // Default: 20
  pointsPerPage:      number,   // Default: 1
  overtimeMultiplier: number,   // Default: 1.5
  deadlineAlertHours: number,   // Default: 2
}
`

#### /activity_logs/{logId} dan /audit_logs/{logId} - Log Immutable

`	ypescript
{
  timestamp:     Timestamp,
  userId:        string,
  userName:      string,
  action:        string,
  details:       string,
  type:          "TIMER" | "SUBMISSION" | "REVIEW" | "SYSTEM",
  assignmentId?: string,
}
`

### Konvensi Penamaan

| Entitas | Konvensi | Contoh |
|---------|----------|--------|
| Koleksi | snake_case | translator_profiles, timer_logs |
| Field | camelCase | createdAt, translatorId |
| Enum | SCREAMING_SNAKE_CASE | SUPER_ADMIN, WAITING_REVIEW |
| Document ID | Auto-ID atau UID Auth | auto atau Firebase UID |


### Query dan Fitur Firestore

#### Real-time Listener (digunakan di proyek ini)

```typescript
import { onSnapshot, query, collection, orderBy, where } from 'firebase/firestore';

const q = query(
  collection(db, 'assignments'),
  where('translatorId', '==', translatorId),
  orderBy('createdAt', 'desc')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  setAssignments(data);
});

return () => unsubscribe(); // Wajib cleanup!
```

#### Pagination

```typescript
import { limit, startAfter } from 'firebase/firestore';

let lastDoc = null;

async function loadNextPage() {
  const constraints = [orderBy('createdAt', 'desc'), limit(20)];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  const snap = await getDocs(query(collection(db, 'assignments'), ...constraints));
  lastDoc = snap.docs[snap.docs.length - 1] || null;
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

#### Transaksi (Atomic Operation)

```typescript
await runTransaction(db, async (transaction) => {
  const ref = doc(db, 'translator_profiles', translatorId);
  const snap = await transaction.get(ref);
  if (!snap.exists()) throw new Error('Profil tidak ditemukan');
  const newLoad = snap.data().currentLoadPoints + addedPoints;
  transaction.update(ref, { currentLoadPoints: newLoad });
});
```

#### Batch Write (maksimal 500 operasi per batch)

```typescript
const batch = writeBatch(db);
snapshot.docs.forEach(document => batch.delete(document.ref));
await batch.commit();
```

---

## 11. Firestore Security Rules

### Konsep Dasar

```
request.auth            User yang sedang login (null jika belum login)
request.auth.uid        Firebase Auth UID
request.auth.token      ID Token berisi custom claims (role, dll)
request.resource.data   Data yang AKAN ditulis ke dokumen
resource.data           Data yang SUDAH ADA di dokumen saat ini
```

### Rules Lengkap — Lihat file `firestore.rules` di root proyek

Fungsi helper yang tersedia:

- `isAuthenticated()` — cek apakah user sudah login
- `isSuperAdmin()` — cek role SUPER_ADMIN via custom claim
- `isOwner(userId)` — cek apakah user adalah pemilik dokumen
- `isAssignedTranslator(translatorId)` — cek penerjemah yang ditugaskan

Rules per koleksi:

| Koleksi | Siapa yang bisa Read | Siapa yang bisa Write |
|---------|---------------------|----------------------|
| users | Admin semua, user diri sendiri | Admin buat/hapus, user update terbatas |
| translator_profiles | Semua user login | Admin buat/hapus, penerjemah update terbatas |
| assignments | Admin semua, penerjemah miliknya | Admin semua, penerjemah update terbatas |
| timer_logs | Admin semua, penerjemah miliknya | Penerjemah buat & update terbatas |
| notifications | Admin, penerima notif, broadcast ALL | Admin buat, user update/hapus miliknya |
| system_settings | Semua user login | Hanya admin |
| audit_logs | Hanya admin | Create saja — update/delete diblokir |
| activity_logs | Hanya admin | Create saja — update/delete diblokir |

### Deploy Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only firestore:rules,storage
```

### Menguji Rules via Rules Playground

1. Buka **Firestore → Rules → Rules Playground**
2. Pilih Simulation type: get / create / update / delete
3. Isi Location: path dokumen (misal `/assignments/assign-001`)
4. Toggle Authenticated → ON
5. Isi UID dan custom claims: `{ "role": "TRANSLATOR", "translatorProfileId": "tr-001" }`
6. Klik **Run** → lihat hasil Allow atau Deny

---

## 12. Firebase Storage

### Mengaktifkan Storage

1. Buka **Storage** → **Get started**
2. Mode: **Production mode**
3. Lokasi: `asia-southeast1`
4. Klik **Done**

### Struktur Folder Storage

```
Firebase Storage Bucket
    avatars/
        {translatorProfileId}/
            {timestamp}_avatar.jpg         Foto profil penerjemah
    assignments/
        {assignmentId}/
            source/
                {filename}                 Dokumen sumber (upload Admin)
            result/
                {filename}                 Hasil terjemahan (upload Penerjemah)
```

### Validasi File saat Upload

```typescript
// Tipe file yang diizinkan
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Hanya JPG, PNG, atau WebP yang diizinkan');
}

// Ukuran maksimum 2MB
if (file.size > 2 * 1024 * 1024) {
  throw new Error('Ukuran file maksimum 2MB');
}
```

---

## 13. Cloud Functions

### Fungsi yang Ada di Proyek

| Fungsi | Tipe | Trigger | Deskripsi |
|--------|------|---------|-----------|
| createAssignmentTrigger | Firestore Trigger | assignments onCreate | Hitung beban kerja |
| onAssignmentUpdate | Firestore Trigger | assignments onUpdate | Sinkron status |
| submitAssignmentCallable | HTTPS Callable | Dipanggil client | Submit terjemahan |
| deadlineCronJob | Scheduled | Tiap 15 menit | Alert deadline |

### Deploy Cloud Functions

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
firebase functions:log
```

### Memanggil Callable Function dari Client

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(getFirebaseApp());
const submit = httpsCallable(functions, 'submitAssignmentCallable');

await submit({
  assignmentId: 'assign-001',
  resultFileName: 'terjemahan-final.pdf',
  resultFileUrl: 'https://storage.googleapis.com/...',
  submissionNotes: 'Terjemahan selesai.',
});
```

---

## 14. Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Custom Domain

1. Buka **Hosting** → **Add custom domain**
2. Masukkan domain: `tms.mastertranslate.id`
3. Verifikasi kepemilikan domain (TXT record ke DNS)
4. Tambahkan A record dan AAAA record sesuai instruksi Firebase
5. Tunggu propagasi DNS 24–48 jam

---

## 15. Firebase Emulator Suite

### Keuntungan

- Gratis — tidak ada biaya quota Firebase
- Cepat — tidak ada latency jaringan
- Aman — data tidak masuk ke production
- Mudah reset — data bisa dihapus kapan saja

### Menjalankan Emulator

```bash
firebase emulators:start --only firestore,auth,functions,storage
# Buka Emulator UI: http://localhost:4000
```

### Port Default

| Layanan | Port |
|---------|------|
| Emulator UI | 4000 |
| Authentication | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |

### Hubungkan App ke Emulator

Tambahkan di `.env.local`:
```bash
VITE_USE_EMULATOR=true
```

Tambahkan koneksi di `src/lib/firebase.ts`:
```typescript
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(getFirebaseAuth(), 'http://localhost:9099');
  connectFirestoreEmulator(getFirebaseDb(), 'localhost', 8080);
  connectStorageEmulator(getFirebaseStorage(), 'localhost', 9199);
}
```

---

## 16. Service Account & Backend Integration

### Membuat Service Account

1. Buka **Firebase Console → Project Settings → Service accounts**
2. Klik **Generate new private key** → **Generate key**
3. Rename file JSON menjadi `serviceAccountKey.json`
4. Pindah ke root proyek
5. **PASTIKAN ada di `.gitignore`!**

> PERINGATAN: Jangan pernah commit `serviceAccountKey.json` ke repository!
> File ini memberikan akses PENUH ke seluruh project Firebase.
> Jika tidak sengaja ter-commit, SEGERA revoke di Firebase Console.

### Seed Data Awal

```typescript
// scripts/seed.ts
import * as admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

const db = admin.firestore();
await db.collection('system_settings').doc('main').set({
  maxCapacityPoints: 20,
  pointsPerPage: 1,
  overtimeMultiplier: 1.5,
  deadlineAlertHours: 2,
});
console.log('Database berhasil di-seed!');
```

```bash
npx tsx scripts/seed.ts
```

---

## 17. Variabel Environment Lengkap

| Variabel | Wajib? | Deskripsi |
|----------|--------|-----------|
| VITE_FIREBASE_API_KEY | Ya | API Key Firebase SDK |
| VITE_FIREBASE_AUTH_DOMAIN | Ya | Domain untuk Authentication |
| VITE_FIREBASE_PROJECT_ID | Ya | ID unik project Firebase |
| VITE_FIREBASE_STORAGE_BUCKET | Ya | Nama bucket Storage |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Ya | ID Cloud Messaging |
| VITE_FIREBASE_APP_ID | Ya | ID aplikasi web |
| VITE_USE_FIREBASE | Ya | Toggle Firebase atau localStorage |
| VITE_USE_EMULATOR | Tidak | Aktifkan Emulator (hanya dev) |

### Cara Mendapatkan Nilai

| Variabel | Lokasi di Firebase Console |
|----------|---------------------------|
| API_KEY, AUTH_DOMAIN, APP_ID | Project Settings → General → Your apps → SDK config |
| PROJECT_ID | Project Settings → General → Project ID |
| STORAGE_BUCKET | Storage → nama bucket di atas halaman |
| MESSAGING_SENDER_ID | Project Settings → Cloud Messaging → Sender ID |

---

## 18. Mengaktifkan Mode Firebase (Feature Flag)

### Cara Kerja

```typescript
// src/lib/firebaseFlag.ts
export const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
```

### Checklist Sebelum Aktivasi

- [ ] Firebase project sudah dibuat
- [ ] Authentication aktif dengan Email/Password enabled
- [ ] Firestore database dibuat (Production mode, region `asia-southeast1`)
- [ ] Storage sudah aktif
- [ ] Security rules di-deploy: `firebase deploy --only firestore:rules,storage`
- [ ] Composite indexes di-deploy: `firebase deploy --only firestore:indexes`
- [ ] Akun admin dibuat di Authentication dengan custom claims `SUPER_ADMIN`
- [ ] Dokumen `users/{uid}` dan `system_settings/main` sudah ada di Firestore

### Langkah Aktivasi

```bash
# Edit .env.local
VITE_USE_FIREBASE=true

# Restart dev server (wajib!)
npm run dev
```

---

## 19. Deployment ke Production

### Urutan Deploy

```bash
# 1. Build frontend
npm run build

# 2. TypeScript check
npx tsc --noEmit

# 3. Deploy Firestore rules & indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# 4. Deploy Storage rules
firebase deploy --only storage

# 5. Build & deploy Cloud Functions
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions

# 6. Deploy Hosting
firebase deploy --only hosting

# Atau semua sekaligus
firebase deploy
```

### CI/CD — GitHub Actions

Buat file `.github/workflows/deploy.yml`. Simpan secrets di:
**GitHub → Repository Settings → Secrets and variables → Actions**

Secrets yang diperlukan:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (isi dengan konten `serviceAccountKey.json`)

---

## 20. Checklist Keamanan Production

### Authentication
- [ ] Password policy aktif (minimal 8 karakter)
- [ ] Email enumeration protection aktif
- [ ] Authorized Domains hanya domain yang digunakan
- [ ] Tidak ada akun test dengan password lemah di production
- [ ] MFA aktif untuk akun Super Admin

### Firestore
- [ ] Security Rules bukan Test mode
- [ ] Tidak ada `allow read, write: if true`
- [ ] Semua koleksi punya rules yang tepat
- [ ] Rules sudah diuji di Rules Playground
- [ ] Composite indexes sudah di-deploy

### Storage
- [ ] Security rules sudah dikonfigurasi
- [ ] Validasi tipe dan ukuran file di client
- [ ] Public access tidak diaktifkan sembarangan

### Kredensial
- [ ] `.env.local` ada di `.gitignore`
- [ ] `serviceAccountKey.json` ada di `.gitignore`
- [ ] Tidak ada API key hardcoded di source code
- [ ] Service account yang tidak digunakan sudah dihapus

---

## 21. Troubleshooting

### `permission-denied`

**Gejala:** `FirebaseError: Missing or insufficient permissions`

**Penyebab:**
1. Security rules menolak request → cek Rules Playground
2. User belum login saat query dijalankan
3. Custom claims belum ter-refresh → `await auth.currentUser?.getIdToken(true)`

### `missing index`

**Gejala:** `The query requires an index. You can create it here: https://...`

```bash
# Klik link di pesan error (otomatis buat index), atau:
firebase deploy --only firestore:indexes
```

### `unauthorized-domain`

**Gejala:** `auth/unauthorized-domain`

**Solusi:** Tambahkan domain di Authentication → Settings → Authorized domains.

### `invalid-api-key`

**Gejala:** `Firebase: Error (auth/invalid-api-key)`

```bash
# Cek nilai di .env.local, lalu restart dev server
npm run dev
```

### `quota-exceeded` / `resource-exhausted`

**Gejala:** `firestore/resource-exhausted`

**Solusi:**
1. Tambahkan `limit()` ke semua query
2. Implementasi pagination
3. Kurangi real-time listener yang aktif bersamaan
4. Cek Firebase Console → Usage
5. Upgrade ke Blaze Plan jika diperlukan

### Missing environment variables

**Gejala:** `[TMS] Missing Firebase env vars: VITE_FIREBASE_API_KEY, ...`

```bash
cp .env .env.local
# Edit dengan nilai yang benar
npm run dev
```

### Cloud Functions timeout

```bash
firebase functions:log
firebase deploy --only functions
```

### `storage/unauthorized`

```bash
firebase deploy --only storage
```

---

## 22. Optimasi Performa

### Batasi Data yang Diambil

```typescript
const q = query(
  collection(db, 'assignments'),
  where('status', 'in', ['WORKING', 'PAUSED']),
  orderBy('deadlineAt', 'asc'),
  limit(50)
);
```

### Selalu Cleanup Listener

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(q, callback);
  return () => unsubscribe(); // Mencegah memory leak
}, []);
```

### Gunakan `serverTimestamp()`

```typescript
await addDoc(collection(db, 'logs'), {
  timestamp: serverTimestamp(), // Waktu server, bukan client
});
```

### Denormalisasi Data

```typescript
// Simpan translatorName di dokumen assignment
// agar tidak perlu query tambahan (Firestore tidak mendukung JOIN)
{
  translatorId:   'tr-001',
  translatorName: 'Ahmad Rizky', // data denormalisasi
}
```

### Aktifkan Offline Persistence

```typescript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(getFirebaseApp(), {
  localCache: persistentLocalCache(),
});
```

---

## 23. FAQ

**Q: Apakah API Key Firebase aman jika terlihat di source code frontend?**

A: Relatif aman. Keamanan sebenarnya dijaga oleh Security Rules dan Authentication.
API Key hanya mengidentifikasi project, bukan memberikan akses penuh.
Tetap gunakan `.env.local`, jangan hardcode di source code.

---

**Q: Bagaimana menambah penerjemah baru?**

A: Via UI Admin: Login sebagai Super Admin → Manajemen Penerjemah → Tambah Penerjemah.
Atau manual via Firebase Console + Admin SDK untuk set custom claims.

---

**Q: Berapa biaya Firebase?**

A: Spark Plan (gratis): 50.000 reads/hari, 20.000 writes/hari, 1GB Firestore storage.
Upgrade ke Blaze Plan (pay-as-you-go) jika kuota habis.

---

**Q: Custom claims tidak berlaku setelah diset?**

A: Force refresh: `await auth.currentUser?.getIdToken(true);`
Atau minta user logout dan login ulang.

---

**Q: Bagaimana cara melihat data Firestore?**

A: Firebase Console, Emulator UI di `http://localhost:4000`, atau VS Code Extension "Firebase Explorer".

---

**Q: Apa bedanya Firestore trigger vs HTTPS Callable?**

A: Trigger berjalan otomatis saat dokumen berubah (tidak bisa dipanggil manual dari client).
Callable dipanggil manual dari client menggunakan `httpsCallable()` dan bisa mengembalikan nilai.

---

**Q: Bagaimana menghapus data Firestore untuk testing?**

A: Via Emulator (aman — tidak menyentuh production):

```bash
# Hapus via Emulator UI di http://localhost:4000
firebase emulators:start --only firestore
```

Via Admin SDK (untuk data production — hati-hati!):

```typescript
await admin.firestore().recursiveDelete(
  admin.firestore().collection('assignments')
);
```

---

*Dokumentasi ini dibuat khusus untuk proyek Sistem Monitoring Penerjemah by Master Translate.*
*Untuk pertanyaan teknis, buka GitHub Issue atau hubungi tim developer.*
