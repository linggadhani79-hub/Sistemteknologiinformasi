import { onCall } from 'firebase-functions/v2/https';
import { db, REGION, requireUser, assertRole, badRequest } from './lib.js';

// ---- KRS: pengajuan mahasiswa (padanan POST /akademik/krs) ----
export const krsAjukan = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['MAHASISWA']);

  const { tahunAkademikId, kelasIds } = req.data as { tahunAkademikId: string; kelasIds: string[] };
  if (!tahunAkademikId || !Array.isArray(kelasIds) || kelasIds.length === 0) {
    badRequest('tahunAkademikId dan kelasIds wajib diisi');
  }

  // Hitung total SKS dari kelas -> mataKuliah
  let totalSks = 0;
  for (const kelasId of kelasIds) {
    const kelasSnap = await db.collection('kelas').doc(kelasId).get();
    if (!kelasSnap.exists) badRequest(`Kelas ${kelasId} tidak ditemukan`);
    const mkSnap = await db.collection('mataKuliah').doc(kelasSnap.data()!.mataKuliahId).get();
    totalSks += mkSnap.data()?.sks ?? 0;
  }
  if (totalSks > 24) badRequest(`Total SKS (${totalSks}) melebihi batas maksimal 24 SKS`);

  const id = `${caller.uid}_${tahunAkademikId}`;
  await db.collection('krs').doc(id).set({
    mahasiswaId: caller.uid, tahunAkademikId, status: 'DIAJUKAN', totalSks, kelasIds, createdAt: Date.now(),
  }, { merge: true });

  return { id, totalSks, status: 'DIAJUKAN' };
});

// ---- KRS: approval dosen wali / admin (padanan PATCH /akademik/krs/:id/status) ----
export const krsSetStatus = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN']);

  const { krsId, status, catatan } = req.data as { krsId: string; status: string; catatan?: string };
  if (!['DISETUJUI', 'DITOLAK'].includes(status)) badRequest('Status tidak valid');

  await db.collection('krs').doc(krsId).update({ status, catatan: catatan ?? null });
  return { ok: true };
});

// Konversi nilai angka -> huruf & bobot (identik dengan backend Express)
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

// ---- Input nilai + rekalkulasi IPK otomatis (padanan POST /akademik/nilai) ----
export const nilaiInput = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN']);

  const { mahasiswaId, kelasId, tugas = 0, uts = 0, uas = 0 } = req.data as {
    mahasiswaId: string; kelasId: string; tugas?: number; uts?: number; uas?: number;
  };
  if (!mahasiswaId || !kelasId) badRequest('mahasiswaId dan kelasId wajib diisi');

  const nilaiAkhir = tugas * 0.3 + uts * 0.3 + uas * 0.4;
  const { huruf, bobot } = konversiNilai(nilaiAkhir);
  const id = `${mahasiswaId}_${kelasId}`;

  await db.collection('nilai').doc(id).set({
    mahasiswaId, kelasId, tugas, uts, uas, nilaiAkhir, huruf, bobot, createdAt: Date.now(),
  }, { merge: true });

  await hitungUlangIpk(mahasiswaId);
  return { id, nilaiAkhir, huruf, bobot };
});

async function hitungUlangIpk(mahasiswaId: string) {
  const nilaiSnap = await db.collection('nilai').where('mahasiswaId', '==', mahasiswaId).get();
  let totalMutu = 0;
  let totalSks = 0;
  for (const doc of nilaiSnap.docs) {
    const n = doc.data();
    if (n.bobot == null) continue;
    const kelasSnap = await db.collection('kelas').doc(n.kelasId).get();
    const mkSnap = await db.collection('mataKuliah').doc(kelasSnap.data()!.mataKuliahId).get();
    const sks = mkSnap.data()?.sks ?? 0;
    totalSks += sks;
    totalMutu += n.bobot * sks;
  }
  const ipk = totalSks ? Number((totalMutu / totalSks).toFixed(2)) : 0;
  await db.collection('mahasiswa').doc(mahasiswaId).update({ ipk, totalSks });
}
