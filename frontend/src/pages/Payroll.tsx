import { useState } from 'react';
import { api } from '../api';
import { PageHeader, Spinner, useFetch, fmtRupiah } from '../components/ui';

export function Payroll() {
  const now = new Date();
  const [periode, setPeriode] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const { data, loading, reload } = useFetch<any>(`/kepegawaian/payroll?periode=${periode}`, [periode]);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      await api.post('/kepegawaian/payroll/generate', { periode });
      reload();
    } finally {
      setBusy(false);
    }
  };

  const rows = data ?? [];
  const total = rows.reduce((s: number, r: any) => s + r.totalGaji, 0);

  return (
    <div>
      <PageHeader
        title="Penggajian (Payroll)"
        subtitle="Perhitungan gaji pegawai per periode"
        action={
          <div className="flex items-center gap-2">
            <input className="input" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            <button className="btn" disabled={busy} onClick={generate}>{busy ? 'Memproses…' : 'Generate Payroll'}</button>
          </div>
        }
      />
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="card text-center text-gray-400">Belum ada payroll untuk periode ini. Klik "Generate Payroll".</div>
      ) : (
        <>
          <div className="mb-4 card flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Anggaran Gaji {periode}</span>
            <span className="text-xl font-bold text-brand-600">{fmtRupiah(total)}</span>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50"><tr>
                  <th className="th">NIP</th><th className="th">Nama</th><th className="th">Unit</th>
                  <th className="th">Gaji Pokok</th><th className="th">Tunjangan</th><th className="th">Potongan</th><th className="th">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="td font-mono text-xs">{r.pegawai.nip}</td>
                      <td className="td">{r.pegawai.nama}</td>
                      <td className="td">{r.pegawai.unitKerja}</td>
                      <td className="td">{fmtRupiah(r.gajiPokok)}</td>
                      <td className="td text-green-600">{fmtRupiah(r.tunjangan)}</td>
                      <td className="td text-rose-500">{fmtRupiah(r.potongan)}</td>
                      <td className="td font-semibold">{fmtRupiah(r.totalGaji)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
