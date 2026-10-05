import { generateToken, decodeToken } from '../utils/jwt.js';
import { config } from '../config/config.js';
import { catchAsync } from '../utils/catchAsync.js';
import { UserDTO } from '../dto/user.dto.js';
import { getCurrentUserService } from '../services/users.service.js';

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
});

export const register = catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', payload: UserDTO(req.user) });
});

export const login = catchAsync(async (req, res) => {
  const token = generateToken({ id: req.user._id, email: req.user.email, role: req.user.role });
  const { exp } = decodeToken(token);

  res.cookie('currentUser', token, {
    ...cookieOptions(),
    expires: new Date(exp * 1000),
  });

  res.status(200).json({ status: 'success', message: 'Login correcto' });
});

export const current = catchAsync(async (req, res) => {
  const user = await getCurrentUserService(req.user.id);
  res.status(200).json({ status: 'success', payload: UserDTO(user) });
});

export const logout = catchAsync(async (req, res) => {
  res.clearCookie('currentUser', cookieOptions());

  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
});
