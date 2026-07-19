import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-500 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_MANAGER';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-950 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
            E
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">EMS</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Employee Management</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink to="/dashboard" className={navItemClass} onClick={() => setSidebarOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/employees" className={navItemClass} onClick={() => setSidebarOpen(false)}>
            Employees
          </NavLink>
          <NavLink to="/organization" className={navItemClass} onClick={() => setSidebarOpen(false)}>
            Org Chart
          </NavLink>
          <NavLink to="/profile" className={navItemClass} onClick={() => setSidebarOpen(false)}>
            My Profile
          </NavLink>
          {canManage && (
            <NavLink to="/employees/new" className={navItemClass} onClick={() => setSidebarOpen(false)}>
              Add Employee
            </NavLink>
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-3 rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
            <p className="font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
            <p className="text-slate-500 dark:text-slate-400">{user?.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:px-6">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <button
            onClick={toggle}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
