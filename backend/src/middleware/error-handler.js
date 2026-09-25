export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);
  res.status(status).json({ success: false, message: status < 500 || process.env.NODE_ENV !== 'production' ? (err.message || 'Request failed') : 'Internal server error' });
}
