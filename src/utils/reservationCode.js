import crypto from 'crypto';

// Sin 0/O/1/I para evitar ambigüedad visual
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export const generateReservationCode = () => {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return `EVT-${code}`;
};
