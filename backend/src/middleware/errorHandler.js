class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: { message: 'Invalid token', code: 'INVALID_TOKEN', statusCode: 401 }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: { message: 'Token expired', code: 'TOKEN_EXPIRED', statusCode: 401 }
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      error: { message: 'Resource already exists', code: 'DUPLICATE_ENTRY', statusCode: 409 }
    });
  }

  if (err.name === 'ValidationError' || err.type === 'validation') {
    const messages = err.errors ? err.errors.map(e => e.msg) : [err.message];
    return res.status(400).json({
      error: { message: messages.join(', '), code: 'VALIDATION_ERROR', statusCode: 400 }
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code || 'APP_ERROR', statusCode: err.statusCode }
    });
  }

  console.error('Unexpected error:', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: { message, code: 'INTERNAL_ERROR', statusCode }
  });
};

module.exports = { AppError, errorHandler };
