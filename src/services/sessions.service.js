import { findByEmail, create } from '../repositories/users.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

const MIN_PASSWORD_LENGTH = 8;

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const unauthorized = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const conflict = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

export const registerUserService = async ({ first_name, last_name, email, password }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  if (!first_name || !last_name || !normalizedEmail || !password) {
    throw badRequest('Faltan campos obligatorios');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw badRequest('Formato de email inválido');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  const existingUser = await findByEmail(normalizedEmail);
  if (existingUser) {
    throw conflict('El email ya está registrado');
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await create({
    first_name,
    last_name,
    email: normalizedEmail,
    password: hashedPassword,
  });

  return newUser;
};

export const loginUserService = async ({ email, password }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  if (!normalizedEmail || !password) {
    throw unauthorized('Credenciales inválidas');
  }

  const user = await findByEmail(normalizedEmail);

  if (!user || !(await comparePassword(password, user.password))) {
    throw unauthorized('Credenciales inválidas');
  }

  return user;
};
