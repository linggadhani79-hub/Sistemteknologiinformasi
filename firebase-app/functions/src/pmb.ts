import { onCall } from 'firebase-functions/v2/https';
import { db, REGION, requireUser, assertRole, badRequest, forbidden } from './lib.js';

const PANITIA: Parameters<typeof assertRole>[1] = ['SUPERADMIN', 'ADMIN_AKADEMIK'];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

/** Pendaftaran PMB oleh calon mahasiswa (padanan POST /pmb/daftar). */
export const pmbDaftar = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['CALON_MAHASISWA']);

  const { gelombangId, asalSekolah, pilihanProdi1, pilihanProdi2, hp } = req.data as {
    gelombangId: string; asalSekolah?: string; pilihanProdi1?: string; pilihanProdi2?: string; hp?: string;
  };
  const gelombangSnap = await db.collection('gelombangPmb').doc(gelombangId).get();
  if (!gelombangSnap.exists || !gelombangSnap.data()!.aktif) badRequest('Gelombang tidak tersedia');

  const existing = await db.collection('pendaftar').doc(caller.uid).get();
  if (existing.exists) badRequest('Anda sudah terdaftar');

  const countSnap = await db.collection('pendaftar').count().get();
  const noPendaftaran = `PMB${gelombangSnap.data()!.tahun}${String(countSnap.data().count + 1).padStart(4, '0')}`;

  const data = {
    noPendaftaran, gelombangId, nama: caller.nama, email: (await db.collection('users').doc(caller.uid).get()).data()!.email,
    hp: hp ?? null, asalSekolah: asalSekolah ?? null, pilihanProdi1: pilihanProdi1 ?? null, pilihanProdi2: pilihanProdi2 ?? null,
    status: 'DAFTAR', createdAt: Date.now(),
  };
  await db.collection('pendaftar').doc(caller.uid).set(data);
  return { id: caller.uid, ...data };
});

/** Generate Virtual Account untuk pembayaran (padanan POST /pmb/pembayaran/va). */
export const pmbVaGenerate = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['CALON_MAHASISWA']);

  const { bank, nomorHp } = req.data as { bank: string; nomorHp?: string };
  const pendaftarSnap = await db.collection('pendaftar').doc(caller.uid).get();
  if (!pendaftarSnap.exists) badRequest('Anda belum mendaftar');
  const pendaftar = pendaftarSnap.data()!;

  const konfigSnap = await db.collection('konfigurasiVA').doc(bank).get();
  if (!konfigSnap.exists || !konfigSnap.data()!.aktif) badRequest('Bank tidak tersedia');
  const konfig = konfigSnap.data()!;

  const gelombangSnap = await db.collection('gelombangPmb').doc(pendaftar.gelombangId).get();
  const hp = (nomorHp || pendaftar.hp || '0').replace(/\D/g, '');
  const seq = String(Math.abs(hashCode(caller.uid))).padStart(10, '0').slice(0, 10);
  const nomorVA = `${konfig.prefixVA}${seq}`;

  const data = {
    pendaftarId: caller.uid, bank, namaBank: konfig.namaBank, nomorVA, nomorHp: hp,
    jumlah: gelombangSnap.data()?.biaya ?? 0, status: 'BELUM_BAYAR',
    jatuhTempo: Date.now() + 3 * 24 * 3600 * 1000, createdAt: Date.now(),
  };
  await db.collection('tagihanVA').doc(nomorVA).set(data, { merge: true });
  return { id: nomorVA, ...data };
});

/** Konfirmasi pembayaran (simulasi callback bank/gateway; padanan POST /pmb/pembayaran/:id/konfirmasi). */
export const pmbPembayaranKonfirmasi = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  const { nomorVA } = req.data as { nomorVA: string };
  const tagihanSnap = await db.collection('tagihanVA').doc(nomorVA).get();
  if (!tagihanSnap.exists) badRequest('Tagihan tidak ditemukan');
  const tagihan = tagihanSnap.data()!;

  const isPanitia = PANITIA.includes(caller.role);
  if (!isPanitia && tagihan.pendaftarId !== caller.uid) forbidden('Tidak diizinkan');

  await db.collection('tagihanVA').doc(nomorVA).update({ status: 'LUNAS', paidAt: Date.now() });
  await db.collection('pendaftar').doc(tagihan.pendaftarId).update({ status: 'BAYAR' });
  return { ok: true };
});

