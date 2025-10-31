import { db } from '@/infrastructure/database/client';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '@/use-cases/user/delete-user.use-case';
import { CreateUserInput, UpdateUserInput } from '@/domain/user.types';
import { User } from '@/infrastructure/database/schema/users';
import { PermissionChecker } from '@/lib/permissions';

/**
 * UserController (Imperative Shell)
 * 
 * Coordinates asynchronous system operations for user-related actions.
 * Responsibilities:
 * - Retrieve data from repositories
 * - Call use cases for business decisions
 * - Execute side effects based on use case outcomes
 * - Handle I/O operations
 * - Enforce RBAC permissions before operations
 * 
 * Following functional DDD principles:
 * - Takes actions, doesn't make business decisions
 * - Business logic is delegated to use cases (Functional Core)
 * - Handles all infrastructure concerns (database, repositories)
 * - Permission checking happens in controller (Imperative Shell)
 */
export class UserController {
  private readonly userRepository: UserRepository;
  private readonly createUserUseCase: CreateUserUseCase;
  private readonly getUserUseCase: GetUserUseCase;
  private readonly updateUserUseCase: UpdateUserUseCase;
  private readonly deleteUserUseCase: DeleteUserUseCase;
  private readonly permissionChecker: PermissionChecker;

  constructor(
    userRepository?: UserRepository,
    createUserUseCase?: CreateUserUseCase,
    getUserUseCase?: GetUserUseCase,
    updateUserUseCase?: UpdateUserUseCase,
    deleteUserUseCase?: DeleteUserUseCase,
    permissionChecker?: PermissionChecker
  ) {
    // Initialize infrastructure dependencies (or use injected ones for testing)
    this.userRepository = userRepository || new UserRepository(db);
    
    // Initialize use cases with their dependencies (or use injected ones for testing)
    this.createUserUseCase = createUserUseCase || new CreateUserUseCase(this.userRepository);
    this.getUserUseCase = getUserUseCase || new GetUserUseCase(this.userRepository);
    this.updateUserUseCase = updateUserUseCase || new UpdateUserUseCase(this.userRepository);
    this.deleteUserUseCase = deleteUserUseCase || new DeleteUserUseCase(this.userRepository);
    
    // Initialize permission checker (or use injected one for testing)
    this.permissionChecker = permissionChecker || new PermissionChecker();
  }

  /**
   * Create a new user
   * Coordinates: permission check, uniqueness check, creation
   * Note: Input validation happens at the API layer
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param input - User creation input
   * @throws Error with message 'Forbidden' if actor lacks 'users:write' permission
   */
  async createUser(actorId: string, input: CreateUserInput): Promise<User> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'write');
    
    // If permission check passes, proceed with business logic
    return await this.createUserUseCase.execute(input);
  }

  /**
   * Get all users
   * Coordinates: permission check, repository query
   * 
   * Note: This directly calls the repository without a use case because
   * there's no business logic involved - it's a simple data retrieval.
   * Use cases are only needed when there are business rules to enforce.
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @throws Error with message 'Forbidden' if actor lacks 'users:read' permission
   */
  async getAllUsers(actorId: string): Promise<User[]> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'read');
    
    return await this.userRepository.findAll();
  }

  /**
   * Get a user by ID
   * Coordinates: permission check, repository query
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param id - The ID of the user to retrieve
   * @throws Error with message 'Forbidden' if actor lacks 'users:read' permission
   */
  async getUserById(actorId: string, id: string): Promise<User | null> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'read');
    
    return await this.getUserUseCase.execute(id);
  }

  /**
   * Get a user by email
   * Coordinates: permission check, repository query
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param email - The email of the user to retrieve
   * @throws Error with message 'Forbidden' if actor lacks 'users:read' permission
   */
  async getUserByEmail(actorId: string, email: string): Promise<User | null> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'read');
    
    return await this.getUserUseCase.getByEmail(email);
  }

  /**
   * Update a user
   * Coordinates: permission check, existence check, update operation
   * Note: Input validation happens at the API layer
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param id - The ID of the user to update
   * @param input - Update input data
   * @throws Error with message 'Forbidden' if actor lacks 'users:write' permission
   */
  async updateUser(actorId: string, id: string, input: UpdateUserInput): Promise<User | null> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'write');
    
    return await this.updateUserUseCase.execute(id, input);
  }

  /**
   * Delete a user (soft delete)
   * Coordinates: permission check, existence check, soft delete operation
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param id - The ID of the user to delete
   * @throws Error with message 'Forbidden' if actor lacks 'users:delete' permission
   */
  async deleteUser(actorId: string, id: string): Promise<User | null> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'delete');
    
    return await this.deleteUserUseCase.execute(id);
  }
}
