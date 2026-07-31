import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const pjjRouter = Router();
const DOSEN = ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN'];

pjjRouter.use('/sesi', crudRouter(prisma.sesiPjj, {
  writeRoles: DOSEN,
  include: { kelas: { include: { mataKuliah: true } } },
  orderBy: { tanggal: 'desc' },
}));

// Rekap kehadiran per sesi
pjjRouter.get('/sesi/:id/kehadiran', authenticate, async (req, res) => {
  const kehadiran = await prisma.kehadiranPjj.findMany({
    where: { sesiId: req.params.id },
    include: { mahasiswa: { include: { user: { select: { nama: true } } } } },
  });
  res.json(kehadiran);
});

// Presensi mahasiswa (join sesi PJJ)
pjjRouter.post('/sesi/:id/hadir', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });
  const hadir = await prisma.kehadiranPjj.upsert({
    where: { sesiId_mahasiswaId: { sesiId: req.params.id, mahasiswaId: mhs.id } },
    create: { sesiId: req.params.id, mahasiswaId: mhs.id, hadir: true, waktuMasuk: new Date() },
    update: { hadir: true, waktuMasuk: new Date() },
  });
  res.json(hadir);
});

// Dosen menandai kehadiran manual
pjjRouter.post('/sesi/:id/presensi', authenticate, authorize(...DOSEN), async (req, res) => {
  const { mahasiswaId, hadir, keterangan } = req.body;
  const rec = await prisma.kehadiranPjj.upsert({
    where: { sesiId_mahasiswaId: { sesiId: req.params.id, mahasiswaId } },
    create: { sesiId: req.params.id, mahasiswaId, hadir: !!hadir, keterangan },
    update: { hadir: !!hadir, keterangan },
  });
  res.json(rec);
});
