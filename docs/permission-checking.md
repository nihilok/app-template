# Permission Checking Flow

This document describes how to implement and use the permission checking flow in controllers.

## Overview

The permission checking system is built on the RBAC (Role-Based Access Control) foundation and implements a secure, reusable pattern for enforcing permissions at the controller layer (Imperative Shell).

### Key Design Principles

1. **Permission checks happen in controllers** - The Imperative Shell is responsible for enforcing permissions before executing business logic
2. **No timing attacks** - All permission checks take consistent time regardless of the outcome
3. **No enumeration attacks** - Generic error messages that don't leak information about users, roles, or permissions
4. **Reusable components** - DRY principle with shared repository, use case, and service components
5. **Testable design** - Dependency injection enables easy testing

## Architecture Layers

```
API Layer (HTTP)
    ↓
Controller (Imperative Shell)
    ↓ (Permission Check)
    PermissionChecker → CheckPermissionUseCase → PermissionRepository
    ↓ (If authorized)
Use Cases (Functional Core)
    ↓
Repository Layer
    ↓
Database
```

## Components

### 1. PermissionRepository

**Location**: `src/infrastructure/repositories/permission.repository.ts`

Data access layer for permissions. Handles queries for:
- User permissions (through role assignments)
- Role permissions
- Permission lookups by resource and action

```typescript
const permissionRepo = new PermissionRepository(db);

// Get all permissions for a user
const permissions = await permissionRepo.getUserPermissions(userId);

// Get permissions for a role
const rolePermissions = await permissionRepo.getRolePermissions(roleId);

// Find a specific permission
const permission = await permissionRepo.findByResourceAndAction('users', 'write');
```

### 2. CheckPermissionUseCase

**Location**: `src/use-cases/permission/check-permission.use-case.ts`

Functional Core - contains the business logic for permission checking.

```typescript
const useCase = new CheckPermissionUseCase(permissionRepo);

// Check a single permission
const canWrite = await useCase.execute(userId, 'users', 'write');

// Check multiple permissions
const results = await useCase.checkMultiple(userId, [
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'write' },
]);
```

### 3. PermissionChecker

**Location**: `src/lib/permissions/permission-checker.ts`

Imperative Shell helper - provides a convenient interface for controllers.

```typescript
import { PermissionChecker } from '@/lib/permissions';

const checker = new PermissionChecker();

// Check permission (returns boolean)
const hasPermission = await checker.check(userId, 'users', 'write');

// Require permission (throws if denied)
await checker.require(userId, 'users', 'write'); // Throws 'Forbidden' if denied

// Check multiple permissions
const results = await checker.checkMultiple(userId, [
  { resource: 'users', action: 'read' },
  { resource: 'reports', action: 'write' },
]);

// Convenience methods
const hasAll = await checker.hasAll(userId, checks);
const hasAny = await checker.hasAny(userId, checks);
```

## Usage in Controllers

### Basic Pattern

```typescript
import { PermissionChecker } from '@/lib/permissions';

export class MyController {
  private readonly permissionChecker: PermissionChecker;

  constructor(
    // ... other dependencies
    permissionChecker?: PermissionChecker
  ) {
    this.permissionChecker = permissionChecker || new PermissionChecker();
  }

  async myOperation(actorId: string, data: SomeInput): Promise<Result> {
    // 1. Check permission first (Imperative Shell responsibility)
    await this.permissionChecker.require(actorId, 'resource', 'action');
    
    // 2. If permission check passes, proceed with business logic
    return await this.useCase.execute(data);
  }
}
```

### Complete Example (UserController)

