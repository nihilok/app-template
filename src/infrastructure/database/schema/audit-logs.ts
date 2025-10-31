import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Audit Logs Table
 * 
 * Tracks all database operations for compliance and debugging purposes.
 * Each log entry includes:
 * - What action was performed (operation)
 * - Which entity was affected (entityType, entityId)
 * - Who performed the action (actorId)
 * - When it happened (timestamp)
 * - What changed (oldValues, newValues)
 * - Request context (metadata)
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // What action was performed
  operation: text('operation').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
  
  // Which entity was affected
  entityType: text('entity_type').notNull(), // 'user', 'role', 'permission', etc.
  entityId: text('entity_id').notNull(), // ID of the affected entity
  
  // Who performed the action
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // What changed - stored as JSONB for flexibility
  oldValues: jsonb('old_values'), // Previous state (null for CREATE)
  newValues: jsonb('new_values'), // New state (null for DELETE)
  
  // Additional context
  metadata: jsonb('metadata'), // Request context, IP, user agent, etc.
  
  // When it happened
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
