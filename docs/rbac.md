# Role-Based Access Control (RBAC) System

This template includes a comprehensive, flexible, and extensible Role-Based Access Control (RBAC) system built on Domain-Driven Design principles.

## Overview

The RBAC system provides fine-grained access control through a hierarchy of:
- **Groups** - Top-level organizational units (e.g., companies, departments, cohorts, institutions)
- **Roles** - Named collections of permissions within a group
- **Permissions** - Specific actions on resources (e.g., "read:users", "write:reports")
- **Users** - Assigned to roles through user_roles

## Database Schema

### Core Tables

#### groups
```typescript
{
  id: uuid,
  name: string,
  description: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp | null
}
```

Groups represent top-level organizational units. Examples:
- Educational institutions, cohorts, or classes
- Companies or departments
- Project teams or workspaces

#### roles
```typescript
{
  id: uuid,
  name: string,
  description: string | null,
  groupId: uuid -> groups.id,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp | null
}
```

Roles are scoped to groups and define sets of permissions. Examples:
- `admin` - Full access within a group
- `member` - Standard access
- `viewer` - Read-only access
- `instructor`, `student` - Education-specific roles
- `manager`, `employee` - Organization-specific roles

#### permissions
```typescript
{
  id: uuid,
  name: string (unique),
  resource: string,
  action: string,
  description: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp | null
}
```

Permissions define atomic actions. The `resource:action` pattern enables:
- `users:read` - View users
- `users:write` - Create/update users
- `users:delete` - Delete users
- `reports:read`, `reports:write`
- `settings:manage`

#### role_permissions
```typescript
{
  id: uuid,
  roleId: uuid -> roles.id,
  permissionId: uuid -> permissions.id,
  createdAt: timestamp
}
```

Maps permissions to roles (many-to-many).

#### user_roles
```typescript
{
  id: uuid,
  userId: uuid -> users.id,
  roleId: uuid -> roles.id,
  createdAt: timestamp
}
```

Assigns users to roles (many-to-many).

## Usage Examples

### Creating a Group

```typescript
// src/use-cases/group/create-group.use-case.ts
const group = await createGroupUseCase.execute({
  name: "Acme Corporation",
  description: "Main company group"
});
```

### Creating Roles

```typescript
// Create an admin role for the group
const adminRole = await createRoleUseCase.execute({
  name: "Admin",
  description: "Full administrative access",
  groupId: group.id
});

// Create a member role
const memberRole = await createRoleUseCase.execute({
  name: "Member",
  description: "Standard member access",
  groupId: group.id
});
```

### Creating Permissions

```typescript
// Define granular permissions
const permissions = [
  { name: "users:read", resource: "users", action: "read" },
  { name: "users:write", resource: "users", action: "write" },
  { name: "users:delete", resource: "users", action: "delete" },
  { name: "reports:read", resource: "reports", action: "read" },
  { name: "reports:write", resource: "reports", action: "write" },
];

for (const permission of permissions) {
  await createPermissionUseCase.execute(permission);
}
```

### Assigning Permissions to Roles

```typescript
// Admin gets all permissions
await assignPermissionUseCase.execute({
  roleId: adminRole.id,
  permissionId: usersReadPermission.id
});
await assignPermissionUseCase.execute({
  roleId: adminRole.id,
  permissionId: usersWritePermission.id
});
// ... etc

// Member gets read-only permissions
await assignPermissionUseCase.execute({
  roleId: memberRole.id,
  permissionId: usersReadPermission.id
});
await assignPermissionUseCase.execute({
  roleId: memberRole.id,
  permissionId: reportsReadPermission.id
});
```

### Assigning Users to Roles

```typescript
// Assign user to admin role
await assignUserRoleUseCase.execute({
  userId: user.id,
  roleId: adminRole.id
});
```

### Checking Permissions

```typescript
// Get user's permissions
const userPermissions = await getUserPermissionsUseCase.execute(user.id);

// Check if user has specific permission
const canWriteUsers = userPermissions.some(
  p => p.resource === 'users' && p.action === 'write'
);
```

## Extension Patterns

### Multi-tenancy

Groups provide natural isolation for multi-tenant applications:

```typescript
// Each customer/tenant gets their own group
const customerGroup = await createGroupUseCase.execute({
  name: "Customer Corp",
  description: "Customer's isolated workspace"
});

// Roles and permissions are scoped to the group
const customerAdminRole = await createRoleUseCase.execute({
  name: "Admin",
  groupId: customerGroup.id
});
```

### Hierarchical Structures

For complex hierarchies (institutions → cohorts → classes):

