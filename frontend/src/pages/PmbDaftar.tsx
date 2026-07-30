import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Spinner, Badge, fmtRupiah } from '../components/ui';

const alurStatus = ['DAFTAR', 'BAYAR', 'VERIFIKASI', 'UJIAN', 'DITERIMA', 'DAFTAR_ULANG'];

export function PmbDaftar() {
  const [status, setStatus] = useState<any>(null);
  const [gelombang, setGelombang] = useState<any[]>([]);
  const [prodi, setProdi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ gelombangId: '', asalSekolah: '', pilihanProdi1: '', pilihanProdi2: '', hp: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const s = await api.get('/pmb/status/saya');
      setStatus(s.data);
    } catch {
      const [g, p] = await Promise.all([api.get('/pmb/gelombang'), api.get('/akademik/prodi')]);
      setGelombang(g.data.data);
      setProdi(p.data.data);
      if (g.data.data[0]) setForm((f) => ({ ...f, gelombangId: g.data.data[0].id }));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/pmb/daftar', form);
      load();
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.message ?? 'Gagal mendaftar'));
    }
  };

  if (loading) return <Spinner />;

  if (status) {
    const idx = alurStatus.indexOf(status.status);
    return (
      <div>
        <PageHeader title="Status Pendaftaran PMB" subtitle={`No. Pendaftaran: ${status.noPendaftaran}`} />
        <div className="card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{status.nama}</div>
              <div className="text-sm text-gray-500">{status.gelombang.nama}</div>
            </div>
            <Badge>{status.status}</Badge>
          </div>
          {/* Timeline */}
          <div className="flex items-center">
            {alurStatus.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
                {i < alurStatus.length - 1 && <div className={`h-1 flex-1 ${i < idx ? 'bg-brand-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400">
            {alurStatus.map((s) => <span key={s}>{s}</span>)}
          </div>
        </div>
        <div className="card grid gap-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Asal Sekolah</span><span>{status.asalSekolah ?? '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Nilai Ujian</span><span>{status.nilaiUjian ?? 'Belum ada'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Biaya Pendaftaran</span><span>{fmtRupiah(status.gelombang.biaya)}</span></div>
          {status.catatan && <div className="mt-2 rounded bg-amber-50 p-2 text-amber-700">{status.catatan}</div>}
        </div>
      </div>
    );
  }

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
          <input className="input" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} />
        </div>
        {msg && <div className="text-sm text-rose-500">{msg}</div>}
        <button className="btn">Kirim Pendaftaran</button>
      </form>
    </div>
  );
}
