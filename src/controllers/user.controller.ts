import { db } from '@/infrastructure/database/client';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { AuditLogRepository } from '@/infrastructure/repositories/audit-log.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '@/use-cases/user/delete-user.use-case';
import { CreateUserInput, UpdateUserInput } from '@/domain/user.types';
import { User } from '@/infrastructure/database/schema/users';
import { PermissionChecker } from '@/lib/permissions';
import { AuditLogger } from '@/lib/audit-logger';

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
 * - Log all database operations for audit trail
 * 
 * Following functional DDD principles:
 * - Takes actions, doesn't make business decisions
 * - Business logic is delegated to use cases (Functional Core)
 * - Handles all infrastructure concerns (database, repositories)
 * - Permission checking happens in controller (Imperative Shell)
 * - Audit logging happens in controller (Imperative Shell)
 */
export class UserController {
  private readonly userRepository: UserRepository;
  private readonly createUserUseCase: CreateUserUseCase;
  private readonly getUserUseCase: GetUserUseCase;
  private readonly updateUserUseCase: UpdateUserUseCase;
  private readonly deleteUserUseCase: DeleteUserUseCase;
  private readonly permissionChecker: PermissionChecker;
  private readonly auditLogger: AuditLogger;

  constructor(
    userRepository?: UserRepository,
    createUserUseCase?: CreateUserUseCase,
    getUserUseCase?: GetUserUseCase,
    updateUserUseCase?: UpdateUserUseCase,
    deleteUserUseCase?: DeleteUserUseCase,
    permissionChecker?: PermissionChecker,
    auditLogger?: AuditLogger,
    auditLogRepository?: AuditLogRepository
  ) {
    // Initialize infrastructure dependencies (or use injected ones for testing)
    this.userRepository = userRepository || new UserRepository(db);
    const auditLogRepo = auditLogRepository || new AuditLogRepository(db);
    
    // Initialize use cases with their dependencies (or use injected ones for testing)
    this.createUserUseCase = createUserUseCase || new CreateUserUseCase(this.userRepository);
    this.getUserUseCase = getUserUseCase || new GetUserUseCase(this.userRepository);
    this.updateUserUseCase = updateUserUseCase || new UpdateUserUseCase(this.userRepository);
    this.deleteUserUseCase = deleteUserUseCase || new DeleteUserUseCase(this.userRepository);
    
    // Initialize permission checker (or use injected one for testing)
    this.permissionChecker = permissionChecker || new PermissionChecker();
    
    // Initialize audit logger (or use injected one for testing)
    this.auditLogger = auditLogger || new AuditLogger(auditLogRepo);
  }

  /**
   * Create a new user
   * Coordinates: permission check, uniqueness check, creation, audit logging
   * Note: Input validation happens at the API layer
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param input - User creation input
   * @throws Error with message 'Forbidden' if actor lacks 'users:write' permission
   */
  async createUser(actorId: string, input: CreateUserInput): Promise<User> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'write');
    
    // Execute business logic
    const user = await this.createUserUseCase.execute(input);
    
    // Log the operation for audit trail
    await this.auditLogger.logCreate(
      'user',
      user.id,
      actorId,
      this.sanitizeUserForAudit(user)
    );
    
    return user;
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
   * Coordinates: permission check, existence check, update operation, audit logging
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
    
    // Get old values before update for audit logging
    const oldUser = await this.userRepository.findById(id);
    
    // Execute business logic
    const updatedUser = await this.updateUserUseCase.execute(id, input);
    
    // Log the operation for audit trail (only if update was successful)
    if (updatedUser && oldUser) {
      await this.auditLogger.logUpdate(
        'user',
        updatedUser.id,
        actorId,
        this.sanitizeUserForAudit(oldUser),
        this.sanitizeUserForAudit(updatedUser)
      );
    }
    
    return updatedUser;
  }

  /**
   * Delete a user (soft delete)
   * Coordinates: permission check, existence check, soft delete operation, audit logging
   * 
   * @param actorId - The ID of the user performing the action (for permission check)
   * @param id - The ID of the user to delete
   * @throws Error with message 'Forbidden' if actor lacks 'users:delete' permission
   */
  async deleteUser(actorId: string, id: string): Promise<User | null> {
    // Permission check happens in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'delete');
    
    // Get old values before delete for audit logging
    const oldUser = await this.userRepository.findById(id);
    
    // Execute business logic
    const deletedUser = await this.deleteUserUseCase.execute(id);
    
    // Log the operation for audit trail (only if delete was successful)
    if (deletedUser && oldUser) {
      await this.auditLogger.logDelete(
        'user',
        deletedUser.id,
        actorId,
        this.sanitizeUserForAudit(oldUser)
      );
    }
    
    return deletedUser;
  }

  /**
   * Sanitize user data for audit logging
   * Removes sensitive fields that shouldn't be logged
   * 
   * @param user - User object to sanitize
   * @returns Sanitized user object safe for logging
   */
  private sanitizeUserForAudit(user: User): Record<string, unknown> {
    // Create a copy and convert dates to ISO strings for JSON serialization
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
      deletedAt: user.deletedAt?.toISOString() || null,
    };
  }
}