```typescript
// Add parentGroupId to groups table
export const groups = pgTable('groups', {
  // ... existing fields
  parentGroupId: uuid('parent_group_id')
    .references(() => groups.id, { onDelete: 'cascade' }),
});

// Institution → Cohort → Class
const institution = await createGroup({ name: "University" });
const cohort = await createGroup({ 
  name: "2024 Cohort", 
  parentGroupId: institution.id 
});
const class = await createGroup({ 
  name: "CS 101", 
  parentGroupId: cohort.id 
});
```

### Resource-Level Permissions

For fine-grained control, add resource IDs to permissions:

```typescript
export const rolePermissions = pgTable('role_permissions', {
  // ... existing fields
  resourceId: uuid('resource_id'), // Specific resource instance
  constraints: jsonb('constraints'), // Additional conditions
});

// Grant permission to specific resources
await assignPermission({
  roleId: role.id,
  permissionId: permission.id,
  resourceId: specificDocument.id // Optional: limit to this document
});
```

### Time-Based Permissions

Add expiration to role assignments:

```typescript
export const userRoles = pgTable('user_roles', {
  // ... existing fields
  expiresAt: timestamp('expires_at'),
});

// Temporary access
await assignUserRole({
  userId: user.id,
  roleId: role.id,
  expiresAt: new Date('2024-12-31')
});
```

## API Integration

### Middleware for Permission Checking

```typescript
// src/lib/auth/permissions.ts
export async function requirePermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some(
    p => p.resource === resource && p.action === action
  );
}

// Usage in API route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasPermission = await requirePermission(
    session.user.id,
    'users',
    'delete'
  );
  
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with deletion
}
```

### Group Context

```typescript
// Add current group to session
export async function setCurrentGroup(userId: string, groupId: string) {
  // Store in session or JWT
}

// Filter data by current group
export async function getUsersInCurrentGroup(groupId: string) {
  const userRoles = await db
    .select()
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(roles.groupId, groupId));
  
  return userRoles;
}
```

## Best Practices

1. **Principle of Least Privilege**: Start with minimal permissions and add as needed
2. **Consistent Naming**: Use `resource:action` pattern for permissions
3. **Audit Logs**: Track permission changes and access attempts
4. **Soft Deletes**: Maintain RBAC history by soft-deleting instead of hard-deleting
5. **Caching**: Cache permission checks to improve performance
6. **Documentation**: Document each role and permission's purpose

## Common Patterns

### Education System Example

```typescript
// Institution → Cohort → Class
const institution = await createGroup({ name: "University" });
const cohort = await createGroup({ name: "2024 Batch" });

// Roles
const instructor = await createRole({ 
  name: "Instructor", 
  groupId: cohort.id 
});
const student = await createRole({ 
  name: "Student", 
  groupId: cohort.id 
});

// Permissions
const readLessons = await createPermission({ 
  name: "lessons:read",
  resource: "lessons",
  action: "read" 
});
const writeLessons = await createPermission({ 
  name: "lessons:write",
  resource: "lessons",
  action: "write" 
});

// Assignment
await assignPermission(instructor.id, readLessons.id);
await assignPermission(instructor.id, writeLessons.id);
await assignPermission(student.id, readLessons.id);
```

### Organization Example

```typescript
// Company → Departments
const company = await createGroup({ name: "Acme Corp" });

// Roles
const manager = await createRole({ 
  name: "Manager", 
  groupId: company.id 
});
const employee = await createRole({ 
  name: "Employee", 
  groupId: company.id 
});

// Permissions for HR resources
await assignPermission(manager.id, "employees:read");
await assignPermission(manager.id, "employees:write");
await assignPermission(manager.id, "reports:read");
await assignPermission(employee.id, "reports:read");
```

## Testing RBAC

```typescript
describe('RBAC System', () => {
  it('should enforce permissions', async () => {
    const group = await createGroup({ name: 'Test Group' });
    const role = await createRole({ name: 'Viewer', groupId: group.id });
    const permission = await createPermission({ 
      name: 'users:read',
      resource: 'users',
      action: 'read'
    });
    
    await assignPermission(role.id, permission.id);
    await assignUserRole(user.id, role.id);
    
    const hasPermission = await checkPermission(user.id, 'users', 'read');
    expect(hasPermission).toBe(true);
    
    const canWrite = await checkPermission(user.id, 'users', 'write');
    expect(canWrite).toBe(false);
  });
});
```

## Migration from User Example

The existing user schema and API demonstrate the pattern:
- Replace simple user CRUD with RBAC-aware operations
- Add permission checks to all endpoints
- Scope data queries by user's group membership
- Extend user model with group/role relationships

This RBAC foundation provides enterprise-grade access control while remaining simple to use and extend.
