export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (!err.statusCode) {
    console.error(err);
  }

  res.status(statusCode).json({ status: 'error', message: err.statusCode ? err.message : 'Error interno del servidor' });
};
