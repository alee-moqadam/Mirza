const ApiError = require('../utils/ApiError')

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Route not found'))
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500

  res.status(statusCode).json({
    error: {
      message: error.message || 'Internal server error',
      statusCode,
    },
  })
}

module.exports = {
  notFoundHandler,
  errorHandler,
}
