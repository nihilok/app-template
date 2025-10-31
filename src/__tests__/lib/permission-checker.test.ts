import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionChecker } from '@/lib/permissions/permission-checker';
import { CheckPermissionUseCase } from '@/use-cases/permission/check-permission.use-case';
import { PermissionRepository } from '@/infrastructure/repositories/permission.repository';
import { Permission } from '@/infrastructure/database/schema/permissions';

describe('PermissionChecker', () => {
  let permissionChecker: PermissionChecker;
  let mockPermissionRepository: PermissionRepository;
  let mockCheckPermissionUseCase: CheckPermissionUseCase;

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
  ];

  beforeEach(() => {
    mockPermissionRepository = {} as PermissionRepository;

    mockCheckPermissionUseCase = {
      execute: vi.fn(),
      getUserPermissions: vi.fn(),
      checkMultiple: vi.fn(),
    } as unknown as CheckPermissionUseCase;

    permissionChecker = new PermissionChecker(
      mockPermissionRepository,
      mockCheckPermissionUseCase
    );
  });

  describe('check', () => {
    it('should return true when user has permission', async () => {
      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(true);

      const result = await permissionChecker.check('user-123', 'users', 'read');

      expect(result).toBe(true);
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith(
        'user-123',
        'users',
        'read'
      );
    });

    it('should return false when user does not have permission', async () => {
      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(false);

      const result = await permissionChecker.check(
        'user-123',
        'users',
        'write'
      );

      expect(result).toBe(false);
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledWith(
        'user-123',
        'users',
        'write'
      );
    });

    it('should return false and log error when an exception occurs', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(mockCheckPermissionUseCase.execute).mockRejectedValue(
        new Error('Database error')
      );

      const result = await permissionChecker.check('user-123', 'users', 'read');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Permission check error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('require', () => {
    it('should not throw when user has permission', async () => {
      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(true);

      await expect(
        permissionChecker.require('user-123', 'users', 'read')
      ).resolves.not.toThrow();
    });

    it('should throw Forbidden error when user does not have permission', async () => {
      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(false);

      await expect(
        permissionChecker.require('user-123', 'users', 'write')
      ).rejects.toThrow('Forbidden');
    });

    it('should throw generic Forbidden error without details', async () => {
      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(false);

      try {
        await permissionChecker.require('user-123', 'users', 'write');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Forbidden');
        // Verify no information leakage about resource, action, or user
        expect((error as Error).message).not.toContain('user');
        expect((error as Error).message).not.toContain('write');
      }
    });
  });

  describe('checkMultiple', () => {
    it('should check multiple permissions at once', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];
      const mockResults = {
        'users:read': true,
        'users:write': false,
      };

      vi.mocked(mockCheckPermissionUseCase.checkMultiple).mockResolvedValue(
        mockResults
      );

      const result = await permissionChecker.checkMultiple('user-123', checks);

      expect(result).toEqual(mockResults);
      expect(mockCheckPermissionUseCase.checkMultiple).toHaveBeenCalledWith(
        'user-123',
        checks
      );
    });

    it('should return false for all checks on error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];

      vi.mocked(mockCheckPermissionUseCase.checkMultiple).mockRejectedValue(
        new Error('Database error')
      );

      const result = await permissionChecker.checkMultiple('user-123', checks);

      expect(result).toEqual({
        'users:read': false,
        'users:write': false,
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getUserPermissions', () => {
    it('should return all user permissions', async () => {
      vi.mocked(
        mockCheckPermissionUseCase.getUserPermissions
      ).mockResolvedValue(mockPermissions);

      const result = await permissionChecker.getUserPermissions('user-123');

      expect(result).toEqual(mockPermissions);
      expect(
        mockCheckPermissionUseCase.getUserPermissions
      ).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array on error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(
        mockCheckPermissionUseCase.getUserPermissions
      ).mockRejectedValue(new Error('Database error'));

      const result = await permissionChecker.getUserPermissions('user-123');

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('hasAll', () => {
    it('should return true when user has all permissions', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];
      const mockResults = {
        'users:read': true,
        'users:write': true,
      };

      vi.mocked(mockCheckPermissionUseCase.checkMultiple).mockResolvedValue(
        mockResults
      );

      const result = await permissionChecker.hasAll('user-123', checks);

      expect(result).toBe(true);
    });

    it('should return false when user lacks any permission', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];
      const mockResults = {
        'users:read': true,
        'users:write': false,
      };

      vi.mocked(mockCheckPermissionUseCase.checkMultiple).mockResolvedValue(
        mockResults
      );

      const result = await permissionChecker.hasAll('user-123', checks);

      expect(result).toBe(false);
    });

    it('should return false for empty checks array', async () => {
      const result = await permissionChecker.hasAll('user-123', []);

      expect(result).toBe(false);
      // Should not call checkMultiple for empty array
      expect(mockCheckPermissionUseCase.checkMultiple).not.toHaveBeenCalled();
    });
  });

  describe('hasAny', () => {
    it('should return true when user has at least one permission', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];
      const mockResults = {
        'users:read': true,
        'users:write': false,
      };

      vi.mocked(mockCheckPermissionUseCase.checkMultiple).mockResolvedValue(
        mockResults
      );

      const result = await permissionChecker.hasAny('user-123', checks);

      expect(result).toBe(true);
    });

    it('should return false when user has no permissions', async () => {
      const checks = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ];
      const mockResults = {
        'users:read': false,
        'users:write': false,
      };

      vi.mocked(mockCheckPermissionUseCase.checkMultiple).mockResolvedValue(
        mockResults
      );

      const result = await permissionChecker.hasAny('user-123', checks);

      expect(result).toBe(false);
    });

    it('should return false for empty checks array', async () => {
      const result = await permissionChecker.hasAny('user-123', []);

      expect(result).toBe(false);
      // Should not call checkMultiple for empty array
      expect(mockCheckPermissionUseCase.checkMultiple).not.toHaveBeenCalled();
    });
  });

  describe('Security considerations', () => {
    it('should always call the permission check regardless of result', async () => {
      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(true);

      await permissionChecker.check('user-123', 'users', 'read');
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledTimes(1);

      vi.mocked(mockCheckPermissionUseCase.execute).mockResolvedValue(false);

      await permissionChecker.check('user-123', 'users', 'write');
      expect(mockCheckPermissionUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should not reveal error details in require method', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(mockCheckPermissionUseCase.execute).mockRejectedValue(
        new Error('User not found in database')
      );

      await expect(
        permissionChecker.require('user-123', 'users', 'read')
      ).rejects.toThrow('Forbidden');

      // Verify that check() caught the error and logged it internally
      // require() then throws 'Forbidden' based on check() returning false
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Permission check error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
