import { betterAuth } from 'better-auth';
import { getPool } from './db/pool.js';

const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
if (!secret) throw new Error('Better Auth secret is not configured. Set BETTER_AUTH_SECRET or AUTH_SECRET in .env.');

export const auth = betterAuth({
  database: getPool(),
  trustedOrigins: [process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000'],
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000',
  secret,
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' }
});
export default auth;
