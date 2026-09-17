import crypto from 'crypto';

export const generateReservationCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();
