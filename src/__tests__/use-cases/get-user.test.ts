import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

describe('GetUserUseCase', () => {
  let getUserUseCase: GetUserUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
    } as unknown as UserRepository;

    getUserUseCase = new GetUserUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should return user by id', async () => {
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

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

      const result = await getUserUseCase.execute('123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return null if user not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await getUserUseCase.execute('non-existent-id');

      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
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

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);

      const result = await getUserUseCase.getByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null if user with email not found', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const result = await getUserUseCase.getByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });
  });
});
