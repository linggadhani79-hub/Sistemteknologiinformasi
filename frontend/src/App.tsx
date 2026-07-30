import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transkrip } from './pages/Transkrip';
import { KRS } from './pages/KRS';
import { Neofeeder } from './pages/Neofeeder';
import { PmbDaftar } from './pages/PmbDaftar';
import { Lms } from './pages/Lms';
import { Pjj } from './pages/Pjj';
import { Payroll } from './pages/Payroll';
import * as M from './pages/modules';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function Routing() {
  const P = (el: JSX.Element) => <Protected>{el}</Protected>;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={P(<Dashboard />)} />
      {/* Akademik */}
      <Route path="/akademik/prodi" element={P(<M.ProdiPage />)} />
      <Route path="/akademik/matakuliah" element={P(<M.MataKuliahPage />)} />
      <Route path="/akademik/mahasiswa" element={P(<M.MahasiswaPage />)} />
      <Route path="/akademik/dosen" element={P(<M.DosenPage />)} />
      <Route path="/akademik/kelas" element={P(<M.KelasPage />)} />
      <Route path="/akademik/krs" element={P(<KRS />)} />
      <Route path="/akademik/transkrip" element={P(<Transkrip />)} />
      {/* Neofeeder */}
      <Route path="/neofeeder" element={P(<Neofeeder />)} />
      {/* Pembelajaran */}
      <Route path="/lms" element={P(<Lms />)} />
      <Route path="/pjj" element={P(<Pjj />)} />
      {/* SPMI */}
      <Route path="/spmi/standar" element={P(<M.StandarMutuPage />)} />
      <Route path="/spmi/audit" element={P(<M.AuditMutuPage />)} />
      {/* PMB */}
      <Route path="/pmb/pendaftar" element={P(<M.PendaftarPage />)} />
      <Route path="/pmb/daftar" element={P(<PmbDaftar />)} />
      {/* Kepegawaian */}
      <Route path="/kepegawaian/pegawai" element={P(<M.PegawaiPage />)} />
      <Route path="/kepegawaian/payroll" element={P(<Payroll />)} />
      {/* LPPM */}
      <Route path="/lppm/penelitian" element={P(<M.PenelitianPage />)} />
      <Route path="/lppm/pengabdian" element={P(<M.PengabdianPage />)} />
      <Route path="/lppm/publikasi" element={P(<M.PublikasiPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routing />
      </BrowserRouter>
    </AuthProvider>
  );
}
