import { ResourceList } from '../components/ResourceList';

export function Pjj() {
  return (
    <ResourceList
      title="Pembelajaran Jarak Jauh (PJJ)"
      subtitle="Sesi kuliah daring sinkron & asinkron"
      endpoint="/pjj/sesi"
      searchable={false}
      columns={[
        { key: 'pertemuanKe', label: 'Pertemuan' },
        { key: 'judul', label: 'Judul' },
        { key: 'kelas.mataKuliah.nama', label: 'Mata Kuliah' },
        { key: 'tanggal', label: 'Tanggal', render: (r) => new Date(r.tanggal).toLocaleDateString('id-ID') },
        { key: 'mode', label: 'Mode', badge: true },
        { key: 'linkMeeting', label: 'Link', render: (r) => (r.linkMeeting ? <a className="text-brand-500 hover:underline" href={r.linkMeeting} target="_blank">Gabung →</a> : '-') },
      ]}
    />
  );
}
