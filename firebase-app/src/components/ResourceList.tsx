import { useState } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { useFirestoreList, ResolveSpec, Row } from '../lib/firestore';
import { PageHeader, Spinner, Badge } from './ui';

export interface Column {
  key: string;
  label: string;
  render?: (row: any) => any;
  badge?: boolean;
}

interface Props {
  title: string;
  subtitle?: string;
  collection: string;
  columns: Column[];
  resolve?: ResolveSpec[];
  constraints?: QueryConstraint[];
  searchable?: boolean;
  searchField?: string; // field lokal untuk filter teks (client-side, dataset kecil)
}

function get(row: any, key: string) {
  return key.split('.').reduce((o, k) => o?.[k], row);
}

/** Daftar Firestore generik — padanan ResourceList berbasis REST di versi Express. */
export function ResourceList({ title, subtitle, collection, columns, resolve = [], constraints = [], searchable = true, searchField }: Props) {
  const { rows, loading, error } = useFirestoreList(collection, constraints, resolve);
  const [q, setQ] = useState('');

  const filtered: Row[] = q && searchField
    ? rows.filter((r) => String(get(r, searchField) ?? '').toLowerCase().includes(q.toLowerCase()))
    : rows;

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={searchable ? <input className="input max-w-xs" placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} /> : undefined}
      />
      <div className="card overflow-hidden p-0">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-8 text-center text-rose-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {columns.map((c) => {
                      const val = c.render ? c.render(row) : get(row, c.key);
                      return <td key={c.key} className="td">{c.badge && typeof val === 'string' ? <Badge>{val}</Badge> : val ?? '-'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
