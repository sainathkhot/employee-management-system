const Employee = require('../models/Employee');
const { wouldCreateCycle } = require('../utils/circularCheck');

const ADMIN_ONLY_FIELDS = ['role']; // only SUPER_ADMIN may set/change this
const HR_FORBIDDEN_FIELDS = ['role']; // HR cannot assign SUPER_ADMIN or change roles at all

async function getManagerIdOf(id) {
  const emp = await Employee.findById(id).select('reportingManager');
  return emp?.reportingManager ? emp.reportingManager.toString() : null;
}

// ---------------------------------------------------------------------
// GET /api/employees  (list, with search/filter/sort/pagination)
// ---------------------------------------------------------------------
async function listEmployees(req, res, next) {
  try {
    const {
      search,
      department,
      role,
      status,
      sortBy = 'joiningDate',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Employees may only ever see the roster in read-only, limited-field form;
    // HR and Super Admin can see everything.
    const allowedSort = ['joiningDate', 'name', 'salary', 'createdAt'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'joiningDate';
    const sortDir = order === 'asc' ? 1 : -1;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    let query = Employee.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum);
    query = query.populate('reportingManager', 'name employeeId designation');

    // Employees get a narrowed field set of everyone else's profile.
    if (req.user.role === 'EMPLOYEE') {
      query = query.select('employeeId name email department designation status profileImage reportingManager');
    }

    const [items, total] = await Promise.all([
      query.exec(),
      Employee.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// GET /api/employees/:id
// ---------------------------------------------------------------------
async function getEmployee(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role === 'EMPLOYEE' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'You may only view your own profile.' });
    }

    const employee = await Employee.findById(id).populate(
      'reportingManager',
      'name employeeId designation email'
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    res.json({ data: employee.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// POST /api/employees   (Super Admin, HR Manager)
// ---------------------------------------------------------------------
async function createEmployee(req, res, next) {
  try {
    const payload = { ...req.body };

    if (req.user.role === 'HR_MANAGER') {
      HR_FORBIDDEN_FIELDS.forEach((f) => delete payload[f]);
      payload.role = payload.role && payload.role !== 'SUPER_ADMIN' ? payload.role : 'EMPLOYEE';
    }

    if (payload.reportingManager) {
      const managerExists = await Employee.findById(payload.reportingManager);
      if (!managerExists) {
        return res.status(400).json({ message: 'Reporting manager does not exist.' });
      }
    }

    const employee = await Employee.create(payload);
    res.status(201).json({ message: 'Employee created.', data: employee.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// PUT /api/employees/:id   (Super Admin, HR Manager: any employee)
//                          (Employee: own profile, limited fields only)
// ---------------------------------------------------------------------
async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const target = await Employee.findById(id);
    if (!target) return res.status(404).json({ message: 'Employee not found.' });

    let updates = { ...req.body };

    if (req.user.role === 'EMPLOYEE') {
      if (req.user._id.toString() !== id) {
        return res.status(403).json({ message: 'You may only edit your own profile.' });
      }
      // Restrict to a safe, self-editable subset regardless of what was sent.
      const allowed = Employee.SELF_EDITABLE_FIELDS;
      updates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowed.includes(key))
      );
    }

    if (req.user.role === 'HR_MANAGER') {
      ADMIN_ONLY_FIELDS.forEach((f) => delete updates[f]);
      delete updates.reportingManager; // HR changes reporting via the dedicated endpoint & Super Admin only per spec intent
    }

    // Never allow role escalation to SUPER_ADMIN except by an existing SUPER_ADMIN
    if (updates.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only a Super Admin can assign the Super Admin role.' });
    }

    if (updates.reportingManager) {
      if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Only a Super Admin can change reporting managers here. Use PATCH /api/employees/:id/manager.' });
      }
      const cycle = await wouldCreateCycle(id, updates.reportingManager, getManagerIdOf);
      if (cycle) {
        return res.status(400).json({ message: 'This assignment would create a circular reporting relationship.' });
      }
    }

    Object.assign(target, updates);
    await target.save();

    res.json({ message: 'Employee updated.', data: target.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// DELETE /api/employees/:id  (Super Admin only, soft delete)
// ---------------------------------------------------------------------
async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Reassign direct reports to the deleted employee's own manager to avoid orphaned dangling refs
    await Employee.updateMany(
      { reportingManager: employee._id },
      { reportingManager: employee.reportingManager || null }
    );

    employee.isDeleted = true;
    employee.deletedAt = new Date();
    employee.status = 'INACTIVE';
    await employee.save();

    res.json({ message: 'Employee soft-deleted.' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// PATCH /api/employees/:id/manager  (Super Admin, HR Manager)
// ---------------------------------------------------------------------
async function assignManager(req, res, next) {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (managerId) {
      if (managerId === id) {
        return res.status(400).json({ message: 'An employee cannot be their own manager.' });
      }
      const manager = await Employee.findById(managerId);
      if (!manager) return res.status(400).json({ message: 'Proposed manager does not exist.' });

      const cycle = await wouldCreateCycle(id, managerId, getManagerIdOf);
      if (cycle) {
        return res.status(400).json({
          message: 'This assignment would create a circular reporting relationship.',
        });
      }
    }

    employee.reportingManager = managerId || null;
    await employee.save();

    res.json({ message: 'Reporting manager updated.', data: employee.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------
// GET /api/employees/:id/reportees
// ---------------------------------------------------------------------
async function getReportees(req, res, next) {
  try {
    const { id } = req.params;
    const reportees = await Employee.find({ reportingManager: id }).select(
      'employeeId name email designation department status profileImage'
    );
    res.json({ data: reportees });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignManager,
  getReportees,
};
