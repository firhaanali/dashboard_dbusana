const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    success: false,
    error: 'Internal server error',
    message: err.message,
    statusCode: 500
  };

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error = {
          success: false,
          error: 'Duplicate entry',
          message: 'Data with this identifier already exists',
          statusCode: 409,
          details: err.meta
        };
        break;
      case 'P2025':
        error = {
          success: false,
          error: 'Record not found',
          message: 'The requested record was not found',
          statusCode: 404
        };
        break;
      case 'P2014':
        error = {
          success: false,
          error: 'Invalid relation',
          message: 'The change you are trying to make would violate the required relation',
          statusCode: 400
        };
        break;
      default:
        error = {
          success: false,
          error: 'Database error',
          message: 'A database error occurred',
          statusCode: 400,
          code: err.code
        };
    }
  }
  
  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = {
      success: false,
      error: 'Validation error',
      message: 'Invalid data provided',
      statusCode: 400
    };
  }

  // Joi validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    error = {
      success: false,
      error: 'Validation error',
      message: err.details ? err.details[0].message : err.message,
      statusCode: 400,
      details: err.details
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      error: 'File too large',
      message: 'File size exceeds the limit (10MB)',
      statusCode: 413
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      success: false,
      error: 'Too many files',
      message: 'Only one file is allowed per upload',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      success: false,
      error: 'Invalid file field',
      message: 'Unexpected field name for file upload',
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      error: 'Invalid token',
      message: 'Authentication token is invalid',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      error: 'Token expired',
      message: 'Authentication token has expired',
      statusCode: 401
    };
  }

  // Syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      statusCode: 400
    };
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error = {
      success: false,
      error: 'Invalid ID format',
      message: 'Invalid identifier format provided',
      statusCode: 400
    };
  }

  // Custom application errors
  if (err.statusCode) {
    error.statusCode = err.statusCode;
    error.error = err.error || error.error;
    error.message = err.message;
  }

  // Import/Excel specific errors
  if (err.code === 'EXCEL_PARSE_ERROR') {
    error = {
      success: false,
      error: 'Excel parsing error',
      message: err.message || 'Failed to parse Excel file',
      statusCode: 400,
      details: err.details
    };
  }

  if (err.code === 'CSV_PARSE_ERROR') {
    error = {
      success: false,
      error: 'CSV parsing error',
      message: err.message || 'Failed to parse CSV file',
      statusCode: 400,
      details: err.details
    };
  }

  // Remove sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete error.stack;
    if (error.statusCode === 500) {
      error.message = 'Something went wrong on our end';
    }
  } else {
    // Include stack trace in development
    error.stack = err.stack;
  }

  res.status(error.statusCode).json(error);
};

module.exports = errorHandler;