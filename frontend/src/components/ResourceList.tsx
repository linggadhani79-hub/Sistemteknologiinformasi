import { useEffect, useState } from 'react';
import { api } from '../api';
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
  endpoint: string; // e.g. /akademik/mahasiswa
  columns: Column[];
  searchable?: boolean;
}

function get(row: any, key: string) {
  return key.split('.').reduce((o, k) => o?.[k], row);
}

export function ResourceList({ title, subtitle, endpoint, columns, searchable = true }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(endpoint, { params: { q, limit: 50 } })
      .then((r) => setRows(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch((e) => setError(e.response?.data?.message ?? 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [endpoint, q]);

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
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-gray-50">
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
