export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: string[]; // roles yang boleh melihat menu; kosong = semua
}

// Grup menu berdasarkan modul
export const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: 'Umum',
    items: [{ label: 'Dashboard', path: '/', icon: '🏠', roles: [] }],
  },
  {
    group: 'Akademik',
    items: [
      { label: 'Program Studi', path: '/akademik/prodi', icon: '🏛️', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK'] },
      { label: 'Mata Kuliah', path: '/akademik/matakuliah', icon: '📚', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK'] },
      { label: 'Mahasiswa', path: '/akademik/mahasiswa', icon: '🎓', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN'] },
      { label: 'Dosen', path: '/akademik/dosen', icon: '👨‍🏫', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK'] },
      { label: 'Kelas', path: '/akademik/kelas', icon: '🗓️', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK'] },
      { label: 'KRS Saya', path: '/akademik/krs', icon: '📝', roles: ['MAHASISWA'] },
      { label: 'Transkrip', path: '/akademik/transkrip', icon: '📄', roles: ['MAHASISWA'] },
    ],
  },
  {
    group: 'Neofeeder / PDDikti',
    items: [{ label: 'Sinkronisasi Feeder', path: '/neofeeder', icon: '🔄', roles: ['SUPERADMIN', 'OPERATOR_FEEDER'] }],
  },
  {
    group: 'Pembelajaran',
    items: [
      { label: 'LMS - Course', path: '/lms', icon: '💻', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN', 'MAHASISWA'] },
      { label: 'PJJ - Sesi', path: '/pjj', icon: '📡', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN', 'MAHASISWA'] },
    ],
  },
  {
    group: 'Penjaminan Mutu (SPMI)',
    items: [
      { label: 'Standar Mutu', path: '/spmi/standar', icon: '✅', roles: ['SUPERADMIN', 'AUDITOR_MUTU'] },
      { label: 'Audit Mutu (AMI)', path: '/spmi/audit', icon: '🔍', roles: ['SUPERADMIN', 'AUDITOR_MUTU'] },
    ],
  },
  {
    group: 'PMB',
    items: [
      { label: 'Pendaftar', path: '/pmb/pendaftar', icon: '📋', roles: ['SUPERADMIN', 'ADMIN_AKADEMIK'] },
      { label: 'Pendaftaran Saya', path: '/pmb/daftar', icon: '✍️', roles: ['CALON_MAHASISWA'] },
    ],
  },
  {
    group: 'Kepegawaian',
    items: [
      { label: 'Data Pegawai', path: '/kepegawaian/pegawai', icon: '👥', roles: ['SUPERADMIN', 'KEPEGAWAIAN'] },
      { label: 'Payroll', path: '/kepegawaian/payroll', icon: '💰', roles: ['SUPERADMIN', 'KEPEGAWAIAN'] },
    ],
  },
  {
    group: 'LPPM',
    items: [
      { label: 'Penelitian', path: '/lppm/penelitian', icon: '🔬', roles: ['SUPERADMIN', 'LPPM', 'DOSEN'] },
      { label: 'Pengabdian', path: '/lppm/pengabdian', icon: '🤝', roles: ['SUPERADMIN', 'LPPM', 'DOSEN'] },
      { label: 'Publikasi', path: '/lppm/publikasi', icon: '📰', roles: ['SUPERADMIN', 'LPPM', 'DOSEN'] },
    ],
  },
];

export function visibleGroups(role: string) {
  return navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.length === 0 || i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}
