import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import type { Employee } from '../types';
import { AxiosError } from 'axios';

interface FormState {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  salary: string;
  joiningDate: string;
  status: string;
  role: string;
  reportingManager: string;
}

const EMPTY: FormState = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  department: '',
  designation: '',
  salary: '',
  joiningDate: '',
  status: 'ACTIVE',
  role: 'EMPLOYEE',
  reportingManager: '',
};

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employeeApi.list({ limit: 100 }).then((res) => setManagers(res.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    employeeApi.get(id).then((emp) => {
      setForm({
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        password: '',
        department: emp.department,
        designation: emp.designation,
        salary: String(emp.salary),
        joiningDate: emp.joiningDate?.slice(0, 10) || '',
        status: emp.status,
        role: emp.role,
        reportingManager:
          typeof emp.reportingManager === 'object' && emp.reportingManager
            ? emp.reportingManager._id
            : (emp.reportingManager as string) || '',
      });
      setLoading(false);
    });
  }, [id]);

  const update = (field: keyof FormState, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        employeeId: form.employeeId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
        salary: Number(form.salary),
        joiningDate: form.joiningDate,
        status: form.status,
        role: form.role,
      };
      if (!isEdit) payload.password = form.password;

      let savedId = id;
      if (isEdit && id) {
        await employeeApi.update(id, payload);
      } else {
        const created = await employeeApi.create(payload as Partial<Employee> & { password: string });
        savedId = created._id;
      }

      // Manager assignment goes through the dedicated endpoint (server enforces cycle checks)
      if (savedId && form.reportingManager !== undefined) {
        await employeeApi.assignManager(savedId, form.reportingManager || null);
      }

      navigate('/employees');
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.message ||
            err.response?.data?.errors?.map((x: { message: string }) => x.message).join(', ') ||
            'Failed to save employee.'
          : 'Failed to save employee.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
        {isEdit ? 'Edit Employee' : 'Add Employee'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Employee ID">
            <input
              required
              disabled={isEdit}
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Full Name">
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="input" />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Phone">
            <input
              required
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+919876543210"
              className="input"
            />
          </Field>
          {!isEdit && (
            <Field label="Initial Password">
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input"
              />
            </Field>
          )}
          <Field label="Department">
            <input
              required
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Designation">
            <input
              required
              value={form.designation}
              onChange={(e) => update('designation', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Salary">
            <input
              required
              type="number"
              min={0}
              value={form.salary}
              onChange={(e) => update('salary', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Joining Date">
            <input
              required
              type="date"
              value={form.joiningDate}
              onChange={(e) => update('joiningDate', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              disabled={!isSuperAdmin && form.role === 'SUPER_ADMIN'}
              className="input"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR_MANAGER">HR Manager</option>
              {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
          </Field>
          <Field label="Reporting Manager">
            <select
              value={form.reportingManager}
              onChange={(e) => update('reportingManager', e.target.value)}
              className="input"
            >
              <option value="">None</option>
              {managers
                .filter((m) => m._id !== id)
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.designation})
                  </option>
                ))}
            </select>
          </Field>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
