import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { crudRouter } from '../utils/crud.js';

export const wisudaRouter = Router();
const PANITIA = ['SUPERADMIN', 'ADMIN_AKADEMIK'];

// Predikat kelulusan berdasarkan IPK (mengacu standar umum PT)
function predikat(ipk: number): string {
  if (ipk >= 3.51) return 'CUMLAUDE';
  if (ipk >= 3.01) return 'SANGAT_MEMUASKAN';
  if (ipk >= 2.76) return 'MEMUASKAN';
  return 'CUKUP';
}

// ---- Periode wisuda (master) ----
wisudaRouter.use('/periode', crudRouter(prisma.periodeWisuda, {
  writeRoles: PANITIA,
  readRoles: [],
  orderBy: { tanggal: 'desc' },
}));

// ---- Pendaftaran oleh mahasiswa ----
wisudaRouter.post('/daftar', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });

  const { periodeId, judulSkripsi, fotoUrl } = req.body as { periodeId: string; judulSkripsi?: string; fotoUrl?: string };
  const periode = await prisma.periodeWisuda.findUnique({ where: { id: periodeId } });
  if (!periode || !periode.aktif) return res.status(400).json({ message: 'Periode wisuda tidak tersedia' });

  // Syarat minimal: sudah menempuh SKS & IPK memadai (contoh sederhana)
  if (mhs.totalSks < 1) return res.status(400).json({ message: 'Anda belum memenuhi syarat akademik untuk wisuda' });

  try {
    const peserta = await prisma.pesertaWisuda.upsert({
      where: { periodeId_mahasiswaId: { periodeId, mahasiswaId: mhs.id } },
      create: {
        periodeId,
        mahasiswaId: mhs.id,
        judulSkripsi,
        fotoUrl: fotoUrl ?? mhs.foto ?? null,
        ipk: mhs.ipk,
        predikat: predikat(mhs.ipk),
        status: 'DAFTAR',
      },
      update: { judulSkripsi, fotoUrl: fotoUrl ?? mhs.foto ?? null, status: 'DAFTAR' },
      include: { periode: true },
    });
    res.status(201).json(peserta);
  } catch (e: any) {
    res.status(400).json({ message: 'Gagal mendaftar wisuda', detail: e.message });
  }
});

// ---- Status pendaftaran mahasiswa ----
wisudaRouter.get('/saya', authenticate, authorize('MAHASISWA'), async (req, res) => {
  const mhs = await prisma.mahasiswa.findUnique({ where: { userId: req.user!.id } });
  if (!mhs) return res.status(404).json({ message: 'Profil mahasiswa tidak ditemukan' });
  const peserta = await prisma.pesertaWisuda.findMany({
    where: { mahasiswaId: mhs.id },
    include: { periode: true },
    orderBy: { tanggalDaftar: 'desc' },
  });
  res.json(peserta);
});

// ---- Daftar peserta per periode (panitia) ----
wisudaRouter.get('/periode/:id/peserta', authenticate, authorize(...PANITIA), async (req, res) => {
  const peserta = await prisma.pesertaWisuda.findMany({
    where: { periodeId: req.params.id },
    include: { mahasiswa: { include: { user: { select: { nama: true } }, prodi: true } } },
    orderBy: [{ nomorUrut: 'asc' }, { tanggalDaftar: 'asc' }],
  });
  res.json(peserta);
});

