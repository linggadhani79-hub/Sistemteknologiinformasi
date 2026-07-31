-- CreateEnum
CREATE TYPE "StatusWisuda" AS ENUM ('DAFTAR', 'VERIFIKASI', 'DITERIMA', 'DITOLAK', 'SELESAI');

-- AlterTable
ALTER TABLE "Mahasiswa" ADD COLUMN     "foto" TEXT;

-- CreateTable
CREATE TABLE "PeriodeWisuda" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "kuota" INTEGER NOT NULL DEFAULT 500,
    "biaya" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodeWisuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesertaWisuda" (
    "id" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "nomorUrut" INTEGER,
    "noIjazah" TEXT,
    "judulSkripsi" TEXT,
    "ipk" DOUBLE PRECISION,
    "predikat" TEXT,
    "fotoUrl" TEXT,
    "status" "StatusWisuda" NOT NULL DEFAULT 'DAFTAR',
    "catatan" TEXT,
    "tanggalDaftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesertaWisuda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PeriodeWisuda_kode_key" ON "PeriodeWisuda"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "PesertaWisuda_periodeId_mahasiswaId_key" ON "PesertaWisuda"("periodeId", "mahasiswaId");

-- AddForeignKey
ALTER TABLE "PesertaWisuda" ADD CONSTRAINT "PesertaWisuda_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "PeriodeWisuda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesertaWisuda" ADD CONSTRAINT "PesertaWisuda_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
