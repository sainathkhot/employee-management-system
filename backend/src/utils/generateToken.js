const jwt = require('jsonwebtoken');

function generateAccessToken(employee) {
  return jwt.sign(
    { sub: employee._id.toString(), role: employee.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function generateRefreshToken(employee) {
  return jwt.sign(
    {
      sub: employee._id.toString(),
      v: employee.refreshTokenVersion || 0,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
