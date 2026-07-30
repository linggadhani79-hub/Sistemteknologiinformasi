-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN', 'MAHASISWA', 'OPERATOR_FEEDER', 'AUDITOR_MUTU', 'KEPEGAWAIAN', 'LPPM', 'CALON_MAHASISWA');

-- CreateEnum
CREATE TYPE "StatusMahasiswa" AS ENUM ('AKTIF', 'CUTI', 'LULUS', 'DROP_OUT', 'MENGUNDURKAN_DIRI', 'NON_AKTIF');

-- CreateEnum
CREATE TYPE "JabatanFungsional" AS ENUM ('ASISTEN_AHLI', 'LEKTOR', 'LEKTOR_KEPALA', 'GURU_BESAR', 'TENAGA_PENGAJAR');

-- CreateEnum
CREATE TYPE "StatusKRS" AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "FeederStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "StatusAudit" AS ENUM ('DIRENCANAKAN', 'BERLANGSUNG', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusPendaftar" AS ENUM ('DAFTAR', 'BAYAR', 'VERIFIKASI', 'UJIAN', 'DITERIMA', 'DITOLAK', 'DAFTAR_ULANG');

-- CreateEnum
CREATE TYPE "StatusPegawai" AS ENUM ('TETAP', 'KONTRAK', 'HONORER', 'PENSIUN');

