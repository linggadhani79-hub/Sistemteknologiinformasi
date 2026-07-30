import { useState } from 'react';
import { api } from '../api';
import { PageHeader, Spinner, useFetch, Badge } from '../components/ui';

export function Lms() {
  const { data, loading } = useFetch<any>('/lms/course');
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const open = async (id: string) => {
    setLoadingDetail(true);
    const { data } = await api.get(`/lms/course/${id}/belajar`);
    setDetail(data);
    setLoadingDetail(false);
  };

  if (loading) return <Spinner />;
  const courses = data?.data ?? [];

  if (detail) {
    return (
      <div>
        <button className="btn-ghost mb-4" onClick={() => setDetail(null)}>← Kembali</button>
        <PageHeader title={detail.kelas.mataKuliah.nama} subtitle={detail.deskripsi} />
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
                  {m.url && <a href={m.url} className="text-sm text-brand-500 hover:underline" target="_blank">Buka materi →</a>}
                </div>
              ))}
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
        {courses.map((c: any) => (
          <div key={c.id} className="card cursor-pointer transition hover:shadow-md" onClick={() => open(c.id)}>
            <div className="mb-2 text-3xl">💻</div>
            <h3 className="font-semibold">{c.kelas.mataKuliah.nama}</h3>
            <p className="mt-1 text-sm text-gray-500">{c.kelas.dosen?.user?.nama}</p>
            <div className="mt-3 flex gap-2 text-xs text-gray-400">
              <span>📖 {c.modul?.length ?? 0} modul</span>
              <span>📝 {c.tugas?.length ?? 0} tugas</span>
              <span>❓ {c.kuis?.length ?? 0} kuis</span>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-gray-400">Belum ada course.</p>}
      </div>
    </div>
  );
}
