import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../firebase';
import { useAuth } from '../auth';
import { PageHeader, Spinner, Badge, fmtRupiah, fmtTanggal } from '../components/ui';

const alur = ['DAFTAR', 'VERIFIKASI', 'DITERIMA', 'SELESAI'];

export function WisudaDaftar() {
  const { user } = useAuth();
  const [saya, setSaya] = useState<any[]>([]);
  const [periode, setPeriode] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ periodeId: '', judulSkripsi: '' });
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [sSnap, pSnap] = await Promise.all([
      getDocs(query(collection(db, 'pesertaWisuda'), where('mahasiswaId', '==', user!.uid))),
      getDocs(collection(db, 'periodeWisuda')),
    ]);
    const sList = await Promise.all(sSnap.docs.map(async (d) => {
      const p = d.data();
      const periodeSnap = await getDoc(doc(db, 'periodeWisuda', p.periodeId));
      return { id: d.id, ...p, periode: periodeSnap.data() };
    }));
    setSaya(sList);
    const pList = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setPeriode(pList);
    if (pList[0]) setForm((f) => ({ ...f, periodeId: pList[0].id }));
    setLoading(false);
  };
  useEffect(() => { if (user) load().catch(() => setLoading(false)); }, [user]);

  const uploadFoto = async (file: File) => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `foto/${user!.uid}/wisuda-${Date.now()}`);
      await uploadBytes(storageRef, file);
      setFotoUrl(await getDownloadURL(storageRef));
    } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const wisudaDaftar = httpsCallable(functions, 'wisudaDaftar');
      await wisudaDaftar({ ...form, fotoUrl: fotoUrl || undefined });
      setMsg('✅ Pendaftaran wisuda terkirim, menunggu verifikasi panitia.');
      load();
    } catch (err: any) {
      setMsg('❌ ' + (err.message ?? 'Gagal mendaftar'));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Pendaftaran Wisuda" subtitle="Daftarkan diri Anda untuk mengikuti prosesi wisuda" />

      {saya.length > 0 && (
        <div className="mb-6 space-y-4">
          {saya.map((s) => {
            const idx = alur.indexOf(s.status);
            return (
              <div key={s.id} className="card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{s.periode?.nama}</div>
                    <div className="text-sm text-gray-400">{fmtTanggal(s.periode?.tanggal)} · {s.periode?.lokasi}</div>
                  </div>
                  <Badge>{s.status}</Badge>
                </div>
                {s.status !== 'DITOLAK' && (
                  <div className="flex items-center">
                    {alur.map((a, i) => (
                      <div key={a} className="flex flex-1 items-center last:flex-none">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
                        {i < alur.length - 1 && <div className={`h-1 flex-1 ${i < idx ? 'bg-brand-500' : 'bg-gray-200'}`} />}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid gap-1 text-sm text-gray-600">
                  {s.noIjazah && <div>No. Ijazah: <b>{s.noIjazah}</b></div>}
                  {s.nomorUrut && <div>No. Urut Prosesi: <b>{s.nomorUrut}</b></div>}
                  {s.predikat && <div>Predikat: <b>{s.predikat.replace(/_/g, ' ')}</b></div>}
                  {s.catatan && <div className="rounded bg-amber-50 p-2 text-amber-700">{s.catatan}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={submit} className="card max-w-2xl space-y-4">
        <h3 className="font-semibold">Formulir Pendaftaran</h3>
        <div>
          <label className="mb-1 block text-sm font-medium">Periode Wisuda</label>
          <select className="input" value={form.periodeId} onChange={(e) => setForm({ ...form, periodeId: e.target.value })} required>
            {periode.map((p) => <option key={p.id} value={p.id}>{p.nama} — {fmtRupiah(p.biaya)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Judul Skripsi / Tugas Akhir</label>
          <input className="input" value={form.judulSkripsi} onChange={(e) => setForm({ ...form, judulSkripsi: e.target.value })} placeholder="Judul skripsi Anda" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Foto Wisuda (opsional)</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadFoto(e.target.files[0])} />
          {uploading && <p className="mt-1 text-xs text-gray-400">Mengunggah…</p>}
          {fotoUrl && <img src={fotoUrl} alt="preview" className="mt-2 h-24 w-24 rounded-lg object-cover" />}
          <p className="mt-1 text-xs text-gray-400">Foto formal untuk slide & ijazah. Kosongkan untuk memakai foto profil.</p>
        </div>
        {msg && <div className="text-sm">{msg}</div>}
        <button className="btn">Daftar Wisuda</button>
      </form>
    </div>
  );
}
