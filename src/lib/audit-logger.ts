import { AuditLogRepository } from '@/infrastructure/repositories/audit-log.repository';
import { NewAuditLog } from '@/infrastructure/database/schema/audit-logs';

/**
 * Operation types for audit logging
 */
export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'READ';

/**
 * AuditLogger
 * 
 * Service for creating audit log entries.
 * Used by controllers to log all database operations.
 * 
 * Key features:
 * - Records what changed (old vs new values)
 * - Records who made the change (actorId)
 * - Records when it happened (timestamp)
 * - Records context (metadata)
 * 
 * All logs are immutable and can be used to:
 * - Track changes over time
 * - Debug issues
 * - Comply with regulations
 * - Reverse operations if needed
 */
export class AuditLogger {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Log a database operation
   * 
   * @param params - Audit log parameters
   * @returns Created audit log entry
   * @throws Error if entityType or entityId are empty
   */
  async log(params: {
    operation: AuditOperation;
    entityType: string;
    entityId: string;
    actorId: string;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }) {
    // Validate required parameters
    if (!params.entityType || params.entityType.trim() === '') {
      throw new Error('entityType cannot be empty');
    }
    if (!params.entityId || params.entityId.trim() === '') {
      throw new Error('entityId cannot be empty');
    }
    if (!params.actorId || params.actorId.trim() === '') {
      throw new Error('actorId cannot be empty');
    }

    const auditLogData: NewAuditLog = {
      operation: params.operation,
      entityType: params.entityType.trim(),
      entityId: params.entityId.trim(),
      actorId: params.actorId.trim(),
      oldValues: params.oldValues ?? null,
      newValues: params.newValues ?? null,
      metadata: params.metadata ?? null,
    };

    return await this.auditLogRepository.create(auditLogData);
  }

  /**
   * Log a CREATE operation
   * 
   * @param entityType - Type of entity created
   * @param entityId - ID of created entity
   * @param actorId - ID of user who created the entity
   * @param newValues - The created entity values
   * @param metadata - Additional context
   */
  async logCreate(
    entityType: string,
    entityId: string,
    actorId: string,
    newValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      operation: 'CREATE',
      entityType,
      entityId,
      actorId,
      oldValues: null,
      newValues,
      metadata,
    });
  }

  /**
   * Log an UPDATE operation
   * 
   * @param entityType - Type of entity updated
   * @param entityId - ID of updated entity
   * @param actorId - ID of user who updated the entity
   * @param oldValues - The previous entity values
   * @param newValues - The new entity values
   * @param metadata - Additional context
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    actorId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      operation: 'UPDATE',
      entityType,
      entityId,
      actorId,
      oldValues,
      newValues,
      metadata,
    });
  }

  /**
   * Log a DELETE operation (soft delete)
   * 
   * @param entityType - Type of entity deleted
   * @param entityId - ID of deleted entity
   * @param actorId - ID of user who deleted the entity
   * @param oldValues - The entity values before deletion
   * @param metadata - Additional context
   */
  async logDelete(
    entityType: string,
    entityId: string,
    actorId: string,
    oldValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      operation: 'DELETE',
      entityType,
      entityId,
      actorId,
      oldValues,
      newValues: null,
      metadata,
    });
  }

  /**
   * Log a RESTORE operation (restore soft deleted entity)
   * 
   * @param entityType - Type of entity restored
   * @param entityId - ID of restored entity
   * @param actorId - ID of user who restored the entity
   * @param newValues - The restored entity values
   * @param metadata - Additional context
   */
  async logRestore(
    entityType: string,
    entityId: string,
    actorId: string,
    newValues: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      operation: 'RESTORE',
      entityType,
      entityId,
      actorId,
      oldValues: null,
      newValues,
      metadata,
    });
  }

  /**
   * Log a READ operation (for sensitive data access)
   * 
   * Note: Only log READ operations for sensitive data to avoid log bloat.
   * Most read operations should not be logged.
   * 
   * @param entityType - Type of entity read
   * @param entityId - ID of read entity
   * @param actorId - ID of user who read the entity
   * @param metadata - Additional context
   */
  async logRead(
    entityType: string,
    entityId: string,
    actorId: string,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      operation: 'READ',
      entityType,
      entityId,
      actorId,
      oldValues: null,
      newValues: null,
      metadata,
    });
  }
}
