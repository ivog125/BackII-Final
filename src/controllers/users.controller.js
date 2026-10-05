import { listUsersService } from '../services/users.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { UserDTO } from '../dto/user.dto.js';

export const getUsers = catchAsync(async (req, res) => {
  const users = await listUsersService();
  res.status(200).json({ status: 'success', payload: users.map(UserDTO) });
});
