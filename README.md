# 🎓 SIAKAD Terpadu — Sistem Informasi Akademik

Sistem informasi akademik **full-stack** terintegrasi untuk perguruan tinggi, mencakup delapan modul dalam satu platform:

| Modul | Deskripsi |
|-------|-----------|
| 🎓 **Akademik** | Fakultas, prodi, kurikulum, mata kuliah, kelas, KRS, KHS, transkrip, IPK otomatis |
| 🔄 **Neofeeder / PDDikti** | Sinkronisasi pelaporan (mahasiswa, AKM, nilai) + mapping kode & log sync |
| 💻 **LMS** | Learning Management System: course, modul, tugas, kuis, enrollment |
| 📡 **PJJ** | Pembelajaran Jarak Jauh: sesi sinkron/asinkron + presensi daring |
| ✅ **SPMI** | Penjaminan Mutu Internal: standar mutu, indikator, Audit Mutu Internal (AMI), temuan |
| 📋 **PMB** | Penerimaan Mahasiswa Baru: gelombang, pendaftaran online, alur seleksi |
| 👥 **Kepegawaian** | Data pegawai, absensi, cuti, generate payroll |
| 🔬 **LPPM** | Penelitian, pengabdian masyarakat, publikasi ilmiah |
| 🎓 **Wisuda** | Pendaftaran wisuda, verifikasi peserta, generate nomor ijazah, **slide seremoni** (foto + nama), **cetak ijazah** |

## 🏗️ Arsitektur

```
siakad-terpadu/  (npm workspaces monorepo)
├── backend/     Node.js + Express + TypeScript + Prisma (PostgreSQL)
│   ├── prisma/schema.prisma   # Model data seluruh modul
│   ├── prisma/seed.ts         # Data demo
│   └── src/
│       ├── index.ts           # Entry point + wiring modul
│       ├── middleware/auth.ts  # JWT + RBAC (authorize by role)
│       ├── utils/crud.ts       # Generator router CRUD reusable
│       └── modules/           # auth, akademik, neofeeder, pjj,
│                              #   spmi, lms, pmb, kepegawaian, lppm
└── frontend/    React + Vite + TypeScript + Tailwind CSS
    └── src/
        ├── auth.tsx           # Context autentikasi
        ├── nav.ts             # Menu dinamis berdasarkan peran
        ├── components/        # Layout, UI, ResourceList
        └── pages/             # Halaman per modul
```

**Stack:** TypeScript end-to-end · JWT auth dengan 9 peran (RBAC) · Prisma ORM · REST API · SPA React.

## 🚀 Menjalankan (lokal)

Prasyarat: Node.js ≥ 20 dan **PostgreSQL** (16+). Cara cepat menyalakan Postgres via Docker:

```bash
docker run --name siakad-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=siakad -p 5432:5432 -d postgres:16
```

```bash
# 1. Install semua dependency (backend + frontend)
npm install

# 2. Set koneksi DB (buat backend/.env dari contoh, lalu sesuaikan DATABASE_URL)
cp backend/.env.example backend/.env
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/siakad?schema=public"

# 3. Terapkan skema + seed data demo
npm run db:setup

# 4. Jalankan backend (:4000) + frontend (:5173) sekaligus
npm run dev
```

Buka **http://localhost:5173**.

> Menjalankan terpisah: `npm run backend` dan `npm run frontend`.

## ☁️ Deploy ke Google Cloud Run

Aplikasi dikemas sebagai **satu container** (`Dockerfile`): API Express sekaligus menyajikan
SPA React. Database produksi: **Cloud SQL for PostgreSQL**. Panduan lengkap perintah `gcloud`
(buat Cloud SQL, secret, `gcloud run deploy --source .`) ada di **[`DEPLOY.md`](./DEPLOY.md)**.

Migrasi database (`prisma migrate deploy`) berjalan otomatis saat container start.

