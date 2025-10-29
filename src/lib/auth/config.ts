import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/infrastructure/database/client';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
  secret: process.env.BETTER_AUTH_SECRET || 'development-secret-key-min-32-chars-long-please-change',
});
