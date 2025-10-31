import { eq, and, desc } from 'drizzle-orm';
import { auditLogs, AuditLog, NewAuditLog } from '../database/schema/audit-logs';
import { Database } from '../database/client';
import { AuditOperation } from '@/lib/audit-logger';

/**
 * AuditLogRepository
 * 
 * Handles data access for audit logs.
 * Note: Audit logs do NOT extend BaseRepository because:
 * - They should never be updated or deleted (immutable records)
 * - They don't have soft delete functionality
 * - They have different query patterns (time-based, entity-based)
 */
export class AuditLogRepository {
  constructor(protected readonly db: Database) {}

  /**
   * Create a new audit log entry
   * 
   * @param data - Audit log data
   * @returns Created audit log
   */
  async create(data: NewAuditLog): Promise<AuditLog> {
    const result = await this.db
      .insert(auditLogs)
      .values(data)
      .returning();
    
    return result[0];
  }

  /**
   * Get audit logs for a specific entity
   * 
   * @param entityType - Type of entity (e.g., 'user', 'role')
   * @param entityId - ID of the entity
   * @returns Array of audit logs for the entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await this.db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.timestamp));
  }

  /**
   * Get audit logs for a specific actor
   * 
   * @param actorId - ID of the actor who performed actions
   * @returns Array of audit logs created by the actor
   */
  async findByActor(actorId: string): Promise<AuditLog[]> {
    return await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actorId, actorId))
      .orderBy(desc(auditLogs.timestamp));
  }

  /**
   * Get audit logs by operation type
   * 
   * @param operation - Operation type (e.g., 'CREATE', 'UPDATE', 'DELETE')
   * @returns Array of audit logs for the operation
   */
  async findByOperation(operation: AuditOperation): Promise<AuditLog[]> {
    return await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.operation, operation))
      .orderBy(desc(auditLogs.timestamp));
  }

  /**
   * Get all audit logs (with pagination)
   * 
   * @param limit - Maximum number of logs to return (default: 100, max: 1000)
   * @param offset - Number of logs to skip (default: 0)
   * @returns Array of audit logs
   */
  async findAll(limit = 100, offset = 0): Promise<AuditLog[]> {
    // Validate and clamp limit and offset
    const MAX_LIMIT = 1000;
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, MAX_LIMIT));
    const safeOffset = Math.max(0, Number(offset) || 0);

    return await this.db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(safeLimit)
      .offset(safeOffset);
  }

  /**
   * Get audit log by ID
   * 
   * @param id - Audit log ID
   * @returns Audit log or null if not found
   */
  async findById(id: string): Promise<AuditLog | null> {
    const results = await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);
    
    return results[0] || null;
  }
}
