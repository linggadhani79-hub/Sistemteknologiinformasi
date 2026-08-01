import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { PageHeader, Spinner } from '../components/ui';

export function NilaiInput() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [kelasId, setKelasId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const kelasSnap = await getDocs(collection(db, 'kelas'));
      const list = await Promise.all(kelasSnap.docs.map(async (d) => {
        const k = d.data();
        const mkSnap = await getDoc(doc(db, 'mataKuliah', k.mataKuliahId));
        return { id: d.id, ...k, mataKuliah: mkSnap.data() };
      }));
      setKelasList(list);
      if (list[0]) setKelasId(list[0].id);
      setLoading(false);
    })();
  }, []);

  const loadMahasiswa = async (kid: string) => {
    if (!kid) return;
    setLoading(true);
    const krsSnap = await getDocs(query(collection(db, 'krs'), where('kelasIds', 'array-contains', kid), where('status', '==', 'DISETUJUI')));
    const list = await Promise.all(krsSnap.docs.map(async (d) => {
      const mahasiswaId = d.data().mahasiswaId;
      const [userSnap, mhsSnap, nilaiSnap] = await Promise.all([
        getDoc(doc(db, 'users', mahasiswaId)),
        getDoc(doc(db, 'mahasiswa', mahasiswaId)),
        getDoc(doc(db, 'nilai', `${mahasiswaId}_${kid}`)),
      ]);
      const n = nilaiSnap.data();
      return {
        mahasiswaId, nama: userSnap.data()?.nama, nim: mhsSnap.data()?.nim,
        tugas: n?.tugas ?? '', uts: n?.uts ?? '', uas: n?.uas ?? '', huruf: n?.huruf,
      };
    }));
    setRows(list);
    setLoading(false);
  };
  useEffect(() => { if (kelasId) loadMahasiswa(kelasId); }, [kelasId]);

  const update = (mahasiswaId: string, field: string, value: string) => {
    setRows((rs) => rs.map((r) => (r.mahasiswaId === mahasiswaId ? { ...r, [field]: value } : r)));
  };

  const save = async (row: any) => {
    setBusyId(row.mahasiswaId); setMsg('');
    try {
      const nilaiInput = httpsCallable(functions, 'nilaiInput');
      const { data } = await nilaiInput({
        mahasiswaId: row.mahasiswaId, kelasId,
        tugas: Number(row.tugas) || 0, uts: Number(row.uts) || 0, uas: Number(row.uas) || 0,
      }) as any;
      update(row.mahasiswaId, 'huruf', data.huruf);
      setMsg(`✅ Nilai ${row.nama} tersimpan (${data.huruf})`);
    } catch (e: any) {
      setMsg('❌ ' + (e.message ?? 'Gagal menyimpan nilai'));
    } finally { setBusyId(''); }
  };

  return (
    <div>
      <PageHeader title="Input Nilai" subtitle="Nilai akhir & IPK mahasiswa dihitung otomatis (Tugas 30% + UTS 30% + UAS 40%)" />
      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Kelas:</label>
          <select className="input max-w-md" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
            {kelasList.map((k) => <option key={k.id} value={k.id}>{k.kode} — {k.mataKuliah?.nama}</option>)}
          </select>
        </div>
        {msg && <div className="mb-3 text-sm">{msg}</div>}
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50"><tr>
                <th className="th">NIM</th><th className="th">Nama</th><th className="th">Tugas</th><th className="th">UTS</th><th className="th">UAS</th><th className="th">Huruf</th><th className="th">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.mahasiswaId}>
                    <td className="td font-mono text-xs">{r.nim}</td>
                    <td className="td">{r.nama}</td>
                    {(['tugas', 'uts', 'uas'] as const).map((f) => (
                      <td className="td" key={f}><input className="input w-20" type="number" min={0} max={100} value={r[f]} onChange={(e) => update(r.mahasiswaId, f, e.target.value)} /></td>
                    ))}
                    <td className="td">{r.huruf ? <span className="badge bg-blue-100 text-blue-700">{r.huruf}</span> : '-'}</td>
                    <td className="td"><button onClick={() => save(r)} disabled={busyId === r.mahasiswaId} className="btn text-xs">{busyId === r.mahasiswaId ? '…' : 'Simpan'}</button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td className="td text-center text-gray-400" colSpan={7}>Belum ada mahasiswa dengan KRS disetujui di kelas ini.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
