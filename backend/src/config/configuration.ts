import { cleanEnv, str, port } from 'envalid';

export function validateEnv() {
  return cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['localhost', 'development', 'production', 'test'], default: 'localhost' }),
    PORT: port({ default: 5500 }),
    BASE_URL: str({ default: 'localhost:5500' }),
    MONGO_URI: str({ default: 'mongodb://localhost:27017/taskflow' }),
    JWT_SECRET: str({ default: 'super-secret-key-change-in-production' }),
    JWT_REFRESH_SECRET: str({ default: 'refresh-secret-change-in-production' }),
    SMTP_USER: str({ default: '' }),
    SMTP_PASS: str({ default: '' }),
    GOOGLE_CLIENT_ID: str({ default: '' }),
    GOOGLE_CLIENT_SECRET: str({ default: '' }),
    GOOGLE_CALLBACK_URL: str({ default: '' }),
    FRONTEND_URL: str({ default: 'http://localhost:5173' }),
  });
}

export default () => {
  const env = validateEnv();

  const isProduction = env.NODE_ENV === 'production';
  const baseUrl = env.BASE_URL.startsWith('http') ? env.BASE_URL : `http://${env.BASE_URL}`;

  return {
    nodeEnv: env.NODE_ENV,
    isProduction,
    port: env.PORT,
    baseUrl,
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    smtp: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: env.GOOGLE_CALLBACK_URL || `${baseUrl}/auth/google/callback`,
    frontendUrl: env.FRONTEND_URL,
  };
};