```typescript
import { PermissionChecker } from '@/lib/permissions';

export class UserController {
  private readonly permissionChecker: PermissionChecker;
  private readonly createUserUseCase: CreateUserUseCase;

  constructor(
    userRepository?: UserRepository,
    createUserUseCase?: CreateUserUseCase,
    permissionChecker?: PermissionChecker
  ) {
    this.userRepository = userRepository || new UserRepository(db);
    this.createUserUseCase = createUserUseCase || new CreateUserUseCase(this.userRepository);
    this.permissionChecker = permissionChecker || new PermissionChecker();
  }

  /**
   * Create a new user
   * 
   * @param actorId - The ID of the user performing the action
   * @param input - User creation input
   * @throws Error with message 'Forbidden' if actor lacks permission
   */
  async createUser(actorId: string, input: CreateUserInput): Promise<User> {
    // Permission check in controller (Imperative Shell)
    await this.permissionChecker.require(actorId, 'users', 'write');
    
    // Business logic in use case (Functional Core)
    return await this.createUserUseCase.execute(input);
  }

  async getUserById(actorId: string, id: string): Promise<User | null> {
    await this.permissionChecker.require(actorId, 'users', 'read');
    return await this.getUserUseCase.execute(id);
  }

  async updateUser(actorId: string, id: string, input: UpdateUserInput): Promise<User | null> {
    await this.permissionChecker.require(actorId, 'users', 'write');
    return await this.updateUserUseCase.execute(id, input);
  }

  async deleteUser(actorId: string, id: string): Promise<User | null> {
    await this.permissionChecker.require(actorId, 'users', 'delete');
    return await this.deleteUserUseCase.execute(id);
  }
}
```

### Usage in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '@/controllers/user.controller';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // 3. Execute controller operation (includes permission check)
    const controller = new UserController();
    const user = await controller.createUser(session.user.id, validatedData);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Handle other errors...
  }
}
```

## Permission Naming Convention

Follow the `resource:action` pattern:

- **Resources**: Entities or features (e.g., `users`, `reports`, `settings`)
- **Actions**: Operations (e.g., `read`, `write`, `delete`, `manage`)

Examples:
- `users:read` - View users
- `users:write` - Create or update users
- `users:delete` - Delete users
- `reports:read` - View reports
- `reports:write` - Create or update reports
- `settings:manage` - Modify settings

## Security Considerations

### 1. Timing Attack Prevention

The permission checker always performs the full check regardless of the outcome, ensuring consistent timing:

```typescript
// ✅ Good - Always performs full check without short-circuiting
// Implementation uses full iteration instead of Array.some() to prevent
// timing information leakage based on permission position
const hasPermission = await checker.check(userId, 'users', 'write');
if (!hasPermission) {
  throw new Error('Forbidden');
}

// ❌ Bad - Early return could leak timing information
if (!userExists) return false; // Don't do this in permission logic

// ❌ Bad - Short-circuiting methods like some() leak timing
const hasPermission = permissions.some(p => p.matches()); // Don't do this
```

### 2. Enumeration Attack Prevention

Error messages are intentionally generic and don't reveal:
- Whether a user exists
- Whether a permission exists
- What roles a user has
- Any other authorization structure details

```typescript
// ✅ Good - Generic error message
throw new Error('Forbidden');

// ❌ Bad - Reveals information
throw new Error(`User ${userId} does not have permission users:write`);
throw new Error('Permission not found');
throw new Error('User not found');
```

### 3. Error Handling

Errors are logged internally but not exposed to the caller:

```typescript
try {
  const hasPermission = await checkPermission(userId, resource, action);
  return hasPermission;
} catch (error) {
  console.error('Permission check error:', error); // Log internally
  return false; // Generic response
}
```

## Testing

### Testing Controllers with Permission Checks

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyController } from '@/controllers/my.controller';
import { PermissionChecker } from '@/lib/permissions';

describe('MyController', () => {
  let controller: MyController;
  let mockPermissionChecker: PermissionChecker;

  beforeEach(() => {
    mockPermissionChecker = {
      require: vi.fn(),
    } as unknown as PermissionChecker;

    controller = new MyController(
      // ... other dependencies
      mockPermissionChecker
    );
  });

  it('should check permission before executing operation', async () => {
    vi.mocked(mockPermissionChecker.require).mockResolvedValue(undefined);

    await controller.myOperation('actor-123', someInput);

    expect(mockPermissionChecker.require).toHaveBeenCalledWith(
      'actor-123',
      'resource',
      'action'
    );
  });

  it('should throw Forbidden when actor lacks permission', async () => {
    vi.mocked(mockPermissionChecker.require).mockRejectedValue(
      new Error('Forbidden')
    );

    await expect(
      controller.myOperation('actor-123', someInput)
    ).rejects.toThrow('Forbidden');
  });
});
```

