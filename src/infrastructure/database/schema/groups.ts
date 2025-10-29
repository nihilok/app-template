import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
