import { findAll, findById } from '../repositories/users.repository.js';
import { unauthorized } from '../utils/errors.js';

export const listUsersService = async () => {
  const users = await findAll();
  return users;
};

export const getCurrentUserService = async (userId) => {
  const user = await findById(userId);
  if (!user) {
    throw unauthorized('No autenticado');
  }
  return user;
};
