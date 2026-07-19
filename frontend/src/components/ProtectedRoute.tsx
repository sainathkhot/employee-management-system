import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface Props {
  roles?: Role[];
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
