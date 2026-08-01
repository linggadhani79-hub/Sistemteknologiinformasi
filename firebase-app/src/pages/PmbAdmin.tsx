import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { PageHeader, Spinner, Badge, fmtRupiah } from '../components/ui';

const labelBerkas: Record<string, string> = { FOTO: 'Pas Foto', IJAZAH: 'Ijazah/SKL', KTP: 'KTP', KK: 'Kartu Keluarga', RAPOR: 'Rapor', AKTA: 'Akta Kelahiran' };

// ---------- Verifikasi Berkas ----------
export function PmbBerkas() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const snap = await getDocs(collection(db, 'berkasPendaftar'));
    const list = await Promise.all(snap.docs.map(async (d) => {
      const b = d.data();
      const pSnap = await getDoc(doc(db, 'pendaftar', b.pendaftarId));
      return { id: d.id, ...b, pendaftar: pSnap.data() };
    }));
    setRows(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => { await updateDoc(doc(db, 'berkasPendaftar', id), { status }); load(); };

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
                  <td className="td"><a href={b.storagePath} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">{b.namaFile}</a></td>
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
  const load = async () => {
    const snap = await getDocs(collection(db, 'tagihanVA'));
    const list = await Promise.all(snap.docs.map(async (d) => {
      const t = d.data();
      const pSnap = await getDoc(doc(db, 'pendaftar', t.pendaftarId));
      return { id: d.id, ...t, pendaftar: pSnap.data() };
    }));
    setRows(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const konfirmasi = async (nomorVA: string) => {
    const fn = httpsCallable(functions, 'pmbPembayaranKonfirmasi');
    await fn({ nomorVA });
    load();
  };

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
                  <td className="td">{t.status !== 'LUNAS' && <button onClick={() => konfirmasi(t.nomorVA)} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200">Konfirmasi Lunas</button>}</td>
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
  const load = async () => {
    const snap = await getDocs(collection(db, 'konfigurasiVA'));
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (r: any) => {
    setMsg('');
    await setDoc(doc(db, 'konfigurasiVA', r.id), { namaBank: r.namaBank, kodeBank: r.kodeBank, prefixVA: r.prefixVA, aktif: r.aktif }, { merge: true });
    setMsg(`✅ Konfigurasi ${r.id} disimpan`);
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
              <h3 className="text-lg font-bold">{r.id}</h3>
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

// ---------- Bank Soal CBT ----------
const KATEGORI = ['TPA', 'MATEMATIKA', 'BAHASA_INDONESIA', 'BAHASA_INGGRIS'];
const kosong = { kategori: KATEGORI[0], pertanyaan: '', opsiA: '', opsiB: '', opsiC: '', opsiD: '', jawaban: 'A' };

export function PmbSoalCbt() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(kosong);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const snap = await getDocs(collection(db, 'soalCbtPublic'));
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const edit = (r: any) => { setEditId(r.id); setForm({ ...r, jawaban: 'A' }); };
  const batal = () => { setEditId(null); setForm(kosong); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const upsert = httpsCallable(functions, 'cbtSoalUpsert');
      await upsert({ id: editId ?? undefined, ...form });
      setMsg('✅ Soal tersimpan');
      batal();
      load();
    } catch (err: any) {
      setMsg('❌ ' + (err.message ?? 'Gagal menyimpan soal'));
    }
  };

  const hapus = async (id: string) => {
    const del = httpsCallable(functions, 'cbtSoalHapus');
    await del({ id });
    load();
  };

  return (
    <div>
      <PageHeader title="Bank Soal CBT" subtitle="Kunci jawaban tersimpan terpisah & terkunci — tidak pernah bisa dibaca klien mana pun" />
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-3">
          <h3 className="font-semibold">{editId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>
          <select className="input" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
            {KATEGORI.map((k) => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
          </select>
          <textarea className="input" placeholder="Pertanyaan" value={form.pertanyaan} onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })} required />
          {(['A', 'B', 'C', 'D'] as const).map((o) => (
            <input key={o} className="input" placeholder={`Opsi ${o}`} value={form[`opsi${o}`]} onChange={(e) => setForm({ ...form, [`opsi${o}`]: e.target.value })} required />
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Kunci Jawaban Benar</label>
            <select className="input" value={form.jawaban} onChange={(e) => setForm({ ...form, jawaban: e.target.value })}>
              {['A', 'B', 'C', 'D'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {editId && <p className="mt-1 text-xs text-amber-600">Kunci lama tidak ditampilkan (terkunci) — pilih ulang kunci yang benar.</p>}
          </div>
          {msg && <div className="text-sm">{msg}</div>}
          <div className="flex gap-2">
            <button className="btn">{editId ? 'Simpan Perubahan' : 'Tambah Soal'}</button>
            {editId && <button type="button" onClick={batal} className="btn-ghost">Batal</button>}
          </div>
        </form>

        <div className="card overflow-hidden p-0">
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50"><tr><th className="th">Kategori</th><th className="th">Pertanyaan</th><th className="th">Aksi</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td"><Badge>{r.kategori}</Badge></td>
                      <td className="td">{r.pertanyaan}</td>
                      <td className="td"><div className="flex gap-1">
                        <button onClick={() => edit(r)} className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-600 hover:bg-brand-100">Edit</button>
                        <button onClick={() => hapus(r.id)} className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700 hover:bg-rose-200">Hapus</button>
                      </div></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td className="td text-center text-gray-400" colSpan={3}>Belum ada soal.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
