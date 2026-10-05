import mongoose from 'mongoose';
import User from '../models/User.js';

export const findUserByEmail = (email) => User.findOne({ email });

export const createUser = (userData) => User.create(userData);

export const findAllUsers = () => User.find({}, '-password');

export const findUserById = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Promise.resolve(null);
  }
  return User.findById(id);
};

export const deleteAllUsers = () => User.deleteMany({});
