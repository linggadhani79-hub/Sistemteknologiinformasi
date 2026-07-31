import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const kepegawaianRouter = Router();
const HR = ['SUPERADMIN', 'KEPEGAWAIAN'];

kepegawaianRouter.use('/pegawai', crudRouter(prisma.pegawai, { writeRoles: HR, readRoles: HR, searchFields: ['nama', 'nip'], orderBy: { nama: 'asc' } }));
kepegawaianRouter.use('/absensi', crudRouter(prisma.absensi, { writeRoles: HR, readRoles: HR, include: { pegawai: true }, orderBy: { tanggal: 'desc' } }));
kepegawaianRouter.use('/cuti', crudRouter(prisma.cuti, { writeRoles: HR, readRoles: HR, include: { pegawai: true } }));

// Generate payroll periode tertentu
kepegawaianRouter.post('/payroll/generate', authenticate, authorize(...HR), async (req, res) => {
  const { periode } = req.body as { periode: string }; // format 2024-07
  if (!periode) return res.status(400).json({ message: 'periode wajib diisi (format YYYY-MM)' });

  const pegawai = await prisma.pegawai.findMany({ where: { status: { not: 'PENSIUN' } } });
  const hasil = [];
  for (const p of pegawai) {
    const tunjangan = p.gajiPokok * 0.25; // tunjangan 25%
    const potongan = p.gajiPokok * 0.05; // BPJS dll 5%
    const totalGaji = p.gajiPokok + tunjangan - potongan;
    const pr = await prisma.payroll.upsert({
      where: { pegawaiId_periode: { pegawaiId: p.id, periode } },
      create: { pegawaiId: p.id, periode, gajiPokok: p.gajiPokok, tunjangan, potongan, totalGaji },
      update: { gajiPokok: p.gajiPokok, tunjangan, potongan, totalGaji },
    });
    hasil.push(pr);
  }
  res.status(201).json({ periode, jumlah: hasil.length, totalAnggaran: hasil.reduce((s, h) => s + h.totalGaji, 0) });
});

kepegawaianRouter.get('/payroll', authenticate, authorize(...HR), async (req, res) => {
  const periode = req.query.periode as string | undefined;
  const data = await prisma.payroll.findMany({
    where: periode ? { periode } : {},
    include: { pegawai: { select: { nama: true, nip: true, unitKerja: true } } },
    orderBy: { periode: 'desc' },
  });
  res.json(data);
});

// Dashboard kepegawaian
kepegawaianRouter.get('/dashboard', authenticate, authorize(...HR), async (_req, res) => {
  const [total, perStatus, perJenis] = await Promise.all([
    prisma.pegawai.count(),
    prisma.pegawai.groupBy({ by: ['status'], _count: true }),
    prisma.pegawai.groupBy({ by: ['jenis'], _count: true }),
  ]);
  res.json({ total, perStatus, perJenis });
});
