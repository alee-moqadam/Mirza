function authMiddleware(req, res, next) {
  req.user = null
  next()
}

module.exports = { authMiddleware }
