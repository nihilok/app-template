import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from '@/controllers/user.controller';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '@/use-cases/user/delete-user.use-case';
import { PermissionChecker } from '@/lib/permissions';

describe('UserController', () => {
  let controller: UserController;
  let mockUserRepository: UserRepository;
  let mockCreateUserUseCase: CreateUserUseCase;
  let mockGetUserUseCase: GetUserUseCase;
  let mockUpdateUserUseCase: UpdateUserUseCase;
  let mockDeleteUserUseCase: DeleteUserUseCase;
  let mockPermissionChecker: PermissionChecker;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const actorId = 'actor-123';

  beforeEach(() => {
    // Create mock instances with vi.fn() methods
    mockUserRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
    } as unknown as UserRepository;

    mockCreateUserUseCase = {
      execute: vi.fn(),
    } as unknown as CreateUserUseCase;

    mockGetUserUseCase = {
      execute: vi.fn(),
      getByEmail: vi.fn(),
    } as unknown as GetUserUseCase;

    mockUpdateUserUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateUserUseCase;

    mockDeleteUserUseCase = {
      execute: vi.fn(),
    } as unknown as DeleteUserUseCase;

    mockPermissionChecker = {
      check: vi.fn(),
      require: vi.fn(),
      checkMultiple: vi.fn(),
      getUserPermissions: vi.fn(),
      hasAll: vi.fn(),
      hasAny: vi.fn(),
    } as unknown as PermissionChecker;

    // Inject mocks via constructor
    controller = new UserController(
      mockUserRepository,
      mockCreateUserUseCase,
      mockGetUserUseCase,
      mockUpdateUserUseCase,
      mockDeleteUserUseCase,
      mockPermissionChecker
    );
  });

  describe('createUser', () => {
    it('should check permission and delegate to CreateUserUseCase', async () => {
      const input = {
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockCreateUserUseCase.execute).mockResolvedValue(mockUser);

      const result = await controller.createUser(actorId, input);

      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'write'
      );
      expect(result).toEqual(mockUser);
      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(input);
    });

    it('should throw Forbidden error when actor lacks permission', async () => {
      const input = {
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(mockPermissionChecker.require).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(controller.createUser(actorId, input)).rejects.toThrow(
        'Forbidden'
      );
      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'write'
      );
      expect(mockCreateUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should check permission and retrieve all users from repository', async () => {
      const users = [mockUser];
      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockUserRepository.findAll).mockResolvedValue(users);

      const result = await controller.getAllUsers(actorId);

      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'read'
      );
      expect(result).toEqual(users);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });

    it('should throw Forbidden error when actor lacks permission', async () => {
      vi.mocked(mockPermissionChecker.require).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(controller.getAllUsers(actorId)).rejects.toThrow(
        'Forbidden'
      );
      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should check permission and delegate to GetUserUseCase', async () => {
      const userId = '123';
      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockGetUserUseCase.execute).mockResolvedValue(mockUser);

      const result = await controller.getUserById(actorId, userId);

      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'read'
      );
      expect(result).toEqual(mockUser);
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent';
      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockGetUserUseCase.execute).mockResolvedValue(null);

      const result = await controller.getUserById(actorId, userId);

      expect(result).toBeNull();
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('should throw Forbidden error when actor lacks permission', async () => {
      vi.mocked(mockPermissionChecker.require).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(
        controller.getUserById(actorId, '123')
      ).rejects.toThrow('Forbidden');
      expect(mockGetUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('should check permission and delegate to GetUserUseCase', async () => {
      const email = 'test@example.com';
      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockGetUserUseCase.getByEmail).mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail(actorId, email);

      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'read'
      );
      expect(result).toEqual(mockUser);
      expect(mockGetUserUseCase.getByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw Forbidden error when actor lacks permission', async () => {
      vi.mocked(mockPermissionChecker.require).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(
        controller.getUserByEmail(actorId, 'test@example.com')
      ).rejects.toThrow('Forbidden');
      expect(mockGetUserUseCase.getByEmail).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should check permission and delegate to UpdateUserUseCase', async () => {
      const userId = '123';
      const input = {
        name: 'Updated Name',
      };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockUpdateUserUseCase.execute).mockResolvedValue(updatedUser);

      const result = await controller.updateUser(actorId, userId, input);

      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'write'
      );
      expect(result).toEqual(updatedUser);
      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith(userId, input);
    });

    it('should throw Forbidden error when actor lacks permission', async () => {
      const userId = '123';
      const input = { name: 'Updated Name' };

      vi.mocked(mockPermissionChecker.require).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(
        controller.updateUser(actorId, userId, input)
      ).rejects.toThrow('Forbidden');
      expect(mockUpdateUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should check permission and delegate to DeleteUserUseCase', async () => {
      const userId = '123';
      const deletedUser = { ...mockUser, deletedAt: new Date() };

      vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);
      vi.mocked(mockDeleteUserUseCase.execute).mockResolvedValue(deletedUser);

      const result = await controller.deleteUser(actorId, userId);

      expect(mockPermissionChecker.require).toHaveBeenCalledWith(
        actorId,
        'users',
        'delete'
      );
      expect(result).toEqual(deletedUser);
      expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('should throw Forbidden error when actor lacks permission', async () => {
      const userId = '123';

      vi.mocked(mockPermissionChecker.require).mockRejectedValue(
        new Error('Forbidden')
      );

      await expect(
        controller.deleteUser(actorId, userId)
      ).rejects.toThrow('Forbidden');
      expect(mockDeleteUserUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
