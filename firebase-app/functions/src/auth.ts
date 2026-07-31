import { onCall } from 'firebase-functions/v2/https';
import { db, authAdmin, REGION, requireUser, assertRole, badRequest, Role } from './lib.js';

/**
 * Registrasi publik akun CALON_MAHASISWA (padanan POST /auth/register).
 * Satu-satunya self-service signup; peran lain dibuat lewat createStaffAccount.
 */
export const registerCalon = onCall({ region: REGION }, async (req) => {
  const { email, password, nama } = req.data as { email: string; password: string; nama: string };
  if (!email || !password || password.length < 6 || !nama) badRequest('Data registrasi tidak valid');

  const userRecord = await authAdmin.createUser({ email, password, displayName: nama });
  await db.collection('users').doc(userRecord.uid).set({
    email, nama, role: 'CALON_MAHASISWA', isActive: true, createdAt: Date.now(),
  });
  return { uid: userRecord.uid };
});

/**
 * Panitia/admin membuat akun staf/mahasiswa dengan peran tertentu (padanan seed manual
 * di Express — di sana akun dibuat lewat seed script; di sini disediakan sebagai fungsi
 * agar SUPERADMIN bisa menambah pengguna dari UI tanpa akses Admin SDK langsung).
 */
export const createStaffAccount = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['SUPERADMIN']);

  const { email, password, nama, role } = req.data as { email: string; password: string; nama: string; role: Role };
  const validRoles: Role[] = ['SUPERADMIN', 'ADMIN_AKADEMIK', 'DOSEN', 'MAHASISWA', 'OPERATOR_FEEDER', 'AUDITOR_MUTU', 'KEPEGAWAIAN', 'LPPM'];
  if (!validRoles.includes(role)) badRequest('Peran tidak valid');

  const userRecord = await authAdmin.createUser({ email, password, displayName: nama });
  await db.collection('users').doc(userRecord.uid).set({
    email, nama, role, isActive: true, createdAt: Date.now(),
  });
  return { uid: userRecord.uid };
});

/** SUPERADMIN menonaktifkan/mengaktifkan akun. */
export const setUserActive = onCall({ region: REGION }, async (req) => {
  const caller = await requireUser(req);
  assertRole(caller.role, ['SUPERADMIN']);
  const { uid, isActive } = req.data as { uid: string; isActive: boolean };
  await db.collection('users').doc(uid).update({ isActive });
  await authAdmin.updateUser(uid, { disabled: !isActive });
  return { ok: true };
});
