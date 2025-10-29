# Database Schema

This directory contains all Drizzle ORM schema definitions for the application.

## Schema Files

### users.ts

Defines the user entity with authentication-related fields:

- `id` - UUID primary key
- `email` - Unique email address
- `name` - User's display name (optional)
- `emailVerified` - Email verification status
- `image` - Profile image URL (optional)
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp
- `deletedAt` - Soft delete timestamp (nullable)

### sessions.ts

Manages user sessions for Better Auth:

- `id` - UUID primary key
- `userId` - Foreign key to users table
- `token` - Unique session token
- `expiresAt` - Session expiration timestamp
- `ipAddress` - Client IP address
- `userAgent` - Client user agent string
- `createdAt` - Session creation timestamp
- `updatedAt` - Last update timestamp

### accounts.ts

Stores authentication provider accounts:

- `id` - UUID primary key
- `userId` - Foreign key to users table
- `accountId` - Provider-specific account ID
- `providerId` - Authentication provider identifier
- `accessToken` - OAuth access token
- `refreshToken` - OAuth refresh token
- `idToken` - OAuth ID token
- `expiresAt` - Token expiration timestamp
- `password` - Hashed password (for email/password auth)
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp

### verification-tokens.ts

Manages email verification and password reset tokens:

- `id` - UUID primary key
- `identifier` - User identifier (email)
- `token` - Unique verification token
- `expiresAt` - Token expiration timestamp
- `createdAt` - Token creation timestamp

## Schema Conventions

### Timestamps

All tables should include these standard timestamp fields:

```typescript
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull(),
deletedAt: timestamp('deleted_at'), // For soft-delete support
```

### Primary Keys

Use UUIDs for primary keys:

```typescript
id: uuid('id').defaultRandom().primaryKey()
```

### Foreign Keys

Define foreign key relationships with cascade delete:

```typescript
userId: uuid('user_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' })
```

### Naming Conventions

- Table names: lowercase, plural (e.g., `users`, `roles`, `permissions`)
- Column names: snake_case (e.g., `created_at`, `email_verified`)
- TypeScript types: PascalCase (e.g., `User`, `Session`)

## Adding New Tables

1. Create a new schema file in this directory
2. Define the table using Drizzle's `pgTable`
3. Include standard timestamps and soft-delete field
4. Export the table and infer types
5. Add export to `index.ts`
6. Generate migration with `npm run db:generate`

Example - RBAC Role Schema:

```typescript
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
```
