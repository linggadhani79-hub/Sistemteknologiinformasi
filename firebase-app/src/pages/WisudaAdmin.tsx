import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { PageHeader, Spinner, Badge } from '../components/ui';

export function WisudaAdmin() {
  const nav = useNavigate();
  const [periode, setPeriode] = useState<any[]>([]);
  const [periodeId, setPeriodeId] = useState('');
  const [peserta, setPeserta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'periodeWisuda'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPeriode(list);
      if (list[0]) setPeriodeId(list[0].id);
      setLoading(false);
    })();
  }, []);

  const loadPeserta = async (id: string) => {
    if (!id) return;
    const snap = await getDocs(query(collection(db, 'pesertaWisuda'), where('periodeId', '==', id)));
    const list: any[] = await Promise.all(snap.docs.map(async (d) => {
      const p = d.data();
      const [mhsSnap] = await Promise.all([getDoc(doc(db, 'mahasiswa', p.mahasiswaId))]);
      const mhs = mhsSnap.data();
      const [userSnap, prodiSnap] = await Promise.all([
        getDoc(doc(db, 'users', p.mahasiswaId)),
        mhs ? getDoc(doc(db, 'prodi', mhs.prodiId)) : Promise.resolve(null as any),
      ]);
      return { id: d.id, ...p, mahasiswa: { ...mhs, user: userSnap.data(), prodi: prodiSnap?.data() } };
    }));
    list.sort((a, b) => (a.nomorUrut ?? 999) - (b.nomorUrut ?? 999));
    setPeserta(list);
  };
  useEffect(() => { loadPeserta(periodeId); }, [periodeId]);

  const setStatus = async (pesertaId: string, status: string) => {
    const fn = httpsCallable(functions, 'wisudaSetStatus');
    await fn({ pesertaId, status });
    loadPeserta(periodeId);
  };

  const generateNomor = async () => {
    setBusy(true); setMsg('');
    try {
      const fn = httpsCallable(functions, 'wisudaGenerateNomor');
      const { data }: any = await fn({ periodeId });
      setMsg(`✅ ${data.message}`);
      loadPeserta(periodeId);
    } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Peserta Wisuda"
        subtitle="Verifikasi peserta, generate nomor ijazah, dan buka slide seremoni"
        action={
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={busy} onClick={generateNomor}>🔢 Generate Nomor</button>
            <button className="btn" onClick={() => nav(`/wisuda/slide/${periodeId}`)}>🎬 Buka Slide</button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">Periode:</label>
        <select className="input max-w-md" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)}>
          {periode.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
        </select>
      </div>
      {msg && <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              <th className="th">No.</th><th className="th">Nama</th><th className="th">NIM</th><th className="th">Prodi</th>
              <th className="th">IPK</th><th className="th">Predikat</th><th className="th">No. Ijazah</th><th className="th">Status</th><th className="th">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {peserta.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="td">{p.nomorUrut ?? '-'}</td>
                  <td className="td font-medium">{p.mahasiswa?.user?.nama}</td>
                  <td className="td font-mono text-xs">{p.mahasiswa?.nim}</td>
                  <td className="td">{p.mahasiswa?.prodi?.nama}</td>
                  <td className="td">{p.ipk?.toFixed(2)}</td>
                  <td className="td text-xs">{p.predikat?.replace(/_/g, ' ')}</td>
                  <td className="td font-mono text-xs">{p.noIjazah ?? '-'}</td>
                  <td className="td"><Badge>{p.status}</Badge></td>
                  <td className="td">
                    <div className="flex gap-1">
                      {p.status !== 'DITERIMA' && <button onClick={() => setStatus(p.id, 'DITERIMA')} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200">Terima</button>}
                      {p.status !== 'DITOLAK' && <button onClick={() => setStatus(p.id, 'DITOLAK')} className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700 hover:bg-rose-200">Tolak</button>}
                      <button onClick={() => nav(`/wisuda/ijazah/${p.id}`)} className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-600 hover:bg-brand-100">Ijazah</button>
                    </div>
                  </td>
                </tr>
              ))}
              {peserta.length === 0 && <tr><td className="td text-center text-gray-400" colSpan={9}>Belum ada peserta pada periode ini.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
