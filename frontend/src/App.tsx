import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeFormPage from './pages/EmployeeFormPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import OrgChartPage from './pages/OrgChartPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                <Route path="/organization" element={<OrgChartPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                <Route element={<ProtectedRoute roles={['SUPER_ADMIN', 'HR_MANAGER']} />}>
                  <Route path="/employees/new" element={<EmployeeFormPage />} />
                  <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
