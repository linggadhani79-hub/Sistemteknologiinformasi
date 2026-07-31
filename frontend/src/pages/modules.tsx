import { fmtRupiah } from '../components/ui';
import { ResourceList, Column } from '../components/ResourceList';

// ---------- AKADEMIK ----------
export const ProdiPage = () => (
  <ResourceList title="Program Studi" endpoint="/akademik/prodi" columns={[
    { key: 'kode', label: 'Kode PDDikti' },
    { key: 'nama', label: 'Nama Prodi' },
    { key: 'jenjang', label: 'Jenjang' },
    { key: 'fakultas.nama', label: 'Fakultas' },
    { key: 'akreditasi', label: 'Akreditasi', badge: true },
  ]} />
);

export const MataKuliahPage = () => (
  <ResourceList title="Mata Kuliah" endpoint="/akademik/matakuliah" columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama' },
    { key: 'sks', label: 'SKS' },
    { key: 'semester', label: 'Semester' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'prodi.nama', label: 'Prodi' },
  ]} />
);

export const MahasiswaPage = () => (
  <ResourceList title="Data Mahasiswa" endpoint="/akademik/mahasiswa" columns={[
    { key: 'nim', label: 'NIM' },
    { key: 'user.nama', label: 'Nama' },
    { key: 'prodi.nama', label: 'Prodi' },
    { key: 'angkatan', label: 'Angkatan' },
    { key: 'ipk', label: 'IPK', render: (r) => r.ipk?.toFixed(2) },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const DosenPage = () => (
  <ResourceList title="Data Dosen" endpoint="/akademik/dosen" columns={[
    { key: 'nidn', label: 'NIDN' },
    { key: 'user.nama', label: 'Nama' },
    { key: 'prodi.nama', label: 'Prodi' },
    { key: 'jabatan', label: 'Jabatan Fungsional' },
    { key: 'pendidikan', label: 'Pendidikan' },
  ]} />
);

export const KelasPage = () => (
  <ResourceList title="Kelas / Jadwal" endpoint="/akademik/kelas" searchable={false} columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'mataKuliah.nama', label: 'Mata Kuliah' },
    { key: 'dosen.user.nama', label: 'Dosen' },
    { key: 'jadwal', label: 'Jadwal', render: (r) => `${r.hari ?? '-'} ${r.jamMulai ?? ''}-${r.jamSelesai ?? ''}` },
    { key: 'ruang', label: 'Ruang' },
    { key: 'mode', label: 'Mode', badge: true },
  ]} />
);

// ---------- SPMI ----------
export const StandarMutuPage = () => (
  <ResourceList title="Standar Mutu (SPMI)" endpoint="/spmi/standar" columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Standar' },
    { key: 'kategori', label: 'Kategori', badge: true },
    { key: 'target', label: 'Target' },
    { key: 'indikator', label: 'Jml Indikator', render: (r) => r.indikator?.length ?? 0 },
  ]} />
);

export const AuditMutuPage = () => (
  <ResourceList title="Audit Mutu Internal (AMI)" endpoint="/spmi/audit" searchable={false} columns={[
    { key: 'siklus', label: 'Siklus' },
    { key: 'ruangLingkup', label: 'Ruang Lingkup' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'tanggal', label: 'Tanggal', render: (r) => new Date(r.tanggal).toLocaleDateString('id-ID') },
    { key: 'status', label: 'Status', badge: true },
    { key: 'temuan', label: 'Temuan', render: (r) => r.temuan?.length ?? 0 },
  ]} />
);

// ---------- PMB ----------
export const PendaftarPage = () => (
  <ResourceList title="Pendaftar PMB" endpoint="/pmb/pendaftar" columns={[
    { key: 'noPendaftaran', label: 'No. Daftar' },
    { key: 'nama', label: 'Nama' },
    { key: 'asalSekolah', label: 'Asal Sekolah' },
    { key: 'gelombang.nama', label: 'Gelombang' },
    { key: 'nilaiUjian', label: 'Nilai Ujian' },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const SoalCbtPage = () => (
  <ResourceList title="Bank Soal CBT" endpoint="/pmb/cbt/soal" columns={[
    { key: 'kategori', label: 'Kategori', badge: true },
    { key: 'pertanyaan', label: 'Pertanyaan' },
    { key: 'jawaban', label: 'Kunci' },
  ]} />
);

// ---------- KEPEGAWAIAN ----------
export const PegawaiPage = () => (
  <ResourceList title="Data Pegawai" endpoint="/kepegawaian/pegawai" columns={[
    { key: 'nip', label: 'NIP' },
    { key: 'nama', label: 'Nama' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'jabatan', label: 'Jabatan' },
    { key: 'unitKerja', label: 'Unit Kerja' },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

// ---------- LPPM ----------
export const PenelitianPage = () => (
  <ResourceList title="Penelitian" endpoint="/lppm/penelitian" columns={[
    { key: 'judul', label: 'Judul' },
    { key: 'ketua.user.nama', label: 'Ketua' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'skema', label: 'Skema' },
    { key: 'danaDisetujui', label: 'Dana', render: (r) => fmtRupiah(r.danaDisetujui) },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const PengabdianPage = () => (
  <ResourceList title="Pengabdian Masyarakat" endpoint="/lppm/pengabdian" columns={[
    { key: 'judul', label: 'Judul' },
    { key: 'ketua.user.nama', label: 'Ketua' },
    { key: 'mitra', label: 'Mitra' },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const PublikasiPage = () => (
  <ResourceList title="Publikasi Ilmiah" endpoint="/lppm/publikasi" columns={[
    { key: 'judul', label: 'Judul' },
    { key: 'penulis.user.nama', label: 'Penulis' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'namaMedia', label: 'Media' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'indeksasi', label: 'Indeksasi', badge: true },
  ]} />
);

// ---- WISUDA ----
export const PeriodeWisudaPage = () => (
  <ResourceList title="Periode Wisuda" endpoint="/wisuda/periode" searchable={false} columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama Periode' },
    { key: 'tanggal', label: 'Tanggal', render: (r) => new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'biaya', label: 'Biaya', render: (r) => fmtRupiah(r.biaya) },
    { key: 'aktif', label: 'Status', render: (r) => (r.aktif ? 'Aktif' : 'Tutup') },
  ]} />
);
