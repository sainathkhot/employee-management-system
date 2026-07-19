import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeApi } from '../services/endpoints';
import type { Employee, ManagerRef } from '../types';
import { AxiosError } from 'axios';

export default function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    employeeApi.get(user._id).then((emp) => {
      setEmployee(emp);
      setPhone(emp.phone);
      setLoading(false);
    });
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await employeeApi.update(user._id, { phone });
      setEmployee(updated);
      setMessage('Profile updated successfully.');
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : null;
      setError(msg || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !employee) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;

  const manager = employee.reportingManager as ManagerRef | null;
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Profile</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
            {employee.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{employee.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {employee.designation} · {employee.department}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-400">Employee ID</dt>
            <dd className="text-slate-800 dark:text-slate-200">{employee.employeeId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Email</dt>
            <dd className="text-slate-800 dark:text-slate-200">{employee.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Role</dt>
            <dd className="text-slate-800 dark:text-slate-200">{employee.role.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Reporting Manager</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              {manager && typeof manager === 'object' ? manager.name : '—'}
            </dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-900">
          <p className="text-xs text-slate-400">
            {isEmployee
              ? 'You can update your phone number below. Other fields require HR or Admin assistance.'
              : 'You can update your phone number here. Use the Employees section to edit other fields.'}
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </label>

          {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
