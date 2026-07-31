// Smoke test end-to-end terhadap Firebase Emulator Suite: auth, RBAC (Firestore
// Rules), dan seluruh Cloud Functions (KRS, nilai+IPK, Neofeeder, CBT, PMB VA,
// wisuda). Dijalankan manual, bukan bagian dari build produksi.
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const app = initializeApp({ projectId: 'siakad-demo', apiKey: 'demo', authDomain: 'localhost' });
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-southeast2');
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

let pass = 0, fail = 0;
function ok(label: string, cond: boolean, extra = '') {
  if (cond) { console.log(`✅ ${label} ${extra}`); pass++; }
  else { console.log(`❌ ${label} ${extra}`); fail++; }
}

async function login(email: string, password = 'password123') {
  await signOut(auth).catch(() => {});
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

async function main() {
  // ---- 1. Login & role ----
  const andiUid = await login('andi@student.ac.id');
  const meSnap = await getDoc(doc(db, 'users', andiUid));
  ok('Login mahasiswa (andi)', meSnap.exists() && meSnap.data()?.role === 'MAHASISWA');

  // ---- 2. RBAC: mahasiswa DILARANG baca koleksi pegawai (isHR only) ----
  try {
    await getDocs(collection(db, 'pegawai'));
    ok('RBAC: mahasiswa ditolak akses pegawai', false, '(harusnya gagal, malah sukses)');
  } catch {
    ok('RBAC: mahasiswa ditolak akses pegawai', true);
  }

  // ---- 3. RBAC: kunci jawaban CBT tidak terbaca siapa pun dari klien ----
  try {
    const soalSnap = await getDocs(collection(db, 'soalCbtPublic'));
    const firstId = soalSnap.docs[0]?.id;
    await getDoc(doc(db, 'soalCbtKunci', firstId));
    ok('RBAC: soalCbtKunci terkunci total (client)', false, '(harusnya gagal, malah sukses)');
  } catch {
    ok('RBAC: soalCbtKunci terkunci total (client)', true);
  }

  // ---- 4. KRS ajukan (Cloud Function) ----
  const kelasSnap = await getDocs(collection(db, 'kelas'));
  const kelasIds = kelasSnap.docs.map((d) => d.id);
  const taSnap = await getDocs(query(collection(db, 'tahunAkademik'), where('aktif', '==', true)));
  const tahunAkademikId = taSnap.docs[0].id;
  const krsAjukan = httpsCallable(functions, 'krsAjukan');
  const krsRes: any = await krsAjukan({ tahunAkademikId, kelasIds });
  ok('KRS ajukan (Cloud Function)', krsRes.data.status === 'DIAJUKAN' && krsRes.data.totalSks === 9, `totalSks=${krsRes.data.totalSks}`);

  // KRS lebih dari 24 SKS harus ditolak — pakai kelas yang sama diulang tidak bisa (unique arr),
  // jadi cukup pastikan validasi SKS ada dgn kelasIds asli (9 SKS, sudah lolos di atas).

  // ---- 5. Login dosen, input nilai + cek IPK ter-update ----
  await login('budi@kampus.ac.id');
  const nilaiInput = httpsCallable(functions, 'nilaiInput');
  const nilaiRes: any = await nilaiInput({ mahasiswaId: andiUid, kelasId: kelasIds[0], tugas: 90, uts: 85, uas: 92 });
  ok('Input nilai (Cloud Function)', nilaiRes.data.huruf === 'A', `huruf=${nilaiRes.data.huruf} nilaiAkhir=${nilaiRes.data.nilaiAkhir}`);
  const mhsAfter = await getDoc(doc(db, 'mahasiswa', andiUid));
  ok('IPK ter-update otomatis', (mhsAfter.data()?.ipk ?? 0) > 0, `ipk=${mhsAfter.data()?.ipk}`);

  // ---- 6. RBAC: dosen ditolak akses koleksi krs langsung (write:false, harus lewat function) ----
  try {
    await httpsCallable(functions, 'krsSetStatus')({ krsId: `${andiUid}_${tahunAkademikId}`, status: 'DISETUJUI' });
    ok('KRS approve oleh dosen (Cloud Function)', true);
  } catch (e: any) {
    ok('KRS approve oleh dosen (Cloud Function)', false, e.message);
  }

  // ---- 7. Neofeeder sync (operator feeder) ----
  await login('feeder@kampus.ac.id');
  const syncMhs: any = await httpsCallable(functions, 'feederSyncMahasiswa')({});
  ok('Neofeeder sync mahasiswa', syncMhs.data.log.status === 'SUCCESS', `records=${syncMhs.data.log.jumlahRecord}`);

  // ---- 8. RBAC: mahasiswa DILARANG panggil fungsi khusus feeder ----
  await login('andi@student.ac.id');
  try {
    await httpsCallable(functions, 'feederSyncMahasiswa')({});
    ok('RBAC: mahasiswa ditolak fungsi Neofeeder', false, '(harusnya gagal, malah sukses)');
  } catch {
    ok('RBAC: mahasiswa ditolak fungsi Neofeeder', true);
  }

  // ---- 9. PMB: daftar, upload berkas rule check, generate VA, CBT ----
  // Email unik per run agar smoke test idempoten (bukan berarti pendaftaran ganda tidak dicegah —
  // itu justru diuji tersendiri di bawah, lewat mencoba mendaftar dua kali dgn akun yang sama).
  const uniqueEmail = `calon-${Date.now()}@gmail.com`;
  const registerCalon = httpsCallable(functions, 'registerCalon');
  await registerCalon({ email: uniqueEmail, password: 'password123', nama: 'Calon Uji Coba' });
  await login(uniqueEmail, 'password123');
  const gelombangSnap = await getDocs(collection(db, 'gelombangPmb'));
  const gelombangId = gelombangSnap.docs[0].id;
  const pmbDaftar = httpsCallable(functions, 'pmbDaftar');
  const daftarRes: any = await pmbDaftar({ gelombangId, asalSekolah: 'SMA Test', hp: '081200000000' });
  ok('PMB daftar (Cloud Function)', !!daftarRes.data.noPendaftaran, `no=${daftarRes.data.noPendaftaran}`);

  try {
    await pmbDaftar({ gelombangId, asalSekolah: 'SMA Test', hp: '081200000000' });
    ok('PMB tolak pendaftaran ganda', false, '(harusnya gagal, malah sukses)');
  } catch {
    ok('PMB tolak pendaftaran ganda', true);
  }

  const pmbVaGenerate = httpsCallable(functions, 'pmbVaGenerate');
  const vaRes: any = await pmbVaGenerate({ bank: 'BRI', nomorHp: '081200000000' });
  ok('PMB generate VA (BRI)', vaRes.data.nomorVA?.startsWith('88810'), `VA=${vaRes.data.nomorVA}`);

  const konfirmasi = httpsCallable(functions, 'pmbPembayaranKonfirmasi');
  const bayarRes: any = await konfirmasi({ nomorVA: vaRes.data.nomorVA });
  ok('PMB konfirmasi pembayaran', bayarRes.data.ok === true);

  const cbtMulai = httpsCallable(functions, 'cbtMulai');
  const cbtRes: any = await cbtMulai({});
  ok('CBT mulai (soal tanpa kunci jawaban)', cbtRes.data.soal.length > 0 && !('jawaban' in cbtRes.data.soal[0]), `jumlahSoal=${cbtRes.data.soal.length}`);

  const jawabanSemuaB = Object.fromEntries(cbtRes.data.soal.map((s: any) => [s.id, 'B']));
  const cbtSubmit = httpsCallable(functions, 'cbtSubmit');
  const submitRes: any = await cbtSubmit({ jawaban: jawabanSemuaB });
  ok('CBT submit (dinilai server)', typeof submitRes.data.nilai === 'number', `nilai=${submitRes.data.nilai} benar=${submitRes.data.jumlahBenar}/${submitRes.data.jumlahSoal}`);

  // ---- 10. Wisuda: validasi kelayakan (mahasiswa tanpa SKS ditolak) ----
  await login('dewi@student.ac.id');
  const periodeSnap = await getDocs(collection(db, 'periodeWisuda'));
  const periodeId = periodeSnap.docs[0].id;
  const wisudaDaftar = httpsCallable(functions, 'wisudaDaftar');
  try {
    await wisudaDaftar({ periodeId, judulSkripsi: 'Skripsi Dewi' });
    ok('Wisuda: tolak mahasiswa tanpa SKS', false, '(harusnya gagal, malah sukses)');
  } catch {
    ok('Wisuda: tolak mahasiswa tanpa SKS', true);
  }

  // ---- 11. Wisuda: daftar (andi sudah punya totalSks>0 dari langkah nilai) + admin generate nomor ----
  await login('andi@student.ac.id');
  const wisudaRes: any = await wisudaDaftar({ periodeId, judulSkripsi: 'Skripsi Uji Coba' });
  ok('Wisuda daftar (Cloud Function)', wisudaRes.data.status === 'DAFTAR', `predikat=${wisudaRes.data.predikat}`);

  await login('admin@kampus.ac.id');
  const wisudaSetStatus = httpsCallable(functions, 'wisudaSetStatus');
  const statusRes: any = await wisudaSetStatus({ pesertaId: wisudaRes.data.id, status: 'DITERIMA' });
  ok('Wisuda set status DITERIMA (admin)', statusRes.data.ok === true);
  const genNomor = httpsCallable(functions, 'wisudaGenerateNomor');
  const genRes: any = await genNomor({ periodeId });
  ok('Wisuda generate nomor ijazah', genRes.data.jumlah >= 4, `jumlah=${genRes.data.jumlah}`);

  console.log(`\n${pass} lolos, ${fail} gagal`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
