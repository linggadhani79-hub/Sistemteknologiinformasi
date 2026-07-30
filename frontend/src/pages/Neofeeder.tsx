import { useState } from 'react';
import { api } from '../api';
import { PageHeader, StatCard, Spinner, useFetch, Badge } from '../components/ui';

export function Neofeeder() {
  const { data: dash, loading, reload } = useFetch<any>('/neofeeder/dashboard');
  const { data: logs, reload: reloadLogs } = useFetch<any>('/neofeeder/log');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState<any>(null);

  const sync = async (entitas: 'mahasiswa' | 'nilai') => {
    setBusy(entitas);
    setResult(null);
    try {
      const { data } = await api.post(`/neofeeder/sync/${entitas}`);
      setResult(data);
      reload();
      reloadLogs();
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Sinkronisasi Neofeeder / PDDikti" subtitle="Pelaporan data ke Pangkalan Data Pendidikan Tinggi" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Data Mahasiswa" value={dash?.totalMhs ?? 0} icon="🎓" color="brand" />
        <StatCard label="Data Nilai/AKM" value={dash?.totalNilai ?? 0} icon="📊" color="green" />
        <StatCard label="Total Sync" value={(dash?.ringkasanLog ?? []).reduce((s: number, l: any) => s + l._count, 0)} icon="🔄" color="purple" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">Sinkronisasi Data Mahasiswa</h3>
          <p className="mt-1 text-sm text-gray-500">Kirim data mahasiswa (biodata & status) ke Feeder.</p>
          <button className="btn mt-4" disabled={busy === 'mahasiswa'} onClick={() => sync('mahasiswa')}>
            {busy === 'mahasiswa' ? 'Mengirim…' : '🔄 Sync Mahasiswa'}
          </button>
        </div>
        <div className="card">
          <h3 className="font-semibold">Sinkronisasi Nilai / AKM</h3>
          <p className="mt-1 text-sm text-gray-500">Kirim aktivitas kuliah mahasiswa & nilai per semester.</p>
          <button className="btn mt-4" disabled={busy === 'nilai'} onClick={() => sync('nilai')}>
            {busy === 'nilai' ? 'Mengirim…' : '🔄 Sync Nilai'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card mb-6">
          <h3 className="mb-2 font-semibold">Hasil Sinkronisasi</h3>
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{result.log.pesan}</div>
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300">{JSON.stringify(result.preview, null, 2)}</pre>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="border-b px-5 py-3 font-semibold">Riwayat Sinkronisasi</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr><th className="th">Waktu</th><th className="th">Entitas</th><th className="th">Status</th><th className="th">Record</th><th className="th">Pesan</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {(logs?.data ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td className="td text-xs">{new Date(l.createdAt).toLocaleString('id-ID')}</td>
                  <td className="td font-medium">{l.entitas}</td>
                  <td className="td"><Badge>{l.status}</Badge></td>
                  <td className="td">{l.jumlahBerhasil}/{l.jumlahRecord}</td>
                  <td className="td text-xs text-gray-500">{l.pesan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
