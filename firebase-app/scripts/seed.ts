// Seed data demo untuk SIAKAD Terpadu (Firebase Edition).
// Jalankan lokal ke Emulator Suite: pastikan emulator sudah `firebase emulators:start`
// di terminal lain, lalu `npm run seed` (env FIRESTORE_EMULATOR_HOST dkk di bawah).
// Untuk seed ke project Firebase ASLI: hapus/comment blok "emulator env" & pastikan
// GOOGLE_APPLICATION_CREDENTIALS menunjuk service-account key yang sah.
import admin from 'firebase-admin';

// ---- Emulator env (hapus/comment bagian ini untuk seed ke project asli) ----
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199';

admin.initializeApp({ projectId: 'siakad-demo' });
const db = admin.firestore();
const auth = admin.auth();

async function mkUser(email: string, nama: string, role: string, password = 'password123') {
  const user = await auth.createUser({ email, password, displayName: nama });
  await db.collection('users').doc(user.uid).set({ email, nama, role, isActive: true, createdAt: Date.now() });
  return user.uid;
}

function predikatOf(ipk: number) {
  return ipk >= 3.51 ? 'CUMLAUDE' : ipk >= 3.01 ? 'SANGAT_MEMUASKAN' : ipk >= 2.76 ? 'MEMUASKAN' : 'CUKUP';
}