/** Mulai ujian CBT — kirim soal tanpa kunci jawaban (padanan POST /pmb/cbt/mulai). */
export const cbtMulai = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['CALON_MAHASISWA']);

  const existing = await db.collection('ujianCbt').doc(caller.uid).get();
  if (existing.exists && existing.data()!.status === 'SELESAI') badRequest('Anda sudah menyelesaikan ujian');

  const soalSnap = await db.collection('soalCbtPublic').get();
  if (soalSnap.empty) badRequest('Bank soal belum tersedia');

  await db.collection('ujianCbt').doc(caller.uid).set({
    pendaftarId: caller.uid, mulai: Date.now(), status: 'BERLANGSUNG',
    jumlahSoal: soalSnap.size, durasiMenit: 60,
  }, { merge: true });

  return {
    ujian: { durasiMenit: 60, jumlahSoal: soalSnap.size },
    soal: soalSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
});

/** Submit jawaban CBT — dinilai otomatis di server (kunci jawaban tak pernah dikirim ke klien). */
export const cbtSubmit = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['CALON_MAHASISWA']);

  const ujianSnap = await db.collection('ujianCbt').doc(caller.uid).get();
  if (!ujianSnap.exists || ujianSnap.data()!.status !== 'BERLANGSUNG') badRequest('Ujian belum dimulai / sudah selesai');

  const { jawaban } = req.data as { jawaban: Record<string, string> };
  const soalSnap = await db.collection('soalCbtPublic').get();
  let benar = 0;
  const batch = db.batch();
  for (const soalDoc of soalSnap.docs) {
    const j = jawaban?.[soalDoc.id];
    if (!j) continue;
    const kunciSnap = await db.collection('soalCbtKunci').doc(soalDoc.id).get();
    const jawabanId = `${caller.uid}_${soalDoc.id}`;
    batch.set(db.collection('jawabanCbt').doc(jawabanId), { ujianId: caller.uid, soalId: soalDoc.id, jawaban: j });
    if (kunciSnap.exists && kunciSnap.data()!.jawaban === j) benar++;
  }
  await batch.commit();

  const nilai = Number(((benar / soalSnap.size) * 100).toFixed(1));
  await db.collection('ujianCbt').doc(caller.uid).update({
    status: 'SELESAI', selesai: Date.now(), jumlahBenar: benar, jumlahSoal: soalSnap.size, nilai,
  });
  await db.collection('pendaftar').doc(caller.uid).update({ nilaiUjian: nilai, status: 'UJIAN' });

  return { nilai, jumlahBenar: benar, jumlahSoal: soalSnap.size };
});

/**
 * Admin membuat/mengubah soal CBT + kunci jawaban sekaligus (padanan crudRouter
 * /pmb/cbt/soal Express). `soalCbtKunci` dikunci total di Firestore Rules —
 * hanya fungsi ini (Admin SDK) yang bisa menulisnya, agar kunci jawaban tidak
 * pernah bisa diakses langsung oleh klien mana pun, termasuk admin.
 */
export const cbtSoalUpsert = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, PANITIA);

  const { id, kategori, pertanyaan, opsiA, opsiB, opsiC, opsiD, jawaban } = req.data as {
    id?: string; kategori: string; pertanyaan: string; opsiA: string; opsiB: string; opsiC: string; opsiD: string; jawaban: string;
  };
  if (!['A', 'B', 'C', 'D'].includes(jawaban)) badRequest('Kunci jawaban harus A/B/C/D');

  const ref = id ? db.collection('soalCbtPublic').doc(id) : db.collection('soalCbtPublic').doc();
  await ref.set({ kategori, pertanyaan, opsiA, opsiB, opsiC, opsiD });
  await db.collection('soalCbtKunci').doc(ref.id).set({ jawaban });
  return { id: ref.id };
});

/** Admin menghapus soal CBT + kuncinya. */
export const cbtSoalHapus = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, PANITIA);
  const { id } = req.data as { id: string };
  await db.collection('soalCbtPublic').doc(id).delete();
  await db.collection('soalCbtKunci').doc(id).delete();
  return { ok: true };
});
