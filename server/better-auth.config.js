import { betterAuth } from 'better-auth';
import { getPool } from './db/pool.js';

export const auth = betterAuth({
  database: getPool(),
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:5173'],
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' }
});
export default auth;