-- CreateEnum
CREATE TYPE "StatusUsulan" AS ENUM ('DIAJUKAN', 'REVIEW', 'DIDANAI', 'DITOLAK', 'SELESAI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MAHASISWA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fakultas" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Fakultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramStudi" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "akreditasi" TEXT,
    "fakultasId" TEXT NOT NULL,

    CONSTRAINT "ProgramStudi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TahunAkademik" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TahunAkademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mahasiswa" (
    "id" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prodiId" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "status" "StatusMahasiswa" NOT NULL DEFAULT 'AKTIF',
    "ipk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSks" INTEGER NOT NULL DEFAULT 0,
    "nisn" TEXT,
    "jenisKelamin" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "tempatLahir" TEXT,
    "alamat" TEXT,
    "hp" TEXT,
    "dosenWaliId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dosen" (
    "id" TEXT NOT NULL,
    "nidn" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prodiId" TEXT NOT NULL,
    "jabatan" "JabatanFungsional" NOT NULL DEFAULT 'TENAGA_PENGAJAR',
    "pendidikan" TEXT,
    "hp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kurikulum" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "prodiId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Kurikulum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MataKuliah" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'WAJIB',
    "prodiId" TEXT NOT NULL,
    "kurikulumId" TEXT,

    CONSTRAINT "MataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "mataKuliahId" TEXT NOT NULL,
    "dosenId" TEXT NOT NULL,
    "tahunAkademikId" TEXT NOT NULL,
    "ruang" TEXT,
    "hari" TEXT,
    "jamMulai" TEXT,
    "jamSelesai" TEXT,
    "kuota" INTEGER NOT NULL DEFAULT 40,
    "mode" TEXT NOT NULL DEFAULT 'LURING',

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRS" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "tahunAkademikId" TEXT NOT NULL,
    "status" "StatusKRS" NOT NULL DEFAULT 'DRAFT',
    "totalSks" INTEGER NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRSDetail" (
    "id" TEXT NOT NULL,
    "krsId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,

    CONSTRAINT "KRSDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "tugas" DOUBLE PRECISION,
    "uts" DOUBLE PRECISION,
    "uas" DOUBLE PRECISION,
    "nilaiAkhir" DOUBLE PRECISION,
    "huruf" TEXT,
    "bobot" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeederSyncLog" (
    "id" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "tahunAkademikId" TEXT,
    "status" "FeederStatus" NOT NULL DEFAULT 'PENDING',
    "jumlahRecord" INTEGER NOT NULL DEFAULT 0,
    "jumlahBerhasil" INTEGER NOT NULL DEFAULT 0,
    "jumlahGagal" INTEGER NOT NULL DEFAULT 0,
    "pesan" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeederSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeederMapping" (
    "id" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "kodeLokal" TEXT NOT NULL,
    "idFeeder" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "FeederMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesiPjj" (
    "id" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "pertemuanKe" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'SINKRON',
    "linkMeeting" TEXT,
    "rekaman" TEXT,
    "materi" TEXT,
    "durasiMenit" INTEGER,

    CONSTRAINT "SesiPjj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KehadiranPjj" (
    "id" TEXT NOT NULL,
    "sesiId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "hadir" BOOLEAN NOT NULL DEFAULT false,
    "waktuMasuk" TIMESTAMP(3),
    "keterangan" TEXT,

    CONSTRAINT "KehadiranPjj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandarMutu" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "target" TEXT,
    "prodiId" TEXT,

    CONSTRAINT "StandarMutu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndikatorMutu" (
    "id" TEXT NOT NULL,
    "standarId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT,
    "targetNilai" DOUBLE PRECISION,
    "capaian" DOUBLE PRECISION,
    "tahun" INTEGER NOT NULL,

    CONSTRAINT "IndikatorMutu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditMutu" (
    "id" TEXT NOT NULL,
    "siklus" TEXT NOT NULL,
    "ruangLingkup" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "auditor" TEXT NOT NULL,
    "status" "StatusAudit" NOT NULL DEFAULT 'DIRENCANAKAN',

    CONSTRAINT "AuditMutu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemuanAudit" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "akarMasalah" TEXT,
    "tindakLanjut" TEXT,
    "statusTindak" TEXT NOT NULL DEFAULT 'TERBUKA',
    "batasWaktu" TIMESTAMP(3),

    CONSTRAINT "TemuanAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "deskripsi" TEXT,
    "silabus" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulLms" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "konten" TEXT,
    "tipe" TEXT NOT NULL DEFAULT 'MATERI',
    "url" TEXT,

    CONSTRAINT "ModulLms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TugasLms" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "deadline" TIMESTAMP(3),
    "bobot" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TugasLms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengumpulanTugas" (
    "id" TEXT NOT NULL,
    "tugasId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "catatan" TEXT,
    "nilai" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PengumpulanTugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kuis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "durasi" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Kuis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoalKuis" (
    "id" TEXT NOT NULL,
    "kuisId" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "opsiA" TEXT NOT NULL,
    "opsiB" TEXT NOT NULL,
    "opsiC" TEXT NOT NULL,
    "opsiD" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,

    CONSTRAINT "SoalKuis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GelombangPmb" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,
    "biaya" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GelombangPmb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendaftar" (
    "id" TEXT NOT NULL,
    "noPendaftaran" TEXT NOT NULL,
    "userId" TEXT,
    "gelombangId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hp" TEXT,
    "asalSekolah" TEXT,
    "pilihanProdi1" TEXT,
    "pilihanProdi2" TEXT,
    "status" "StatusPendaftar" NOT NULL DEFAULT 'DAFTAR',
    "nilaiUjian" DOUBLE PRECISION,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pendaftar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pegawai" (
    "id" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "userId" TEXT,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'DOSEN',
    "status" "StatusPegawai" NOT NULL DEFAULT 'TETAP',
    "unitKerja" TEXT,
    "jabatan" TEXT,
    "golongan" TEXT,
    "tglMasuk" TIMESTAMP(3),
    "gajiPokok" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hp" TEXT,

    CONSTRAINT "Pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jamMasuk" TEXT,
    "jamPulang" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HADIR',

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuti" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,
    "alasan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIAJUKAN',

    CONSTRAINT "Cuti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "gajiPokok" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tunjangan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potongan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGaji" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penelitian" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "ketuaId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "skema" TEXT,
    "danaUsulan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "danaDisetujui" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "StatusUsulan" NOT NULL DEFAULT 'DIAJUKAN',
    "luaran" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penelitian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengabdian" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "ketuaId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "mitra" TEXT,
    "lokasi" TEXT,
    "danaUsulan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "StatusUsulan" NOT NULL DEFAULT 'DIAJUKAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pengabdian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publikasi" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "penulisId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "namaMedia" TEXT,
    "tahun" INTEGER NOT NULL,
    "indeksasi" TEXT,
    "doi" TEXT,
    "url" TEXT,

    CONSTRAINT "Publikasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fakultas_kode_key" ON "Fakultas"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramStudi_kode_key" ON "ProgramStudi"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "TahunAkademik_kode_key" ON "TahunAkademik"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Mahasiswa_nim_key" ON "Mahasiswa"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "Mahasiswa_userId_key" ON "Mahasiswa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dosen_nidn_key" ON "Dosen"("nidn");

-- CreateIndex
CREATE UNIQUE INDEX "Dosen_userId_key" ON "Dosen"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kurikulum_kode_key" ON "Kurikulum"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "MataKuliah_kode_key" ON "MataKuliah"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_kode_key" ON "Kelas"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "KRS_mahasiswaId_tahunAkademikId_key" ON "KRS"("mahasiswaId", "tahunAkademikId");

-- CreateIndex
CREATE UNIQUE INDEX "KRSDetail_krsId_kelasId_key" ON "KRSDetail"("krsId", "kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "Nilai_mahasiswaId_kelasId_key" ON "Nilai"("mahasiswaId", "kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "FeederMapping_entitas_kodeLokal_key" ON "FeederMapping"("entitas", "kodeLokal");

-- CreateIndex
CREATE UNIQUE INDEX "KehadiranPjj_sesiId_mahasiswaId_key" ON "KehadiranPjj"("sesiId", "mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "StandarMutu_kode_key" ON "StandarMutu"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Course_kelasId_key" ON "Course"("kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_courseId_mahasiswaId_key" ON "Enrollment"("courseId", "mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "PengumpulanTugas_tugasId_mahasiswaId_key" ON "PengumpulanTugas"("tugasId", "mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_noPendaftaran_key" ON "Pendaftar"("noPendaftaran");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_userId_key" ON "Pendaftar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "Pegawai"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_userId_key" ON "Pegawai"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_pegawaiId_tanggal_key" ON "Absensi"("pegawaiId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_pegawaiId_periode_key" ON "Payroll"("pegawaiId", "periode");

-- AddForeignKey
ALTER TABLE "ProgramStudi" ADD CONSTRAINT "ProgramStudi_fakultasId_fkey" FOREIGN KEY ("fakultasId") REFERENCES "Fakultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "ProgramStudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_dosenWaliId_fkey" FOREIGN KEY ("dosenWaliId") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dosen" ADD CONSTRAINT "Dosen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dosen" ADD CONSTRAINT "Dosen_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "ProgramStudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kurikulum" ADD CONSTRAINT "Kurikulum_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "ProgramStudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MataKuliah" ADD CONSTRAINT "MataKuliah_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "ProgramStudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MataKuliah" ADD CONSTRAINT "MataKuliah_kurikulumId_fkey" FOREIGN KEY ("kurikulumId") REFERENCES "Kurikulum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRSDetail" ADD CONSTRAINT "KRSDetail_krsId_fkey" FOREIGN KEY ("krsId") REFERENCES "KRS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRSDetail" ADD CONSTRAINT "KRSDetail_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeederSyncLog" ADD CONSTRAINT "FeederSyncLog_tahunAkademikId_fkey" FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesiPjj" ADD CONSTRAINT "SesiPjj_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KehadiranPjj" ADD CONSTRAINT "KehadiranPjj_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiPjj"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KehadiranPjj" ADD CONSTRAINT "KehadiranPjj_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandarMutu" ADD CONSTRAINT "StandarMutu_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "ProgramStudi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndikatorMutu" ADD CONSTRAINT "IndikatorMutu_standarId_fkey" FOREIGN KEY ("standarId") REFERENCES "StandarMutu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemuanAudit" ADD CONSTRAINT "TemuanAudit_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "AuditMutu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulLms" ADD CONSTRAINT "ModulLms_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TugasLms" ADD CONSTRAINT "TugasLms_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengumpulanTugas" ADD CONSTRAINT "PengumpulanTugas_tugasId_fkey" FOREIGN KEY ("tugasId") REFERENCES "TugasLms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kuis" ADD CONSTRAINT "Kuis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoalKuis" ADD CONSTRAINT "SoalKuis_kuisId_fkey" FOREIGN KEY ("kuisId") REFERENCES "Kuis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_gelombangId_fkey" FOREIGN KEY ("gelombangId") REFERENCES "GelombangPmb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pegawai" ADD CONSTRAINT "Pegawai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuti" ADD CONSTRAINT "Cuti_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penelitian" ADD CONSTRAINT "Penelitian_ketuaId_fkey" FOREIGN KEY ("ketuaId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pengabdian" ADD CONSTRAINT "Pengabdian_ketuaId_fkey" FOREIGN KEY ("ketuaId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publikasi" ADD CONSTRAINT "Publikasi_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

