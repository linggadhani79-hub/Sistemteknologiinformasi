import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';
import { visibleGroups } from '../nav';

const roleLabel: Record<string, string> = {
  SUPERADMIN: 'Super Admin', ADMIN_AKADEMIK: 'Admin Akademik', DOSEN: 'Dosen', MAHASISWA: 'Mahasiswa',
  OPERATOR_FEEDER: 'Operator Feeder', AUDITOR_MUTU: 'Auditor Mutu', KEPEGAWAIAN: 'Kepegawaian', LPPM: 'LPPM', CALON_MAHASISWA: 'Calon Mahasiswa',
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const groups = visibleGroups(user?.role ?? '');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto bg-white shadow-lg transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <span className="text-2xl">🎓</span>
          <div>
            <div className="font-bold leading-tight">SIAKAD Terpadu</div>
            <div className="text-xs text-gray-400">Sistem Informasi Akademik</div>
          </div>
        </div>
        <nav className="p-3">
          {groups.map((g) => (
            <div key={g.group} className="mb-4">
              <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{g.group}</div>
              {g.items.map((i) => (
                <NavLink
                  key={i.path}
                  to={i.path}
                  end={i.path === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`
                  }
                >
                  <span>{i.icon}</span>
                  {i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
          <button className="text-gray-500 lg:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.nama}</div>
              <div className="text-xs text-gray-400">{roleLabel[user?.role ?? ''] ?? user?.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">
              {user?.nama?.[0]?.toUpperCase()}
            </div>
            <button onClick={logout} className="btn-ghost text-xs">Keluar</button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
