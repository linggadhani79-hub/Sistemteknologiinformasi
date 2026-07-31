import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const akademikRouter = Router();

const ADMIN = ['SUPERADMIN', 'ADMIN_AKADEMIK'];

// ---- Master data (CRUD) ----
akademikRouter.use('/fakultas', crudRouter(prisma.fakultas, { writeRoles: ADMIN, searchFields: ['nama', 'kode'], orderBy: { nama: 'asc' } }));
akademikRouter.use('/prodi', crudRouter(prisma.programStudi, { writeRoles: ADMIN, include: { fakultas: true }, searchFields: ['nama', 'kode'], orderBy: { nama: 'asc' } }));
akademikRouter.use('/tahun-akademik', crudRouter(prisma.tahunAkademik, { writeRoles: ADMIN, orderBy: { kode: 'desc' } }));
akademikRouter.use('/kurikulum', crudRouter(prisma.kurikulum, { writeRoles: ADMIN, include: { prodi: true } }));
akademikRouter.use('/matakuliah', crudRouter(prisma.mataKuliah, { writeRoles: ADMIN, include: { prodi: true }, searchFields: ['nama', 'kode'], orderBy: { semester: 'asc' } }));
akademikRouter.use('/mahasiswa', crudRouter(prisma.mahasiswa, { writeRoles: ADMIN, readRoles: [...ADMIN, 'DOSEN', 'OPERATOR_FEEDER'], include: { user: { select: { email: true, nama: true } }, prodi: true }, searchFields: ['nim'], orderBy: { nim: 'asc' } }));
akademikRouter.use('/dosen', crudRouter(prisma.dosen, { writeRoles: ADMIN, include: { user: { select: { email: true, nama: true } }, prodi: true }, searchFields: ['nidn'] }));
akademikRouter.use('/kelas', crudRouter(prisma.kelas, { writeRoles: ADMIN, include: { mataKuliah: true, dosen: { include: { user: { select: { nama: true } } } }, tahunAkademik: true } }));

