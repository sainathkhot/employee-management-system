import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../services/endpoints';
import type { Employee, PaginationMeta } from '../types';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS_FALLBACK = ['Engineering', 'Sales', 'Human Resources', 'Executive', 'Finance', 'Marketing'];

export default function EmployeesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('joiningDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    employeeApi
      .list({ search, department, role, status, sortBy, order, page, limit: 10 })
      .then((res) => {
        setEmployees(res.data);
        setPagination(res.pagination);
        setError(null);
      })
      .catch(() => setError('Failed to load employees.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department, role, status, sortBy, order, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Soft-delete this employee? Their record will be deactivated but retained.')) return;
    await employeeApi.remove(id);
    load();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await employeeApi.importCsv(file);
      setImportMsg(`Imported ${res.data.created} employee(s). ${res.data.failed.length} failed.`);
      load();
    } catch {
      setImportMsg('CSV import failed.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Employees</h1>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              {importing ? 'Importing…' : 'Import CSV'}
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
          )}
          {canManage && (
            <Link
              to="/employees/new"
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              + Add Employee
            </Link>
          )}
        </div>
      </div>

      {importMsg && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-500">
          {importMsg}
        </p>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name or email…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <select
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS_FALLBACK.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="HR_MANAGER">HR Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('name')}>
                Name {sortBy === 'name' && (order === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Status</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('joiningDate')}>
                Joined {sortBy === 'joiningDate' && (order === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id} className="border-b border-slate-100 last:border-0 dark:border-slate-900">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <Link to={`/employees/${emp._id}`} className="hover:text-brand-600 dark:hover:text-brand-500">
                      {emp.name}
                    </Link>
                    <p className="text-xs font-normal text-slate-400">{emp.employeeId}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.department}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.designation}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(emp.joiningDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/employees/${emp._id}`}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        View
                      </Link>
                      {canManage && (
                        <Link
                          to={`/employees/${emp._id}/edit`}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                      )}
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(emp._id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <p>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Prev
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
