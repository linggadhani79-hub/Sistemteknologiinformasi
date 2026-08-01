import { onCall } from 'firebase-functions/v2/https';
import { db, REGION, requireUser, assertRole, badRequest } from './lib.js';

const HR: Parameters<typeof assertRole>[1] = ['SUPERADMIN', 'KEPEGAWAIAN'];

/** Generate payroll periode tertentu (padanan POST /kepegawaian/payroll/generate). */
export const payrollGenerate = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, HR);

  const { periode } = req.data as { periode: string }; // format YYYY-MM
  if (!periode) badRequest('periode wajib diisi (format YYYY-MM)');

  const pegawaiSnap = await db.collection('pegawai').where('status', '!=', 'PENSIUN').get();
  const batch = db.batch();
  let totalAnggaran = 0;
  for (const doc of pegawaiSnap.docs) {
    const p = doc.data();
    const tunjangan = p.gajiPokok * 0.25;
    const potongan = p.gajiPokok * 0.05;
    const totalGaji = p.gajiPokok + tunjangan - potongan;
    totalAnggaran += totalGaji;
    batch.set(db.collection('payroll').doc(`${doc.id}_${periode}`), {
      pegawaiId: doc.id, periode, gajiPokok: p.gajiPokok, tunjangan, potongan, totalGaji, createdAt: Date.now(),
    }, { merge: true });
  }
  await batch.commit();

  return { periode, jumlah: pegawaiSnap.size, totalAnggaran };
});
