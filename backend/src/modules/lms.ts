import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const lmsRouter = Router();
const PENGAJAR = ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN'];

lmsRouter.use('/course', crudRouter(prisma.course, {
  writeRoles: PENGAJAR,
  include: { kelas: { include: { mataKuliah: true, dosen: { include: { user: { select: { nama: true } } } } } }, modul: true, tugas: true, kuis: true },
}));
lmsRouter.use('/modul', crudRouter(prisma.modulLms, { writeRoles: PENGAJAR, orderBy: { urutan: 'asc' } }));
lmsRouter.use('/tugas', crudRouter(prisma.tugasLms, { writeRoles: PENGAJAR }));
lmsRouter.use('/kuis', crudRouter(prisma.kuis, { writeRoles: PENGAJAR, include: { soal: true } }));
lmsRouter.use('/soal', crudRouter(prisma.soalKuis, { writeRoles: PENGAJAR }));

// Detail course lengkap (untuk halaman belajar)
lmsRouter.get('/course/:id/belajar', authenticate, async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      kelas: { include: { mataKuliah: true } },
      modul: { orderBy: { urutan: 'asc' } },
      tugas: true,
      kuis: { include: { soal: { select: { id: true, pertanyaan: true, opsiA: true, opsiB: true, opsiC: true, opsiD: true } } } },
    },
  });
  if (!course) return res.status(404).json({ message: 'Course tidak ditemukan' });
  res.json(course);
});

// Enroll mahasiswa
lmsRouter.post('/course/:id/enroll', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });
  const enr = await prisma.enrollment.upsert({
    where: { courseId_mahasiswaId: { courseId: req.params.id, mahasiswaId: mhs.id } },
    create: { courseId: req.params.id, mahasiswaId: mhs.id },
    update: {},
  });
  res.status(201).json(enr);
});

// Pengumpulan tugas
lmsRouter.post('/tugas/:id/submit', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });
  const { fileUrl, catatan } = req.body;
  const sub = await prisma.pengumpulanTugas.upsert({
    where: { tugasId_mahasiswaId: { tugasId: req.params.id, mahasiswaId: mhs.id } },
    create: { tugasId: req.params.id, mahasiswaId: mhs.id, fileUrl, catatan },
    update: { fileUrl, catatan, submittedAt: new Date() },
  });
  res.status(201).json(sub);
});

// Penilaian kuis otomatis
lmsRouter.post('/kuis/:id/submit', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const { jawaban } = req.body as { jawaban: Record<string, string> };
  const soal = await prisma.soalKuis.findMany({ where: { kuisId: req.params.id } });
  if (!soal.length) return res.status(404).json({ message: 'Kuis tidak ditemukan / belum ada soal' });
  let benar = 0;
  for (const s of soal) if (jawaban?.[s.id] === s.jawaban) benar++;
  const nilai = Number(((benar / soal.length) * 100).toFixed(1));
  res.json({ totalSoal: soal.length, benar, nilai });
});
