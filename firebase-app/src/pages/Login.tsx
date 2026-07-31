import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const demoAkun = [
  ['admin@kampus.ac.id', 'Admin Akademik'],
  ['budi@kampus.ac.id', 'Dosen'],
  ['andi@student.ac.id', 'Mahasiswa'],
  ['feeder@kampus.ac.id', 'Operator Feeder'],
  ['mutu@kampus.ac.id', 'Auditor SPMI'],
  ['hrd@kampus.ac.id', 'Kepegawaian'],
  ['lppm@kampus.ac.id', 'LPPM'],
  ['calon@gmail.com', 'Calon Mahasiswa'],
];

export function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@kampus.ac.id');
  const [password, setPassword] = useState('password123');
  const [nama, setNama] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, nama);
      nav('/');
    } catch (err: any) {
      setError(err.message?.replace(/^Firebase:\s*/, '') ?? 'Gagal masuk');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-center bg-brand-600 p-10 text-white md:flex">
          <div className="text-4xl">🎓</div>
          <h1 className="mt-4 text-2xl font-bold">SIAKAD Terpadu</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-brand-200">Firebase Edition</p>
          <p className="mt-3 text-sm text-brand-50">
            Sistem Informasi Akademik terintegrasi — berjalan di atas Firebase Auth, Firestore, Storage, dan Cloud Functions.
          </p>
          <ul className="mt-6 space-y-1 text-sm text-brand-50">
            <li>✓ Manajemen akademik & KRS/KHS</li>
            <li>✓ PMB dengan CBT & Virtual Account</li>
            <li>✓ Wisuda: slide seremoni & ijazah</li>
          </ul>
        </div>
        <div className="p-8">
          <h2 className="text-xl font-bold">{mode === 'login' ? 'Masuk' : 'Registrasi Calon Mahasiswa'}</h2>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <input className="input" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} required />
            )}
            <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
            <button className="btn w-full" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar'}</button>
          </form>
          <button className="mt-4 text-sm text-brand-500 hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Belum punya akun? Daftar (PMB)' : 'Sudah punya akun? Masuk'}
          </button>

          {mode === 'login' && (
            <div className="mt-6 border-t pt-4">
              <div className="mb-2 text-xs font-semibold text-gray-400">AKUN DEMO (password: password123)</div>
              <div className="grid grid-cols-2 gap-1">
                {demoAkun.map(([em, label]) => (
                  <button key={em} type="button" onClick={() => setEmail(em)} className="rounded px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-100">
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
