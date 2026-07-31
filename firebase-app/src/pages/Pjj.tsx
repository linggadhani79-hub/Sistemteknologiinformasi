import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PageHeader, Spinner, Badge, fmtTanggal } from '../components/ui';

export function Pjj() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'sesiPjj'));
      const list: any[] = await Promise.all(snap.docs.map(async (d) => {
        const s = d.data();
        const kelasSnap = await getDoc(doc(db, 'kelas', s.kelasId));
        const kelas = kelasSnap.data();
        const mkSnap = kelas ? await getDoc(doc(db, 'mataKuliah', kelas.mataKuliahId)) : null;
        return { id: d.id, ...s, mataKuliah: mkSnap?.data() };
      }));
      list.sort((a, b) => (b.tanggal ?? 0) - (a.tanggal ?? 0));
      setRows(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Pembelajaran Jarak Jauh (PJJ)" subtitle="Sesi kuliah daring sinkron & asinkron" />
      <div className="card overflow-hidden p-0">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50"><tr>
                <th className="th">Pertemuan</th><th className="th">Judul</th><th className="th">Mata Kuliah</th>
                <th className="th">Tanggal</th><th className="th">Mode</th><th className="th">Link</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="td">{r.pertemuanKe}</td>
                    <td className="td">{r.judul}</td>
                    <td className="td">{r.mataKuliah?.nama}</td>
                    <td className="td">{fmtTanggal(r.tanggal)}</td>
                    <td className="td"><Badge>{r.mode}</Badge></td>
                    <td className="td">{r.linkMeeting ? <a className="text-brand-500 hover:underline" href={r.linkMeeting} target="_blank" rel="noreferrer">Gabung →</a> : '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td className="td text-center text-gray-400" colSpan={6}>Belum ada sesi PJJ.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
