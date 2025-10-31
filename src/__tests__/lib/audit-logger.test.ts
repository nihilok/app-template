import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogger } from '@/lib/audit-logger';
import { AuditLogRepository } from '@/infrastructure/repositories/audit-log.repository';

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let mockRepository: AuditLogRepository;

  const actorId = 'actor-123';
  const entityId = 'entity-456';
  const entityType = 'user';

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: vi.fn(),
      findByEntity: vi.fn(),
      findByActor: vi.fn(),
      findByOperation: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
    } as unknown as AuditLogRepository;

    auditLogger = new AuditLogger(mockRepository);
  });

  describe('logCreate', () => {
    it('should create audit log with CREATE operation', async () => {
      const newValues = { id: entityId, name: 'Test Entity' };
      const metadata = { source: 'api', ip: '127.0.0.1' };

      const expectedLog = {
        id: 'log-123',
        operation: 'CREATE',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues,
        metadata,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      const result = await auditLogger.logCreate(
        entityType,
        entityId,
        actorId,
        newValues,
        metadata
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'CREATE',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues,
        metadata,
      });
      expect(result).toEqual(expectedLog);
    });

    it('should create audit log without metadata', async () => {
      const newValues = { id: entityId, name: 'Test Entity' };

      const expectedLog = {
        id: 'log-123',
        operation: 'CREATE',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues,
        metadata: null,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      await auditLogger.logCreate(entityType, entityId, actorId, newValues);

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'CREATE',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues,
        metadata: null,
      });
    });
  });

  describe('logUpdate', () => {
    it('should create audit log with UPDATE operation', async () => {
      const oldValues = { id: entityId, name: 'Old Name' };
      const newValues = { id: entityId, name: 'New Name' };
      const metadata = { source: 'api' };

      const expectedLog = {
        id: 'log-123',
        operation: 'UPDATE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues,
        metadata,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      const result = await auditLogger.logUpdate(
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues,
        metadata
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'UPDATE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues,
        metadata,
      });
      expect(result).toEqual(expectedLog);
    });
  });

  describe('logDelete', () => {
    it('should create audit log with DELETE operation', async () => {
      const oldValues = { id: entityId, name: 'Test Entity' };
      const metadata = { source: 'api' };

      const expectedLog = {
        id: 'log-123',
        operation: 'DELETE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues: null,
        metadata,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      const result = await auditLogger.logDelete(
        entityType,
        entityId,
        actorId,
        oldValues,
        metadata
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'DELETE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues: null,
        metadata,
      });
      expect(result).toEqual(expectedLog);
    });
  });

  describe('logRestore', () => {
    it('should create audit log with RESTORE operation', async () => {
      const newValues = { id: entityId, name: 'Test Entity', deletedAt: null };
      const metadata = { source: 'api' };

      const expectedLog = {
        id: 'log-123',
        operation: 'RESTORE',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues,
        metadata,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      const result = await auditLogger.logRestore(
        entityType,
        entityId,
        actorId,
        newValues,
        metadata
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'RESTORE',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues,
        metadata,
      });
      expect(result).toEqual(expectedLog);
    });
  });

  describe('logRead', () => {
    it('should create audit log with READ operation', async () => {
      const metadata = { source: 'api', sensitive: true };

      const expectedLog = {
        id: 'log-123',
        operation: 'READ',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues: null,
        metadata,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      const result = await auditLogger.logRead(
        entityType,
        entityId,
        actorId,
        metadata
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'READ',
        entityType,
        entityId,
        actorId,
        oldValues: null,
        newValues: null,
        metadata,
      });
      expect(result).toEqual(expectedLog);
    });
  });

  describe('log', () => {
    it('should handle generic log operation', async () => {
      const oldValues = { id: entityId, status: 'pending' };
      const newValues = { id: entityId, status: 'completed' };
      const metadata = { reason: 'manual approval' };

      const expectedLog = {
        id: 'log-123',
        operation: 'UPDATE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues,
        metadata,
        timestamp: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedLog);

      const result = await auditLogger.log({
        operation: 'UPDATE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues,
        metadata,
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        operation: 'UPDATE',
        entityType,
        entityId,
        actorId,
        oldValues,
        newValues,
        metadata,
      });
      expect(result).toEqual(expectedLog);
    });
  });
});
