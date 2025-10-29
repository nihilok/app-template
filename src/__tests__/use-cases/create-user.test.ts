import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

// Mock the repository
jest.mock('@/infrastructure/repositories/user.repository');

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    } as jest.Mocked<UserRepository>;

    createUserUseCase = new CreateUserUseCase(mockUserRepository);
  });

  it('should create a user successfully', async () => {
    const input = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const expectedUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.createUser.mockResolvedValue(expectedUser);

    const result = await createUserUseCase.execute(input);

    expect(result).toEqual(expectedUser);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserRepository.createUser).toHaveBeenCalled();
  });

  it('should throw error if user already exists', async () => {
    const input = {
      email: 'existing@example.com',
      name: 'Test User',
    };

    const existingUser = {
      id: '123',
      email: 'existing@example.com',
      name: 'Existing User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(createUserUseCase.execute(input)).rejects.toThrow(
      'User with this email already exists'
    );
  });
});
