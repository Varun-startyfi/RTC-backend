/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'Resource already exists';
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 400;
    message = 'Invalid reference';
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

