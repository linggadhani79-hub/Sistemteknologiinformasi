import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Spinner } from '../components/ui';

function Avatar({ foto, nama, size = 'w-64 h-64' }: { foto?: string | null; nama: string; size?: string }) {
  const [err, setErr] = useState(false);
  const initials = nama.split(' ').slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  if (foto && !err) {
    return <img src={foto} alt={nama} onError={() => setErr(true)} className={`${size} rounded-2xl object-cover shadow-2xl ring-4 ring-white/30`} />;
  }
  return (
    <div className={`${size} flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-6xl font-bold text-white shadow-2xl ring-4 ring-white/30`}>
      {initials}
    </div>
  );
}

export function WisudaSlide() {
  const { periodeId } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [idx, setIdx] = useState(-1);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    (async () => {
      const periodeSnap = await getDoc(doc(db, 'periodeWisuda', periodeId!));
      if (!periodeSnap.exists()) return nav('/wisuda/peserta');
      const periode = periodeSnap.data();

      const pesertaSnap = await getDocs(query(collection(db, 'pesertaWisuda'), where('periodeId', '==', periodeId)));
      const slides = await Promise.all(
        pesertaSnap.docs
          .map((d) => d.data())
          .filter((p) => ['DITERIMA', 'SELESAI'].includes(p.status))
          .map(async (p) => {
            const mhsSnap = await getDoc(doc(db, 'mahasiswa', p.mahasiswaId));
            const mhs = mhsSnap.data();
            const [userSnap, prodiSnap] = await Promise.all([
              getDoc(doc(db, 'users', p.mahasiswaId)),
              mhs ? getDoc(doc(db, 'prodi', mhs.prodiId)) : Promise.resolve(null as any),
            ]);
            const prodi = prodiSnap?.data();
            const fakultasSnap = prodi ? await getDoc(doc(db, 'fakultas', prodi.fakultasId)) : null;
            return {
              nomorUrut: p.nomorUrut, nama: userSnap.data()?.nama, nim: mhs?.nim,
              prodi: prodi?.nama, fakultas: fakultasSnap?.data()?.nama,
              ipk: p.ipk, predikat: p.predikat, judulSkripsi: p.judulSkripsi, foto: p.fotoUrl ?? mhs?.foto,
            };
          }),
      );
      slides.sort((a, b) => (a.nomorUrut ?? 999) - (b.nomorUrut ?? 999));
      setData({ periode, slides });
    })();
  }, [periodeId, nav]);

  const total = data?.slides?.length ?? 0;
  const next = useCallback(() => setIdx((i) => Math.min(i + 1, total - 1)), [total]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') nav('/wisuda/peserta');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, nav]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setIdx((i) => (i + 1 >= total ? -1 : i + 1)), 5000);
    return () => clearInterval(t);
  }, [auto, total]);

  if (!data) return <div className="fixed inset-0 grid place-items-center bg-slate-900"><Spinner /></div>;

  const cur = idx >= 0 ? data.slides[idx] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="z-10 flex items-center justify-between px-6 py-4">
        <button onClick={() => nav('/wisuda/peserta')} className="rounded-lg bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">✕ Tutup</button>
        <div className="text-sm text-white/60">{idx >= 0 ? `${idx + 1} / ${total}` : 'Pembuka'}</div>
        <button onClick={() => setAuto((a) => !a)} className="rounded-lg bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">{auto ? '⏸ Auto' : '▶ Auto'}</button>
      </div>

      <div className="z-10 flex flex-1 items-center justify-center px-8">
        {!cur ? (
          <div className="text-center">
            <div className="mb-6 text-7xl">🎓</div>
            <h1 className="text-5xl font-bold tracking-tight">{data.periode.nama}</h1>
            <p className="mt-4 text-xl text-white/60">{data.periode.lokasi}</p>
            <p className="mt-1 text-lg text-white/40">{new Date(data.periode.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="mt-10 text-white/50">Tekan <kbd className="rounded bg-white/10 px-2 py-1">→</kbd> atau <kbd className="rounded bg-white/10 px-2 py-1">Spasi</kbd> untuk mulai</p>
          </div>
        ) : (
          <div className="flex w-full max-w-5xl flex-col items-center gap-8 md:flex-row md:gap-14">
            <Avatar foto={cur.foto} nama={cur.nama} size="h-72 w-72 shrink-0" />
            <div className="text-center md:text-left">
              {cur.nomorUrut && <div className="mb-2 inline-block rounded-full bg-amber-400/20 px-4 py-1 text-sm font-medium text-amber-300">No. Urut {cur.nomorUrut}</div>}
              <h1 className="text-5xl font-bold leading-tight">{cur.nama}</h1>
              <p className="mt-2 text-xl text-blue-200">{cur.nim}</p>
              <p className="mt-4 text-2xl font-medium">{cur.prodi}</p>
              <p className="text-lg text-white/50">{cur.fakultas}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <span className="rounded-lg bg-white/10 px-4 py-2 text-lg backdrop-blur">IPK <b className="text-amber-300">{cur.ipk?.toFixed(2)}</b></span>
                {cur.predikat && <span className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-lg font-semibold">{cur.predikat.replace(/_/g, ' ')}</span>}
              </div>
              {cur.judulSkripsi && <p className="mt-6 max-w-lg text-sm italic text-white/40">"{cur.judulSkripsi}"</p>}
            </div>
          </div>
        )}
      </div>

      <div className="z-10 flex items-center justify-center gap-4 pb-8">
        <button onClick={prev} disabled={idx === -1} className="rounded-full bg-white/10 px-6 py-3 backdrop-blur hover:bg-white/20 disabled:opacity-30">← Sebelumnya</button>
        <button onClick={next} disabled={idx >= total - 1} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-semibold hover:brightness-110 disabled:opacity-30">Selanjutnya →</button>
      </div>
    </div>
  );
}
