interface Props {
  label: string;
  value: number | string;
  accent?: 'brand' | 'green' | 'red' | 'amber';
}

const accentMap: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
};

export default function StatCard({ label, value, accent = 'brand' }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-2 py-1 text-2xl font-bold ${accentMap[accent]}`}>
        {value}
      </p>
    </div>
  );
}
