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
  const [perStatus, total, tagihan, ujian] = await Promise.all([
    prisma.pendaftar.groupBy({ by: ['status'], _count: true }),
    prisma.pendaftar.count(),
    prisma.tagihanVA.groupBy({ by: ['status'], _count: true }),
    prisma.ujianCbt.groupBy({ by: ['status'], _count: true }),
  ]);
  res.json({ total, perStatus, tagihan, ujian });
});

// Helper: ambil pendaftar milik user login
async function pendaftarSaya(userId: string) {
  return prisma.pendaftar.findUnique({ where: { userId }, include: { gelombang: true } });
}

// =====================================================================
//  UPLOAD BERKAS PERSYARATAN
// =====================================================================
export const JENIS_BERKAS = ['FOTO', 'IJAZAH', 'KTP', 'KK', 'RAPOR', 'AKTA'];

pmbRouter.post('/berkas', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });
  const { jenis, namaFile, mimeType, ukuran, data } = req.body;
  if (!JENIS_BERKAS.includes(jenis)) return res.status(400).json({ message: 'Jenis berkas tidak valid' });
  if (ukuran && ukuran > 3 * 1024 * 1024) return res.status(400).json({ message: 'Ukuran berkas maksimal 3 MB' });

  const berkas = await prisma.berkasPendaftar.upsert({
    where: { pendaftarId_jenis: { pendaftarId: pendaftar.id, jenis } },
    create: { pendaftarId: pendaftar.id, jenis, namaFile, mimeType, ukuran, data, status: 'PENDING' },
    update: { namaFile, mimeType, ukuran, data, status: 'PENDING', catatan: null },
    select: { id: true, jenis: true, namaFile: true, status: true, createdAt: true },
  });
  res.status(201).json(berkas);
});

pmbRouter.get('/berkas/saya', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });
  const berkas = await prisma.berkasPendaftar.findMany({
    where: { pendaftarId: pendaftar.id },
    select: { id: true, jenis: true, namaFile: true, mimeType: true, status: true, catatan: true, createdAt: true },
  });
  res.json({ jenisWajib: JENIS_BERKAS, berkas });
});

// Panitia: daftar berkas + verifikasi
pmbRouter.get('/berkas', authenticate, authorize(...PANITIA), async (req, res) => {
  const where = req.query.pendaftarId ? { pendaftarId: String(req.query.pendaftarId) } : {};
  const berkas = await prisma.berkasPendaftar.findMany({
    where,
    select: { id: true, jenis: true, namaFile: true, mimeType: true, status: true, catatan: true, createdAt: true, pendaftar: { select: { nama: true, noPendaftaran: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(berkas);
});

pmbRouter.get('/berkas/:id/file', authenticate, async (req, res) => {
  const b = await prisma.berkasPendaftar.findUnique({ where: { id: req.params.id } });
  if (!b?.data) return res.status(404).json({ message: 'File tidak ditemukan' });
  res.json({ namaFile: b.namaFile, mimeType: b.mimeType, data: b.data });
});

pmbRouter.patch('/berkas/:id/status', authenticate, authorize(...PANITIA), async (req, res) => {
  const { status, catatan } = req.body;
  if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  const b = await prisma.berkasPendaftar.update({ where: { id: req.params.id }, data: { status, catatan }, select: { id: true, status: true } });
  res.json(b);
});

// =====================================================================
//  PEMBAYARAN — VIRTUAL ACCOUNT (BRI, MANDIRI, BTN)
// =====================================================================
// Konfigurasi VA per bank (setting admin)
pmbRouter.use('/va-config', crudRouter(prisma.konfigurasiVA, { writeRoles: PANITIA, readRoles: PANITIA, orderBy: { bank: 'asc' } }));

// Daftar bank aktif (untuk calon memilih)
pmbRouter.get('/bank', authenticate, async (_req, res) => {
  const banks = await prisma.konfigurasiVA.findMany({ where: { aktif: true }, select: { bank: true, namaBank: true } });
  res.json(banks);
});

// Calon: generate Virtual Account untuk bank pilihan
pmbRouter.post('/pembayaran/va', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });
  const { bank, nomorHp } = req.body as { bank: string; nomorHp?: string };

  const konfig = await prisma.konfigurasiVA.findUnique({ where: { bank } });
  if (!konfig || !konfig.aktif) return res.status(400).json({ message: 'Bank tidak tersedia' });

  // Nomor VA = prefix + 10 digit unik (dari urutan pendaftar + hp)
  const hp = (nomorHp || pendaftar.hp || '0').replace(/\D/g, '');
  const seq = String(Math.abs(hashCode(pendaftar.id))).padStart(10, '0').slice(0, 10);
  const nomorVA = `${konfig.prefixVA}${seq}`;

  const tagihan = await prisma.tagihanVA.upsert({
    where: { nomorVA },
    create: {
      pendaftarId: pendaftar.id,
      bank,
      namaBank: konfig.namaBank,
      nomorVA,
      nomorHp: hp,
      jumlah: pendaftar.gelombang.biaya,
      status: 'BELUM_BAYAR',
      jatuhTempo: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    },
    update: { bank, namaBank: konfig.namaBank, nomorHp: hp, jumlah: pendaftar.gelombang.biaya },
  });
  res.status(201).json(tagihan);
});

// Panitia: semua tagihan
pmbRouter.get('/pembayaran', authenticate, authorize(...PANITIA), async (_req, res) => {
  const tagihan = await prisma.tagihanVA.findMany({
    include: { pendaftar: { select: { nama: true, noPendaftaran: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tagihan);
});

pmbRouter.get('/pembayaran/saya', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });
  const tagihan = await prisma.tagihanVA.findMany({ where: { pendaftarId: pendaftar.id }, orderBy: { createdAt: 'desc' } });
  res.json(tagihan);
});

// Simulasi konfirmasi pembayaran (produksi: callback gateway/bank)
pmbRouter.post('/pembayaran/:id/konfirmasi', authenticate, async (req, res) => {
  const isPanitia = PANITIA.includes(req.user!.role);
  const tagihan = await prisma.tagihanVA.findUnique({ where: { id: req.params.id } });
  if (!tagihan) return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
  // Calon hanya boleh untuk tagihannya sendiri (simulasi bayar)
  if (!isPanitia) {
    const pendaftar = await pendaftarSaya(req.user!.id);
    if (!pendaftar || tagihan.pendaftarId !== pendaftar.id) return res.status(403).json({ message: 'Tidak diizinkan' });
  }
  const updated = await prisma.tagihanVA.update({ where: { id: tagihan.id }, data: { status: 'LUNAS', paidAt: new Date() } });
  await prisma.pendaftar.update({ where: { id: tagihan.pendaftarId }, data: { status: 'BAYAR' } });
  res.json(updated);
});

// =====================================================================
//  CBT — Computer Based Test
// =====================================================================
// Bank soal (kelola admin)
pmbRouter.use('/cbt/soal', crudRouter(prisma.soalCbt, { writeRoles: PANITIA, readRoles: PANITIA, searchFields: ['pertanyaan', 'kategori'], orderBy: { kategori: 'asc' } }));

// Calon: status ujian
pmbRouter.get('/cbt/saya', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });
  const ujian = await prisma.ujianCbt.findUnique({ where: { pendaftarId: pendaftar.id } });
  res.json(ujian);
});

