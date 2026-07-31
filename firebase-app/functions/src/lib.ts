import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';

export const app = initializeApp();
export const db = getFirestore(app);
export const authAdmin = getAuth(app);
export const FV = FieldValue;
export const REGION = 'asia-southeast2';

export type Role =
  | 'SUPERADMIN' | 'ADMIN_AKADEMIK' | 'DOSEN' | 'MAHASISWA' | 'OPERATOR_FEEDER'
  | 'AUDITOR_MUTU' | 'KEPEGAWAIAN' | 'LPPM' | 'CALON_MAHASISWA';

/** Ambil dokumen users/{uid} pemanggil fungsi; lempar error kalau belum login. */
export async function requireUser(req: CallableRequest): Promise<{ uid: string; role: Role; nama: string }> {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Anda harus login terlebih dahulu');
  const snap = await db.collection('users').doc(req.auth.uid).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan');
  const data = snap.data()!;
  return { uid: req.auth.uid, role: data.role, nama: data.nama };
}

/** Pastikan peran pemanggil ada di daftar yang diizinkan (padanan `authorize(...roles)` Express). */
export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new HttpsError('permission-denied', `Peran ${role} tidak memiliki akses untuk aksi ini`);
  }
}

export function badRequest(message: string): never {
  throw new HttpsError('invalid-argument', message);
}

export function forbidden(message: string): never {
  throw new HttpsError('permission-denied', message);
}
