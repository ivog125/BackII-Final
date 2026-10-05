import * as usersDao from '../dao/users.dao.js';

export const findByEmail = (email) => usersDao.findUserByEmail(email);

export const create = (userData) => usersDao.createUser(userData);

export const findAll = () => usersDao.findAllUsers();

export const findById = (id) => usersDao.findUserById(id);

export const deleteAll = () => usersDao.deleteAllUsers();
