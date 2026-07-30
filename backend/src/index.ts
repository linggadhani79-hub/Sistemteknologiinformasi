import express from 'express';
import cors from 'cors';
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

// 404 & error handler
app.use((_req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan server', detail: err?.message });
});

app.listen(config.port, () => {
  console.log(`🎓 SIAKAD Terpadu API berjalan di http://localhost:${config.port}`);
});
