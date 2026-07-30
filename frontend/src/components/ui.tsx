import { useEffect, useState, ReactNode } from 'react';
import { api } from '../api';

export function Spinner() {
  return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'brand' }: { label: string; value: ReactNode; icon?: string; color?: string }) {
  const colors: Record<string, string> = {
    brand: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="card flex items-center gap-4">
      {icon && <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl ${colors[color] ?? colors.brand}`}>{icon}</div>}
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

const badgeColors: Record<string, string> = {
  AKTIF: 'bg-green-100 text-green-700', DISETUJUI: 'bg-green-100 text-green-700', DITERIMA: 'bg-green-100 text-green-700',
  DIDANAI: 'bg-green-100 text-green-700', SUCCESS: 'bg-green-100 text-green-700', SELESAI: 'bg-green-100 text-green-700',
  DIAJUKAN: 'bg-blue-100 text-blue-700', DRAFT: 'bg-gray-100 text-gray-600', PENDING: 'bg-amber-100 text-amber-700',
  REVIEW: 'bg-amber-100 text-amber-700', VERIFIKASI: 'bg-amber-100 text-amber-700', PROSES: 'bg-amber-100 text-amber-700',
  DITOLAK: 'bg-rose-100 text-rose-700', FAILED: 'bg-rose-100 text-rose-700', DROP_OUT: 'bg-rose-100 text-rose-700',
  MINOR: 'bg-amber-100 text-amber-700', MAYOR: 'bg-rose-100 text-rose-700',
};

export function Badge({ children }: { children: string }) {
  const cls = badgeColors[children] ?? 'bg-gray-100 text-gray-600';
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function useFetch<T = any>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    api
      .get(url)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message ?? 'Gagal memuat data'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey, ...deps]);

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) };
}

export function fmtRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0);
}
