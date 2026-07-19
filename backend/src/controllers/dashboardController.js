const Employee = require('../models/Employee');

// GET /api/dashboard/stats
async function getStats(req, res, next) {
  try {
    const [total, active, inactive, departmentAgg] = await Promise.all([
      Employee.countDocuments({}),
      Employee.countDocuments({ status: 'ACTIVE' }),
      Employee.countDocuments({ status: 'INACTIVE' }),
      Employee.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const roleAgg = await Employee.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      data: {
        totalEmployees: total,
        activeEmployees: active,
        inactiveEmployees: inactive,
        departmentCount: departmentAgg.length,
        byDepartment: departmentAgg.map((d) => ({ department: d._id, count: d.count })),
        byRole: roleAgg.map((r) => ({ role: r._id, count: r.count })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
