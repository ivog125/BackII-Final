export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const badRequest = (message) => new AppError(message, 400);
export const unauthorized = (message) => new AppError(message, 401);
export const forbidden = (message) => new AppError(message, 403);
export const notFound = (message) => new AppError(message, 404);
export const conflict = (message) => new AppError(message, 409);
