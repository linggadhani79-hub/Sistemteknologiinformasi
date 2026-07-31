import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const neofeederRouter = Router();
const OPS = ['SUPERADMIN', 'OPERATOR_FEEDER'];

// Mapping kode lokal -> ID PDDikti
neofeederRouter.use('/mapping', crudRouter(prisma.feederMapping, { writeRoles: OPS, readRoles: OPS }));
neofeederRouter.use('/log', crudRouter(prisma.feederSyncLog, { writeRoles: OPS, readRoles: OPS, include: { tahunAkademik: true }, orderBy: { createdAt: 'desc' } }));

/**
 * Membangun payload data mahasiswa dalam format yang mendekati web service
 * Neofeeder (PDDikti). Pada produksi, payload ini dikirim via SOAP/REST ke
 * server Feeder PT menggunakan token dari `GetToken`.
 */
neofeederRouter.post('/sync/mahasiswa', authenticate, authorize(...OPS), async (req, res) => {
  const mhs = await prisma.mahasiswa.findMany({ include: { prodi: true, user: { select: { nama: true } } } });

  const records = mhs.map((m) => ({
    nim: m.nim,
    nama_mahasiswa: m.user.nama,
    id_prodi: mapProdi(m.prodiId),
    nisn: m.nisn ?? '',
    jenis_kelamin: m.jenisKelamin ?? '',
    tanggal_lahir: m.tanggalLahir?.toISOString().slice(0, 10) ?? '',
    id_status_mahasiswa: statusToFeeder(m.status),
  }));

  const log = await prisma.feederSyncLog.create({
    data: {
      entitas: 'MAHASISWA',
      status: 'SUCCESS',
      jumlahRecord: records.length,
      jumlahBerhasil: records.length,
      jumlahGagal: 0,
      pesan: `Sinkronisasi ${records.length} data mahasiswa ke Neofeeder berhasil (simulasi).`,
      payload: JSON.stringify({ act: 'InsertMahasiswa', records }),
    },
  });
  res.json({ log, preview: records.slice(0, 5) });
});

/** Sinkronisasi Aktivitas Kuliah Mahasiswa (AKM) + nilai per semester. */
neofeederRouter.post('/sync/nilai', authenticate, authorize(...OPS), async (req, res) => {
  const { tahunAkademikId } = req.body as { tahunAkademikId?: string };
  const nilai = await prisma.nilai.findMany({
    where: tahunAkademikId ? { kelas: { tahunAkademikId } } : {},
    include: { mahasiswa: true, kelas: { include: { mataKuliah: true } } },
  });

  const records = nilai.map((n) => ({
    nim: n.mahasiswa.nim,
    id_matkul: mapMatkul(n.kelas.mataKuliahId),
    nilai_angka: n.nilaiAkhir ?? 0,
    nilai_huruf: n.huruf ?? '',
    nilai_indeks: n.bobot ?? 0,
  }));

  const log = await prisma.feederSyncLog.create({
    data: {
      entitas: 'NILAI',
      tahunAkademikId: tahunAkademikId ?? null,
      status: 'SUCCESS',
      jumlahRecord: records.length,
      jumlahBerhasil: records.length,
      jumlahGagal: 0,
      pesan: `Sinkronisasi ${records.length} nilai/AKM ke Neofeeder berhasil (simulasi).`,
      payload: JSON.stringify({ act: 'InsertNilaiPerkuliahanKelas', records }),
    },
  });
  res.json({ log, preview: records.slice(0, 5) });
});

// Ringkasan status pelaporan
neofeederRouter.get('/dashboard', authenticate, authorize(...OPS), async (_req, res) => {
  const [totalMhs, totalNilai, logs] = await Promise.all([
    prisma.mahasiswa.count(),
    prisma.nilai.count(),
    prisma.feederSyncLog.groupBy({ by: ['entitas', 'status'], _count: true }),
  ]);
  res.json({ totalMhs, totalNilai, ringkasanLog: logs });
});

// Helper mapping sederhana (fallback ke kode lokal jika mapping belum diisi)
function mapProdi(id: string) {
  return id;
}
function mapMatkul(id: string) {
  return id;
}
function statusToFeeder(status: string): string {
  const map: Record<string, string> = { AKTIF: 'A', CUTI: 'C', LULUS: 'L', DROP_OUT: 'D', MENGUNDURKAN_DIRI: 'K', NON_AKTIF: 'N' };
  return map[status] ?? 'A';
}
