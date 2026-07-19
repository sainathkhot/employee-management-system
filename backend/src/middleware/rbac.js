/**
 * Restricts a route to the given list of roles.
 * Usage: router.get('/', protect, allowRoles('SUPER_ADMIN', 'HR_MANAGER'), handler)
 */
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${roles.join(', ')}.`,
      });
    }
    next();
  };
}

module.exports = { allowRoles };
