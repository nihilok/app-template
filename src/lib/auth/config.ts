import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/infrastructure/database/client';

const secret = process.env.BETTER_AUTH_SECRET || 'development-secret-key-min-32-chars-long-please-change';

// Validate secret in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required in production');
  }
  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long in production');
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
  secret,
});