## 🔑 Akun Demo

Password semua akun: **`password123`**

| Email | Peran | Akses utama |
|-------|-------|-------------|
| `super@kampus.ac.id` | Super Admin | Semua modul |
| `admin@kampus.ac.id` | Admin Akademik | Akademik, PMB, dashboard mutu |
| `budi@kampus.ac.id` | Dosen | Nilai, kelas, LMS/PJJ, LPPM |
| `andi@student.ac.id` | Mahasiswa | KRS, transkrip, LMS, PJJ |
| `feeder@kampus.ac.id` | Operator Feeder | Sinkronisasi Neofeeder |
| `mutu@kampus.ac.id` | Auditor Mutu | SPMI |
| `hrd@kampus.ac.id` | Kepegawaian | Pegawai, payroll |
| `lppm@kampus.ac.id` | LPPM | Penelitian, pengabdian, publikasi |
| `calon@gmail.com` | Calon Mahasiswa | Pendaftaran PMB |

Calon mahasiswa baru dapat mendaftar sendiri via tombol **Daftar (PMB)** di halaman login.

## 📡 Ringkasan API

Semua endpoint di-prefix `/api`. Autentikasi via header `Authorization: Bearer <token>`.

| Modul | Endpoint contoh |
|-------|-----------------|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Akademik | `GET /akademik/mahasiswa`, `POST /akademik/krs`, `POST /akademik/nilai`, `GET /akademik/transkrip/:id` |
| Neofeeder | `POST /neofeeder/sync/mahasiswa`, `POST /neofeeder/sync/nilai`, `GET /neofeeder/dashboard` |
| PJJ | `GET /pjj/sesi`, `POST /pjj/sesi/:id/hadir` |
| SPMI | `GET /spmi/standar`, `GET /spmi/dashboard` |
| LMS | `GET /lms/course/:id/belajar`, `POST /lms/kuis/:id/submit` |
| PMB | `POST /pmb/daftar`, `GET /pmb/status/saya`, `GET /pmb/dashboard` |
| Kepegawaian | `GET /kepegawaian/pegawai`, `POST /kepegawaian/payroll/generate` |
| LPPM | `GET /lppm/penelitian`, `PATCH /lppm/penelitian/:id/review` |
| Wisuda | `POST /wisuda/daftar`, `GET /wisuda/periode/:id/slide`, `POST /wisuda/periode/:id/generate-nomor`, `GET /wisuda/ijazah/:id` |

## 🧠 Logika Bisnis Utama

- **IPK otomatis** — dihitung ulang setiap input nilai (bobot: Tugas 30% + UTS 30% + UAS 40%), dengan konversi huruf A–E.
- **Validasi KRS** — batas maksimal 24 SKS per semester, alur pengajuan → persetujuan dosen wali.
- **RBAC** — setiap endpoint dibatasi peran; menu frontend menyesuaikan peran login.
- **Neofeeder** — membangun payload format PDDikti (mis. `InsertNilaiPerkuliahanKelas`) dan mencatat log sinkronisasi (simulasi web service Feeder).
- **Payroll** — generate gaji per periode (tunjangan 25%, potongan 5%).

## 🛠️ Catatan Teknis

- Database **PostgreSQL** (Prisma). Skema dikelola lewat migrasi (`backend/prisma/migrations`), diterapkan otomatis via `prisma migrate deploy` saat container start.
- **Single-container**: di produksi, backend menyajikan hasil build frontend (`PUBLIC_DIR`) dan mendengarkan `$PORT` (Cloud Run = 8080). Rute non-`/api` di-fallback ke `index.html` (SPA routing).
- Integrasi Neofeeder di sini masih **simulasi** (payload dibangun & dilog). Untuk produksi tinggal menghubungkan ke web service Feeder PT resmi menggunakan token `GetToken`.
- Env backend: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `RUN_SEED` (opsional, seed data demo).
