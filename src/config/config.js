import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
  mailFrom: process.env.MAIL_FROM,
};

export const validateConfig = () => {
  const missing = [];
  if (!config.mongoUrl) missing.push('MONGO_URL');
  if (!config.jwtSecret) missing.push('JWT_SECRET');

  if (missing.length) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  }
};

const MAIL_KEYS = ['mailHost', 'mailPort', 'mailUser', 'mailPass', 'mailFrom'];

export const warnIfMailConfigMissing = () => {
  const missing = MAIL_KEYS.filter((key) => !config[key]);
  if (missing.length) {
    console.warn(
      `[config] Variables de email incompletas (${missing.join(', ')}). La inscripción a eventos funcionará igual, pero el email de confirmación no se podrá enviar.`
    );
  }
};
