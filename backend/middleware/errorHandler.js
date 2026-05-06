// Global Express error handler — must have 4 params to be recognised by Express

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${err.message}`);
  res.status(status).json({ success: false, error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
