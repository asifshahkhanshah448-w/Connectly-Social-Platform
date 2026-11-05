export function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  // Malformed JSON request payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON request body.',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
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
      message: 'Resource not found or invalid identifier format.',
    });
  }

  // Default server error (never leak internal error details on 500 in production)
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const safeMessage =
    statusCode >= 500 && isProduction
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
}
