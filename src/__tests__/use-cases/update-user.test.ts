import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

describe('UpdateUserUseCase', () => {
  let updateUserUseCase: UpdateUserUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      updateUser: vi.fn(),
    } as unknown as UserRepository;

    updateUserUseCase = new UpdateUserUseCase(mockUserRepository);
  });

  it('should update user successfully', async () => {
    const existingUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const updateInput = {
      name: 'Updated Name',
      emailVerified: true,
    };

    const updatedUser = {
      ...existingUser,
      ...updateInput,
      updatedAt: new Date(),
    };

    vi.mocked(mockUserRepository.findById).mockResolvedValue(existingUser);
    vi.mocked(mockUserRepository.updateUser).mockResolvedValue(updatedUser);

    const result = await updateUserUseCase.execute('123', updateInput);

    expect(result).toEqual(updatedUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    expect(mockUserRepository.updateUser).toHaveBeenCalledWith('123', updateInput);
  });

  it('should throw error if user not found', async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    const updateInput = {
      name: 'Updated Name',
    };

    await expect(
      updateUserUseCase.execute('non-existent-id', updateInput)
    ).rejects.toThrow('User not found');

    expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
  });

  it('should validate input data', async () => {
    const existingUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    vi.mocked(mockUserRepository.findById).mockResolvedValue(existingUser);

    // Invalid image URL
    const invalidInput = {
      image: 'not-a-valid-url',
    };

    await expect(
      updateUserUseCase.execute('123', invalidInput)
    ).rejects.toThrow();
  });

  it('should allow updating name only', async () => {
    const existingUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const updateInput = {
      name: 'New Name',
    };

    const updatedUser = {
      ...existingUser,
      name: 'New Name',
      updatedAt: new Date(),
    };

    vi.mocked(mockUserRepository.findById).mockResolvedValue(existingUser);
    vi.mocked(mockUserRepository.updateUser).mockResolvedValue(updatedUser);

    const result = await updateUserUseCase.execute('123', updateInput);

    expect(result?.name).toBe('New Name');
  });
});
