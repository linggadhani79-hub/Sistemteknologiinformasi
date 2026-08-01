import { ResourceList } from '../components/ResourceList';
import { fmtRupiah, fmtTanggal } from '../components/ui';

// ---------- AKADEMIK ----------
export const ProdiPage = () => (
  <ResourceList title="Program Studi" collection="prodi" searchField="nama" resolve={[{ field: 'fakultasId', collection: 'fakultas', as: 'fakultas' }]} columns={[
    { key: 'kode', label: 'Kode PDDikti' },
    { key: 'nama', label: 'Nama Prodi' },
    { key: 'jenjang', label: 'Jenjang' },
    { key: 'fakultas.nama', label: 'Fakultas' },
    { key: 'akreditasi', label: 'Akreditasi', badge: true },
  ]} />
);

export const MataKuliahPage = () => (
  <ResourceList title="Mata Kuliah" collection="mataKuliah" searchField="nama" resolve={[{ field: 'prodiId', collection: 'prodi', as: 'prodi' }]} columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama' },
    { key: 'sks', label: 'SKS' },
    { key: 'semester', label: 'Semester' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'prodi.nama', label: 'Prodi' },
  ]} />
);

export const MahasiswaPage = () => (
  <ResourceList title="Data Mahasiswa" collection="mahasiswa" searchField="nim" resolve={[{ field: 'prodiId', collection: 'prodi', as: 'prodi' }, { field: 'id', collection: 'users', as: 'user' }]} columns={[
    { key: 'nim', label: 'NIM' },
    { key: 'user.nama', label: 'Nama' },
    { key: 'prodi.nama', label: 'Prodi' },
    { key: 'angkatan', label: 'Angkatan' },
    { key: 'ipk', label: 'IPK', render: (r) => r.ipk?.toFixed(2) },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const DosenPage = () => (
  <ResourceList title="Data Dosen" collection="dosen" searchField="nidn" resolve={[{ field: 'prodiId', collection: 'prodi', as: 'prodi' }, { field: 'id', collection: 'users', as: 'user' }]} columns={[
    { key: 'nidn', label: 'NIDN' },
    { key: 'user.nama', label: 'Nama' },
    { key: 'prodi.nama', label: 'Prodi' },
    { key: 'jabatan', label: 'Jabatan Fungsional' },
    { key: 'pendidikan', label: 'Pendidikan' },
  ]} />
);

export const KelasPage = () => (
  <ResourceList title="Kelas / Jadwal" collection="kelas" searchable={false}
    resolve={[
      { field: 'mataKuliahId', collection: 'mataKuliah', as: 'mataKuliah' },
      { field: 'dosenId', collection: 'users', as: 'dosenUser' },
    ]}
    columns={[
      { key: 'kode', label: 'Kode' },
      { key: 'mataKuliah.nama', label: 'Mata Kuliah' },
      { key: 'dosenUser.nama', label: 'Dosen' },
      { key: 'jadwal', label: 'Jadwal', render: (r) => `${r.hari ?? '-'} ${r.jamMulai ?? ''}-${r.jamSelesai ?? ''}` },
      { key: 'ruang', label: 'Ruang' },
      { key: 'mode', label: 'Mode', badge: true },
    ]} />
);

// ---------- SPMI ----------
export const StandarMutuPage = () => (
  <ResourceList title="Standar Mutu (SPMI)" collection="standarMutu" searchField="nama" columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Standar' },
    { key: 'kategori', label: 'Kategori', badge: true },
    { key: 'target', label: 'Target' },
  ]} />
);

export const AuditMutuPage = () => (
  <ResourceList title="Audit Mutu Internal (AMI)" collection="auditMutu" searchable={false} columns={[
    { key: 'siklus', label: 'Siklus' },
    { key: 'ruangLingkup', label: 'Ruang Lingkup' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'tanggal', label: 'Tanggal', render: (r) => fmtTanggal(r.tanggal) },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

// ---------- PMB ----------
export const PendaftarPage = () => (
  <ResourceList title="Pendaftar PMB" collection="pendaftar" searchField="nama" resolve={[{ field: 'gelombangId', collection: 'gelombangPmb', as: 'gelombang' }]} columns={[
    { key: 'noPendaftaran', label: 'No. Daftar' },
    { key: 'nama', label: 'Nama' },
    { key: 'asalSekolah', label: 'Asal Sekolah' },
    { key: 'gelombang.nama', label: 'Gelombang' },
    { key: 'nilaiUjian', label: 'Nilai Ujian' },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

// ---------- KEPEGAWAIAN ----------
export const PegawaiPage = () => (
  <ResourceList title="Data Pegawai" collection="pegawai" searchField="nama" columns={[
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
  <ResourceList title="Penelitian" collection="penelitian" searchField="judul" resolve={[{ field: 'ketuaId', collection: 'users', as: 'ketuaUser' }]} columns={[
    { key: 'judul', label: 'Judul' },
    { key: 'ketuaUser.nama', label: 'Ketua' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'skema', label: 'Skema' },
    { key: 'danaDisetujui', label: 'Dana', render: (r) => fmtRupiah(r.danaDisetujui) },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const PengabdianPage = () => (
  <ResourceList title="Pengabdian Masyarakat" collection="pengabdian" searchField="judul" resolve={[{ field: 'ketuaId', collection: 'users', as: 'ketuaUser' }]} columns={[
    { key: 'judul', label: 'Judul' },
    { key: 'ketuaUser.nama', label: 'Ketua' },
    { key: 'mitra', label: 'Mitra' },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'status', label: 'Status', badge: true },
  ]} />
);

export const PublikasiPage = () => (
  <ResourceList title="Publikasi Ilmiah" collection="publikasi" searchField="judul" resolve={[{ field: 'penulisId', collection: 'users', as: 'penulisUser' }]} columns={[
    { key: 'judul', label: 'Judul' },
    { key: 'penulisUser.nama', label: 'Penulis' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'namaMedia', label: 'Media' },
    { key: 'tahun', label: 'Tahun' },
    { key: 'indeksasi', label: 'Indeksasi', badge: true },
  ]} />
);

// ---------- WISUDA ----------
export const PeriodeWisudaPage = () => (
  <ResourceList title="Periode Wisuda" collection="periodeWisuda" searchable={false} columns={[
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama Periode' },
    { key: 'tanggal', label: 'Tanggal', render: (r) => fmtTanggal(r.tanggal) },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'biaya', label: 'Biaya', render: (r) => fmtRupiah(r.biaya) },
    { key: 'aktif', label: 'Status', render: (r) => (r.aktif ? 'Aktif' : 'Tutup') },
  ]} />
);
