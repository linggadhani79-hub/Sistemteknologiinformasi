// Model data Firestore — padanan NoSQL dari skema Prisma (backend/prisma/schema.prisma).
// Firestore tidak punya JOIN, jadi relasi disimpan sebagai *Id (string) yang di-resolve
// di klien (lihat lib/refs.ts), bukan foreign key relasional.

export type Role =
  | 'SUPERADMIN' | 'ADMIN_AKADEMIK' | 'DOSEN' | 'MAHASISWA' | 'OPERATOR_FEEDER'
  | 'AUDITOR_MUTU' | 'KEPEGAWAIAN' | 'LPPM' | 'CALON_MAHASISWA';

export interface UserDoc {
  email: string;
  nama: string;
  role: Role;
  isActive: boolean;
  createdAt: number; // epoch ms
}

// ---- Akademik ----
export interface Fakultas { kode: string; nama: string; }
export interface Prodi { kode: string; nama: string; jenjang: string; akreditasi?: string; fakultasId: string; }
export interface TahunAkademik { kode: string; nama: string; semester: 'GANJIL' | 'GENAP' | 'PENDEK'; aktif: boolean; mulai: number; selesai: number; }
export interface Kurikulum { kode: string; nama: string; prodiId: string; tahun: number; aktif: boolean; }
export interface MataKuliah { kode: string; nama: string; sks: number; semester: number; jenis: 'WAJIB' | 'PILIHAN'; prodiId: string; kurikulumId?: string; }
export interface Kelas { kode: string; mataKuliahId: string; dosenId: string; tahunAkademikId: string; ruang?: string; hari?: string; jamMulai?: string; jamSelesai?: string; kuota: number; mode: 'LURING' | 'DARING' | 'HYBRID'; }

export type StatusMahasiswa = 'AKTIF' | 'CUTI' | 'LULUS' | 'DROP_OUT' | 'MENGUNDURKAN_DIRI' | 'NON_AKTIF';
// doc id = uid (sama dengan users/{uid})
export interface Mahasiswa {
  nim: string; prodiId: string; angkatan: number; status: StatusMahasiswa; ipk: number; totalSks: number;
  nisn?: string; jenisKelamin?: 'L' | 'P'; tanggalLahir?: number; tempatLahir?: string; alamat?: string; hp?: string; foto?: string;
  dosenWaliId?: string; createdAt: number;
}

export type JabatanFungsional = 'ASISTEN_AHLI' | 'LEKTOR' | 'LEKTOR_KEPALA' | 'GURU_BESAR' | 'TENAGA_PENGAJAR';
// doc id = uid
export interface Dosen { nidn: string; prodiId: string; jabatan: JabatanFungsional; pendidikan?: string; hp?: string; createdAt: number; }

export type StatusKRS = 'DRAFT' | 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK';
export interface Krs { mahasiswaId: string; tahunAkademikId: string; status: StatusKRS; totalSks: number; catatan?: string; kelasIds: string[]; createdAt: number; }

// doc id = `${mahasiswaId}_${kelasId}`
export interface Nilai { mahasiswaId: string; kelasId: string; tugas?: number; uts?: number; uas?: number; nilaiAkhir?: number; huruf?: string; bobot?: number; createdAt: number; }

// ---- Neofeeder ----
export interface FeederSyncLog { entitas: string; tahunAkademikId?: string; status: 'PENDING' | 'SUCCESS' | 'FAILED'; jumlahRecord: number; jumlahBerhasil: number; jumlahGagal: number; pesan?: string; payload?: string; createdAt: number; }
export interface FeederMapping { entitas: string; kodeLokal: string; idFeeder: string; keterangan?: string; }

// ---- PJJ ----
export interface SesiPjj { kelasId: string; pertemuanKe: number; judul: string; tanggal: number; mode: 'SINKRON' | 'ASINKRON'; linkMeeting?: string; rekaman?: string; materi?: string; durasiMenit?: number; }
// doc id = `${sesiId}_${mahasiswaId}`
export interface KehadiranPjj { sesiId: string; mahasiswaId: string; hadir: boolean; waktuMasuk?: number; keterangan?: string; }

// ---- SPMI ----
export interface StandarMutu { kode: string; nama: string; kategori: string; deskripsi?: string; target?: string; prodiId?: string; }
export interface IndikatorMutu { standarId: string; nama: string; satuan?: string; targetNilai?: number; capaian?: number; tahun: number; }
export interface AuditMutu { siklus: string; ruangLingkup: string; tanggal: number; auditor: string; status: 'DIRENCANAKAN' | 'BERLANGSUNG' | 'SELESAI'; }
export interface TemuanAudit { auditId: string; kategori: 'MAYOR' | 'MINOR' | 'OBSERVASI'; deskripsi: string; akarMasalah?: string; tindakLanjut?: string; statusTindak: string; batasWaktu?: number; }

