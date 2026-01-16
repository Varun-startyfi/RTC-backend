/**
 * Not Found Middleware
 * Handle 404 errors for undefined routes
 */

const notFound = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
};

module.exports = notFound;

