import { db } from '@/infrastructure/database/client';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '@/use-cases/user/delete-user.use-case';
import { CreateUserInput, UpdateUserInput } from '@/domain/user.types';
import { User } from '@/infrastructure/database/schema/users';

/**
 * UserController (Imperative Shell)
 * 
 * Coordinates asynchronous system operations for user-related actions.
 * Responsibilities:
 * - Retrieve data from repositories
 * - Call use cases for business decisions
 * - Execute side effects based on use case outcomes
 * - Handle I/O operations
 * 
 * Following functional DDD principles:
 * - Takes actions, doesn't make business decisions
 * - Business logic is delegated to use cases (Functional Core)
 * - Handles all infrastructure concerns (database, repositories)
 */
export class UserController {
  private readonly userRepository: UserRepository;
  private readonly createUserUseCase: CreateUserUseCase;
  private readonly getUserUseCase: GetUserUseCase;
  private readonly updateUserUseCase: UpdateUserUseCase;
  private readonly deleteUserUseCase: DeleteUserUseCase;

  constructor(
    userRepository?: UserRepository,
    createUserUseCase?: CreateUserUseCase,
    getUserUseCase?: GetUserUseCase,
    updateUserUseCase?: UpdateUserUseCase,
    deleteUserUseCase?: DeleteUserUseCase
  ) {
    // Initialize infrastructure dependencies (or use injected ones for testing)
    this.userRepository = userRepository || new UserRepository(db);
    
    // Initialize use cases with their dependencies (or use injected ones for testing)
    this.createUserUseCase = createUserUseCase || new CreateUserUseCase(this.userRepository);
    this.getUserUseCase = getUserUseCase || new GetUserUseCase(this.userRepository);
    this.updateUserUseCase = updateUserUseCase || new UpdateUserUseCase(this.userRepository);
    this.deleteUserUseCase = deleteUserUseCase || new DeleteUserUseCase(this.userRepository);
  }

  /**
   * Create a new user
   * Coordinates: uniqueness check, creation
   * Note: Input validation happens at the API layer
   */
  async createUser(input: CreateUserInput): Promise<User> {
    return await this.createUserUseCase.execute(input);
  }

  /**
   * Get all users
   * Coordinates: repository query
   * 
   * Note: This directly calls the repository without a use case because
   * there's no business logic involved - it's a simple data retrieval.
   * Use cases are only needed when there are business rules to enforce.
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  /**
   * Get a user by ID
   * Coordinates: repository query
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.getUserUseCase.execute(id);
  }

  /**
   * Get a user by email
   * Coordinates: repository query
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.getUserUseCase.getByEmail(email);
  }

  /**
   * Update a user
   * Coordinates: existence check, update operation
   * Note: Input validation happens at the API layer
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    return await this.updateUserUseCase.execute(id, input);
  }

  /**
   * Delete a user (soft delete)
   * Coordinates: existence check, soft delete operation
   */
  async deleteUser(id: string): Promise<User | null> {
    return await this.deleteUserUseCase.execute(id);
  }
}
