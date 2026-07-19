import { api } from './api';
import type {
  AuthUser,
  DashboardStats,
  Employee,
  EmployeeListResponse,
  OrgTreeNode,
} from '../types';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  message: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: () => api.post<LoginResponse>('/auth/refresh').then((r) => r.data),
  me: () => api.get<{ user: AuthUser }>('/auth/me').then((r) => r.data),
};

export interface EmployeeListParams {
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const employeeApi = {
  list: (params: EmployeeListParams) =>
    api.get<EmployeeListResponse>('/employees', { params }).then((r) => r.data),
  get: (id: string) => api.get<{ data: Employee }>(`/employees/${id}`).then((r) => r.data.data),
  create: (payload: Partial<Employee> & { password: string }) =>
    api.post<{ data: Employee }>('/employees', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<Employee>) =>
    api.put<{ data: Employee }>(`/employees/${id}`, payload).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/employees/${id}`).then((r) => r.data),
  assignManager: (id: string, managerId: string | null) =>
    api.patch(`/employees/${id}/manager`, { managerId }).then((r) => r.data),
  reportees: (id: string) =>
    api.get<{ data: Employee[] }>(`/employees/${id}/reportees`).then((r) => r.data.data),
  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/employees/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const organizationApi = {
  tree: () => api.get<{ data: OrgTreeNode[] }>('/organization/tree').then((r) => r.data.data),
};

export const dashboardApi = {
  stats: () => api.get<{ data: DashboardStats }>('/dashboard/stats').then((r) => r.data.data),
};
