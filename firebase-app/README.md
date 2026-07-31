# 🎓 SIAKAD Terpadu — Firebase Edition

Implementasi **paralel** dari SIAKAD Terpadu (lihat `../backend` & `../frontend` untuk versi
Express + Prisma + PostgreSQL yang berjalan di Cloud Run) menggunakan **Firebase**
(Auth, Firestore, Storage, Cloud Functions). Dibangun agar frontend-nya berupa
**aplikasi client-only** (React + Vite + TypeScript) yang bisa di-preview di
**Google AI Studio Build** — sesuatu yang **tidak bisa** dilakukan oleh versi
Express/Postgres karena AI Studio Build menjalankan kode di sandbox browser, bukan
proses Node.js dengan koneksi database TCP.

Kedua versi ini **independen** — tidak saling menggantikan. Pilih sesuai kebutuhan:
versi Cloud Run untuk produksi dengan database relasional, versi ini untuk
kebutuhan preview/demo di AI Studio atau bila Anda memang lebih memilih ekosistem Firebase.

## 🧠 Bagaimana ini bisa jalan di AI Studio, padahal Express tidak bisa?

- **Firestore, Firebase Auth, Storage** punya *client SDK* yang bicara lewat
  HTTPS/gRPC — bisa dipanggil langsung dari JavaScript di browser (termasuk di
  sandbox AI Studio), diamankan oleh **Security Rules** (`firestore.rules`,
  `storage.rules`), bukan oleh server aplikasi.
- **PostgreSQL** memakai *wire protocol* TCP mentah — browser tidak bisa
  bicara dengannya sama sekali, apa pun frameworknya.
- Untuk logika yang perlu **rahasia atau kalkulasi tervalidasi** (kunci jawaban
  CBT, IPK, validasi SKS, nomor VA/ijazah), dipakai **Cloud Functions** (`onCall`)
  yang di-*deploy* terpisah ke Firebase — klien memanggilnya lewat HTTPS
  (`httpsCallable`), sama seperti klien manapun memanggil API biasa.

## 🏗️ Arsitektur

```
firebase-app/
├── src/                  React + Vite + TypeScript + Tailwind (client-only)
│   ├── firebase.ts        Init Firebase SDK (Auth, Firestore, Storage, Functions)
│   ├── auth.tsx            AuthProvider (Firebase Auth + peran dari Firestore)
│   ├── types.ts            Model data Firestore (padanan skema Prisma)
│   ├── lib/firestore.ts    Hook generik query + resolve relasi (spt "include" Prisma)
│   ├── components/         Layout, ResourceList, UI
│   └── pages/              Semua halaman modul
├── functions/            Cloud Functions (Node.js + TypeScript, Admin SDK)
│   └── src/                KRS, nilai+IPK, Neofeeder, CBT, PMB (VA/berkas), payroll, wisuda
├── scripts/
│   ├── seed.ts             Seed data demo (Admin SDK) — emulator atau project asli
│   └── smoketest.ts        Uji end-to-end (auth, RBAC, seluruh Cloud Function)
├── firestore.rules        RBAC 9 peran berbasis dokumen users/{uid}.role
├── storage.rules          Aturan akses berkas PMB & foto
└── metadata.json          Manifest untuk AI Studio Build
```

## 🔐 Model keamanan (RBAC)

Firestore Security Rules meniru `authorize(...roles)` di backend Express:
- Data referensi (prodi, mata kuliah, dsb.) — baca bebas (login), tulis dibatasi per peran.
- **Koleksi dengan logika/kalkulasi** (`krs`, `nilai`, `ujianCbt`, `jawabanCbt`,
  `tagihanVA`, `pesertaWisuda`, `payroll`, `feederSyncLog`, `soalCbtPublic`) —
  **`allow write: if false`** di rules; satu-satunya jalan masuk adalah Cloud
  Function terkait (Admin SDK otomatis melewati rules).
- **`soalCbtKunci`** (kunci jawaban CBT) — `allow read, write: if false` **total**,
  bahkan admin tidak bisa membacanya dari klien. Hanya Cloud Function `cbtSubmit`
  (jalan di server dengan Admin SDK) yang bisa mengaksesnya untuk menilai.

