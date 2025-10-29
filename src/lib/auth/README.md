# Authentication with Better Auth

This directory contains the Better Auth configuration for handling authentication in the application.

## Overview

Better Auth is a modern, type-safe authentication library that provides:

- Email/Password authentication
- OAuth providers (easily extensible)
- Session management
- Token handling
- Built-in security best practices

## Files

### config.ts

Server-side authentication configuration:

```typescript
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
  secret: process.env.BETTER_AUTH_SECRET,
});
```

### client.ts

Client-side authentication utilities:

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});
```

## Configuration

### Environment Variables

Required environment variables:

```bash
# Better Auth secret (min 32 characters)
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars-long

# Application URL
BETTER_AUTH_URL=http://localhost:3000

# For client-side
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Database Integration

Better Auth uses Drizzle adapter to integrate with the database. Required tables:

- `users` - User accounts
- `sessions` - Active sessions
- `accounts` - Provider-specific account data
- `verification_tokens` - Email verification and password reset tokens

These are defined in `src/infrastructure/database/schema/`.

## API Routes

The auth API routes are automatically handled by Better Auth:

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth/config';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### Available Endpoints

Better Auth automatically creates these endpoints:

- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out current user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

## Usage in Components

### Sign Up

```typescript
import { authClient } from '@/lib/auth/client';

async function handleSignUp(email: string, password: string, name: string) {
  try {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });
    
    if (result.error) {
      console.error('Sign up failed:', result.error);
      return;
    }
    
    console.log('User created:', result.data);
  } catch (error) {
    console.error('Sign up error:', error);
  }
}
```

### Sign In

```typescript
async function handleSignIn(email: string, password: string) {
  try {
    const result = await authClient.signIn.email({
      email,
      password,
    });
    
    if (result.error) {
      console.error('Sign in failed:', result.error);
      return;
    }
    
    console.log('Signed in:', result.data);
  } catch (error) {
    console.error('Sign in error:', error);
  }
}
```

### Sign Out

```typescript
async function handleSignOut() {
  try {
    await authClient.signOut();
    console.log('Signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}
```

### Get Session

```typescript
import { useSession } from 'better-auth/react';

function UserProfile() {
  const { data: session, isPending } = useSession();
  
  if (isPending) {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <div>Not signed in</div>;
  }
  
  return (
    <div>
      <p>Email: {session.user.email}</p>
      <p>Name: {session.user.name}</p>
    </div>
  );
}
```

## Server-Side Session Check

```typescript
import { auth } from '@/lib/auth/config';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // User is authenticated
  return NextResponse.json({ user: session.user });
}
```

## Adding OAuth Providers

To add OAuth providers (e.g., Google, GitHub):

1. Install the provider package:
```bash
npm install @better-auth/oauth
```

2. Update config.ts:
```typescript
import { betterAuth } from 'better-auth';
import { github, google } from '@better-auth/oauth';

export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

3. Add environment variables:
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Security Best Practices

1. **Secret Key**: Use a strong, random secret (min 32 characters)
2. **HTTPS**: Always use HTTPS in production
3. **Trusted Origins**: Configure correct trusted origins for CORS
4. **Environment Variables**: Never commit secrets to version control
5. **Session Duration**: Configure appropriate session expiration
6. **Password Requirements**: Enforce strong password policies

## Customization

Better Auth is highly customizable. See the [Better Auth documentation](https://better-auth.com) for:

- Custom session duration
- Password requirements
- Rate limiting
- Custom callbacks
- Email templates
- And more...
