import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900">
      <p className="text-5xl font-bold text-slate-300 dark:text-slate-700">404</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">Page not found.</p>
      <Link to="/dashboard" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500">
        Back to dashboard
      </Link>
    </div>
  );
}
