import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth } from '../auth';
import { PageHeader, Spinner, Badge } from '../components/ui';

export function KRS() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState<any[]>([]);
  const [tahun, setTahun] = useState<any[]>([]);
  const [krs, setKrs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [taId, setTaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [kelasSnap, taSnap, krsSnap] = await Promise.all([
      getDocs(collection(db, 'kelas')),
      getDocs(collection(db, 'tahunAkademik')),
      getDocs(query(collection(db, 'krs'), where('mahasiswaId', '==', user!.uid), orderBy('createdAt', 'desc'))),
    ]);

    const kelasList = await Promise.all(kelasSnap.docs.map(async (d) => {
      const k = d.data();
      const [mkSnap, dosenUserSnap] = await Promise.all([
        getDoc(doc(db, 'mataKuliah', k.mataKuliahId)),
        getDoc(doc(db, 'users', k.dosenId)),
      ]);
      return { id: d.id, ...k, mataKuliah: mkSnap.data(), dosenUser: dosenUserSnap.data() };
    }));
    setKelas(kelasList);

    const taList = taSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTahun(taList);
    const aktif = taList.find((t: any) => t.aktif);
    if (aktif) setTaId(aktif.id);

    setKrs(krsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
  useEffect(() => { if (user) load().catch(() => setLoading(false)); }, [user]);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const totalSks = kelas.filter((k) => selected.has(k.id)).reduce((s, k) => s + (k.mataKuliah?.sks ?? 0), 0);

  const submit = async () => {
    setMsg(''); setBusy(true);
    try {
      const krsAjukan = httpsCallable(functions, 'krsAjukan');
      await krsAjukan({ tahunAkademikId: taId, kelasIds: [...selected] });
      setMsg('✅ KRS berhasil diajukan, menunggu persetujuan dosen wali.');
      setSelected(new Set());
      load();
    } catch (e: any) {
      setMsg('❌ ' + (e.message ?? 'Gagal mengajukan KRS'));
    } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Kartu Rencana Studi (KRS)" subtitle="Pilih kelas yang akan diambil semester ini (maks. 24 SKS)" />

      {krs.length > 0 && (
        <div className="card mb-6">
          <h3 className="mb-3 font-semibold">Riwayat KRS</h3>
          {krs.map((k) => (
            <div key={k.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <div className="text-sm font-medium">{tahun.find((t) => t.id === k.tahunAkademikId)?.nama}</div>
                <div className="text-xs text-gray-400">{k.kelasIds?.length ?? 0} MK • {k.totalSks} SKS</div>
              </div>
              <Badge>{k.status}</Badge>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Tahun Akademik:</label>
          <select className="input max-w-xs" value={taId} onChange={(e) => setTaId(e.target.value)}>
            {tahun.map((t) => <option key={t.id} value={t.id}>{t.nama}{t.aktif ? ' (aktif)' : ''}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr><th className="th w-10"></th><th className="th">Kode</th><th className="th">Mata Kuliah</th><th className="th">SKS</th><th className="th">Dosen</th><th className="th">Jadwal</th><th className="th">Mode</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {kelas.map((k) => (
                <tr key={k.id} className={selected.has(k.id) ? 'bg-brand-50' : 'hover:bg-gray-50'}>
                  <td className="td"><input type="checkbox" checked={selected.has(k.id)} onChange={() => toggle(k.id)} /></td>
                  <td className="td font-mono">{k.kode}</td>
                  <td className="td">{k.mataKuliah?.nama}</td>
                  <td className="td">{k.mataKuliah?.sks}</td>
                  <td className="td">{k.dosenUser?.nama}</td>
                  <td className="td text-xs">{k.hari} {k.jamMulai}-{k.jamSelesai}</td>
                  <td className="td"><Badge>{k.mode}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">Total dipilih: <b className={totalSks > 24 ? 'text-rose-500' : 'text-brand-600'}>{totalSks} SKS</b></div>
          <button className="btn" disabled={selected.size === 0 || totalSks > 24 || busy} onClick={submit}>{busy ? 'Memproses…' : 'Ajukan KRS'}</button>
        </div>
        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>
    </div>
  );
}
