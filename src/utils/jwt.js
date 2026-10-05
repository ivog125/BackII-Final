import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const generateToken = (payload, expiresIn = config.jwtExpiresIn) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
