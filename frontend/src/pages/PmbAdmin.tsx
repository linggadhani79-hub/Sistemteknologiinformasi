import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Spinner, Badge, fmtRupiah } from '../components/ui';

const labelBerkas: Record<string, string> = { FOTO: 'Pas Foto', IJAZAH: 'Ijazah/SKL', KTP: 'KTP', KK: 'Kartu Keluarga', RAPOR: 'Rapor', AKTA: 'Akta Kelahiran' };

// ---------- Verifikasi Berkas ----------
export function PmbBerkas() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => api.get('/pmb/berkas').then((r) => { setRows(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => { await api.patch(`/pmb/berkas/${id}/status`, { status }); load(); };
  const preview = async (id: string) => {
    const { data } = await api.get(`/pmb/berkas/${id}/file`);
    const w = window.open('');
    if (w) w.document.write(data.mimeType?.startsWith('image') ? `<img src="${data.data}" style="max-width:100%"/>` : `<iframe src="${data.data}" style="width:100%;height:100%;border:0"></iframe>`);
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Verifikasi Berkas PMB" subtitle="Periksa dan verifikasi dokumen pendaftar" />
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              <th className="th">Pendaftar</th><th className="th">Jenis</th><th className="th">File</th><th className="th">Status</th><th className="th">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="td"><div className="font-medium">{b.pendaftar?.nama}</div><div className="text-xs text-gray-400">{b.pendaftar?.noPendaftaran}</div></td>
                  <td className="td">{labelBerkas[b.jenis] ?? b.jenis}</td>
                  <td className="td"><button onClick={() => preview(b.id)} className="text-brand-500 hover:underline">{b.namaFile}</button></td>
                  <td className="td"><Badge>{b.status}</Badge></td>
                  <td className="td"><div className="flex gap-1">
                    <button onClick={() => setStatus(b.id, 'VERIFIED')} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200">Verifikasi</button>
                    <button onClick={() => setStatus(b.id, 'REJECTED')} className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700 hover:bg-rose-200">Tolak</button>
                  </div></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-center text-gray-400" colSpan={5}>Belum ada berkas diunggah.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Pembayaran ----------
export function PmbPembayaran() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => api.get('/pmb/pembayaran').then((r) => { setRows(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);
  const konfirmasi = async (id: string) => { await api.post(`/pmb/pembayaran/${id}/konfirmasi`); load(); };

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Pembayaran PMB" subtitle="Tagihan Virtual Account & konfirmasi pembayaran" />
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              <th className="th">Pendaftar</th><th className="th">Bank</th><th className="th">No. VA</th><th className="th">No. HP</th><th className="th">Jumlah</th><th className="th">Status</th><th className="th">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="td"><div className="font-medium">{t.pendaftar?.nama}</div><div className="text-xs text-gray-400">{t.pendaftar?.noPendaftaran}</div></td>
                  <td className="td">{t.namaBank}</td>
                  <td className="td font-mono text-xs">{t.nomorVA}</td>
                  <td className="td">{t.nomorHp ?? '-'}</td>
                  <td className="td">{fmtRupiah(t.jumlah)}</td>
                  <td className="td"><Badge>{t.status}</Badge></td>
                  <td className="td">{t.status !== 'LUNAS' && <button onClick={() => konfirmasi(t.id)} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200">Konfirmasi Lunas</button>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td text-center text-gray-400" colSpan={7}>Belum ada tagihan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Setting Bank VA ----------
export function PmbBankVA() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const load = () => api.get('/pmb/va-config').then((r) => { setRows(r.data.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async (r: any) => {
    setMsg('');
    await api.put(`/pmb/va-config/${r.id}`, { prefixVA: r.prefixVA, kodeBank: r.kodeBank, namaBank: r.namaBank, aktif: r.aktif });
    setMsg(`✅ Konfigurasi ${r.bank} disimpan`);
    load();
  };
  const upd = (id: string, patch: any) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Setting Virtual Account Bank" subtitle="Konfigurasi prefix VA & status bank (BRI, Mandiri, BTN)" />
      {msg && <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((r) => (
          <div key={r.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{r.bank}</h3>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={r.aktif} onChange={(e) => upd(r.id, { aktif: e.target.checked })} /> Aktif
              </label>
            </div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Nama Bank</label>
            <input className="input mb-2" value={r.namaBank} onChange={(e) => upd(r.id, { namaBank: e.target.value })} />
            <label className="mb-1 block text-xs font-medium text-gray-500">Prefix VA</label>
            <input className="input mb-2 font-mono" value={r.prefixVA} onChange={(e) => upd(r.id, { prefixVA: e.target.value })} />
            <label className="mb-1 block text-xs font-medium text-gray-500">Kode Bank</label>
            <input className="input mb-3" value={r.kodeBank ?? ''} onChange={(e) => upd(r.id, { kodeBank: e.target.value })} />
            <p className="mb-3 text-xs text-gray-400">Contoh VA: <span className="font-mono">{r.prefixVA}xxxxxxxxxx</span></p>
            <button onClick={() => save(r)} className="btn w-full">Simpan</button>
          </div>
        ))}
      </div>
    </div>
  );
}
