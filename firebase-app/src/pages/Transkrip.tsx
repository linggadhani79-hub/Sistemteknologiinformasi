import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth';
import { PageHeader, Spinner, StatCard } from '../components/ui';

export function Transkrip() {
  const { user } = useAuth();
  const [mhs, setMhs] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const mhsSnap = await getDoc(doc(db, 'mahasiswa', user.uid));
        if (!mhsSnap.exists()) return setError('Halaman ini hanya untuk mahasiswa.');
        const mhsData = mhsSnap.data();
        const prodiSnap = await getDoc(doc(db, 'prodi', mhsData.prodiId));
        setMhs({ nim: mhsData.nim, nama: user.nama, prodi: prodiSnap.data()?.nama, ipk: mhsData.ipk, totalSks: mhsData.totalSks });

        const nilaiSnap = await getDocs(query(collection(db, 'nilai'), where('mahasiswaId', '==', user.uid)));
        const list = await Promise.all(nilaiSnap.docs.map(async (d) => {
          const n = d.data();
          const kelasSnap = await getDoc(doc(db, 'kelas', n.kelasId));
          const kelas = kelasSnap.data();
          const [mkSnap, taSnap] = await Promise.all([
            getDoc(doc(db, 'mataKuliah', kelas!.mataKuliahId)),
            getDoc(doc(db, 'tahunAkademik', kelas!.tahunAkademikId)),
          ]);
          const mk = mkSnap.data();
          return {
            kode: mk?.kode, matakuliah: mk?.nama, sks: mk?.sks, semester: taSnap.data()?.nama,
            nilaiAkhir: n.nilaiAkhir, huruf: n.huruf, bobot: n.bobot,
          };
        }));
        setRows(list);
      } catch {
        setError('Gagal memuat transkrip.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <Spinner />;
  if (error) return <div className="card text-rose-500">{error}</div>;

  return (
    <div>
      <PageHeader title="Transkrip Nilai / KHS" subtitle={`${mhs.nama} — ${mhs.nim} — ${mhs.prodi}`} />
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="IPK" value={mhs.ipk?.toFixed(2)} icon="⭐" color="green" />
        <StatCard label="Total SKS" value={mhs.totalSks} icon="📚" color="brand" />
        <StatCard label="Mata Kuliah" value={rows.length} icon="📄" color="purple" />
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
              {rows.map((r, i) => (
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