### Testing Permission Checker

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PermissionChecker } from '@/lib/permissions/permission-checker';
import { CheckPermissionUseCase } from '@/use-cases/permission/check-permission.use-case';

describe('PermissionChecker', () => {
  it('should return false on error without revealing details', async () => {
    const mockUseCase = {
      execute: vi.fn().mockRejectedValue(new Error('Database error'))
    } as unknown as CheckPermissionUseCase;

    const checker = new PermissionChecker(undefined, mockUseCase);
    
    const result = await checker.check('user-123', 'users', 'read');
    
    expect(result).toBe(false); // Generic response
  });
});
```

## Best Practices

1. **Always pass actorId as the first parameter** to controller methods that need permission checks
2. **Check permissions before any business logic** - Permission checking happens in the Imperative Shell
3. **Use `require()` for cleaner code** - It throws an error automatically if permission is denied
4. **Test permission checks** - Always test both authorized and unauthorized scenarios
5. **Don't reveal information in errors** - Use generic "Forbidden" messages
6. **Use dependency injection** - Makes testing easier and follows SOLID principles
7. **Document required permissions** - Add comments to controller methods specifying required permissions

## Common Patterns

### Read Operations

```typescript
async getResource(actorId: string, id: string): Promise<Resource | null> {
  await this.permissionChecker.require(actorId, 'resources', 'read');
  return await this.useCase.execute(id);
}
```

### Write Operations (Create/Update)

```typescript
async createResource(actorId: string, input: CreateInput): Promise<Resource> {
  await this.permissionChecker.require(actorId, 'resources', 'write');
  return await this.useCase.execute(input);
}
```

### Delete Operations

```typescript
async deleteResource(actorId: string, id: string): Promise<Resource | null> {
  await this.permissionChecker.require(actorId, 'resources', 'delete');
  return await this.useCase.execute(id);
}
```

### Multiple Permissions

```typescript
async complexOperation(actorId: string, input: Input): Promise<Result> {
  // Require all permissions
  const hasAll = await this.permissionChecker.hasAll(actorId, [
    { resource: 'users', action: 'read' },
    { resource: 'reports', action: 'write' },
  ]);
  
  if (!hasAll) {
    throw new Error('Forbidden');
  }
  
  return await this.useCase.execute(input);
}
```

### Optional Permission (Allow if has any)

```typescript
async viewResource(actorId: string, id: string): Promise<Resource | null> {
  // User needs either read or write permission
  const hasAny = await this.permissionChecker.hasAny(actorId, [
    { resource: 'resources', action: 'read' },
    { resource: 'resources', action: 'write' },
  ]);
  
  if (!hasAny) {
    throw new Error('Forbidden');
  }
  
  return await this.useCase.execute(id);
}
```

## Migration Guide

To add permission checking to an existing controller:

1. **Add PermissionChecker to constructor**:
   ```typescript
   constructor(
     // ... existing dependencies
     permissionChecker?: PermissionChecker
   ) {
     // ... existing initialization
     this.permissionChecker = permissionChecker || new PermissionChecker();
   }
   ```

2. **Add actorId parameter to methods**:
   ```typescript
   // Before
   async getUser(id: string): Promise<User | null>
   
   // After
   async getUser(actorId: string, id: string): Promise<User | null>
   ```

3. **Add permission check at start of method**:
   ```typescript
   async getUser(actorId: string, id: string): Promise<User | null> {
     await this.permissionChecker.require(actorId, 'users', 'read');
     return await this.useCase.execute(id);
   }
   ```

4. **Update tests** to include permission checker mock and verify checks

5. **Update API routes** to pass session user ID to controller methods

## See Also

- [RBAC System Documentation](./rbac.md) - Understanding roles, permissions, and groups
- [Architecture Overview](./architecture.md) - DDD principles and layer separation
- [Testing Guide](./testing.md) - Testing strategies and patterns
- [Controller Guidelines](.github/copilot-instructions.md) - Controller best practices
