const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email: email.toLowerCase() }).select('+password');
    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (employee.status === 'INACTIVE') {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(employee);
    const refreshToken = generateRefreshToken(employee);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

    res.json({
      message: 'Login successful.',
      accessToken,
      user: employee.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const employee = await Employee.findById(decoded.sub);
    if (!employee || (employee.refreshTokenVersion || 0) !== decoded.v) {
      return res.status(401).json({ message: 'Refresh token no longer valid.' });
    }
    if (employee.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    const accessToken = generateAccessToken(employee);
    res.json({ accessToken, user: employee.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

module.exports = { login, refresh, logout, me };
