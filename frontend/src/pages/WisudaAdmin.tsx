import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
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
    api.get('/wisuda/periode').then((r) => {
      setPeriode(r.data.data);
      if (r.data.data[0]) setPeriodeId(r.data.data[0].id);
      setLoading(false);
    });
  }, []);

  const loadPeserta = (id: string) => {
    if (!id) return;
    api.get(`/wisuda/periode/${id}/peserta`).then((r) => setPeserta(r.data));
  };
  useEffect(() => { loadPeserta(periodeId); }, [periodeId]);

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/wisuda/peserta/${id}/status`, { status });
    loadPeserta(periodeId);
  };

  const generateNomor = async () => {
    setBusy(true); setMsg('');
    try {
      const { data } = await api.post(`/wisuda/periode/${periodeId}/generate-nomor`);
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
            <thead className="bg-gray-50">
              <tr>
                <th className="th">No.</th><th className="th">Nama</th><th className="th">NIM</th><th className="th">Prodi</th>
                <th className="th">IPK</th><th className="th">Predikat</th><th className="th">No. Ijazah</th>
                <th className="th">Status</th><th className="th">Aksi</th>
              </tr>
            </thead>
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
