import { generateToken } from '../utils/jwt.js';
import { config } from '../config/config.js';
import { catchAsync } from '../utils/catchAsync.js';
import { UserDTO } from '../dto/user.dto.js';

export const getSessions = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    payload: [],
  });
});

export const register = catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', payload: UserDTO(req.user) });
});

export const login = catchAsync(async (req, res) => {
  const token = generateToken({ id: req.user._id, email: req.user.email, role: req.user.role });

  res.cookie('currentUser', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 3600000,
    secure: config.nodeEnv === 'production',
  });

  res.status(200).json({ status: 'success', message: 'Login correcto' });
});

export const current = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', payload: UserDTO(req.user) });
});

export const logout = catchAsync(async (req, res) => {
  res.clearCookie('currentUser');

  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
});
