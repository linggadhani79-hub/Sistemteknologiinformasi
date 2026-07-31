import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const lppmRouter = Router();
const LPPM = ['SUPERADMIN', 'LPPM'];
const DOSEN_WRITE = [...LPPM, 'DOSEN'];

lppmRouter.use('/penelitian', crudRouter(prisma.penelitian, { writeRoles: DOSEN_WRITE, include: { ketua: { include: { user: { select: { nama: true } } } } }, searchFields: ['judul'], orderBy: { tahun: 'desc' } }));
lppmRouter.use('/pengabdian', crudRouter(prisma.pengabdian, { writeRoles: DOSEN_WRITE, include: { ketua: { include: { user: { select: { nama: true } } } } }, searchFields: ['judul'], orderBy: { tahun: 'desc' } }));
lppmRouter.use('/publikasi', crudRouter(prisma.publikasi, { writeRoles: DOSEN_WRITE, include: { penulis: { include: { user: { select: { nama: true } } } } }, searchFields: ['judul', 'namaMedia'], orderBy: { tahun: 'desc' } }));

// Review usulan penelitian/pengabdian (LPPM)
lppmRouter.patch('/penelitian/:id/review', authenticate, authorize(...LPPM), async (req, res) => {
  const { status, danaDisetujui } = req.body;
  const p = await prisma.penelitian.update({ where: { id: req.params.id }, data: { status, danaDisetujui } });
  res.json(p);
});

// Dashboard LPPM
lppmRouter.get('/dashboard', authenticate, authorize(...LPPM, 'ADMIN_AKADEMIK'), async (_req, res) => {
  const [penelitian, pengabdian, publikasi, danaPenelitian] = await Promise.all([
    prisma.penelitian.groupBy({ by: ['status'], _count: true }),
    prisma.pengabdian.groupBy({ by: ['status'], _count: true }),
    prisma.publikasi.groupBy({ by: ['indeksasi'], _count: true }),
    prisma.penelitian.aggregate({ _sum: { danaDisetujui: true } }),
  ]);
  res.json({ penelitian, pengabdian, publikasi, totalDanaPenelitian: danaPenelitian._sum.danaDisetujui ?? 0 });
});
