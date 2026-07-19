const Employee = require('../models/Employee');

/**
 * Builds a nested organization tree from a flat employee list.
 * Employees with no reportingManager (or whose manager isn't in the
 * active set) become roots.
 */
function buildTree(employees) {
  const byId = new Map();
  employees.forEach((e) => {
    byId.set(e._id.toString(), {
      _id: e._id,
      employeeId: e.employeeId,
      name: e.name,
      designation: e.designation,
      department: e.department,
      status: e.status,
      profileImage: e.profileImage,
      reportingManager: e.reportingManager ? e.reportingManager.toString() : null,
      children: [],
    });
  });

  const roots = [];
  for (const node of byId.values()) {
    if (node.reportingManager && byId.has(node.reportingManager)) {
      byId.get(node.reportingManager).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// GET /api/organization/tree
async function getTree(req, res, next) {
  try {
    const employees = await Employee.find({ status: { $ne: undefined } }).select(
      'employeeId name designation department status profileImage reportingManager'
    );
    const tree = buildTree(employees);
    res.json({ data: tree });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTree, buildTree };
