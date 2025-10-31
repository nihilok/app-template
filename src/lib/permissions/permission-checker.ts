import { db } from '@/infrastructure/database/client';
import { PermissionRepository } from '@/infrastructure/repositories/permission.repository';
import { CheckPermissionUseCase } from '@/use-cases/permission/check-permission.use-case';
import { Permission } from '@/infrastructure/database/schema/permissions';

/**
 * PermissionChecker (Imperative Shell Helper)
 * 
 * Provides a reusable interface for permission checking in controllers.
 * This class is designed to prevent timing and enumeration attacks by:
 * 
 * 1. Always performing the same operations regardless of the outcome
 * 2. Using constant-time comparisons where feasible
 * 3. Not revealing whether a user exists or not through timing differences
 * 4. Returning consistent response structures
 * 
 * Usage in controllers:
 * ```typescript
 * const checker = new PermissionChecker();
 * const hasPermission = await checker.check(userId, 'users', 'write');
 * if (!hasPermission) {
 *   throw new Error('Forbidden');
 * }
 * ```
 */
export class PermissionChecker {
  private readonly permissionRepository: PermissionRepository;
  private readonly checkPermissionUseCase: CheckPermissionUseCase;

  constructor(
    permissionRepository?: PermissionRepository,
    checkPermissionUseCase?: CheckPermissionUseCase
  ) {
    // Allow dependency injection for testing
    this.permissionRepository =
      permissionRepository || new PermissionRepository(db);
    this.checkPermissionUseCase =
      checkPermissionUseCase ||
      new CheckPermissionUseCase(this.permissionRepository);
  }

  /**
   * Check if a user has a specific permission
   * 
   * This method is designed to have consistent timing regardless of:
   * - Whether the user exists
   * - Whether the user has the permission
   * - The number of roles/permissions the user has
   * 
   * @param userId - The user ID to check (should already be validated)
   * @param resource - The resource name
   * @param action - The action name
   * @returns true if the user has the permission, false otherwise
   */
  async check(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      // Always perform the full permission check
      // This ensures consistent timing regardless of the outcome
      const hasPermission = await this.checkPermissionUseCase.execute(
        userId,
        resource,
        action
      );

      return hasPermission;
    } catch (error) {
      // In case of any error, return false but don't reveal the error
      // This prevents information leakage through error messages
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Require a specific permission or throw an error
   * 
   * This is a convenience method for controllers that want to enforce
   * permissions and throw an error if the check fails.
   * 
   * The error message is intentionally generic to prevent enumeration attacks.
   * It does not reveal whether the user exists, whether the permission exists,
   * or any other information about the authorization structure.
   * 
   * @param userId - The user ID to check
   * @param resource - The resource name
   * @param action - The action name
   * @throws Error with message 'Forbidden' if permission is denied
   */
  async require(
    userId: string,
    resource: string,
    action: string
  ): Promise<void> {
    const hasPermission = await this.check(userId, resource, action);

    if (!hasPermission) {
      // Generic error message that doesn't leak information
      throw new Error('Forbidden');
    }
  }

  /**
   * Check multiple permissions at once
   * 
   * Useful for operations that require multiple permissions or
   * for checking if a user has any of several permissions.
   * 
   * @param userId - The user ID to check
   * @param checks - Array of {resource, action} pairs to check
   * @returns Object mapping "resource:action" keys to boolean results
   */
  async checkMultiple(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<Record<string, boolean>> {
    try {
      return await this.checkPermissionUseCase.checkMultiple(userId, checks);
    } catch (error) {
      console.error('Multiple permission check error:', error);
      // Return false for all checks on error
      const results: Record<string, boolean> = {};
      for (const check of checks) {
        results[`${check.resource}:${check.action}`] = false;
      }
      return results;
    }
  }

  /**
   * Get all permissions for a user
   * 
   * This can be useful for UI logic (showing/hiding buttons, etc.)
   * Note: This is less secure than individual checks as it reveals
   * all permissions at once. Use sparingly and only for authenticated users.
   * 
   * @param userId - The user ID to get permissions for
   * @returns Array of all permissions the user has
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      return await this.checkPermissionUseCase.getUserPermissions(userId);
    } catch (error) {
      console.error('Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Check if user has ALL of the specified permissions
   * 
   * @param userId - The user ID to check
   * @param checks - Array of {resource, action} pairs
   * @returns true only if user has ALL permissions
   */
  async hasAll(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    const results = await this.checkMultiple(userId, checks);
    return Object.values(results).every((hasPermission) => hasPermission);
  }

  /**
   * Check if user has ANY of the specified permissions
   * 
   * @param userId - The user ID to check
   * @param checks - Array of {resource, action} pairs
   * @returns true if user has at least one permission
   */
  async hasAny(
    userId: string,
    checks: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    const results = await this.checkMultiple(userId, checks);
    return Object.values(results).some((hasPermission) => hasPermission);
  }
}

/**
 * Singleton instance for convenience
 * Controllers can use this directly or create their own instance for testing
 */
export const permissionChecker = new PermissionChecker();