// ---- Verifikasi / ubah status peserta ----
wisudaRouter.patch('/peserta/:id/status', authenticate, authorize(...PANITIA), async (req, res) => {
  const { status, catatan } = req.body as { status: string; catatan?: string };
  const valid = ['DAFTAR', 'VERIFIKASI', 'DITERIMA', 'DITOLAK', 'SELESAI'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  const peserta = await prisma.pesertaWisuda.update({ where: { id: req.params.id }, data: { status: status as any, catatan } });
  res.json(peserta);
});

// ---- Generate nomor urut + nomor ijazah untuk peserta DITERIMA ----
wisudaRouter.post('/periode/:id/generate-nomor', authenticate, authorize(...PANITIA), async (req, res) => {
  const periode = await prisma.periodeWisuda.findUnique({ where: { id: req.params.id } });
  if (!periode) return res.status(404).json({ message: 'Periode tidak ditemukan' });

  const peserta = await prisma.pesertaWisuda.findMany({
    where: { periodeId: periode.id, status: { in: ['DITERIMA', 'SELESAI'] } },
    include: { mahasiswa: { include: { user: { select: { nama: true } } } } },
    orderBy: { mahasiswa: { nim: 'asc' } },
  });

  let urut = 1;
  const tahun = periode.tanggal.getFullYear();
  for (const p of peserta) {
    const noIjazah = `${periode.kode}/${String(urut).padStart(4, '0')}/${tahun}`;
    await prisma.pesertaWisuda.update({ where: { id: p.id }, data: { nomorUrut: urut, noIjazah } });
    urut++;
  }
  res.json({ message: `Nomor urut & ijazah digenerate untuk ${peserta.length} peserta`, jumlah: peserta.length });
});

// ---- Data slide seremoni (peserta DITERIMA, terurut) ----
wisudaRouter.get('/periode/:id/slide', authenticate, authorize(...PANITIA), async (req, res) => {
  const periode = await prisma.periodeWisuda.findUnique({ where: { id: req.params.id } });
  if (!periode) return res.status(404).json({ message: 'Periode tidak ditemukan' });
  const peserta = await prisma.pesertaWisuda.findMany({
    where: { periodeId: periode.id, status: { in: ['DITERIMA', 'SELESAI'] } },
    include: { mahasiswa: { include: { user: { select: { nama: true } }, prodi: { include: { fakultas: true } } } } },
    orderBy: [{ nomorUrut: 'asc' }, { mahasiswa: { nim: 'asc' } }],
  });
  res.json({
    periode: { nama: periode.nama, tanggal: periode.tanggal, lokasi: periode.lokasi },
    slides: peserta.map((p) => ({
      nomorUrut: p.nomorUrut,
      nama: p.mahasiswa.user.nama,
      nim: p.mahasiswa.nim,
      prodi: p.mahasiswa.prodi.nama,
      fakultas: p.mahasiswa.prodi.fakultas.nama,
      ipk: p.ipk,
      predikat: p.predikat,
      judulSkripsi: p.judulSkripsi,
      foto: p.fotoUrl ?? p.mahasiswa.foto,
    })),
  });
});

// ---- Data ijazah satu peserta ----
wisudaRouter.get('/ijazah/:pesertaId', authenticate, authorize(...PANITIA), async (req, res) => {
  const p = await prisma.pesertaWisuda.findUnique({
    where: { id: req.params.pesertaId },
    include: {
      periode: true,
      mahasiswa: { include: { user: { select: { nama: true } }, prodi: { include: { fakultas: true } } } },
    },
  });
  if (!p) return res.status(404).json({ message: 'Peserta tidak ditemukan' });
  res.json({
    noIjazah: p.noIjazah,
    nama: p.mahasiswa.user.nama,
    nim: p.mahasiswa.nim,
    tempatLahir: p.mahasiswa.tempatLahir,
    tanggalLahir: p.mahasiswa.tanggalLahir,
    prodi: p.mahasiswa.prodi.nama,
    jenjang: p.mahasiswa.prodi.jenjang,
    fakultas: p.mahasiswa.prodi.fakultas.nama,
    akreditasi: p.mahasiswa.prodi.akreditasi,
    ipk: p.ipk,
    predikat: p.predikat,
    tanggalLulus: p.periode.tanggal,
    foto: p.fotoUrl ?? p.mahasiswa.foto,
  });
});

// ---- Dashboard wisuda ----
wisudaRouter.get('/dashboard', authenticate, authorize(...PANITIA), async (_req, res) => {
  const [totalPeriode, totalPeserta, perStatus] = await Promise.all([
    prisma.periodeWisuda.count(),
    prisma.pesertaWisuda.count(),
    prisma.pesertaWisuda.groupBy({ by: ['status'], _count: true }),
  ]);
  res.json({ totalPeriode, totalPeserta, perStatus });
});