// ---- KRS: pengajuan oleh mahasiswa ----
akademikRouter.get('/krs/saya', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });
  const krs = await prisma.kRS.findMany({
    where: { mahasiswaId: mhs.id },
    include: { tahunAkademik: true, detail: { include: { kelas: { include: { mataKuliah: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(krs);
});

akademikRouter.post('/krs', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });

  const { tahunAkademikId, kelasIds } = req.body as { tahunAkademikId: string; kelasIds: string[] };
  if (!tahunAkademikId || !Array.isArray(kelasIds) || kelasIds.length === 0) {
    return res.status(400).json({ message: 'tahunAkademikId dan kelasIds wajib diisi' });
  }

  const kelas = await prisma.kelas.findMany({ where: { id: { in: kelasIds } }, include: { mataKuliah: true } });
  const totalSks = kelas.reduce((s, k) => s + k.mataKuliah.sks, 0);
  if (totalSks > 24) return res.status(400).json({ message: `Total SKS (${totalSks}) melebihi batas maksimal 24 SKS` });

  try {
    const krs = await prisma.kRS.upsert({
      where: { mahasiswaId_tahunAkademikId: { mahasiswaId: mhs.id, tahunAkademikId } },
      create: {
        mahasiswaId: mhs.id,
        tahunAkademikId,
        status: 'DIAJUKAN',
        totalSks,
        detail: { create: kelasIds.map((id) => ({ kelasId: id })) },
      },
      update: {
        status: 'DIAJUKAN',
        totalSks,
        detail: { deleteMany: {}, create: kelasIds.map((id) => ({ kelasId: id })) },
      },
      include: { detail: { include: { kelas: { include: { mataKuliah: true } } } } },
    });
    res.status(201).json(krs);
  } catch (e: any) {
    res.status(400).json({ message: 'Gagal menyimpan KRS', detail: e.message });
  }
});

// Approval KRS oleh dosen wali / admin
akademikRouter.patch('/krs/:id/status', authenticate, authorize(...ADMIN, 'DOSEN'), async (req, res) => {
  const { status, catatan } = req.body as { status: string; catatan?: string };
  if (!['DISETUJUI', 'DITOLAK'].includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  const krs = await prisma.kRS.update({ where: { id: req.params.id }, data: { status: status as any, catatan } });
  res.json(krs);
});

// ---- Nilai: input oleh dosen, kalkulasi otomatis huruf & bobot ----
function konversiNilai(na: number): { huruf: string; bobot: number } {
  if (na >= 85) return { huruf: 'A', bobot: 4.0 };
  if (na >= 80) return { huruf: 'A-', bobot: 3.7 };
  if (na >= 75) return { huruf: 'B+', bobot: 3.3 };
  if (na >= 70) return { huruf: 'B', bobot: 3.0 };
  if (na >= 65) return { huruf: 'B-', bobot: 2.7 };
  if (na >= 60) return { huruf: 'C+', bobot: 2.3 };
  if (na >= 55) return { huruf: 'C', bobot: 2.0 };
  if (na >= 40) return { huruf: 'D', bobot: 1.0 };
  return { huruf: 'E', bobot: 0.0 };
}

akademikRouter.post('/nilai', authenticate, authorize(...ADMIN, 'DOSEN'), async (req, res) => {
  const { mahasiswaId, kelasId, tugas = 0, uts = 0, uas = 0 } = req.body;
  if (!mahasiswaId || !kelasId) return res.status(400).json({ message: 'mahasiswaId dan kelasId wajib diisi' });

  // Bobot standar: Tugas 30%, UTS 30%, UAS 40%
  const nilaiAkhir = tugas * 0.3 + uts * 0.3 + uas * 0.4;
  const { huruf, bobot } = konversiNilai(nilaiAkhir);

  const nilai = await prisma.nilai.upsert({
    where: { mahasiswaId_kelasId: { mahasiswaId, kelasId } },
    create: { mahasiswaId, kelasId, tugas, uts, uas, nilaiAkhir, huruf, bobot },
    update: { tugas, uts, uas, nilaiAkhir, huruf, bobot },
  });

  await hitungUlangIpk(mahasiswaId);
  res.status(201).json(nilai);
});

async function hitungUlangIpk(mahasiswaId: string) {
  const nilai = await prisma.nilai.findMany({
    where: { mahasiswaId, bobot: { not: null } },
    include: { kelas: { include: { mataKuliah: true } } },
  });
  let totalMutu = 0;
  let totalSks = 0;
  for (const n of nilai) {
    const sks = n.kelas.mataKuliah.sks;
    totalSks += sks;
    totalMutu += (n.bobot ?? 0) * sks;
  }
  const ipk = totalSks ? Number((totalMutu / totalSks).toFixed(2)) : 0;
  await prisma.mahasiswa.update({ where: { id: mahasiswaId }, data: { ipk, totalSks } });
}

// ---- Transkrip / KHS ----
akademikRouter.get('/transkrip/:mahasiswaId', authenticate, async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({
    where: { id: req.params.mahasiswaId },
    include: { prodi: true, user: { select: { nama: true } } },
  });
  if (!mhs) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
  const nilai = await prisma.nilai.findMany({
    where: { mahasiswaId: mhs.id },
    include: { kelas: { include: { mataKuliah: true, tahunAkademik: true } } },
  });
  res.json({
    mahasiswa: { nim: mhs.nim, nama: mhs.user.nama, prodi: mhs.prodi.nama, ipk: mhs.ipk, totalSks: mhs.totalSks },
    transkrip: nilai.map((n) => ({
      kode: n.kelas.mataKuliah.kode,
      matakuliah: n.kelas.mataKuliah.nama,
      sks: n.kelas.mataKuliah.sks,
      semester: n.kelas.tahunAkademik.nama,
      nilaiAkhir: n.nilaiAkhir,
      huruf: n.huruf,
      bobot: n.bobot,
    })),
  });
});
