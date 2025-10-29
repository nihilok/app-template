import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
