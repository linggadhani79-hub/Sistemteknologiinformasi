import { onCall } from 'firebase-functions/v2/https';
import { db, REGION, requireUser, assertRole, badRequest } from './lib.js';

const PANITIA: Parameters<typeof assertRole>[1] = ['SUPERADMIN', 'ADMIN_AKADEMIK'];

function predikat(ipk: number): string {
  if (ipk >= 3.51) return 'CUMLAUDE';
  if (ipk >= 3.01) return 'SANGAT_MEMUASKAN';
  if (ipk >= 2.76) return 'MEMUASKAN';
  return 'CUKUP';
}

/** Pendaftaran wisuda oleh mahasiswa (padanan POST /wisuda/daftar). */
export const wisudaDaftar = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['MAHASISWA']);

  const { periodeId, judulSkripsi, fotoUrl } = req.data as { periodeId: string; judulSkripsi?: string; fotoUrl?: string };
  const periodeSnap = await db.collection('periodeWisuda').doc(periodeId).get();
  if (!periodeSnap.exists || !periodeSnap.data()!.aktif) badRequest('Periode wisuda tidak tersedia');

  const mhsSnap = await db.collection('mahasiswa').doc(caller.uid).get();
  if (!mhsSnap.exists) badRequest('Profil mahasiswa tidak ditemukan');
  const mhs = mhsSnap.data()!;
  if ((mhs.totalSks ?? 0) < 1) badRequest('Anda belum memenuhi syarat akademik untuk wisuda');

  const id = `${periodeId}_${caller.uid}`;
  const data = {
    periodeId, mahasiswaId: caller.uid, judulSkripsi: judulSkripsi ?? null,
    fotoUrl: fotoUrl ?? mhs.foto ?? null, ipk: mhs.ipk ?? 0, predikat: predikat(mhs.ipk ?? 0),
    status: 'DAFTAR', tanggalDaftar: Date.now(),
  };
  await db.collection('pesertaWisuda').doc(id).set(data, { merge: true });
  return { id, ...data };
});

/** Panitia mengubah status peserta (padanan PATCH /wisuda/peserta/:id/status). */
export const wisudaSetStatus = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, PANITIA);
  const { pesertaId, status, catatan } = req.data as { pesertaId: string; status: string; catatan?: string };
  const valid = ['DAFTAR', 'VERIFIKASI', 'DITERIMA', 'DITOLAK', 'SELESAI'];
  if (!valid.includes(status)) badRequest('Status tidak valid');
  await db.collection('pesertaWisuda').doc(pesertaId).update({ status, catatan: catatan ?? null });
  return { ok: true };
});

/** Generate nomor urut prosesi + nomor ijazah (padanan POST /wisuda/periode/:id/generate-nomor). */
export const wisudaGenerateNomor = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, PANITIA);

  const { periodeId } = req.data as { periodeId: string };
  const periodeSnap = await db.collection('periodeWisuda').doc(periodeId).get();
  if (!periodeSnap.exists) badRequest('Periode tidak ditemukan');
  const periode = periodeSnap.data()!;

  const pesertaSnap = await db.collection('pesertaWisuda')
    .where('periodeId', '==', periodeId)
    .where('status', 'in', ['DITERIMA', 'SELESAI'])
    .get();

  // Urutkan berdasarkan NIM mahasiswa (padanan orderBy mahasiswa.nim di Express)
  const withNim = await Promise.all(pesertaSnap.docs.map(async (d) => {
    const mhsSnap = await db.collection('mahasiswa').doc(d.data().mahasiswaId).get();
    return { doc: d, nim: mhsSnap.data()?.nim ?? '' };
  }));
  withNim.sort((a, b) => a.nim.localeCompare(b.nim));

  const tahun = new Date(periode.tanggal).getFullYear();
  const batch = db.batch();
  withNim.forEach(({ doc }, i) => {
    const urut = i + 1;
    const noIjazah = `${periode.kode}/${String(urut).padStart(4, '0')}/${tahun}`;
    batch.update(doc.ref, { nomorUrut: urut, noIjazah });
  });
  await batch.commit();

  return { message: `Nomor urut & ijazah digenerate untuk ${withNim.length} peserta`, jumlah: withNim.length };
});
