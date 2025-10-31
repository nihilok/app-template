import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckPermissionUseCase } from '@/use-cases/permission/check-permission.use-case';
import { PermissionRepository } from '@/infrastructure/repositories/permission.repository';
import { Permission } from '@/infrastructure/database/schema/permissions';

describe('CheckPermissionUseCase', () => {
  let useCase: CheckPermissionUseCase;
  let mockPermissionRepository: PermissionRepository;

  const mockPermissions: Permission[] = [
    {
      id: 'perm-1',
      name: 'users:read',
      resource: 'users',
      action: 'read',
      description: 'Read users',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'perm-2',
      name: 'users:write',
      resource: 'users',
      action: 'write',
      description: 'Write users',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'perm-3',
      name: 'reports:read',
      resource: 'reports',
      action: 'read',
      description: 'Read reports',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    mockPermissionRepository = {
      getUserPermissions: vi.fn(),
    } as unknown as PermissionRepository;

    useCase = new CheckPermissionUseCase(mockPermissionRepository);
  });

  describe('execute', () => {
    it('should return true when user has the required permission', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        mockPermissions
      );

      const result = await useCase.execute(userId, 'users', 'read');

      expect(result).toBe(true);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(
        userId
      );
    });

    it('should return false when user does not have the required permission', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        mockPermissions
      );

      const result = await useCase.execute(userId, 'users', 'delete');

      expect(result).toBe(false);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(
        userId
      );
    });

    it('should return false when user has no permissions', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        []
      );

      const result = await useCase.execute(userId, 'users', 'read');

      expect(result).toBe(false);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(
        userId
      );
    });

    it('should match exact resource and action combination', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        mockPermissions
      );

      // Has users:read but not reports:write
      expect(await useCase.execute(userId, 'users', 'read')).toBe(true);
      expect(await useCase.execute(userId, 'reports', 'read')).toBe(true);
      expect(await useCase.execute(userId, 'reports', 'write')).toBe(false);
      expect(await useCase.execute(userId, 'users', 'admin')).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for a user', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        mockPermissions
      );

      const result = await useCase.getUserPermissions(userId);

      expect(result).toEqual(mockPermissions);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(
        userId
      );
    });

    it('should return empty array when user has no permissions', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        []
      );

      const result = await useCase.getUserPermissions(userId);

      expect(result).toEqual([]);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(
        userId
      );
    });
  });

  describe('checkMultiple', () => {
    it('should check multiple permissions at once', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        mockPermissions
      );

      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
        { resource: 'users', action: 'delete' },
        { resource: 'reports', action: 'read' },
      ];

      const result = await useCase.checkMultiple(userId, checks);

      expect(result).toEqual({
        'users:read': true,
        'users:write': true,
        'users:delete': false,
        'reports:read': true,
      });
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(
        userId
      );
    });

    it('should return all false when user has no permissions', async () => {
      const userId = 'user-123';
      vi.mocked(mockPermissionRepository.getUserPermissions).mockResolvedValue(
        []
      );

      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];

      const result = await useCase.checkMultiple(userId, checks);

      expect(result).toEqual({
        'users:read': false,
        'users:write': false,
      });
    });
  });
});