Sudah diverifikasi end-to-end (`scripts/smoketest.ts`, 19/19 lolos) bahwa mahasiswa
ditolak mengakses data kepegawaian, tidak bisa membaca kunci CBT, dan tidak bisa
memanggil fungsi Neofeeder — sementara alur normal (KRS → nilai → IPK, PMB → CBT
→ VA, wisuda → generate nomor) semuanya berjalan benar.

## 🚀 Menjalankan lokal (Emulator Suite — gratis, tanpa project Firebase asli)

Prasyarat: Node.js ≥ 20, Java 11+ (untuk emulator Firestore).

```bash
npm install
cd functions && npm install && npm run build && cd ..

# Terminal 1: jalankan Emulator Suite (Auth, Firestore, Storage, Functions)
npx firebase emulators:start

# Terminal 2: seed data demo ke emulator
npm run seed

# Terminal 3: jalankan frontend (pastikan .env berisi VITE_USE_EMULATOR=true)
npm run dev
```

Buka **http://localhost:5173** (atau port yang ditampilkan). Emulator UI di
**http://localhost:4000**. Akun demo sama seperti versi Postgres (password
`password123`): `admin@kampus.ac.id`, `budi@kampus.ac.id`, `andi@student.ac.id`,
`feeder@kampus.ac.id`, `mutu@kampus.ac.id`, `hrd@kampus.ac.id`, `lppm@kampus.ac.id`,
`calon@gmail.com`.

## ☁️ Deploy ke project Firebase asli

1. Buat project di [console.firebase.google.com](https://console.firebase.google.com),
   aktifkan **Authentication (Email/Password)**, **Firestore** (production mode),
   **Storage**, dan **Cloud Functions** (>= 2nd gen).
   > ⚠️ Cloud Functions 2nd gen (dipakai di sini) **mewajibkan paket Blaze**
   > (pay-as-you-go) meski penggunaan kecil biasanya masih masuk kuota gratis.
2. `firebase login` lalu `firebase use --add` (pilih project, ganti `.firebaserc`).
3. Isi `.env` dari `.env.example` dengan konfigurasi Web App project Anda
   (Project Settings → General → Your apps → SDK setup and configuration).
4. Deploy:
   ```bash
   firebase deploy --only firestore:rules,storage,functions
   npm run build && firebase deploy --only hosting   # opsional, jika pakai Firebase Hosting
   ```
5. Seed data ke project asli: hapus baris `process.env.FIRESTORE_EMULATOR_HOST ...`
   di `scripts/seed.ts`, siapkan `GOOGLE_APPLICATION_CREDENTIALS` (service-account
   key dari Project Settings → Service accounts), lalu `npm run seed`.

## 🖥️ Membuka di Google AI Studio Build

1. Salin isi folder `firebase-app/` (kecuali `functions/`, `node_modules/`, `dist/`)
   ke workspace AI Studio Build.
2. Deploy dulu **Cloud Functions & Firestore Rules** ke project Firebase asli
   (langkah di atas) — AI Studio hanya menjalankan bagian client, logika di
   `functions/` tetap perlu berjalan sebagai layanan terpisah di Firebase.
3. Set konfigurasi Firebase (`VITE_FIREBASE_*`) sebagai environment variable di
   AI Studio, atau — bila AI Studio Anda tidak mendukung `.env` — tempel langsung
   nilainya ke `firebaseConfig` di `src/firebase.ts` (config Web App Firebase
   memang publik/aman diekspos; keamanan sesungguhnya ada di Security Rules,
   bukan di kerahasiaan config ini).
4. Jalankan/preview seperti aplikasi React+TS biasa di AI Studio.

## ⚖️ Trade-off dibanding versi Postgres/Express

- **Tidak ada JOIN** — relasi (`prodiId`, `kelasId`, dst.) di-resolve di klien
  lewat pemanggilan dokumen tambahan (lihat `lib/firestore.ts`). Cukup cepat untuk
  skala data seperti seed ini; pada skala jauh lebih besar pertimbangkan
  denormalisasi data lebih lanjut.
- **Aggregasi** (dashboard, laporan lintas-koleksi kompleks) lebih terbatas
  dibanding SQL — dashboard di sini memakai `getCountFromServer` sederhana, bukan
  `GROUP BY` seperti versi Prisma.
- **CBT lebih aman** dibanding versi Express: di sini kunci jawaban benar-benar
  tidak bisa dibaca klien mana pun (termasuk admin), hanya Cloud Function yang
  bisa menyentuhnya — versi Express hanya mengandalkan `select` field di query.
