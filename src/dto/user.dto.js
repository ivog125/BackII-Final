export const UserDTO = (user) => {
  if (!user) return null;

  return {
    id: user.id ?? user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
  };
};
