import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../firebase';
import { useAuth } from '../auth';
import { PageHeader, Spinner, Badge, fmtRupiah } from '../components/ui';

const alurStatus = ['DAFTAR', 'BAYAR', 'VERIFIKASI', 'UJIAN', 'DITERIMA', 'DAFTAR_ULANG'];

export function PmbDaftar() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [gelombang, setGelombang] = useState<any[]>([]);
  const [prodi, setProdi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'status' | 'berkas' | 'bayar' | 'cbt'>('status');
  const [form, setForm] = useState({ gelombangId: '', asalSekolah: '', pilihanProdi1: '', pilihanProdi2: '', hp: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const pendaftarSnap = await getDoc(doc(db, 'pendaftar', user!.uid));
    if (pendaftarSnap.exists()) {
      const p = pendaftarSnap.data();
      const gSnap = await getDoc(doc(db, 'gelombangPmb', p.gelombangId));
      setStatus({ id: pendaftarSnap.id, ...p, gelombang: gSnap.data() });
    } else {
      const [gSnap, pSnap] = await Promise.all([getDocs(collection(db, 'gelombangPmb')), getDocs(collection(db, 'prodi'))]);
      const gList = gSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGelombang(gList);
      setProdi(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (gList[0]) setForm((f) => ({ ...f, gelombangId: gList[0].id }));
    }
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const pmbDaftar = httpsCallable(functions, 'pmbDaftar');
      await pmbDaftar(form);
      load();
    } catch (err: any) {
      setMsg('❌ ' + (err.message ?? 'Gagal mendaftar'));
    }
  };

  if (loading) return <Spinner />;

  if (!status) {
    return (
      <div>
        <PageHeader title="Formulir Pendaftaran Mahasiswa Baru" subtitle="Lengkapi data berikut untuk mendaftar" />
        <form onSubmit={submit} className="card max-w-2xl space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Gelombang</label>
            <select className="input" value={form.gelombangId} onChange={(e) => setForm({ ...form, gelombangId: e.target.value })} required>
              {gelombang.map((g) => <option key={g.id} value={g.id}>{g.nama} — {fmtRupiah(g.biaya)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Asal Sekolah</label>
            <input className="input" value={form.asalSekolah} onChange={(e) => setForm({ ...form, asalSekolah: e.target.value })} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Pilihan Prodi 1</label>
              <select className="input" value={form.pilihanProdi1} onChange={(e) => setForm({ ...form, pilihanProdi1: e.target.value })} required>
                <option value="">- pilih -</option>
                {prodi.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pilihan Prodi 2</label>
              <select className="input" value={form.pilihanProdi2} onChange={(e) => setForm({ ...form, pilihanProdi2: e.target.value })}>
                <option value="">- pilih -</option>
                {prodi.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">No. HP</label>
            <input className="input" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} placeholder="08xxxxxxxxxx" />
          </div>
          {msg && <div className="text-sm text-rose-500">{msg}</div>}
          <button className="btn">Kirim Pendaftaran</button>
        </form>
      </div>
    );
  }

  const tabs = [
    { k: 'status', label: '📋 Status' }, { k: 'berkas', label: '📎 Berkas' },
    { k: 'bayar', label: '💳 Pembayaran' }, { k: 'cbt', label: '🖥️ Ujian CBT' },
  ] as const;

  return (
    <div>
      <PageHeader title="Pendaftaran PMB" subtitle={`No. Pendaftaran: ${status.noPendaftaran}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.k ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'status' && <StatusTab status={status} />}
      {tab === 'berkas' && <BerkasTab uid={user!.uid} />}
      {tab === 'bayar' && <BayarTab uid={user!.uid} />}
      {tab === 'cbt' && <CbtTab uid={user!.uid} />}
    </div>
  );
}

function StatusTab({ status }: { status: any }) {
  const idx = alurStatus.indexOf(status.status);
  return (
    <>
      <div className="card mb-4">
        <div className="mb-4 flex items-center justify-between">
          <div><div className="text-lg font-semibold">{status.nama}</div><div className="text-sm text-gray-500">{status.gelombang?.nama}</div></div>
          <Badge>{status.status}</Badge>
        </div>
        <div className="flex items-center">
          {alurStatus.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
              {i < alurStatus.length - 1 && <div className={`h-1 flex-1 ${i < idx ? 'bg-brand-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-gray-400">{alurStatus.map((s) => <span key={s}>{s}</span>)}</div>
      </div>
      <div className="card grid gap-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Asal Sekolah</span><span>{status.asalSekolah ?? '-'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Nilai Ujian CBT</span><span>{status.nilaiUjian ?? 'Belum ujian'}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Biaya Pendaftaran</span><span>{fmtRupiah(status.gelombang?.biaya ?? 0)}</span></div>
        {status.catatan && <div className="mt-2 rounded bg-amber-50 p-2 text-amber-700">{status.catatan}</div>}
      </div>
    </>
  );
}

const labelBerkas: Record<string, string> = { FOTO: 'Pas Foto', IJAZAH: 'Ijazah/SKL', KTP: 'KTP', KK: 'Kartu Keluarga', RAPOR: 'Rapor', AKTA: 'Akta Kelahiran' };
const JENIS_BERKAS = ['FOTO', 'IJAZAH', 'KTP', 'KK', 'RAPOR', 'AKTA'];

function BerkasTab({ uid }: { uid: string }) {
  const [berkas, setBerkas] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState('');

  const load = async () => {
    const snap = await getDocs(query(collection(db, 'berkasPendaftar'), where('pendaftarId', '==', uid)));
    setBerkas(Object.fromEntries(snap.docs.map((d) => [d.data().jenis, { id: d.id, ...d.data() }])));
  };
  useEffect(() => { load(); }, [uid]);

  const upload = async (jenis: string, file: File) => {
    if (file.size > 3 * 1024 * 1024) return alert('Ukuran maksimal 3 MB');
    setBusy(jenis);
    try {
      const path = `berkas/${uid}/${jenis}/${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'berkasPendaftar', `${uid}_${jenis}`), {
        pendaftarId: uid, jenis, namaFile: file.name, mimeType: file.type, ukuran: file.size,
        storagePath: url, status: 'PENDING', createdAt: Date.now(),
      });
      await load();
    } finally { setBusy(''); }
  };

  return (
    <div className="card">
      <h3 className="mb-1 font-semibold">Upload Berkas Persyaratan</h3>
      <p className="mb-4 text-sm text-gray-400">Format gambar/PDF, maksimal 3 MB per berkas — disimpan di Firebase Storage.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {JENIS_BERKAS.map((j) => {
          const b = berkas[j];
          return (
            <div key={j} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <div className="text-sm font-medium">{labelBerkas[j]}</div>
                {b ? <div className="text-xs text-gray-400">{b.namaFile}</div> : <div className="text-xs text-gray-300">Belum diunggah</div>}
              </div>
              <div className="flex items-center gap-2">
                {b && <Badge>{b.status}</Badge>}
                <label className="btn-ghost cursor-pointer text-xs">
                  {busy === j ? '…' : b ? 'Ganti' : 'Unggah'}
                  <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && upload(j, e.target.files[0])} />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BayarTab({ uid }: { uid: string }) {
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [bank, setBank] = useState('');
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [tSnap, bSnap] = await Promise.all([
      getDocs(query(collection(db, 'tagihanVA'), where('pendaftarId', '==', uid))),
      getDocs(query(collection(db, 'konfigurasiVA'), where('aktif', '==', true))),
    ]);
    const tList = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTagihan(tList);
    const bList = bSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setBanks(bList);
    if (bList[0]) setBank(bList[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, [uid]);

  const buat = async () => {
    const pmbVaGenerate = httpsCallable(functions, 'pmbVaGenerate');
    await pmbVaGenerate({ bank, nomorHp: hp });
    load();
  };
  const bayar = async (nomorVA: string) => {
    const konfirmasi = httpsCallable(functions, 'pmbPembayaranKonfirmasi');
    await konfirmasi({ nomorVA });
    load();
  };

  if (loading) return <Spinner />;
  const aktif = tagihan.find((t) => t.status !== 'DIBATALKAN');

  return (
    <div className="space-y-4">
      {aktif ? (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Virtual Account {aktif.namaBank}</h3>
            <Badge>{aktif.status}</Badge>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 p-5 text-white">
            <div className="text-xs opacity-80">Nomor Virtual Account</div>
            <div className="mt-1 font-mono text-2xl font-bold tracking-wider">{aktif.nomorVA}</div>
            <div className="mt-3 flex justify-between text-sm">
              <div><div className="opacity-70">Total Bayar</div><div className="font-semibold">{fmtRupiah(aktif.jumlah)}</div></div>
              <div className="text-right"><div className="opacity-70">No. HP</div><div className="font-semibold">{aktif.nomorHp ?? '-'}</div></div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">Transfer ke nomor VA di atas melalui ATM / m-banking {aktif.namaBank}.</p>
          {aktif.status === 'BELUM_BAYAR' && <button onClick={() => bayar(aktif.id)} className="btn mt-4 w-full">✅ Simulasi Bayar (demo)</button>}
          {aktif.status === 'LUNAS' && <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Pembayaran lunas. Silakan lanjut ke Ujian CBT.</div>}
        </div>
      ) : (
        <div className="card">
          <h3 className="mb-3 font-semibold">Pilih Bank untuk Virtual Account</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {banks.map((b) => (
              <button key={b.id} onClick={() => setBank(b.id)} className={`rounded-xl border p-4 text-left transition ${bank === b.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="text-lg font-bold">{b.id}</div>
                <div className="text-xs text-gray-400">{b.namaBank}</div>
              </button>
            ))}
          </div>
          <input className="input mt-4" placeholder="No. HP (untuk notifikasi VA)" value={hp} onChange={(e) => setHp(e.target.value)} />
          <button onClick={buat} disabled={!bank} className="btn mt-3">Buat Virtual Account</button>
        </div>
      )}
    </div>
  );
}

function CbtTab({ uid }: { uid: string }) {
  const [ujian, setUjian] = useState<any>(null);
  const [soal, setSoal] = useState<any[] | null>(null);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'ujianCbt', uid));
      setUjian(snap.exists() ? snap.data() : null);
      setLoading(false);
    })();
  }, [uid]);

  const mulai = async () => {
    const cbtMulai = httpsCallable(functions, 'cbtMulai');
    const { data }: any = await cbtMulai({});
    setSoal(data.soal); setUjian({ ...data.ujian, status: 'BERLANGSUNG' });
  };
  const submit = async () => {
    const cbtSubmit = httpsCallable(functions, 'cbtSubmit');
    const { data }: any = await cbtSubmit({ jawaban });
    setHasil(data); setSoal(null);
    setUjian((u: any) => ({ ...u, status: 'SELESAI', nilai: data.nilai }));
  };

  if (loading) return <Spinner />;

  if (hasil || ujian?.status === 'SELESAI') {
    const nilai = hasil?.nilai ?? ujian?.nilai;
    return (
      <div className="card text-center">
        <div className="text-5xl">🎯</div>
        <h3 className="mt-3 text-lg font-semibold">Ujian CBT Selesai</h3>
        <div className="mt-2 text-4xl font-bold text-brand-600">{nilai}</div>
        {hasil && <p className="text-sm text-gray-500">{hasil.jumlahBenar} benar dari {hasil.jumlahSoal} soal</p>}
        <p className="mt-3 text-sm text-gray-400">Hasil ujian menjadi bahan pertimbangan seleksi oleh panitia.</p>
      </div>
    );
  }

  if (soal) {
    const terjawab = Object.keys(jawaban).length;
    return (
      <div className="space-y-4">
        <div className="card sticky top-16 z-10 flex items-center justify-between">
          <span className="text-sm">Terjawab: <b>{terjawab}/{soal.length}</b></span>
          <button onClick={submit} className="btn">Kumpulkan Jawaban</button>
        </div>
        {soal.map((s, i) => (
          <div key={s.id} className="card">
            <div className="mb-2 flex items-center gap-2">
              <span className="badge bg-brand-50 text-brand-600">{s.kategori.replace(/_/g, ' ')}</span>
              <span className="text-sm font-semibold">Soal {i + 1}</span>
            </div>
            <p className="mb-3">{s.pertanyaan}</p>
            <div className="grid gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-sm transition ${jawaban[s.id] === opt ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name={s.id} checked={jawaban[s.id] === opt} onChange={() => setJawaban({ ...jawaban, [s.id]: opt })} />
                  <span className="font-medium">{opt}.</span> {s[`opsi${opt}`]}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button onClick={submit} className="btn w-full">Kumpulkan Jawaban</button>
      </div>
    );
  }

  return (
    <div className="card text-center">
      <div className="text-5xl">🖥️</div>
      <h3 className="mt-3 text-lg font-semibold">Ujian Masuk (CBT)</h3>
      <p className="mt-1 text-sm text-gray-500">Ujian berbasis komputer: TPA, Matematika, Bahasa Indonesia & Inggris. Kerjakan sekali; hasil dinilai otomatis di server.</p>
      <button onClick={mulai} className="btn mt-4">Mulai Ujian</button>
    </div>
  );
}