// ---- LMS ----
// doc id = kelasId (1:1)
export interface Course { kelasId: string; deskripsi?: string; silabus?: string; }
export interface ModulLms { courseId: string; urutan: number; judul: string; konten?: string; tipe: string; url?: string; }
export interface TugasLms { courseId: string; judul: string; deskripsi?: string; deadline?: number; bobot: number; }
export interface PengumpulanTugas { tugasId: string; mahasiswaId: string; fileUrl?: string; catatan?: string; nilai?: number; submittedAt: number; }
export interface Kuis { courseId: string; judul: string; durasi: number; }
export interface SoalKuis { kuisId: string; pertanyaan: string; opsiA: string; opsiB: string; opsiC: string; opsiD: string; jawaban: string; }
export interface Enrollment { courseId: string; mahasiswaId: string; progress: number; createdAt: number; }

// ---- PMB ----
export type StatusPendaftar = 'DAFTAR' | 'BAYAR' | 'VERIFIKASI' | 'UJIAN' | 'DITERIMA' | 'DITOLAK' | 'DAFTAR_ULANG';
export interface GelombangPmb { nama: string; tahun: number; mulai: number; selesai: number; biaya: number; aktif: boolean; }
// doc id = uid calon
export interface Pendaftar { noPendaftaran: string; gelombangId: string; nama: string; email: string; hp?: string; asalSekolah?: string; pilihanProdi1?: string; pilihanProdi2?: string; status: StatusPendaftar; nilaiUjian?: number; catatan?: string; createdAt: number; }
// doc id = `${pendaftarId}_${jenis}`
export interface BerkasPendaftar { pendaftarId: string; jenis: string; namaFile: string; mimeType?: string; ukuran?: number; storagePath?: string; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; catatan?: string; createdAt: number; }
// doc id = kode bank (BRI/MANDIRI/BTN)
export interface KonfigurasiVA { namaBank: string; kodeBank?: string; prefixVA: string; aktif: boolean; }
export type StatusBayar = 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'LUNAS' | 'KEDALUWARSA' | 'DIBATALKAN';
// doc id = nomorVA
export interface TagihanVA { pendaftarId: string; bank: string; namaBank: string; nomorVA: string; nomorHp?: string; jumlah: number; status: StatusBayar; jatuhTempo?: number; paidAt?: number; createdAt: number; }
// soal publik TANPA kunci jawaban — kunci disimpan terpisah di soalCbtKunci (tidak bisa dibaca klien sama sekali)
export interface SoalCbtPublic { kategori: string; pertanyaan: string; opsiA: string; opsiB: string; opsiC: string; opsiD: string; }
// doc id = pendaftarId (1:1)
export interface UjianCbt { pendaftarId: string; mulai?: number; selesai?: number; durasiMenit: number; jumlahSoal?: number; jumlahBenar?: number; nilai?: number; status: 'BELUM' | 'BERLANGSUNG' | 'SELESAI'; }

// ---- Kepegawaian ----
export type StatusPegawai = 'TETAP' | 'KONTRAK' | 'HONORER' | 'PENSIUN';
export interface Pegawai { nip: string; nama: string; jenis: 'DOSEN' | 'TENDIK'; status: StatusPegawai; unitKerja?: string; jabatan?: string; golongan?: string; tglMasuk?: number; gajiPokok: number; hp?: string; }
export interface Absensi { pegawaiId: string; tanggal: number; jamMasuk?: string; jamPulang?: string; status: string; }
export interface Cuti { pegawaiId: string; jenis: string; mulai: number; selesai: number; alasan?: string; status: string; }
// doc id = `${pegawaiId}_${periode}`
export interface Payroll { pegawaiId: string; periode: string; gajiPokok: number; tunjangan: number; potongan: number; totalGaji: number; createdAt: number; }

// ---- LPPM ----
export type StatusUsulan = 'DIAJUKAN' | 'REVIEW' | 'DIDANAI' | 'DITOLAK' | 'SELESAI';
export interface Penelitian { judul: string; ketuaId: string; tahun: number; skema?: string; danaUsulan: number; danaDisetujui: number; status: StatusUsulan; luaran?: string; createdAt: number; }
export interface Pengabdian { judul: string; ketuaId: string; tahun: number; mitra?: string; lokasi?: string; danaUsulan: number; status: StatusUsulan; createdAt: number; }
export interface Publikasi { judul: string; penulisId: string; jenis: string; namaMedia?: string; tahun: number; indeksasi?: string; doi?: string; url?: string; }

// ---- Wisuda ----
export interface PeriodeWisuda { kode: string; nama: string; tanggal: number; lokasi?: string; kuota: number; biaya: number; aktif: boolean; }
export type StatusWisuda = 'DAFTAR' | 'VERIFIKASI' | 'DITERIMA' | 'DITOLAK' | 'SELESAI';
// doc id = `${periodeId}_${mahasiswaId}`
export interface PesertaWisuda { periodeId: string; mahasiswaId: string; nomorUrut?: number; noIjazah?: string; judulSkripsi?: string; ipk?: number; predikat?: string; fotoUrl?: string; status: StatusWisuda; catatan?: string; tanggalDaftar: number; }
