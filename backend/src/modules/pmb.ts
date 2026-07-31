import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const pmbRouter = Router();
const PANITIA = ['SUPERADMIN', 'ADMIN_AKADEMIK'];

pmbRouter.use('/gelombang', crudRouter(prisma.gelombangPmb, { writeRoles: PANITIA, readRoles: [], orderBy: { tahun: 'desc' } }));

// Daftar pendaftar (panitia)
pmbRouter.use('/pendaftar', crudRouter(prisma.pendaftar, { writeRoles: PANITIA, readRoles: PANITIA, include: { gelombang: true }, searchFields: ['nama', 'noPendaftaran', 'email'], orderBy: { createdAt: 'desc' } }));

// Pendaftaran oleh calon mahasiswa
pmbRouter.post('/daftar', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const { gelombangId, asalSekolah, pilihanProdi1, pilihanProdi2, hp } = req.body;
  const gelombang = await prisma.gelombangPmb.findUnique({ where: { id: gelombangId } });
  if (!gelombang || !gelombang.aktif) return res.status(400).json({ message: 'Gelombang tidak tersedia' });

  const existing = await prisma.pendaftar.findUnique({ where: { userId: req.user!.id } });
  if (existing) return res.status(409).json({ message: 'Anda sudah terdaftar', pendaftar: existing });

  const count = await prisma.pendaftar.count();
  const noPendaftaran = `PMB${gelombang.tahun}${String(count + 1).padStart(4, '0')}`;

  const pendaftar = await prisma.pendaftar.create({
    data: {
      noPendaftaran,
      userId: req.user!.id,
      gelombangId,
      nama: req.user!.nama,
      email: req.user!.email,
      hp,
      asalSekolah,
      pilihanProdi1,
      pilihanProdi2,
      status: 'DAFTAR',
    },
  });
  res.status(201).json(pendaftar);
});

// Status pendaftaran saya
pmbRouter.get('/status/saya', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await prisma.pendaftar.findUnique({ where: { userId: req.user!.id }, include: { gelombang: true } });
  if (!pendaftar) return res.status(404).json({ message: 'Belum ada pendaftaran' });
  res.json(pendaftar);
});

// Update status seleksi (panitia)
pmbRouter.patch('/pendaftar/:id/status', authenticate, authorize(...PANITIA), async (req, res) => {
  const { status, nilaiUjian, catatan } = req.body;
  const valid = ['DAFTAR', 'BAYAR', 'VERIFIKASI', 'UJIAN', 'DITERIMA', 'DITOLAK', 'DAFTAR_ULANG'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  const pendaftar = await prisma.pendaftar.update({
    where: { id: req.params.id },
    data: { status, nilaiUjian, catatan },
  });
  res.json(pendaftar);
});

// Dashboard PMB
pmbRouter.get('/dashboard', authenticate, authorize(...PANITIA), async (_req, res) => {
  const perStatus = await prisma.pendaftar.groupBy({ by: ['status'], _count: true });
  const total = await prisma.pendaftar.count();
  res.json({ total, perStatus });
});
