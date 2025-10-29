import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { groups } from './groups';

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
