import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeeApi } from '../services/endpoints';
import type { Employee, ManagerRef } from '../types';
import { useAuth } from '../context/AuthContext';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reportees, setReportees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([employeeApi.get(id), employeeApi.reportees(id)])
      .then(([emp, reps]) => {
        setEmployee(emp);
        setReportees(reps);
      })
      .catch(() => setError('You do not have permission to view this profile, or it does not exist.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;
  if (error || !employee)
    return <p className="text-sm text-red-500">{error || 'Employee not found.'}</p>;

  const manager = employee.reportingManager as ManagerRef | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
          ← Back
        </button>
        {canManage && (
          <Link
            to={`/employees/${employee._id}/edit`}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Edit
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{employee.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {employee.designation} · {employee.department}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                employee.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              {employee.status}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Employee ID" value={employee.employeeId} />
          <Detail label="Email" value={employee.email} />
          <Detail label="Phone" value={employee.phone} />
          <Detail label="Role" value={employee.role.replace('_', ' ')} />
          {(canManage || user?._id === employee._id) && (
            <Detail label="Salary" value={`₹${employee.salary.toLocaleString('en-IN')}`} />
          )}
          <Detail label="Joining Date" value={new Date(employee.joiningDate).toLocaleDateString()} />
          <Detail
            label="Reporting Manager"
            value={
              manager && typeof manager === 'object' ? (
                <Link to={`/employees/${manager._id}`} className="text-brand-600 hover:underline dark:text-brand-500">
                  {manager.name}
                </Link>
              ) : (
                '—'
              )
            }
          />
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Direct Reports ({reportees.length})
        </h2>
        {reportees.length === 0 ? (
          <p className="text-sm text-slate-400">No direct reports.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-900">
            {reportees.map((r) => (
              <li key={r._id} className="flex items-center justify-between py-2">
                <div>
                  <Link
                    to={`/employees/${r._id}`}
                    className="text-sm font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-500"
                  >
                    {r.name}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.designation}</p>
                </div>
                <span className="text-xs text-slate-400">{r.department}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