async function main() {
  console.log('🌱 Seeding SIAKAD Terpadu (Firebase Edition)...');

  // ---- Akun staf ----
  await mkUser('admin@kampus.ac.id', 'Administrator Akademik', 'ADMIN_AKADEMIK');
  await mkUser('super@kampus.ac.id', 'Super Admin', 'SUPERADMIN');
  await mkUser('feeder@kampus.ac.id', 'Operator Feeder', 'OPERATOR_FEEDER');
  await mkUser('mutu@kampus.ac.id', 'Auditor Mutu', 'AUDITOR_MUTU');
  await mkUser('hrd@kampus.ac.id', 'Staf Kepegawaian', 'KEPEGAWAIAN');
  await mkUser('lppm@kampus.ac.id', 'Staf LPPM', 'LPPM');

  // ---- Fakultas & Prodi ----
  const ftikId = 'ftik';
  const febId = 'feb';
  await db.collection('fakultas').doc(ftikId).set({ kode: 'FTIK', nama: 'Fakultas Teknik & Ilmu Komputer' });
  await db.collection('fakultas').doc(febId).set({ kode: 'FEB', nama: 'Fakultas Ekonomi & Bisnis' });

  const tiId = 'ti', siId = 'si', mnjId = 'mnj';
  await db.collection('prodi').doc(tiId).set({ kode: '55201', nama: 'Teknik Informatika', jenjang: 'S1', akreditasi: 'Baik Sekali', fakultasId: ftikId });
  await db.collection('prodi').doc(siId).set({ kode: '57201', nama: 'Sistem Informasi', jenjang: 'S1', akreditasi: 'Baik', fakultasId: ftikId });
  await db.collection('prodi').doc(mnjId).set({ kode: '61201', nama: 'Manajemen', jenjang: 'S1', akreditasi: 'B', fakultasId: febId });

  // ---- Tahun Akademik ----
  const taId = 'ta-20241';
  await db.collection('tahunAkademik').doc(taId).set({ kode: '20241', nama: '2024/2025 Ganjil', semester: 'GANJIL', aktif: true, mulai: new Date('2024-09-01').getTime(), selesai: new Date('2025-01-31').getTime() });
  await db.collection('tahunAkademik').doc('ta-20242').set({ kode: '20242', nama: '2024/2025 Genap', semester: 'GENAP', aktif: false, mulai: new Date('2025-02-01').getTime(), selesai: new Date('2025-07-31').getTime() });

  // ---- Kurikulum & Mata Kuliah ----
  const kurId = 'kur-ti-2024';
  await db.collection('kurikulum').doc(kurId).set({ kode: 'KUR-TI-2024', nama: 'Kurikulum TI 2024 (OBE)', prodiId: tiId, tahun: 2024, aktif: true });
  const mkData = [
    { id: 'mk-ti101', kode: 'TI101', nama: 'Algoritma & Pemrograman', sks: 3, semester: 1 },
    { id: 'mk-ti102', kode: 'TI102', nama: 'Matematika Diskrit', sks: 3, semester: 1 },
    { id: 'mk-ti201', kode: 'TI201', nama: 'Struktur Data', sks: 3, semester: 3 },
    { id: 'mk-ti202', kode: 'TI202', nama: 'Basis Data', sks: 3, semester: 3 },
    { id: 'mk-ti301', kode: 'TI301', nama: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5 },
    { id: 'mk-ti302', kode: 'TI302', nama: 'Kecerdasan Buatan', sks: 3, semester: 5 },
  ];
  for (const m of mkData) {
    await db.collection('mataKuliah').doc(m.id).set({ kode: m.kode, nama: m.nama, sks: m.sks, semester: m.semester, jenis: 'WAJIB', prodiId: tiId, kurikulumId: kurId });
  }

  // ---- Dosen ----
  const dosenData = [
    { email: 'budi@kampus.ac.id', nama: 'Dr. Budi Santoso, M.Kom', nidn: '0401018501', jabatan: 'LEKTOR', pendidikan: 'S3' },
    { email: 'siti@kampus.ac.id', nama: 'Siti Rahmawati, M.T', nidn: '0405029002', jabatan: 'ASISTEN_AHLI', pendidikan: 'S2' },
    { email: 'agus@kampus.ac.id', nama: 'Agus Wijaya, M.Cs', nidn: '0410038803', jabatan: 'LEKTOR_KEPALA', pendidikan: 'S2' },
  ];
  const dosenIds: string[] = [];
  for (const d of dosenData) {
    const uid = await mkUser(d.email, d.nama, 'DOSEN');
    await db.collection('dosen').doc(uid).set({ nidn: d.nidn, prodiId: tiId, jabatan: d.jabatan, pendidikan: d.pendidikan, createdAt: Date.now() });
    dosenIds.push(uid);
  }

  // ---- Mahasiswa ----
  const mhsData = [
    { email: 'andi@student.ac.id', nama: 'Andi Pratama', nim: '2024010001', jk: 'L' },
    { email: 'dewi@student.ac.id', nama: 'Dewi Lestari', nim: '2024010002', jk: 'P' },
    { email: 'rizki@student.ac.id', nama: 'Rizki Ramadhan', nim: '2024010003', jk: 'L' },
    { email: 'putri@student.ac.id', nama: 'Putri Anggraini', nim: '2024010004', jk: 'P' },
  ];
  const mhsIds: string[] = [];
  for (let i = 0; i < mhsData.length; i++) {
    const m = mhsData[i];
    const uid = await mkUser(m.email, m.nama, 'MAHASISWA');
    await db.collection('mahasiswa').doc(uid).set({
      nim: m.nim, prodiId: tiId, angkatan: 2024, status: 'AKTIF', ipk: 0, totalSks: 0,
      jenisKelamin: m.jk, dosenWaliId: dosenIds[0], nisn: `00${m.nim}`,
      foto: `https://i.pravatar.cc/400?img=${i + 11}`, createdAt: Date.now(),
    });
    mhsIds.push(uid);
  }

  // ---- Kelas ----
  const kelasMeta = [
    { id: 'kelas-ti101-a', mk: 'mk-ti101', hari: 'SENIN', mode: 'LURING' },
    { id: 'kelas-ti102-a', mk: 'mk-ti102', hari: 'SELASA', mode: 'LURING' },
    { id: 'kelas-ti201-a', mk: 'mk-ti201', hari: 'RABU', mode: 'DARING' },
  ];
  for (let i = 0; i < kelasMeta.length; i++) {
    const k = kelasMeta[i];
    await db.collection('kelas').doc(k.id).set({
      kode: `${mkData[i].kode}-A`, mataKuliahId: k.mk, dosenId: dosenIds[i % dosenIds.length], tahunAkademikId: taId,
      ruang: `R.${101 + i}`, hari: k.hari, jamMulai: '08:00', jamSelesai: '10:30', kuota: 40, mode: k.mode,
    });
  }
  const kelasIds = kelasMeta.map((k) => k.id);

  // ---- KRS + Nilai untuk mahasiswa pertama ----
  await db.collection('krs').doc(`${mhsIds[0]}_${taId}`).set({
    mahasiswaId: mhsIds[0], tahunAkademikId: taId, status: 'DISETUJUI', totalSks: 9, kelasIds, createdAt: Date.now(),
  });
  const konv = (na: number) => (na >= 85 ? { huruf: 'A', bobot: 4.0 } : na >= 75 ? { huruf: 'B+', bobot: 3.3 } : na >= 70 ? { huruf: 'B', bobot: 3.0 } : { huruf: 'C', bobot: 2.0 });
  const nilaiAngka = [88, 78, 72];
  for (let i = 0; i < kelasIds.length; i++) {
    const na = nilaiAngka[i];
    const k = konv(na);
    await db.collection('nilai').doc(`${mhsIds[0]}_${kelasIds[i]}`).set({
      mahasiswaId: mhsIds[0], kelasId: kelasIds[i], tugas: na, uts: na, uas: na, nilaiAkhir: na, ...k, createdAt: Date.now(),
    });
  }
  await db.collection('mahasiswa').doc(mhsIds[0]).update({ ipk: 3.43, totalSks: 9 });

  // ---- LMS: Course untuk kelas pertama ----
  const courseId = kelasIds[0];
  await db.collection('course').doc(courseId).set({ kelasId: kelasIds[0], deskripsi: 'Kelas daring Algoritma & Pemrograman', silabus: 'Pengantar algoritma, tipe data, kontrol alur, fungsi, rekursi.' });
  await db.collection('modulLms').add({ courseId, urutan: 1, judul: 'Pengantar Algoritma', tipe: 'MATERI', konten: 'Definisi algoritma dan flowchart.' });
  await db.collection('modulLms').add({ courseId, urutan: 2, judul: 'Tipe Data & Variabel', tipe: 'VIDEO', url: 'https://example.com/video1' });
  await db.collection('tugasLms').add({ courseId, judul: 'Tugas 1: Flowchart', deskripsi: 'Buat flowchart menghitung faktorial', bobot: 20 });
  const kuisRef = await db.collection('kuis').add({ courseId, judul: 'Kuis 1', durasi: 20 });
  await db.collection('soalKuis').add({ kuisId: kuisRef.id, pertanyaan: 'Struktur kontrol untuk perulangan adalah?', opsiA: 'if', opsiB: 'for', opsiC: 'return', opsiD: 'print', jawaban: 'B' });
  await db.collection('soalKuis').add({ kuisId: kuisRef.id, pertanyaan: 'Tipe data untuk bilangan bulat?', opsiA: 'string', opsiB: 'boolean', opsiC: 'integer', opsiD: 'float', jawaban: 'C' });
  for (const mid of mhsIds) await db.collection('enrollment').doc(`${courseId}_${mid}`).set({ courseId, mahasiswaId: mid, progress: 40, createdAt: Date.now() });

  // ---- PJJ ----
  const sesiRef = await db.collection('sesiPjj').add({ kelasId: kelasIds[2], pertemuanKe: 1, judul: 'Pertemuan 1: Pengantar', tanggal: new Date('2024-09-10').getTime(), mode: 'SINKRON', linkMeeting: 'https://meet.example.com/abc', durasiMenit: 100 });
  await db.collection('kehadiranPjj').doc(`${sesiRef.id}_${mhsIds[0]}`).set({ sesiId: sesiRef.id, mahasiswaId: mhsIds[0], hadir: true, waktuMasuk: Date.now() });

  // ---- SPMI ----
  const standarRef = await db.collection('standarMutu').add({ kode: 'STD-DIK-01', nama: 'Standar Kompetensi Lulusan', kategori: 'PENDIDIKAN', target: 'IPK rata-rata lulusan ≥ 3.25', prodiId: tiId });
  await db.collection('indikatorMutu').add({ standarId: standarRef.id, nama: 'Rata-rata IPK Lulusan', satuan: 'poin', targetNilai: 3.25, capaian: 3.4, tahun: 2024 });
  await db.collection('indikatorMutu').add({ standarId: standarRef.id, nama: 'Masa Studi Rata-rata', satuan: 'tahun', targetNilai: 4.0, capaian: 4.2, tahun: 2024 });
  const auditRef = await db.collection('auditMutu').add({ siklus: 'AMI 2024', ruangLingkup: 'Prodi Teknik Informatika', tanggal: new Date('2024-11-15').getTime(), auditor: 'Tim AMI LPM', status: 'SELESAI' });
  await db.collection('temuanAudit').add({ auditId: auditRef.id, kategori: 'MINOR', deskripsi: 'Dokumen RPS beberapa MK belum lengkap', tindakLanjut: 'Melengkapi RPS sebelum semester berikutnya', statusTindak: 'PROSES', batasWaktu: new Date('2025-01-30').getTime() });

  // ---- PMB ----
  const gelombangRef = await db.collection('gelombangPmb').add({ nama: 'Gelombang 1 TA 2025/2026', tahun: 2025, mulai: new Date('2025-01-01').getTime(), selesai: new Date('2025-06-30').getTime(), biaya: 300000, aktif: true });
  const calonUid = await mkUser('calon@gmail.com', 'Calon Mahasiswa Baru', 'CALON_MAHASISWA');
  await db.collection('pendaftar').doc(calonUid).set({
    noPendaftaran: 'PMB20250001', gelombangId: gelombangRef.id, nama: 'Calon Mahasiswa Baru', email: 'calon@gmail.com', hp: '081234567890',
    asalSekolah: 'SMAN 1 Jakarta', pilihanProdi1: tiId, pilihanProdi2: siId, status: 'VERIFIKASI', createdAt: Date.now(),
  });

  // Konfigurasi Virtual Account per bank
  await db.collection('konfigurasiVA').doc('BRI').set({ namaBank: 'Bank BRI', kodeBank: '002', prefixVA: '88810', aktif: true });
  await db.collection('konfigurasiVA').doc('MANDIRI').set({ namaBank: 'Bank Mandiri', kodeBank: '008', prefixVA: '89080', aktif: true });
  await db.collection('konfigurasiVA').doc('BTN').set({ namaBank: 'Bank BTN', kodeBank: '200', prefixVA: '88060', aktif: true });

  // Bank soal CBT (public + kunci terpisah — kunci tidak pernah dibaca klien)
  const soalCbt = [
    { kategori: 'TPA', pertanyaan: 'Jika A > B dan B > C, maka …', opsiA: 'A < C', opsiB: 'A > C', opsiC: 'A = C', opsiD: 'Tidak dapat ditentukan', jawaban: 'B' },
    { kategori: 'TPA', pertanyaan: 'Lawan kata dari "OPTIMIS" adalah …', opsiA: 'Yakin', opsiB: 'Ragu', opsiC: 'Pesimis', opsiD: 'Percaya', jawaban: 'C' },
    { kategori: 'MATEMATIKA', pertanyaan: 'Hasil dari 15 × 12 adalah …', opsiA: '170', opsiB: '180', opsiC: '190', opsiD: '160', jawaban: 'B' },
    { kategori: 'MATEMATIKA', pertanyaan: 'Jika 2x + 6 = 20, maka x = …', opsiA: '5', opsiB: '6', opsiC: '7', opsiD: '8', jawaban: 'C' },
    { kategori: 'BAHASA_INDONESIA', pertanyaan: 'Kalimat baku yang benar adalah …', opsiA: 'Saya pergi kepasar', opsiB: 'Saya pergi ke pasar', opsiC: 'Saya pergi kepada pasar', opsiD: 'Saya pergi di pasar', jawaban: 'B' },
    { kategori: 'BAHASA_INGGRIS', pertanyaan: 'She ___ to school every day.', opsiA: 'go', opsiB: 'goes', opsiC: 'going', opsiD: 'gone', jawaban: 'B' },
  ];
  for (const s of soalCbt) {
    const { jawaban, ...publik } = s;
    const ref = await db.collection('soalCbtPublic').add(publik);
    await db.collection('soalCbtKunci').doc(ref.id).set({ jawaban });
  }

  // ---- Kepegawaian ----
  const pegData = [
    { nip: '198501012010011001', nama: 'Dr. Budi Santoso, M.Kom', jenis: 'DOSEN', jabatan: 'Kaprodi TI', unitKerja: 'FTIK', gaji: 6000000 },
    { nip: '199002052015012002', nama: 'Siti Rahmawati, M.T', jenis: 'DOSEN', jabatan: 'Dosen', unitKerja: 'FTIK', gaji: 5000000 },
    { nip: '199203102018011003', nama: 'Joko Susilo', jenis: 'TENDIK', jabatan: 'Staf Administrasi', unitKerja: 'BAAK', gaji: 4000000 },
  ];
  for (const p of pegData) {
    await db.collection('pegawai').add({ nip: p.nip, nama: p.nama, jenis: p.jenis, jabatan: p.jabatan, unitKerja: p.unitKerja, gajiPokok: p.gaji, status: 'TETAP', tglMasuk: new Date('2015-01-01').getTime() });
  }

  // ---- LPPM ----
  await db.collection('penelitian').add({ judul: 'Implementasi Machine Learning untuk Prediksi Kelulusan', ketuaId: dosenIds[0], tahun: 2024, skema: 'Hibah Internal', danaUsulan: 25000000, danaDisetujui: 20000000, status: 'DIDANAI', luaran: 'Jurnal SINTA 2', createdAt: Date.now() });
  await db.collection('pengabdian').add({ judul: 'Pelatihan Literasi Digital untuk UMKM', ketuaId: dosenIds[1], tahun: 2024, mitra: 'Komunitas UMKM Bandung', lokasi: 'Bandung', danaUsulan: 10000000, status: 'DIDANAI', createdAt: Date.now() });
  await db.collection('publikasi').add({ judul: 'A Deep Learning Approach for Student Performance Prediction', penulisId: dosenIds[0], jenis: 'JURNAL', namaMedia: 'Jurnal Teknologi Informasi', tahun: 2024, indeksasi: 'Scopus Q3', doi: '10.1234/jti.2024.001' });

  // ---- Wisuda ----
  const periodeRef = await db.collection('periodeWisuda').add({ kode: 'WSD-2025-1', nama: 'Wisuda Periode I TA 2024/2025', tanggal: new Date('2025-03-15').getTime(), lokasi: 'Auditorium Utama Kampus', kuota: 500, biaya: 1500000, aktif: true });
  const judulSkripsi = [
    'Sistem Rekomendasi Mata Kuliah Berbasis Collaborative Filtering',
    'Analisis Sentimen Ulasan Mahasiswa Menggunakan Deep Learning',
    'Optimasi Rute Distribusi dengan Algoritma Genetika',
    'Deteksi Plagiarisme Dokumen Akademik Berbasis NLP',
  ];
  for (let i = 0; i < mhsIds.length; i++) {
    const ipk = i === 0 ? 3.43 : 3.4;
    await db.collection('pesertaWisuda').doc(`${periodeRef.id}_${mhsIds[i]}`).set({
      periodeId: periodeRef.id, mahasiswaId: mhsIds[i], nomorUrut: i + 1,
      noIjazah: `WSD-2025-1/${String(i + 1).padStart(4, '0')}/2025`,
      judulSkripsi: judulSkripsi[i % judulSkripsi.length], ipk, predikat: predikatOf(ipk),
      fotoUrl: `https://i.pravatar.cc/400?img=${i + 11}`, status: 'DITERIMA', tanggalDaftar: Date.now(),
    });
  }

  // ---- Feeder mapping ----
  await db.collection('feederMapping').add({ entitas: 'PRODI', kodeLokal: '55201', idFeeder: 'a1b2c3-ti', keterangan: 'Teknik Informatika' });
  await db.collection('feederMapping').add({ entitas: 'SEMESTER', kodeLokal: '20241', idFeeder: '20241', keterangan: '2024 Ganjil' });

  console.log('✅ Seed selesai.');
  console.log('   Login demo (password semua: password123):');
  console.log('   - admin@kampus.ac.id    (Admin Akademik)');
  console.log('   - budi@kampus.ac.id     (Dosen)');
  console.log('   - andi@student.ac.id    (Mahasiswa)');
  console.log('   - feeder@kampus.ac.id   (Operator Neofeeder)');
  console.log('   - mutu@kampus.ac.id     (Auditor SPMI)');
  console.log('   - hrd@kampus.ac.id      (Kepegawaian)');
  console.log('   - lppm@kampus.ac.id     (LPPM)');
  console.log('   - calon@gmail.com       (Calon Mahasiswa/PMB)');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
