import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Spinner, fmtTanggal } from '../components/ui';

export function Ijazah() {
  const { pesertaId } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const pSnap = await getDoc(doc(db, 'pesertaWisuda', pesertaId!));
        if (!pSnap.exists()) return setErr('Data peserta tidak ditemukan');
        const p = pSnap.data();

        const [periodeSnap, mhsSnap] = await Promise.all([
          getDoc(doc(db, 'periodeWisuda', p.periodeId)),
          getDoc(doc(db, 'mahasiswa', p.mahasiswaId)),
        ]);
        const mhs = mhsSnap.data();
        const [userSnap, prodiSnap] = await Promise.all([
          getDoc(doc(db, 'users', p.mahasiswaId)),
          mhs ? getDoc(doc(db, 'prodi', mhs.prodiId)) : Promise.resolve(null as any),
        ]);
        const prodi = prodiSnap?.data();
        const fakultasSnap = prodi ? await getDoc(doc(db, 'fakultas', prodi.fakultasId)) : null;

        setD({
          noIjazah: p.noIjazah, nama: userSnap.data()?.nama, nim: mhs?.nim,
          tempatLahir: mhs?.tempatLahir, tanggalLahir: mhs?.tanggalLahir,
          prodi: prodi?.nama, jenjang: prodi?.jenjang, fakultas: fakultasSnap?.data()?.nama, akreditasi: prodi?.akreditasi,
          ipk: p.ipk, predikat: p.predikat, tanggalLulus: periodeSnap.data()?.tanggal, foto: p.fotoUrl ?? mhs?.foto,
        });
      } catch {
        setErr('Gagal memuat data ijazah');
      }
    })();
  }, [pesertaId]);

  if (err) return <div className="card text-rose-500">{err}</div>;
  if (!d) return <Spinner />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button onClick={() => nav(-1)} className="btn-ghost">← Kembali</button>
        <button onClick={() => window.print()} className="btn">🖨️ Cetak / Simpan PDF</button>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="ijazah relative aspect-[1.414/1] overflow-hidden bg-white p-10 shadow-2xl">
          <div className="pointer-events-none absolute inset-3 border-[3px] border-amber-700/70" />
          <div className="pointer-events-none absolute inset-4 border border-amber-600/40" />

          <div className="relative flex h-full flex-col items-center justify-between text-center text-slate-800">
            <div>
              <div className="text-4xl">🎓</div>
              <h1 className="mt-1 font-serif text-2xl font-bold tracking-wide text-amber-800">UNIVERSITAS SIAKAD TERPADU</h1>
              <p className="text-sm text-slate-500">{d.fakultas} — Program Studi {d.prodi} ({d.jenjang})</p>
              {d.akreditasi && <p className="text-xs text-slate-400">Terakreditasi {d.akreditasi}</p>}
              <div className="mx-auto mt-3 h-px w-2/3 bg-amber-700/40" />
              <h2 className="mt-3 font-serif text-xl font-semibold tracking-[0.3em] text-slate-700">IJAZAH</h2>
              <p className="text-xs text-slate-400">Nomor: {d.noIjazah ?? '— (belum digenerate) —'}</p>
            </div>

            <div className="flex items-center gap-8">
              {d.foto && <img src={d.foto} alt={d.nama} className="h-28 w-24 rounded border-2 border-amber-700/40 object-cover" />}
              <div>
                <p className="text-sm text-slate-500">Diberikan kepada:</p>
                <p className="mt-1 font-serif text-3xl font-bold text-slate-900">{d.nama}</p>
                <p className="mt-1 text-sm text-slate-500">NIM {d.nim} · Lahir {[d.tempatLahir, fmtTanggal(d.tanggalLahir)].filter(Boolean).join(', ')}</p>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
                  Telah menyelesaikan seluruh persyaratan akademik pada Program Studi <b>{d.prodi}</b> dan
                  dinyatakan <b>LULUS</b> dengan IPK <b>{d.ipk?.toFixed(2)}</b> serta predikat{' '}
                  <b>{d.predikat?.replace(/_/g, ' ')}</b>.
                </p>
              </div>
            </div>

            <div className="flex w-full items-end justify-between px-8 text-sm">
              <div className="text-left text-slate-400">
                <div className="mb-8">Diberikan di Kampus,</div>
                <div className="border-t border-slate-400 pt-1">Rektor</div>
              </div>
              <div className="text-slate-500">{fmtTanggal(d.tanggalLulus)}</div>
              <div className="text-right text-slate-400">
                <div className="mb-8">Dekan {d.fakultas},</div>
                <div className="border-t border-slate-400 pt-1">Dekan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
