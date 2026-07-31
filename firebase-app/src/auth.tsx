import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import type { Role } from './types';

export interface AppUser {
  uid: string;
  email: string;
  nama: string;
  role: Role;
}

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nama: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

async function loadProfile(fbUser: FirebaseUser): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', fbUser.uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { uid: fbUser.uid, email: d.email, nama: d.nama, role: d.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setUser(null); setLoading(false); return; }
      const profile = await loadProfile(fbUser);
      setUser(profile);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, nama: string) => {
    const registerCalon = httpsCallable(functions, 'registerCalon');
    await registerCalon({ email, password, nama });
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
