import { useAuth } from '../auth';
import { StatCard, Spinner, useFetch } from '../components/ui';

export function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useFetch<any>('/dashboard');

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-violet-500 p-8 text-white shadow-lg shadow-brand-500/20">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Selamat datang, {user?.nama?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-brand-100">Ringkasan Sistem Informasi Akademik Terpadu</p>
        </div>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[120px] opacity-20">🎓</div>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Mahasiswa Aktif" value={data?.mahasiswa ?? 0} icon="🎓" color="brand" />
          <StatCard label="Dosen" value={data?.dosen ?? 0} icon="👨‍🏫" color="green" />
          <StatCard label="Program Studi" value={data?.prodi ?? 0} icon="🏛️" color="purple" />
          <StatCard label="Pegawai" value={data?.pegawai ?? 0} icon="👥" color="amber" />
          <StatCard label="Pendaftar PMB" value={data?.pendaftar ?? 0} icon="📋" color="rose" />
          <StatCard label="Penelitian LPPM" value={data?.penelitian ?? 0} icon="🔬" color="brand" />
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Modul Terintegrasi</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>🎓 <b>Akademik</b> — Prodi, mata kuliah, kelas, KRS, KHS, transkrip</li>
            <li>🔄 <b>Neofeeder</b> — Sinkronisasi pelaporan PDDikti</li>
            <li>💻 <b>LMS + PJJ</b> — Pembelajaran daring & jarak jauh</li>
            <li>✅ <b>SPMI</b> — Standar mutu & audit internal (AMI)</li>
            <li>📋 <b>PMB</b> — Penerimaan mahasiswa baru</li>
            <li>👥 <b>Kepegawaian</b> — Data pegawai, absensi, payroll</li>
            <li>🔬 <b>LPPM</b> — Penelitian, pengabdian, publikasi</li>
            <li>🎓 <b>Wisuda</b> — Pendaftaran, slide seremoni, cetak ijazah</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Status Sistem</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-gray-500">API Backend</span><span className="badge bg-green-100 text-green-700">Online</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Basis Data</span><span className="badge bg-green-100 text-green-700">Terhubung</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Peran Anda</span><span className="badge bg-blue-100 text-blue-700">{user?.role}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
