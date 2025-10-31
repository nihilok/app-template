# Permission Checking Library

This directory contains the reusable permission checking service that controllers use to enforce RBAC permissions.

## Overview

The `PermissionChecker` class provides a secure, consistent interface for checking user permissions in controllers (Imperative Shell layer).

## Components

### PermissionChecker

**File**: `permission-checker.ts`

Main service class that controllers use to check permissions before executing operations.

**Key Features**:
- Consistent timing to prevent timing attacks
- Generic error messages to prevent enumeration attacks
- Error handling that logs but doesn't expose details
- Dependency injection for easy testing
- Convenience methods for common permission checking patterns

**Methods**:

```typescript
// Check permission (returns boolean)
await checker.check(userId, 'resource', 'action'): Promise<boolean>

// Require permission (throws 'Forbidden' if denied)
await checker.require(userId, 'resource', 'action'): Promise<void>

// Check multiple permissions
await checker.checkMultiple(userId, checks): Promise<Record<string, boolean>>

// Get all user permissions
await checker.getUserPermissions(userId): Promise<Permission[]>

// Check if user has ALL permissions
await checker.hasAll(userId, checks): Promise<boolean>

// Check if user has ANY permission
await checker.hasAny(userId, checks): Promise<boolean>
```

## Usage

### Basic Usage in Controllers

```typescript
import { PermissionChecker } from '@/lib/permissions';

export class MyController {
  private readonly permissionChecker: PermissionChecker;

  constructor(permissionChecker?: PermissionChecker) {
    this.permissionChecker = permissionChecker || new PermissionChecker();
  }

  async myOperation(actorId: string, data: Input): Promise<Output> {
    // Check permission before operation
    await this.permissionChecker.require(actorId, 'resource', 'action');
    
    // Proceed with operation
    return await this.useCase.execute(data);
  }
}
```

### Using the Singleton Instance

For convenience, a singleton instance is exported:

```typescript
import { permissionChecker } from '@/lib/permissions';

const hasPermission = await permissionChecker.check(userId, 'users', 'read');
```

**Note**: For controllers, prefer dependency injection over the singleton for better testability.

### Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PermissionChecker } from '@/lib/permissions';

describe('MyController', () => {
  it('should check permissions', async () => {
    const mockChecker = {
      require: vi.fn().mockResolvedValue(undefined)
    } as unknown as PermissionChecker;

    const controller = new MyController(mockChecker);
    
    await controller.myOperation('actor-123', input);

    expect(mockChecker.require).toHaveBeenCalledWith(
      'actor-123',
      'resource',
      'action'
    );
  });
});
```

## Security

The permission checker is designed with security in mind:

1. **Timing Attack Prevention**: All permission checks take consistent time regardless of outcome
2. **Enumeration Attack Prevention**: Generic error messages don't reveal user/permission details
3. **Error Handling**: Errors are logged but not exposed to prevent information leakage
4. **Input Validation**: All inputs are validated before processing

## Architecture

```
PermissionChecker (Imperative Shell Helper)
    ↓
CheckPermissionUseCase (Functional Core)
    ↓
PermissionRepository (Data Access)
    ↓
Database
```

The permission checker follows the same architectural principles as the rest of the application:
- **Imperative Shell**: Handles I/O and coordination
- **Functional Core**: Contains business logic
- **Repository**: Abstracts data access

## See Also

- [Permission Checking Documentation](../../../docs/permission-checking.md) - Complete guide
- [RBAC Documentation](../../../docs/rbac.md) - Understanding the RBAC system
- [Controller Guidelines](../../../.github/copilot-instructions.md) - Controller best practices
