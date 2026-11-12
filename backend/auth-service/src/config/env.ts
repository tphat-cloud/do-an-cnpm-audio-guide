import dotenv from 'dotenv';

dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

const dbPort = Number(requiredEnv('DB_PORT'));
if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error('DB_PORT must be a valid TCP port');
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  db: {
    host: requiredEnv('DB_HOST'),
    port: dbPort,
    user: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    name: requiredEnv('DB_NAME'),
  },
  jwtSecret: process.env.JWT_SECRET || '',
};
