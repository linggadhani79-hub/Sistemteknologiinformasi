import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { prisma } from './prisma.js';
import { authenticate } from './middleware/auth.js';
import { authRouter } from './modules/auth.js';
import { akademikRouter } from './modules/akademik.js';
import { neofeederRouter } from './modules/neofeeder.js';
import { pjjRouter } from './modules/pjj.js';
import { spmiRouter } from './modules/spmi.js';
import { lmsRouter } from './modules/lms.js';
import { pmbRouter } from './modules/pmb.js';
import { kepegawaianRouter } from './modules/kepegawaian.js';
import { lppmRouter } from './modules/lppm.js';
import { wisudaRouter } from './modules/wisuda.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'SIAKAD Terpadu API', time: new Date().toISOString() }));

// Modul-modul
app.use('/api/auth', authRouter);
app.use('/api/akademik', akademikRouter);
app.use('/api/neofeeder', neofeederRouter);
app.use('/api/pjj', pjjRouter);
app.use('/api/spmi', spmiRouter);
app.use('/api/lms', lmsRouter);
app.use('/api/pmb', pmbRouter);
app.use('/api/kepegawaian', kepegawaianRouter);
app.use('/api/lppm', lppmRouter);
app.use('/api/wisuda', wisudaRouter);

// Ringkasan dashboard utama (lintas modul)
app.get('/api/dashboard', authenticate, async (_req, res) => {
  const [mahasiswa, dosen, prodi, pegawai, pendaftar, penelitian] = await Promise.all([
    prisma.mahasiswa.count(),
    prisma.dosen.count(),
    prisma.programStudi.count(),
    prisma.pegawai.count(),
    prisma.pendaftar.count(),
    prisma.penelitian.count(),
  ]);
  res.json({ mahasiswa, dosen, prodi, pegawai, pendaftar, penelitian });
});

// Sajikan frontend SPA (hasil build) bila tersedia — mode single-container (Cloud Run).
// PUBLIC_DIR default: folder "public" di root aplikasi (lihat Dockerfile).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = process.env.PUBLIC_DIR ?? path.resolve(__dirname, '../public');
const hasSpa = fs.existsSync(path.join(publicDir, 'index.html'));

if (hasSpa) {
  app.use(express.static(publicDir));
}

// 404 untuk API, fallback ke index.html untuk rute SPA
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Endpoint tidak ditemukan' });
  }
  if (hasSpa && req.method === 'GET') {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  res.status(404).json({ message: 'Not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan server', detail: err?.message });
});

app.listen(config.port, () => {
  console.log(`🎓 SIAKAD Terpadu API berjalan di http://localhost:${config.port}`);
});
