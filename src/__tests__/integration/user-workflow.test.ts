import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

/**
 * Integration tests for user workflow
 * These tests verify the full flow from use case through repository
 */
describe('User Workflow Integration Tests', () => {
  let userRepository: UserRepository;
  let createUserUseCase: CreateUserUseCase;
  let getUserUseCase: GetUserUseCase;
  let updateUserUseCase: UpdateUserUseCase;

  // In-memory storage for testing
  const mockDatabase = new Map<string, {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>();
  let idCounter = 1;

  beforeEach(() => {
    // Reset mock database
    mockDatabase.clear();
    idCounter = 1;

    // Create mock repository with in-memory storage
    userRepository = {
      findById: vi.fn(async (id: string) => {
        return mockDatabase.get(id) || null;
      }),
      findByEmail: vi.fn(async (email: string) => {
        return Array.from(mockDatabase.values()).find(
          (user) => user.email === email && !user.deletedAt
        ) || null;
      }),
      createUser: vi.fn(async (data: { email: string; name: string | null; image: string | null }) => {
        const id = String(idCounter++);
        const user = {
          id,
          email: data.email,
          name: data.name || null,
          image: data.image || null,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        mockDatabase.set(id, user);
        return user;
      }),
      updateUser: vi.fn(async (id: string, data: Partial<{ name: string; email: string; image: string | null; emailVerified: boolean }>) => {
        const user = mockDatabase.get(id);
        if (!user) return null;
        const updatedUser = {
          ...user,
          ...data,
          updatedAt: new Date(),
        };
        mockDatabase.set(id, updatedUser);
        return updatedUser;
      }),
      softDelete: vi.fn(async (id: string) => {
        const user = mockDatabase.get(id);
        if (!user) return null;
        user.deletedAt = new Date();
        mockDatabase.set(id, user);
        return user;
      }),
    } as unknown as UserRepository;

    // Initialize use cases with the mock repository
    createUserUseCase = new CreateUserUseCase(userRepository);
    getUserUseCase = new GetUserUseCase(userRepository);
    updateUserUseCase = new UpdateUserUseCase(userRepository);
  });

  describe('Complete User Lifecycle', () => {
    it('should handle full user creation, retrieval, and update flow', async () => {
      // Step 1: Create a new user
      const createInput = {
        email: 'john.doe@example.com',
        name: 'John Doe',
      };

      const createdUser = await createUserUseCase.execute(createInput);

      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(createInput.email);
      expect(createdUser.name).toBe(createInput.name);
      expect(createdUser.id).toBeDefined();
      expect(createdUser.emailVerified).toBe(false);

      // Step 2: Retrieve user by ID
      const retrievedUserById = await getUserUseCase.execute(createdUser.id);

      expect(retrievedUserById).toBeDefined();
      expect(retrievedUserById?.id).toBe(createdUser.id);
      expect(retrievedUserById?.email).toBe(createInput.email);

      // Step 3: Retrieve user by email
      const retrievedUserByEmail = await getUserUseCase.getByEmail(createInput.email);

      expect(retrievedUserByEmail).toBeDefined();
      expect(retrievedUserByEmail?.id).toBe(createdUser.id);
      expect(retrievedUserByEmail?.email).toBe(createInput.email);

      // Step 4: Update user information
      const updateInput = {
        name: 'John Updated Doe',
        emailVerified: true,
      };

      const updatedUser = await updateUserUseCase.execute(createdUser.id, updateInput);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe(updateInput.name);
      expect(updatedUser?.emailVerified).toBe(true);

      // Step 5: Verify updated user can be retrieved
      const finalUser = await getUserUseCase.execute(createdUser.id);

      expect(finalUser?.name).toBe(updateInput.name);
      expect(finalUser?.emailVerified).toBe(true);
    });

    it('should prevent duplicate email registration', async () => {
      // Create first user
      const createInput = {
        email: 'duplicate@example.com',
        name: 'First User',
      };

      await createUserUseCase.execute(createInput);

      // Try to create second user with same email
      const duplicateInput = {
        email: 'duplicate@example.com',
        name: 'Second User',
      };

      await expect(createUserUseCase.execute(duplicateInput)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should handle multiple users independently', async () => {
      // Create multiple users
      const user1 = await createUserUseCase.execute({
        email: 'user1@example.com',
        name: 'User One',
      });

      const user2 = await createUserUseCase.execute({
        email: 'user2@example.com',
        name: 'User Two',
      });

      const user3 = await createUserUseCase.execute({
        email: 'user3@example.com',
        name: 'User Three',
      });

      // Verify all users can be retrieved independently
      const retrieved1 = await getUserUseCase.execute(user1.id);
      const retrieved2 = await getUserUseCase.execute(user2.id);
      const retrieved3 = await getUserUseCase.execute(user3.id);

      expect(retrieved1?.email).toBe('user1@example.com');
      expect(retrieved2?.email).toBe('user2@example.com');
      expect(retrieved3?.email).toBe('user3@example.com');

      // Update one user shouldn't affect others
      await updateUserUseCase.execute(user2.id, { name: 'Updated User Two' });

      const updatedUser2 = await getUserUseCase.execute(user2.id);
      const unchangedUser1 = await getUserUseCase.execute(user1.id);
      const unchangedUser3 = await getUserUseCase.execute(user3.id);

      expect(updatedUser2?.name).toBe('Updated User Two');
      expect(unchangedUser1?.name).toBe('User One');
      expect(unchangedUser3?.name).toBe('User Three');
    });

    it('should validate email format during creation', async () => {
      const invalidInput = {
        email: 'not-an-email',
        name: 'Test User',
      };

      await expect(createUserUseCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should validate image URL during update', async () => {
      // Create user
      const user = await createUserUseCase.execute({
        email: 'test@example.com',
        name: 'Test User',
      });

      // Try to update with invalid image URL
      const invalidUpdate = {
        image: 'not-a-valid-url',
      };

      await expect(
        updateUserUseCase.execute(user.id, invalidUpdate)
      ).rejects.toThrow();
    });

    it('should handle user not found scenarios', async () => {
      // Try to get non-existent user
      const nonExistentUser = await getUserUseCase.execute('non-existent-id');
      expect(nonExistentUser).toBeNull();

      // Try to update non-existent user
      await expect(
        updateUserUseCase.execute('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('User not found');
    });
  });
});
