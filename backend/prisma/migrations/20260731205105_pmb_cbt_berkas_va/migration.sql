-- CreateEnum
CREATE TYPE "StatusBayar" AS ENUM ('BELUM_BAYAR', 'MENUNGGU_VERIFIKASI', 'LUNAS', 'KEDALUWARSA', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusUjian" AS ENUM ('BELUM', 'BERLANGSUNG', 'SELESAI');

-- CreateTable
CREATE TABLE "BerkasPendaftar" (
    "id" TEXT NOT NULL,
    "pendaftarId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "namaFile" TEXT NOT NULL,
    "mimeType" TEXT,
    "ukuran" INTEGER,
    "data" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BerkasPendaftar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonfigurasiVA" (
    "id" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "namaBank" TEXT NOT NULL,
    "kodeBank" TEXT,
    "prefixVA" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KonfigurasiVA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagihanVA" (
    "id" TEXT NOT NULL,
    "pendaftarId" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "namaBank" TEXT NOT NULL,
    "nomorVA" TEXT NOT NULL,
    "nomorHp" TEXT,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "status" "StatusBayar" NOT NULL DEFAULT 'BELUM_BAYAR',
    "jatuhTempo" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagihanVA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoalCbt" (
    "id" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "opsiA" TEXT NOT NULL,
    "opsiB" TEXT NOT NULL,
    "opsiC" TEXT NOT NULL,
    "opsiD" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,

    CONSTRAINT "SoalCbt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UjianCbt" (
    "id" TEXT NOT NULL,
    "pendaftarId" TEXT NOT NULL,
    "mulai" TIMESTAMP(3),
    "selesai" TIMESTAMP(3),
    "durasiMenit" INTEGER NOT NULL DEFAULT 60,
    "jumlahSoal" INTEGER,
    "jumlahBenar" INTEGER,
    "nilai" DOUBLE PRECISION,
    "status" "StatusUjian" NOT NULL DEFAULT 'BELUM',

    CONSTRAINT "UjianCbt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JawabanCbt" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,

    CONSTRAINT "JawabanCbt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BerkasPendaftar_pendaftarId_jenis_key" ON "BerkasPendaftar"("pendaftarId", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "KonfigurasiVA_bank_key" ON "KonfigurasiVA"("bank");

-- CreateIndex
CREATE UNIQUE INDEX "TagihanVA_nomorVA_key" ON "TagihanVA"("nomorVA");

-- CreateIndex
CREATE UNIQUE INDEX "UjianCbt_pendaftarId_key" ON "UjianCbt"("pendaftarId");

-- CreateIndex
CREATE UNIQUE INDEX "JawabanCbt_ujianId_soalId_key" ON "JawabanCbt"("ujianId", "soalId");

-- AddForeignKey
ALTER TABLE "BerkasPendaftar" ADD CONSTRAINT "BerkasPendaftar_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagihanVA" ADD CONSTRAINT "TagihanVA_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UjianCbt" ADD CONSTRAINT "UjianCbt_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanCbt" ADD CONSTRAINT "JawabanCbt_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "UjianCbt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
