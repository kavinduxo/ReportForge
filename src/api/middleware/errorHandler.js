// ReportForge - Error Handler Middleware

const { logger } = require('../../app');

/**
 * Global error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('💥 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};