// Calon: mulai ujian → soal tanpa kunci jawaban
pmbRouter.post('/cbt/mulai', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });

  const existing = await prisma.ujianCbt.findUnique({ where: { pendaftarId: pendaftar.id } });
  if (existing?.status === 'SELESAI') return res.status(400).json({ message: 'Anda sudah menyelesaikan ujian' });

  const soal = await prisma.soalCbt.findMany();
  if (soal.length === 0) return res.status(400).json({ message: 'Bank soal belum tersedia' });

  const ujian = await prisma.ujianCbt.upsert({
    where: { pendaftarId: pendaftar.id },
    create: { pendaftarId: pendaftar.id, mulai: new Date(), status: 'BERLANGSUNG', jumlahSoal: soal.length },
    update: { mulai: new Date(), status: 'BERLANGSUNG', jumlahSoal: soal.length },
  });
  res.json({
    ujian: { id: ujian.id, durasiMenit: ujian.durasiMenit, mulai: ujian.mulai, jumlahSoal: soal.length },
    soal: soal.map((s) => ({ id: s.id, kategori: s.kategori, pertanyaan: s.pertanyaan, opsiA: s.opsiA, opsiB: s.opsiB, opsiC: s.opsiC, opsiD: s.opsiD })),
  });
});

// Calon: submit jawaban → dinilai otomatis
pmbRouter.post('/cbt/submit', authenticate, authorize('CALON_MAHASISWA'), async (req, res) => {
  const pendaftar = await pendaftarSaya(req.user!.id);
  if (!pendaftar) return res.status(404).json({ message: 'Anda belum mendaftar' });
  const ujian = await prisma.ujianCbt.findUnique({ where: { pendaftarId: pendaftar.id } });
  if (!ujian || ujian.status !== 'BERLANGSUNG') return res.status(400).json({ message: 'Ujian belum dimulai / sudah selesai' });

  const { jawaban } = req.body as { jawaban: Record<string, string> };
  const soal = await prisma.soalCbt.findMany();
  let benar = 0;
  for (const s of soal) {
    const j = jawaban?.[s.id];
    if (j) {
      await prisma.jawabanCbt.upsert({
        where: { ujianId_soalId: { ujianId: ujian.id, soalId: s.id } },
        create: { ujianId: ujian.id, soalId: s.id, jawaban: j },
        update: { jawaban: j },
      });
      if (j === s.jawaban) benar++;
    }
  }
  const nilai = Number(((benar / soal.length) * 100).toFixed(1));
  const updated = await prisma.ujianCbt.update({
    where: { id: ujian.id },
    data: { status: 'SELESAI', selesai: new Date(), jumlahBenar: benar, jumlahSoal: soal.length, nilai },
  });
  await prisma.pendaftar.update({ where: { id: pendaftar.id }, data: { nilaiUjian: nilai, status: 'UJIAN' } });
  res.json({ nilai, jumlahBenar: benar, jumlahSoal: soal.length, status: updated.status });
});

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}
