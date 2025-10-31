import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from '@/controllers/user.controller';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '@/use-cases/user/delete-user.use-case';

describe('UserController', () => {
  let controller: UserController;
  let mockUserRepository: UserRepository;
  let mockCreateUserUseCase: CreateUserUseCase;
  let mockGetUserUseCase: GetUserUseCase;
  let mockUpdateUserUseCase: UpdateUserUseCase;
  let mockDeleteUserUseCase: DeleteUserUseCase;

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

    // Inject mocks via constructor
    controller = new UserController(
      mockUserRepository,
      mockCreateUserUseCase,
      mockGetUserUseCase,
      mockUpdateUserUseCase,
      mockDeleteUserUseCase
    );
  });

  describe('createUser', () => {
    it('should delegate to CreateUserUseCase', async () => {
      const input = {
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(mockCreateUserUseCase.execute).mockResolvedValue(mockUser);

      const result = await controller.createUser(input);

      expect(result).toEqual(mockUser);
      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(input);
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users from repository', async () => {
      const users = [mockUser];
      vi.mocked(mockUserRepository.findAll).mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(result).toEqual(users);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should delegate to GetUserUseCase', async () => {
      const userId = '123';
      vi.mocked(mockGetUserUseCase.execute).mockResolvedValue(mockUser);

      const result = await controller.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent';
      vi.mocked(mockGetUserUseCase.execute).mockResolvedValue(null);

      const result = await controller.getUserById(userId);

      expect(result).toBeNull();
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByEmail', () => {
    it('should delegate to GetUserUseCase', async () => {
      const email = 'test@example.com';
      vi.mocked(mockGetUserUseCase.getByEmail).mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockGetUserUseCase.getByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('updateUser', () => {
    it('should delegate to UpdateUserUseCase', async () => {
      const userId = '123';
      const input = {
        name: 'Updated Name',
      };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      vi.mocked(mockUpdateUserUseCase.execute).mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, input);

      expect(result).toEqual(updatedUser);
      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith(userId, input);
    });
  });

  describe('deleteUser', () => {
    it('should delegate to DeleteUserUseCase', async () => {
      const userId = '123';
      const deletedUser = { ...mockUser, deletedAt: new Date() };

      vi.mocked(mockDeleteUserUseCase.execute).mockResolvedValue(deletedUser);

      const result = await controller.deleteUser(userId);

      expect(result).toEqual(deletedUser);
      expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith(userId);
    });
  });
});
