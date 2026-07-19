function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}.` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid identifier: ${err.value}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error.',
  });
}

module.exports = { notFound, errorHandler };
