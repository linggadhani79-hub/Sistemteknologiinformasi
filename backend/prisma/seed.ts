import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database SIAKAD Terpadu...');

  // Bersihkan (urutan mengikuti relasi)
  await prisma.$transaction([
    prisma.pesertaWisuda.deleteMany(),
    prisma.periodeWisuda.deleteMany(),
    prisma.kehadiranPjj.deleteMany(),
    prisma.sesiPjj.deleteMany(),
    prisma.pengumpulanTugas.deleteMany(),
    prisma.soalKuis.deleteMany(),
    prisma.kuis.deleteMany(),
    prisma.tugasLms.deleteMany(),
    prisma.modulLms.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.course.deleteMany(),
    prisma.nilai.deleteMany(),
    prisma.kRSDetail.deleteMany(),
    prisma.kRS.deleteMany(),
    prisma.kelas.deleteMany(),
    prisma.mataKuliah.deleteMany(),
    prisma.kurikulum.deleteMany(),
    prisma.indikatorMutu.deleteMany(),
    prisma.standarMutu.deleteMany(),
    prisma.temuanAudit.deleteMany(),
    prisma.auditMutu.deleteMany(),
    prisma.publikasi.deleteMany(),
    prisma.penelitian.deleteMany(),
    prisma.pengabdian.deleteMany(),
    prisma.absensi.deleteMany(),
    prisma.cuti.deleteMany(),
    prisma.payroll.deleteMany(),
    prisma.pegawai.deleteMany(),
    prisma.pendaftar.deleteMany(),
    prisma.gelombangPmb.deleteMany(),
    prisma.feederSyncLog.deleteMany(),
    prisma.feederMapping.deleteMany(),
    prisma.mahasiswa.deleteMany(),
    prisma.dosen.deleteMany(),
    prisma.tahunAkademik.deleteMany(),
    prisma.programStudi.deleteMany(),
    prisma.fakultas.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const pass = await bcrypt.hash('password123', 10);
  const mkUser = (email: string, nama: string, role: any) =>
    prisma.user.create({ data: { email, password: pass, nama, role } });

  // ---- Akun per peran ----
  const admin = await mkUser('admin@kampus.ac.id', 'Administrator Akademik', 'ADMIN_AKADEMIK');
  await mkUser('super@kampus.ac.id', 'Super Admin', 'SUPERADMIN');
  await mkUser('feeder@kampus.ac.id', 'Operator Feeder', 'OPERATOR_FEEDER');
  await mkUser('mutu@kampus.ac.id', 'Auditor Mutu', 'AUDITOR_MUTU');
  await mkUser('hrd@kampus.ac.id', 'Staf Kepegawaian', 'KEPEGAWAIAN');
  await mkUser('lppm@kampus.ac.id', 'Staf LPPM', 'LPPM');

  // ---- Fakultas & Prodi ----
  const ftik = await prisma.fakultas.create({ data: { kode: 'FTIK', nama: 'Fakultas Teknik & Ilmu Komputer' } });
  const feb = await prisma.fakultas.create({ data: { kode: 'FEB', nama: 'Fakultas Ekonomi & Bisnis' } });

  const ti = await prisma.programStudi.create({ data: { kode: '55201', nama: 'Teknik Informatika', jenjang: 'S1', akreditasi: 'Baik Sekali', fakultasId: ftik.id } });
  const si = await prisma.programStudi.create({ data: { kode: '57201', nama: 'Sistem Informasi', jenjang: 'S1', akreditasi: 'Baik', fakultasId: ftik.id } });
  const mnj = await prisma.programStudi.create({ data: { kode: '61201', nama: 'Manajemen', jenjang: 'S1', akreditasi: 'B', fakultasId: feb.id } });

  // ---- Tahun Akademik ----
  const ta = await prisma.tahunAkademik.create({
    data: { kode: '20241', nama: '2024/2025 Ganjil', semester: 'GANJIL', aktif: true, mulai: new Date('2024-09-01'), selesai: new Date('2025-01-31') },
  });
  await prisma.tahunAkademik.create({
    data: { kode: '20242', nama: '2024/2025 Genap', semester: 'GENAP', aktif: false, mulai: new Date('2025-02-01'), selesai: new Date('2025-07-31') },
  });

  // ---- Kurikulum & Mata Kuliah ----
  const kur = await prisma.kurikulum.create({ data: { kode: 'KUR-TI-2024', nama: 'Kurikulum TI 2024 (OBE)', prodiId: ti.id, tahun: 2024 } });
  const mkData = [
    { kode: 'TI101', nama: 'Algoritma & Pemrograman', sks: 3, semester: 1 },
    { kode: 'TI102', nama: 'Matematika Diskrit', sks: 3, semester: 1 },
    { kode: 'TI201', nama: 'Struktur Data', sks: 3, semester: 3 },
    { kode: 'TI202', nama: 'Basis Data', sks: 3, semester: 3 },
    { kode: 'TI301', nama: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5 },
    { kode: 'TI302', nama: 'Kecerdasan Buatan', sks: 3, semester: 5 },
  ];
  const mataKuliah = [];
  for (const m of mkData) {
    mataKuliah.push(await prisma.mataKuliah.create({ data: { ...m, prodiId: ti.id, kurikulumId: kur.id } }));
  }

  // ---- Dosen ----
  const dosenData = [
    { email: 'budi@kampus.ac.id', nama: 'Dr. Budi Santoso, M.Kom', nidn: '0401018501', jabatan: 'LEKTOR', pendidikan: 'S3' },
    { email: 'siti@kampus.ac.id', nama: 'Siti Rahmawati, M.T', nidn: '0405029002', jabatan: 'ASISTEN_AHLI', pendidikan: 'S2' },
    { email: 'agus@kampus.ac.id', nama: 'Agus Wijaya, M.Cs', nidn: '0410038803', jabatan: 'LEKTOR_KEPALA', pendidikan: 'S2' },
  ];
  const dosen = [];
  for (const d of dosenData) {
    const u = await mkUser(d.email, d.nama, 'DOSEN');
    dosen.push(await prisma.dosen.create({ data: { nidn: d.nidn, userId: u.id, prodiId: ti.id, jabatan: d.jabatan as any, pendidikan: d.pendidikan } }));
  }

  // ---- Mahasiswa ----
  const mhsData = [
    { email: 'andi@student.ac.id', nama: 'Andi Pratama', nim: '2024010001', jk: 'L' },
    { email: 'dewi@student.ac.id', nama: 'Dewi Lestari', nim: '2024010002', jk: 'P' },
    { email: 'rizki@student.ac.id', nama: 'Rizki Ramadhan', nim: '2024010003', jk: 'L' },
    { email: 'putri@student.ac.id', nama: 'Putri Anggraini', nim: '2024010004', jk: 'P' },
  ];
  const mahasiswa = [];
  for (const m of mhsData) {
    const u = await mkUser(m.email, m.nama, 'MAHASISWA');
    mahasiswa.push(
      await prisma.mahasiswa.create({
        data: { nim: m.nim, userId: u.id, prodiId: ti.id, angkatan: 2024, jenisKelamin: m.jk, status: 'AKTIF', dosenWaliId: dosen[0].id, nisn: `00${m.nim}` },
      }),
    );
  }

  // ---- Kelas ----
  const kelas = [];
  for (let i = 0; i < 3; i++) {
    kelas.push(
      await prisma.kelas.create({
        data: {
          kode: `${mataKuliah[i].kode}-A`,
          mataKuliahId: mataKuliah[i].id,
          dosenId: dosen[i % dosen.length].id,
          tahunAkademikId: ta.id,
          ruang: `R.${101 + i}`,
          hari: ['SENIN', 'SELASA', 'RABU'][i],
          jamMulai: '08:00',
          jamSelesai: '10:30',
          mode: i === 2 ? 'DARING' : 'LURING',
        },
      }),
    );
  }

  // ---- KRS + Nilai untuk mahasiswa pertama ----
  const krs = await prisma.kRS.create({
    data: {
      mahasiswaId: mahasiswa[0].id,
      tahunAkademikId: ta.id,
      status: 'DISETUJUI',
      totalSks: 9,
      detail: { create: kelas.map((k) => ({ kelasId: k.id })) },
    },
  });
  // Nilai
  const konv = (na: number) => {
    if (na >= 85) return { huruf: 'A', bobot: 4.0 };
    if (na >= 75) return { huruf: 'B+', bobot: 3.3 };
    if (na >= 70) return { huruf: 'B', bobot: 3.0 };
    return { huruf: 'C', bobot: 2.0 };
  };
  const nilaiAngka = [88, 78, 72];
  for (let i = 0; i < kelas.length; i++) {
    const na = nilaiAngka[i];
    const k = konv(na);
    await prisma.nilai.create({
      data: { mahasiswaId: mahasiswa[0].id, kelasId: kelas[i].id, tugas: na, uts: na, uas: na, nilaiAkhir: na, ...k },
    });
  }
  await prisma.mahasiswa.update({ where: { id: mahasiswa[0].id }, data: { ipk: 3.43, totalSks: 9 } });

  // ---- LMS: Course untuk kelas pertama ----
  const course = await prisma.course.create({
    data: {
      kelasId: kelas[0].id,
      deskripsi: 'Kelas daring Algoritma & Pemrograman',
      silabus: 'Pengantar algoritma, tipe data, kontrol alur, fungsi, rekursi.',
      modul: {
        create: [
          { urutan: 1, judul: 'Pengantar Algoritma', tipe: 'MATERI', konten: 'Definisi algoritma dan flowchart.' },
          { urutan: 2, judul: 'Tipe Data & Variabel', tipe: 'VIDEO', url: 'https://example.com/video1' },
        ],
      },
      tugas: { create: [{ judul: 'Tugas 1: Flowchart', deskripsi: 'Buat flowchart menghitung faktorial', bobot: 20 }] },
      kuis: {
        create: [
          {
            judul: 'Kuis 1',
            durasi: 20,
            soal: {
              create: [
                { pertanyaan: 'Struktur kontrol untuk perulangan adalah?', opsiA: 'if', opsiB: 'for', opsiC: 'return', opsiD: 'print', jawaban: 'B' },
                { pertanyaan: 'Tipe data untuk bilangan bulat?', opsiA: 'string', opsiB: 'boolean', opsiC: 'integer', opsiD: 'float', jawaban: 'C' },
              ],
            },
          },
        ],
      },
    },
  });
  for (const m of mahasiswa) await prisma.enrollment.create({ data: { courseId: course.id, mahasiswaId: m.id, progress: 40 } });

  // ---- PJJ: sesi untuk kelas daring ----
  const sesi = await prisma.sesiPjj.create({
    data: { kelasId: kelas[2].id, pertemuanKe: 1, judul: 'Pertemuan 1: Pengantar', tanggal: new Date('2024-09-10'), mode: 'SINKRON', linkMeeting: 'https://meet.example.com/abc', durasiMenit: 100 },
  });
  await prisma.kehadiranPjj.create({ data: { sesiId: sesi.id, mahasiswaId: mahasiswa[0].id, hadir: true, waktuMasuk: new Date() } });

  // ---- SPMI ----
  const standar = await prisma.standarMutu.create({
    data: {
      kode: 'STD-DIK-01',
      nama: 'Standar Kompetensi Lulusan',
      kategori: 'PENDIDIKAN',
      target: 'IPK rata-rata lulusan ≥ 3.25',
      prodiId: ti.id,
      indikator: {
        create: [
          { nama: 'Rata-rata IPK Lulusan', satuan: 'poin', targetNilai: 3.25, capaian: 3.4, tahun: 2024 },
          { nama: 'Masa Studi Rata-rata', satuan: 'tahun', targetNilai: 4.0, capaian: 4.2, tahun: 2024 },
        ],
      },
    },
  });
  const audit = await prisma.auditMutu.create({
    data: { siklus: 'AMI 2024', ruangLingkup: 'Prodi Teknik Informatika', tanggal: new Date('2024-11-15'), auditor: 'Tim AMI LPM', status: 'SELESAI' },
  });
  await prisma.temuanAudit.create({
    data: { auditId: audit.id, kategori: 'MINOR', deskripsi: 'Dokumen RPS beberapa MK belum lengkap', tindakLanjut: 'Melengkapi RPS sebelum semester berikutnya', statusTindak: 'PROSES', batasWaktu: new Date('2025-01-30') },
  });

  // ---- PMB ----
  const gelombang = await prisma.gelombangPmb.create({
    data: { nama: 'Gelombang 1 TA 2025/2026', tahun: 2025, mulai: new Date('2025-01-01'), selesai: new Date('2025-06-30'), biaya: 300000, aktif: true },
  });
  const calon = await mkUser('calon@gmail.com', 'Calon Mahasiswa Baru', 'CALON_MAHASISWA');
  await prisma.pendaftar.create({
    data: { noPendaftaran: 'PMB20250001', userId: calon.id, gelombangId: gelombang.id, nama: 'Calon Mahasiswa Baru', email: 'calon@gmail.com', asalSekolah: 'SMAN 1 Jakarta', pilihanProdi1: ti.id, pilihanProdi2: si.id, status: 'VERIFIKASI' },
  });

  // ---- Kepegawaian ----
  const pegData = [
    { nip: '198501012010011001', nama: 'Dr. Budi Santoso, M.Kom', jenis: 'DOSEN', jabatan: 'Kaprodi TI', unitKerja: 'FTIK', gaji: 6000000 },
    { nip: '199002052015012002', nama: 'Siti Rahmawati, M.T', jenis: 'DOSEN', jabatan: 'Dosen', unitKerja: 'FTIK', gaji: 5000000 },
    { nip: '199203102018011003', nama: 'Joko Susilo', jenis: 'TENDIK', jabatan: 'Staf Administrasi', unitKerja: 'BAAK', gaji: 4000000 },
  ];
  for (const p of pegData) {
    await prisma.pegawai.create({
      data: { nip: p.nip, nama: p.nama, jenis: p.jenis, jabatan: p.jabatan, unitKerja: p.unitKerja, gajiPokok: p.gaji, status: 'TETAP', tglMasuk: new Date('2015-01-01') },
    });
  }

  // ---- LPPM ----
  await prisma.penelitian.create({
    data: { judul: 'Implementasi Machine Learning untuk Prediksi Kelulusan', ketuaId: dosen[0].id, tahun: 2024, skema: 'Hibah Internal', danaUsulan: 25000000, danaDisetujui: 20000000, status: 'DIDANAI', luaran: 'Jurnal SINTA 2' },
  });
  await prisma.pengabdian.create({
    data: { judul: 'Pelatihan Literasi Digital untuk UMKM', ketuaId: dosen[1].id, tahun: 2024, mitra: 'Komunitas UMKM Bandung', lokasi: 'Bandung', danaUsulan: 10000000, status: 'DIDANAI' },
  });
  await prisma.publikasi.create({
    data: { judul: 'A Deep Learning Approach for Student Performance Prediction', penulisId: dosen[0].id, jenis: 'JURNAL', namaMedia: 'Jurnal Teknologi Informasi', tahun: 2024, indeksasi: 'Scopus Q3', doi: '10.1234/jti.2024.001' },
  });

  // ---- Wisuda ----
  const periodeWisuda = await prisma.periodeWisuda.create({
    data: {
      kode: 'WSD-2025-1',
      nama: 'Wisuda Periode I TA 2024/2025',
      tanggal: new Date('2025-03-15'),
      lokasi: 'Auditorium Utama Kampus',
      kuota: 500,
      biaya: 1500000,
      aktif: true,
    },
  });
  const predikatOf = (ipk: number) =>
    ipk >= 3.51 ? 'CUMLAUDE' : ipk >= 3.01 ? 'SANGAT_MEMUASKAN' : ipk >= 2.76 ? 'MEMUASKAN' : 'CUKUP';
  const judulSkripsi = [
    'Sistem Rekomendasi Mata Kuliah Berbasis Collaborative Filtering',
    'Analisis Sentimen Ulasan Mahasiswa Menggunakan Deep Learning',
    'Optimasi Rute Distribusi dengan Algoritma Genetika',
    'Deteksi Plagiarisme Dokumen Akademik Berbasis NLP',
  ];
  for (let i = 0; i < mahasiswa.length; i++) {
    const m = mahasiswa[i];
    const ipk = m.ipk || 3.4;
    await prisma.mahasiswa.update({ where: { id: m.id }, data: { foto: `https://i.pravatar.cc/400?img=${i + 11}` } });
    await prisma.pesertaWisuda.create({
      data: {
        periodeId: periodeWisuda.id,
        mahasiswaId: m.id,
        nomorUrut: i + 1,
        noIjazah: `WSD-2025-1/${String(i + 1).padStart(4, '0')}/2025`,
        judulSkripsi: judulSkripsi[i % judulSkripsi.length],
        ipk,
        predikat: predikatOf(ipk),
        fotoUrl: `https://i.pravatar.cc/400?img=${i + 11}`,
        status: 'DITERIMA',
      },
    });
  }

  // ---- Feeder mapping contoh ----
  await prisma.feederMapping.createMany({
    data: [
      { entitas: 'PRODI', kodeLokal: ti.kode, idFeeder: 'a1b2c3-ti', keterangan: 'Teknik Informatika' },
      { entitas: 'SEMESTER', kodeLokal: '20241', idFeeder: '20241', keterangan: '2024 Ganjil' },
    ],
  });

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
