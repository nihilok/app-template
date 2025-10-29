import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { roles } from './roles';
import { permissions } from './permissions';

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
