# Kredensial Akun Demo (Sistem Monitoring Penerjemah)

Berikut adalah daftar akun demo yang telah di-seed ke database Firebase Authentication dan Firestore. Akun ini dapat digunakan untuk menguji fungsionalitas sistem baik dari sisi **Super Admin** maupun **Penerjemah**.

---

## 🔑 Akun Super Admin
Akun ini memiliki hak akses penuh untuk mengelola tugas, memantau kinerja penerjemah, menyetujui hasil terjemahan, dan mengunduh laporan bulanan.

| Nama Akun | Peran (Role) | Alamat Email | Kata Sandi (Password) |
| :--- | :--- | :--- | :--- |
| **Administrator** | Super Admin | `admin@example.com` | `Admin@2026Secure!` |

---

## ✍️ Akun Penerjemah (15 Penerjemah)
Semua akun penerjemah di bawah ini memiliki kata sandi yang sama: **`Translator@2026!`**. 
Setiap akun memiliki data poin, tingkat level, keahlian bahasa, beban kerja aktif, dan daftar riwayat tugas yang berbeda untuk simulasi sistem yang berjalan secara realistik.

| No | Nama Penerjemah | Alamat Email | Peran (Role) | Keahlian Bahasa |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Andi Pratama** | `andi.pratama@example.com` | Penerjemah | Inggris ↔ Indonesia |
| 2 | **Putri Maharani** | `putri.maharani@example.co` | Penerjemah | Inggris → Mandarin |
| 3 | **Rina Lestari** | `rina.lestari@example.com` | Penerjemah | Inggris → Indonesia, Jerman → Indonesia |
| 4 | **Fajar Nugroho** | `fajar.nugroho@example.com` | Penerjemah | Inggris → Indonesia, Arab → Indonesia |
| 5 | **Dewi Anggraini** | `dewi.anggraini@example.com` | Penerjemah | Inggris → Indonesia, Prancis → Indonesia |
| 6 | **Hendra Wijaya** | `hendra.wijaya@example.com` | Penerjemah | Inggris → Indonesia, Jepang → Indonesia |
| 7 | **Rian Hidayat** | `rian.hidayat@example.com` | Penerjemah | Inggris ↔ Indonesia |
| 8 | **Siti Aminah** | `siti.aminah@example.com` | Penerjemah | Inggris → Indonesia, Jepang → Indonesia, Mandarin → Indonesia |
| 9 | **Budi Santoso** | `budi.santoso@example.com` | Penerjemah | Inggris → Indonesia, Rusia → Indonesia |
| 10 | **Eka Saputra** | `eka.saputra@example.com` | Penerjemah | Inggris ↔ Indonesia |
| 11 | **Fitriani Siregar** | `fitriani.siregar@example.com` | Penerjemah | Inggris → Indonesia, Arab → Indonesia |
| 12 | **Adi Kurniawan** | `adi.kurniawan@example.com` | Penerjemah | Inggris → Indonesia, Jerman → Indonesia |
| 13 | **Mega Utami** | `mega.utami@example.com` | Penerjemah | Inggris → Indonesia, Jepang → Indonesia |
| 14 | **Gede Putra** | `gede.putra@example.com` | Penerjemah | Inggris → Indonesia, Rusia → Indonesia |
| 15 | **Yulia Fitri** | `yulia.fitri@example.com` | Penerjemah | Inggris → Indonesia, Prancis → Indonesia |

---

> **Catatan Pengujian:**
> * Untuk menguji aturan batas jam kerja, silakan pastikan waktu pengujian Anda berada dalam rentang jam operasional (Senin-Jumat: 08.00-12.00 dan 13.00-16.00; Sabtu: 08.00-12.00 dan 13.00-14.00; Minggu: Libur).
> * Kapasitas beban kerja penerjemah dibatasi maksimal **20 halaman** secara default. Penerjemah tidak dapat mengklaim tugas baru di Task Pool jika total beban tugas berjalan melebihi batas tersebut.
