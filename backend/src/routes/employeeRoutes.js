const express = require('express');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const { parse } = require('csv-parse/sync');

const employeeController = require('../controllers/employeeController');
const Employee = require('../models/Employee');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(protect);

const employeeWriteValidators = [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('email').optional().isEmail().withMessage('A valid email is required.'),
  body('phone').optional().matches(/^\+?[0-9]{7,15}$/).withMessage('Invalid phone number.'),
  body('department').optional().notEmpty().withMessage('Department is required.'),
  body('designation').optional().notEmpty().withMessage('Designation is required.'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a non-negative number.'),
  body('joiningDate').optional().isISO8601().withMessage('Joining date must be a valid date.'),
  body('status').optional().isIn(Employee.STATUSES).withMessage('Invalid status.'),
  body('role').optional().isIn(Employee.ROLES).withMessage('Invalid role.'),
];

// GET /api/employees
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  employeeController.listEmployees
);

// POST /api/employees  (Super Admin, HR Manager)
router.post(
  '/',
  allowRoles('SUPER_ADMIN', 'HR_MANAGER'),
  [
    body('employeeId').notEmpty().withMessage('Employee ID is required.'),
    body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('phone').matches(/^\+?[0-9]{7,15}$/).withMessage('Invalid phone number.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('department').notEmpty().withMessage('Department is required.'),
    body('designation').notEmpty().withMessage('Designation is required.'),
    body('salary').isFloat({ min: 0 }).withMessage('Salary must be a non-negative number.'),
    body('joiningDate').isISO8601().withMessage('Joining date must be a valid date.'),
  ],
  validate,
  employeeController.createEmployee
);

// CSV import (bonus) - Super Admin, HR Manager
router.post(
  '/import',
  allowRoles('SUPER_ADMIN', 'HR_MANAGER'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'CSV file is required (field name: file).' });

      const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
      const results = { created: 0, failed: [] };

      for (const [i, row] of records.entries()) {
        try {
          const payload = {
            employeeId: row.employeeId,
            name: row.name,
            email: row.email,
            phone: row.phone,
            password: row.password || 'ChangeMe123!',
            department: row.department,
            designation: row.designation,
            salary: Number(row.salary),
            joiningDate: new Date(row.joiningDate),
            status: row.status || 'ACTIVE',
            role: req.user.role === 'SUPER_ADMIN' && row.role ? row.role : 'EMPLOYEE',
          };
          await Employee.create(payload);
          results.created += 1;
        } catch (err) {
          results.failed.push({ row: i + 1, error: err.message });
        }
      }

      res.json({ message: 'CSV import complete.', data: results });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/employees/:id
router.get('/:id', [param('id').isMongoId()], validate, employeeController.getEmployee);

// GET /api/employees/:id/reportees
router.get(
  '/:id/reportees',
  [param('id').isMongoId()],
  validate,
  employeeController.getReportees
);

// PUT /api/employees/:id
router.put(
  '/:id',
  [param('id').isMongoId(), ...employeeWriteValidators],
  validate,
  employeeController.updateEmployee
);

// PATCH /api/employees/:id/manager
router.patch(
  '/:id/manager',
  allowRoles('SUPER_ADMIN', 'HR_MANAGER'),
  [param('id').isMongoId(), body('managerId').optional({ nullable: true }).isMongoId()],
  validate,
  employeeController.assignManager
);

// DELETE /api/employees/:id  (Super Admin only)
router.delete(
  '/:id',
  allowRoles('SUPER_ADMIN'),
  [param('id').isMongoId()],
  validate,
  employeeController.deleteEmployee
);

module.exports = router;
