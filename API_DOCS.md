# API Documentation

Base URL (local): `http://localhost:5000/api`

All endpoints except `/auth/login`, `/auth/refresh`, and `/auth/logout`
require a valid access token, sent as:

```
Authorization: Bearer <accessToken>
```

The refresh token itself travels as an `httpOnly` cookie and is never
exposed to client-side JavaScript.

---

## Auth

### `POST /auth/login`
Body:
```json
{ "email": "admin@ems.com", "password": "Admin@12345" }
```
Response `200`:
```json
{
  "message": "Login successful.",
  "accessToken": "<jwt>",
  "user": { "_id": "...", "name": "...", "role": "SUPER_ADMIN", "...": "..." }
}
```
Also sets an `httpOnly` `refreshToken` cookie. `401` on bad credentials, `403`
if the account is deactivated, `429` if rate-limited.

### `POST /auth/refresh`
No body (uses the `refreshToken` cookie). Returns a new `accessToken` + `user`.
`401` if the cookie is missing/invalid/expired or the token version no longer
matches (e.g. after a forced logout).

### `POST /auth/logout`
Clears the refresh-token cookie. `200` always.

### `GET /auth/me`
Requires auth. Returns the current authenticated user.

---

## Employees

### `GET /employees`
Query params (all optional):

| Param      | Type   | Notes                                             |
|------------|--------|----------------------------------------------------|
| `search`   | string | matches name or email (case-insensitive)           |
| `department` | string | exact match                                      |
| `role`     | enum   | `SUPER_ADMIN` \| `HR_MANAGER` \| `EMPLOYEE`         |
| `status`   | enum   | `ACTIVE` \| `INACTIVE`                              |
| `sortBy`   | enum   | `joiningDate` \| `name` \| `salary` \| `createdAt`  |
| `order`    | enum   | `asc` \| `desc` (default `desc`)                    |
| `page`     | int    | default `1`                                         |
| `limit`    | int    | default `10`, max `100`                             |

Response:
```json
{
  "data": [ { "employeeId": "EMS-0001", "name": "...", "...": "..." } ],
  "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```
Note: an `EMPLOYEE`-role caller receives a reduced field set for every record
except their own (no salary, phone, etc.).

### `GET /employees/:id`
Returns a single employee (populated `reportingManager`). An `EMPLOYEE` may
only fetch their own record (`403` otherwise). `404` if not found.

### `POST /employees`  — Super Admin, HR Manager
Body (all required unless noted):
```json
{
  "employeeId": "EMS-0010",
  "name": "Jane Doe",
  "email": "jane@company.com",
  "phone": "+919876543210",
  "password": "MinEightChars",
  "department": "Engineering",
  "designation": "Software Engineer",
  "salary": 85000,
  "joiningDate": "2024-01-15",
  "status": "ACTIVE",       // optional, default ACTIVE
  "role": "EMPLOYEE",        // optional, default EMPLOYEE
  "reportingManager": "<id>" // optional
}
```
HR Managers may not set `role` to `SUPER_ADMIN` (silently downgraded to
`EMPLOYEE`). `201` on success, `400` on validation failure, `409` on
duplicate email/employeeId.

### `PUT /employees/:id`
- **Super Admin / HR Manager:** may update any field on any employee (HR may
  not change `role` or `reportingManager` directly — use the manager
  endpoint below for reassignment).
- **Employee:** may update only `phone` and `profileImage` on their **own**
  record; any other field in the request body is silently ignored, and a
  request targeting someone else's `id` returns `403`.
- Assigning `reportingManager` (Super Admin only via this route) is checked
  against circular-reporting; violations return `400`.

### `DELETE /employees/:id`  — Super Admin only
Soft-deletes the employee (flags `isDeleted`, sets `status: INACTIVE`,
records `deletedAt`) and re-parents their direct reports to their own
manager. Cannot delete your own account (`400`).

### `PATCH /employees/:id/manager`  — Super Admin, HR Manager
Body:
```json
{ "managerId": "<id or null>" }
```
Rejects self-assignment and any assignment that would create a circular
reporting chain (`400`).

### `GET /employees/:id/reportees`
Returns the list of employees whose `reportingManager` is `:id`.

### `POST /employees/import`  — Super Admin, HR Manager (bonus)
`multipart/form-data` with a `file` field (CSV). Expected columns:
`employeeId,name,email,phone,password,department,designation,salary,joiningDate,status,role`.
Returns `{ created, failed: [{ row, error }] }`.

---

## Organization

### `GET /organization/tree`
Returns the full reporting hierarchy as a nested array of root nodes, each
with a `children` array.

---

## Dashboard

### `GET /dashboard/stats`  — Super Admin, HR Manager
```json
{
  "data": {
    "totalEmployees": 42,
    "activeEmployees": 38,
    "inactiveEmployees": 4,
    "departmentCount": 5,
    "byDepartment": [{ "department": "Engineering", "count": 12 }],
    "byRole": [{ "role": "EMPLOYEE", "count": 35 }]
  }
}
```

---

## Error format

All error responses share a consistent shape:
```json
{ "message": "Human-readable summary." }
```
Validation errors additionally include:
```json
{
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "A valid email is required." }]
}
```
