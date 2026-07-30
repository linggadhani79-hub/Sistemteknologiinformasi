import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Spinner, StatCard } from '../components/ui';

export function Transkrip() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me');
        if (!me.data.mahasiswa) return setError('Halaman ini hanya untuk mahasiswa.');
        const t = await api.get(`/akademik/transkrip/${me.data.mahasiswa.id}`);
        setData(t.data);
      } catch {
        setError('Gagal memuat transkrip.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="card text-rose-500">{error}</div>;

  return (
    <div>
      <PageHeader title="Transkrip Nilai / KHS" subtitle={`${data.mahasiswa.nama} — ${data.mahasiswa.nim} — ${data.mahasiswa.prodi}`} />
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="IPK" value={data.mahasiswa.ipk?.toFixed(2)} icon="⭐" color="green" />
        <StatCard label="Total SKS" value={data.mahasiswa.totalSks} icon="📚" color="brand" />
        <StatCard label="Mata Kuliah" value={data.transkrip.length} icon="📄" color="purple" />
      </div>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Kode</th><th className="th">Mata Kuliah</th><th className="th">SKS</th>
                <th className="th">Semester</th><th className="th">Nilai</th><th className="th">Huruf</th><th className="th">Bobot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.transkrip.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="td font-mono">{r.kode}</td>
                  <td className="td">{r.matakuliah}</td>
                  <td className="td">{r.sks}</td>
                  <td className="td">{r.semester}</td>
                  <td className="td">{r.nilaiAkhir?.toFixed(1)}</td>
                  <td className="td"><span className="badge bg-blue-100 text-blue-700">{r.huruf}</span></td>
                  <td className="td">{r.bobot?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
