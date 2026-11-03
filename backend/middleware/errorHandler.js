export function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errors: err.errors,
    });
  }

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    const field = fields[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An account with that ${field} already exists.`,
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found or invalid identifier: ${err.value}`,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
