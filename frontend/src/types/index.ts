export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';
export type Status = 'ACTIVE' | 'INACTIVE';

export interface ManagerRef {
  _id: string;
  name: string;
  employeeId: string;
  designation?: string;
  email?: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: Status;
  role: Role;
  reportingManager: ManagerRef | string | null;
  profileImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  department: string;
  designation: string;
  profileImage?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeListResponse {
  data: Employee[];
  pagination: PaginationMeta;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  byDepartment: { department: string; count: number }[];
  byRole: { role: Role; count: number }[];
}

export interface OrgTreeNode {
  _id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  status: Status;
  profileImage?: string | null;
  reportingManager: string | null;
  children: OrgTreeNode[];
}
