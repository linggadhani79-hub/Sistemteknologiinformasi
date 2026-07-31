// SIAKAD Terpadu — Cloud Functions
// Berisi seluruh logika bisnis yang di Firestore Security Rules ditandai
// `allow write: if false` (KRS, nilai/IPK, Neofeeder sync, CBT grading,
// pembayaran VA, generate nomor wisuda, payroll) — mengikuti pola: Firestore
// untuk data & baca langsung dari klien, Cloud Functions untuk aksi yang
// perlu validasi/kalkulasi/rahasia (kunci jawaban CBT, dsb).
export { registerCalon, createStaffAccount, setUserActive } from './auth.js';
export { krsAjukan, krsSetStatus, nilaiInput } from './akademik.js';
export { feederSyncMahasiswa, feederSyncNilai } from './neofeeder.js';
export { pmbDaftar, pmbVaGenerate, pmbPembayaranKonfirmasi, cbtMulai, cbtSubmit, cbtSoalUpsert, cbtSoalHapus } from './pmb.js';
export { payrollGenerate } from './kepegawaian.js';
export { wisudaDaftar, wisudaSetStatus, wisudaGenerateNomor } from './wisuda.js';
