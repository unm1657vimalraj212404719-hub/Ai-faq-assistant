const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Centralized error handler: sanitizes DB errors so internals never leak.
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid resource id';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value: resource already exists';
  } else if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
