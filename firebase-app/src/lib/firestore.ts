import { useEffect, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, query, QueryConstraint, DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Row extends DocumentData {
  id: string;
}

const docCache = new Map<string, any>();

/** Ambil satu dokumen dengan cache in-memory (mengurangi refetch berulang saat resolve relasi). */
export async function getCached(path: string): Promise<any> {
  if (docCache.has(path)) return docCache.get(path);
  const snap = await getDoc(doc(db, path));
  const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
  docCache.set(path, data);
  return data;
}

export function clearDocCache() {
  docCache.clear();
}

export interface ResolveSpec {
  /** Nama field FK pada dokumen, mis. "prodiId" */
  field: string;
  /** Nama koleksi tujuan, mis. "prodi" */
  collection: string;
  /** Nama field hasil resolve pada row, mis. "prodi" (row.prodi = {...}) */
  as: string;
}

/**
 * Hook generik: ambil semua dokumen dari sebuah koleksi Firestore (opsional
 * dengan constraints/where), lalu resolve relasi FK sederhana (padanan
 * `include` Prisma) via `resolveSpecs`. Dipakai oleh ResourceList & halaman
 * modul lain agar tidak menulis ulang boilerplate query+resolve.
 */
export function useFirestoreList(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  resolveSpecs: ResolveSpec[] = [],
  deps: any[] = [],
) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const q = query(collection(db, collectionName), ...constraints);
        const snap = await getDocs(q);
        let list: Row[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        for (const spec of resolveSpecs) {
          list = await Promise.all(
            list.map(async (row) => {
              const fk = row[spec.field];
              if (!fk) return row;
              const related = await getCached(`${spec.collection}/${fk}`);
              return { ...row, [spec.as]: related };
            }),
          );
        }
        if (!cancelled) setRows(list);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, reloadKey, ...deps]);

  return { rows, loading, error, reload: () => setReloadKey((k) => k + 1) };
}

/** Ambil satu dokumen (reaktif terhadap perubahan id) dengan status loading. */
export function useFirestoreDoc(collectionName: string, id: string | null | undefined) {
  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    getDoc(doc(db, collectionName, id)).then((snap) => {
      setData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
  }, [collectionName, id]);

  return { data, loading };
}
