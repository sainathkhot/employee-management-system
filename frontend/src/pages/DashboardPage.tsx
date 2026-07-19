import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { dashboardApi } from '../services/endpoints';
import type { DashboardStats } from '../types';

const PIE_COLORS = ['#3b6ef6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .stats()
      .then(setStats)
      .catch(() => setError('Could not load dashboard stats. You may not have permission.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</div>;
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
        {error || 'No data available.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Organization overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats.totalEmployees} accent="brand" />
        <StatCard label="Active Employees" value={stats.activeEmployees} accent="green" />
        <StatCard label="Inactive Employees" value={stats.inactiveEmployees} accent="red" />
        <StatCard label="Departments" value={stats.departmentCount} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Employees by Department
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="department" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b6ef6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Employees by Role
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.byRole}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry: { role?: string; count?: number }) => `${entry.role}: ${entry.count}`}
              >
                {stats.byRole.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
