const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

/**
 * Verifies the access token (from Authorization header or httpOnly cookie),
 * loads the current employee, and attaches it to req.user.
 * Rejects if the employee has been deactivated or soft-deleted since the
 * token was issued.
 */
async function protect(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. No token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      const reason = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ message: reason });
    }

    const employee = await Employee.findById(decoded.sub);
    if (!employee) {
      return res.status(401).json({ message: 'Employee for this token no longer exists.' });
    }
    if (employee.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.user = employee;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { protect };
