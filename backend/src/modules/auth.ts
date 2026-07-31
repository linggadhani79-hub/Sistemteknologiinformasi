import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { signToken, authenticate } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Email/password tidak valid' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) return res.status(401).json({ message: 'Akun tidak ditemukan / nonaktif' });

  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) return res.status(401).json({ message: 'Password salah' });

  const payload = { id: user.id, email: user.email, role: user.role, nama: user.nama };
  res.json({ token: signToken(payload), user: payload });
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nama: z.string().min(2),
});

// Registrasi publik untuk calon mahasiswa (PMB)
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Data registrasi tidak valid' });

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return res.status(409).json({ message: 'Email sudah terdaftar' });

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, password: hash, nama: parsed.data.nama, role: 'CALON_MAHASISWA' },
  });
  const payload = { id: user.id, email: user.email, role: user.role, nama: user.nama };
  res.status(201).json({ token: signToken(payload), user: payload });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { mahasiswa: true, dosen: true, pegawai: true, pendaftar: true },
  });
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  const { password, ...safe } = user;
  res.json(safe);
});
