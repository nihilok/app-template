import { eq, and, isNull, inArray } from 'drizzle-orm';
import { BaseRepository } from '../database/base-repository';
import { permissions, Permission, NewPermission } from '../database/schema/permissions';
import { rolePermissions } from '../database/schema/role-permissions';
import { userRoles } from '../database/schema/user-roles';
import { roles } from '../database/schema/roles';
import { Database } from '../database/client';

/**
 * PermissionRepository
 * 
 * Handles data access for permissions and permission-related queries.
 * Key capabilities:
 * - Query user permissions through role assignments
 * - Check if user has specific permissions
 * - Retrieve permissions for roles
 */
export class PermissionRepository extends BaseRepository<typeof permissions> {
  constructor(db: Database) {
    super(db, permissions);
  }

  /**
   * Get all permissions assigned to a user through their roles
   * Returns unique permissions across all user roles
   * 
   * @param userId - The user ID to get permissions for
   * @returns Array of permissions the user has
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const results = await this.db
      .select({
        id: permissions.id,
        name: permissions.name,
        resource: permissions.resource,
        action: permissions.action,
        description: permissions.description,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
        deletedAt: permissions.deletedAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          isNull(roles.deletedAt),
          isNull(permissions.deletedAt)
        )
      );

    // Remove duplicates (user might have same permission through multiple roles)
    const uniquePermissions = new Map<string, Permission>();
    for (const result of results) {
      uniquePermissions.set(result.id, result);
    }

    return Array.from(uniquePermissions.values());
  }

  /**
   * Get permissions for a specific role
   * 
   * @param roleId - The role ID to get permissions for
   * @returns Array of permissions assigned to the role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const results = await this.db
      .select({
        id: permissions.id,
        name: permissions.name,
        resource: permissions.resource,
        action: permissions.action,
        description: permissions.description,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
        deletedAt: permissions.deletedAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          isNull(permissions.deletedAt)
        )
      );

    return results;
  }

  /**
   * Find permission by resource and action
   * 
   * @param resource - The resource name
   * @param action - The action name
   * @returns The permission if found, null otherwise
   */
  async findByResourceAndAction(
    resource: string,
    action: string
  ): Promise<Permission | null> {
    const results = await this.db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.resource, resource),
          eq(permissions.action, action),
          isNull(permissions.deletedAt)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find permissions by name
   * 
   * @param names - Array of permission names
   * @returns Array of matching permissions
   */
  async findByNames(names: string[]): Promise<Permission[]> {
    if (names.length === 0) {
      return [];
    }

    const results = await this.db
      .select()
      .from(permissions)
      .where(
        and(
          inArray(permissions.name, names),
          isNull(permissions.deletedAt)
        )
      );

    return results;
  }

  /**
   * Create a new permission
   * 
   * @param data - Permission data
   * @returns Created permission
   */
  async createPermission(data: NewPermission): Promise<Permission> {
    return this.create(data);
  }

  /**
   * Update a permission
   * 
   * @param id - Permission ID
   * @param data - Partial permission data to update
   * @returns Updated permission or null if not found
   */
  async updatePermission(
    id: string,
    data: Partial<Permission>
  ): Promise<Permission | null> {
    return this.update(id, data);
  }

  /**
   * Delete a permission (soft delete)
   * 
   * @param id - Permission ID
   * @returns Deleted permission or null if not found
   */
  async deletePermission(id: string): Promise<Permission | null> {
    return this.softDelete(id);
  }
}
