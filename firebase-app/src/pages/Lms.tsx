import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PageHeader, Spinner, Badge } from '../components/ui';

export function Lms() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    (async () => {
      const courseSnap = await getDocs(collection(db, 'course'));
      const list = await Promise.all(courseSnap.docs.map(async (d) => {
        const c = d.data();
        const kelasSnap = await getDoc(doc(db, 'kelas', c.kelasId));
        const kelas = kelasSnap.data();
        const [mkSnap, dosenUserSnap, modulSnap, tugasSnap, kuisSnap] = await Promise.all([
          getDoc(doc(db, 'mataKuliah', kelas!.mataKuliahId)),
          getDoc(doc(db, 'users', kelas!.dosenId)),
          getDocs(query(collection(db, 'modulLms'), where('courseId', '==', d.id))),
          getDocs(query(collection(db, 'tugasLms'), where('courseId', '==', d.id))),
          getDocs(query(collection(db, 'kuis'), where('courseId', '==', d.id))),
        ]);
        return {
          id: d.id, ...c, mataKuliah: mkSnap.data(), dosenUser: dosenUserSnap.data(),
          modulCount: modulSnap.size, tugasCount: tugasSnap.size, kuisCount: kuisSnap.size,
        };
      }));
      setCourses(list);
      setLoading(false);
    })();
  }, []);

  const open = async (course: any) => {
    setLoadingDetail(true);
    const [modulSnap, tugasSnap, kuisSnap] = await Promise.all([
      getDocs(query(collection(db, 'modulLms'), where('courseId', '==', course.id))),
      getDocs(query(collection(db, 'tugasLms'), where('courseId', '==', course.id))),
      getDocs(query(collection(db, 'kuis'), where('courseId', '==', course.id))),
    ]);
    const kuis = await Promise.all(kuisSnap.docs.map(async (k) => {
      const soalSnap = await getDocs(query(collection(db, 'soalKuis'), where('kuisId', '==', k.id)));
      return { id: k.id, ...k.data(), soal: soalSnap.docs.map((s) => ({ id: s.id, ...s.data() })) };
    }));
    setDetail({
      ...course,
      modul: modulSnap.docs.map((m) => ({ id: m.id, ...m.data() })).sort((a: any, b: any) => a.urutan - b.urutan),
      tugas: tugasSnap.docs.map((t) => ({ id: t.id, ...t.data() })),
      kuis,
    });
    setLoadingDetail(false);
  };

  if (loading) return <Spinner />;

  if (detail) {
    return (
      <div>
        <button className="btn-ghost mb-4" onClick={() => setDetail(null)}>← Kembali</button>
        <PageHeader title={detail.mataKuliah?.nama} subtitle={detail.deskripsi} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="card">
              <h3 className="mb-3 font-semibold">📖 Modul Pembelajaran</h3>
              {detail.modul.map((m: any) => (
                <div key={m.id} className="border-b py-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.urutan}. {m.judul}</span>
                    <Badge>{m.tipe}</Badge>
                  </div>
                  {m.konten && <p className="mt-1 text-sm text-gray-500">{m.konten}</p>}
                  {m.url && <a href={m.url} className="text-sm text-brand-500 hover:underline" target="_blank" rel="noreferrer">Buka materi →</a>}
                </div>
              ))}
              {detail.modul.length === 0 && <p className="text-sm text-gray-400">Belum ada modul.</p>}
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold">📝 Tugas</h3>
              {detail.tugas.map((t: any) => (
                <div key={t.id} className="border-b py-3 last:border-0">
                  <div className="font-medium">{t.judul}</div>
                  <div className="text-sm text-gray-500">{t.deskripsi} • Bobot {t.bobot}%</div>
                </div>
              ))}
              {detail.tugas.length === 0 && <p className="text-sm text-gray-400">Belum ada tugas.</p>}
            </div>
          </div>
          <div className="card h-fit">
            <h3 className="mb-3 font-semibold">❓ Kuis</h3>
            {detail.kuis.map((k: any) => (
              <div key={k.id} className="rounded-lg border p-3">
                <div className="font-medium">{k.judul}</div>
                <div className="text-sm text-gray-500">{k.soal.length} soal • {k.durasi} menit</div>
              </div>
            ))}
            {detail.kuis.length === 0 && <p className="text-sm text-gray-400">Belum ada kuis.</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Learning Management System" subtitle="Kelas daring terintegrasi dengan akademik" />
      {loadingDetail && <Spinner />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="card cursor-pointer transition hover:shadow-md" onClick={() => open(c)}>
            <div className="mb-2 text-3xl">💻</div>
            <h3 className="font-semibold">{c.mataKuliah?.nama}</h3>
            <p className="mt-1 text-sm text-gray-500">{c.dosenUser?.nama}</p>
            <div className="mt-3 flex gap-2 text-xs text-gray-400">
              <span>📖 {c.modulCount} modul</span>
              <span>📝 {c.tugasCount} tugas</span>
              <span>❓ {c.kuisCount} kuis</span>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-gray-400">Belum ada course.</p>}
      </div>
    </div>
  );
}
