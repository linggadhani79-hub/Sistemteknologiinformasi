import { onCall } from 'firebase-functions/v2/https';
import { db, REGION, requireUser, assertRole } from './lib.js';

const OPS: Parameters<typeof assertRole>[1] = ['SUPERADMIN', 'OPERATOR_FEEDER'];

function statusToFeeder(status: string): string {
  const map: Record<string, string> = { AKTIF: 'A', CUTI: 'C', LULUS: 'L', DROP_OUT: 'D', MENGUNDURKAN_DIRI: 'K', NON_AKTIF: 'N' };
  return map[status] ?? 'A';
}

/** Simulasi sinkronisasi data mahasiswa ke Neofeeder/PDDikti (padanan POST /neofeeder/sync/mahasiswa). */
export const feederSyncMahasiswa = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, OPS);

  const mhsSnap = await db.collection('mahasiswa').get();
  const records = [];
  for (const doc of mhsSnap.docs) {
    const m = doc.data();
    const userSnap = await db.collection('users').doc(doc.id).get();
    records.push({
      nim: m.nim,
      nama_mahasiswa: userSnap.data()?.nama ?? '',
      id_prodi: m.prodiId,
      nisn: m.nisn ?? '',
      jenis_kelamin: m.jenisKelamin ?? '',
      id_status_mahasiswa: statusToFeeder(m.status),
    });
  }

  const log = {
    entitas: 'MAHASISWA', status: 'SUCCESS', jumlahRecord: records.length,
    jumlahBerhasil: records.length, jumlahGagal: 0,
    pesan: `Sinkronisasi ${records.length} data mahasiswa ke Neofeeder berhasil (simulasi).`,
    payload: JSON.stringify({ act: 'InsertMahasiswa', records }), createdAt: Date.now(),
  };
  const ref = await db.collection('feederSyncLog').add(log);
  return { log: { id: ref.id, ...log }, preview: records.slice(0, 5) };
});

/** Simulasi sinkronisasi nilai / Aktivitas Kuliah Mahasiswa (padanan POST /neofeeder/sync/nilai). */
export const feederSyncNilai = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, OPS);

  const { tahunAkademikId } = (req.data ?? {}) as { tahunAkademikId?: string };
  const nilaiSnap = await db.collection('nilai').get();
  const records = [];
  for (const doc of nilaiSnap.docs) {
    const n = doc.data();
    const kelasSnap = await db.collection('kelas').doc(n.kelasId).get();
    if (tahunAkademikId && kelasSnap.data()?.tahunAkademikId !== tahunAkademikId) continue;
    const mhsSnap = await db.collection('mahasiswa').doc(n.mahasiswaId).get();
    records.push({
      nim: mhsSnap.data()?.nim ?? '',
      id_matkul: kelasSnap.data()?.mataKuliahId ?? '',
      nilai_angka: n.nilaiAkhir ?? 0,
      nilai_huruf: n.huruf ?? '',
      nilai_indeks: n.bobot ?? 0,
    });
  }

  const log = {
    entitas: 'NILAI', tahunAkademikId: tahunAkademikId ?? null, status: 'SUCCESS',
    jumlahRecord: records.length, jumlahBerhasil: records.length, jumlahGagal: 0,
    pesan: `Sinkronisasi ${records.length} nilai/AKM ke Neofeeder berhasil (simulasi).`,
    payload: JSON.stringify({ act: 'InsertNilaiPerkuliahanKelas', records }), createdAt: Date.now(),
  };
  const ref = await db.collection('feederSyncLog').add(log);
  return { log: { id: ref.id, ...log }, preview: records.slice(0, 5) };
});
