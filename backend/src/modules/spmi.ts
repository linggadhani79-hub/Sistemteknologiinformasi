import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const spmiRouter = Router();
const MUTU = ['SUPERADMIN', 'AUDITOR_MUTU'];

spmiRouter.use('/standar', crudRouter(prisma.standarMutu, { writeRoles: MUTU, include: { indikator: true, prodi: true }, searchFields: ['nama', 'kode'] }));
spmiRouter.use('/indikator', crudRouter(prisma.indikatorMutu, { writeRoles: MUTU, include: { standar: true } }));
spmiRouter.use('/audit', crudRouter(prisma.auditMutu, { writeRoles: MUTU, include: { temuan: true }, orderBy: { tanggal: 'desc' } }));
spmiRouter.use('/temuan', crudRouter(prisma.temuanAudit, { writeRoles: MUTU, include: { audit: true } }));

// Dashboard capaian mutu (PPEPP monitoring)
spmiRouter.get('/dashboard', authenticate, authorize(...MUTU, 'ADMIN_AKADEMIK'), async (_req, res) => {
  const indikator = await prisma.indikatorMutu.findMany({ include: { standar: true } });
  const tercapai = indikator.filter((i) => (i.capaian ?? 0) >= (i.targetNilai ?? 0)).length;
  const temuan = await prisma.temuanAudit.groupBy({ by: ['statusTindak'], _count: true });
  res.json({
    totalIndikator: indikator.length,
    tercapai,
    belumTercapai: indikator.length - tercapai,
    persentaseCapaian: indikator.length ? Number(((tercapai / indikator.length) * 100).toFixed(1)) : 0,
    statusTemuan: temuan,
  });
});
