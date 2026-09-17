import { listUsersService } from '../services/users.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getUsers = catchAsync(async (req, res) => {
  const users = await listUsersService();
  res.status(200).json({ status: 'success', payload: users });
});
