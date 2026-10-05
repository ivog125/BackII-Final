export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'JSON inválido' });
  }

  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join(', ');
    return res.status(400).json({ status: 'error', message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ status: 'error', message: 'Identificador inválido' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ status: 'error', message: 'Recurso duplicado' });
  }

  const statusCode = err.statusCode || 500;

  if (!err.statusCode) {
    console.error(err);
  }

  res.status(statusCode).json({ status: 'error', message: err.statusCode ? err.message : 'Error interno del servidor' });
};
