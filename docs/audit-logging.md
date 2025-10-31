# Audit Logging

This document describes the audit logging system implemented in the application, which tracks all database operations for compliance, debugging, and security purposes.

## Overview

The audit logging system records every create, update, delete, and restore operation performed on database entities. Each audit log entry includes:

- **What** changed (old values vs new values)
- **Who** made the change (actor ID)
- **When** it happened (timestamp)
- **Where** it happened (entity type and ID)
- **Context** (optional metadata like IP address, user agent, etc.)

## Architecture

The audit logging system follows the existing functional DDD architecture with three key components:

### 1. Database Schema

**Location**: `src/infrastructure/database/schema/audit-logs.ts`

The `audit_logs` table stores immutable records of all database operations:

```typescript
{
  id: uuid,              // Unique identifier for the log entry
  operation: string,     // 'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'READ'
  entityType: string,    // Type of entity (e.g., 'user', 'role')
  entityId: string,      // ID of the affected entity
  actorId: uuid,         // ID of the user who performed the action
  oldValues: jsonb,      // Previous state (null for CREATE)
  newValues: jsonb,      // New state (null for DELETE)
  metadata: jsonb,       // Additional context (IP, user agent, etc.)
  timestamp: timestamp   // When the operation occurred
}
```

**Key Design Decisions**:
- Audit logs are **immutable** - they can never be updated or deleted
- JSONB columns store flexible data structures for old/new values
- Foreign key to users table with **SET NULL** on delete (preserves audit logs even when users are deleted)
- Actor ID becomes null when user is deleted, maintaining the audit trail for compliance
- No soft delete on audit logs - they're permanent records

### 2. Repository Layer

**Location**: `src/infrastructure/repositories/audit-log.repository.ts`

The `AuditLogRepository` provides data access methods for audit logs:

```typescript
class AuditLogRepository {
  create(data: NewAuditLog): Promise<AuditLog>
  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>
  findByActor(actorId: string): Promise<AuditLog[]>
  findByOperation(operation: string): Promise<AuditLog[]>
  findAll(limit?: number, offset?: number): Promise<AuditLog[]>
  findById(id: string): Promise<AuditLog | null>
}
```

**Important**: Unlike other repositories, `AuditLogRepository` does **not** extend `BaseRepository` because:
- Audit logs should never be updated
- Audit logs should never be deleted (soft or hard)
- They have different query patterns (time-based, entity-based)

### 3. Service Layer

**Location**: `src/lib/audit-logger.ts`

The `AuditLogger` service provides a convenient API for creating audit logs:

```typescript
class AuditLogger {
  // Generic logging method
  log(params: {
    operation: AuditOperation;
    entityType: string;
    entityId: string;
    actorId: string;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<AuditLog>

  // Convenience methods for specific operations
  logCreate(entityType, entityId, actorId, newValues, metadata?)
  logUpdate(entityType, entityId, actorId, oldValues, newValues, metadata?)
  logDelete(entityType, entityId, actorId, oldValues, metadata?)
  logRestore(entityType, entityId, actorId, newValues, metadata?)
  logRead(entityType, entityId, actorId, metadata?)
}
```

## Integration with Controllers

Audit logging happens in the **controller layer** (Imperative Shell), not in use cases or repositories. This follows functional DDD principles:

- **Controllers** handle side effects like logging (Imperative Shell)
- **Use Cases** handle business logic (Functional Core)
- **Repositories** handle data access only

### Example: UserController

```typescript
export class UserController {
  private readonly auditLogger: AuditLogger;

  async createUser(actorId: string, input: CreateUserInput): Promise<User> {
    // 1. Check permissions
    await this.permissionChecker.require(actorId, 'users', 'write');
    
    // 2. Execute business logic
    const user = await this.createUserUseCase.execute(input);
    
    // 3. Log the operation (side effect in controller)
    await this.auditLogger.logCreate(
      'user',
      user.id,
      actorId,
      this.sanitizeUserForAudit(user)
    );
    
    return user;
  }

  async updateUser(actorId: string, id: string, input: UpdateUserInput) {
    await this.permissionChecker.require(actorId, 'users', 'write');
    
    // Get old values BEFORE update for audit trail
    const oldUser = await this.userRepository.findById(id);
    
    const updatedUser = await this.updateUserUseCase.execute(id, input);
    
    // Log with both old and new values
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

  // Sanitize sensitive data before logging
  private sanitizeUserForAudit(user: User): Record<string, unknown> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      // Don't log passwords, tokens, or other sensitive data
    };
  }
}
```

## Operation Types

The system supports five operation types:

### CREATE
- Records entity creation
- `oldValues`: null
- `newValues`: The created entity
- Example: New user registration

### UPDATE
- Records entity modification
- `oldValues`: State before update
- `newValues`: State after update
- Example: User profile update

### DELETE
- Records soft deletion
- `oldValues`: State before deletion
- `newValues`: null
- Example: User account deactivation

### RESTORE
- Records restoration of soft-deleted entity
- `oldValues`: null
- `newValues`: Restored entity state
- Example: Reactivating a deleted user

### READ
- Records access to sensitive data
- `oldValues`: null
- `newValues`: null
- `metadata`: Context about the access
- **Use sparingly**: Only log reads of sensitive data to avoid log bloat

## Data Sanitization

Always sanitize data before logging to protect sensitive information:

```typescript
private sanitizeUserForAudit(user: User): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    // NEVER log:
    // - passwords (hashed or not)
    // - tokens
    // - API keys
    // - credit card numbers
    // - SSNs or other PII
  };
}
```

## Metadata

Use the `metadata` field to capture additional context:

```typescript
await this.auditLogger.logUpdate(
  'user',
  user.id,
  actorId,
  oldValues,
  newValues,
  {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    source: 'api',
    reason: 'admin action'
  }
);
```

## Querying Audit Logs

The repository provides several query methods:

```typescript
// Get all changes to a specific entity
const userAuditTrail = await auditLogRepository.findByEntity('user', userId);

// Get all actions by a specific user
const userActions = await auditLogRepository.findByActor(actorId);

// Get all deletions
const deletions = await auditLogRepository.findByOperation('DELETE');

// Get recent logs (with pagination)
const recentLogs = await auditLogRepository.findAll(100, 0);
```

## Use Cases

### 1. Compliance & Auditing
- Track who made changes and when
- Prove compliance with data protection regulations (GDPR, HIPAA, etc.)
- Generate audit reports for security reviews

### 2. Debugging
- Investigate data corruption issues
- Trace how data changed over time
- Identify the source of bugs

### 3. Security
- Detect unauthorized access or modifications
- Monitor suspicious activity patterns
- Track administrative actions

### 4. Data Recovery
- Restore previous states by examining old values
- Undo accidental deletions
- Reverse unauthorized changes

## Best Practices

### 1. Log at the Controller Layer
✅ **DO**: Log in controllers (Imperative Shell)
```typescript
async createUser(actorId: string, input: CreateUserInput) {
  const user = await this.createUserUseCase.execute(input);
  await this.auditLogger.logCreate('user', user.id, actorId, user);
  return user;
}
```

❌ **DON'T**: Log in use cases or repositories
```typescript
// Wrong - use cases should be pure business logic
async execute(input: CreateUserInput) {
  const user = await this.repository.create(input);
  await this.auditLogger.logCreate(...); // ❌ Side effect in use case
  return user;
}
```

### 2. Always Sanitize Data
✅ **DO**: Remove sensitive information
```typescript
this.sanitizeUserForAudit(user) // Returns safe data
```

❌ **DON'T**: Log raw entity data
```typescript
await this.auditLogger.logCreate('user', user.id, actorId, user); // ❌ May contain passwords
```

### 3. Capture Old Values for Updates/Deletes
✅ **DO**: Fetch old values before modification
```typescript
const oldUser = await this.repository.findById(id);
const updatedUser = await this.useCase.execute(id, input);
await this.auditLogger.logUpdate('user', id, actorId, oldUser, updatedUser);
```

❌ **DON'T**: Skip old values
```typescript
const user = await this.useCase.execute(id, input);
await this.auditLogger.logUpdate('user', id, actorId, null, user); // ❌ Lost history
```

### 4. Use Metadata for Context
✅ **DO**: Include relevant context
```typescript
await this.auditLogger.logDelete('user', id, actorId, oldValues, {
  reason: 'GDPR right to be forgotten',
  requestId: request.id,
  ip: request.ip
});
```

### 5. Don't Log Everything
- **DO log**: Create, Update, Delete, Restore operations
- **DON'T log**: Read operations (except for sensitive data)
- **DON'T log**: List/search operations (would create excessive logs)

### 6. Test with Mocks
Always mock the audit logger in tests:

```typescript
const mockAuditLogger = {
  logCreate: vi.fn(),
  logUpdate: vi.fn(),
  logDelete: vi.fn(),
};

const controller = new UserController(
  mockRepository,
  mockUseCase,
  mockPermissionChecker,
  mockAuditLogger
);
```

## Adding Audit Logging to New Controllers

When creating a new controller, follow this pattern:

1. **Inject AuditLogger in constructor**:
```typescript
export class OrderController {
  private readonly auditLogger: AuditLogger;

  constructor(
    // ... other dependencies
    auditLogger?: AuditLogger
  ) {
    const auditLogRepository = new AuditLogRepository(db);
    this.auditLogger = auditLogger || new AuditLogger(auditLogRepository);
  }
}
```

2. **Create sanitization method**:
```typescript
private sanitizeOrderForAudit(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    userId: order.userId,
    total: order.total,
    status: order.status,
    // Don't include payment details, credit cards, etc.
  };
}
```

3. **Log operations**:
```typescript
async createOrder(actorId: string, input: CreateOrderInput) {
  await this.permissionChecker.require(actorId, 'orders', 'write');
  
  const order = await this.createOrderUseCase.execute(input);
  
  await this.auditLogger.logCreate(
    'order',
    order.id,
    actorId,
    this.sanitizeOrderForAudit(order)
  );
  
  return order;
}
```

## Performance Considerations

### Database Impact
- Audit logs are write-heavy (every CUD operation creates a log)
- Use database indexing on frequently queried columns:
  - `entity_type` + `entity_id` (composite index)
  - `actor_id`
  - `timestamp`
  - `operation`

### Storage
- JSONB columns can grow large over time
- Consider:
  - Archiving old logs (e.g., move logs older than 1 year to cold storage)
  - Retention policies (e.g., delete logs after 7 years)
  - Compression for archived logs

### Async Logging (Future Enhancement)
For high-throughput systems, consider making audit logging asynchronous:
- Use a message queue (Redis, RabbitMQ)
- Controller publishes audit events
- Background worker consumes and writes to database
- Prevents logging from slowing down user operations

## Security Considerations

### 1. Protect Audit Logs
- Audit logs are sensitive - they reveal system activity
- Restrict access to audit logs to administrators only
- Consider separate permissions for viewing audit logs

### 2. Prevent Tampering
- Audit logs are immutable by design
- Database constraints prevent updates/deletes
- Consider additional measures:
  - Cryptographic signatures on log entries
  - Write logs to write-once storage
  - Regular integrity checks

### 3. Privacy & Compliance
- Be mindful of data retention laws (GDPR, CCPA, etc.)
- Implement retention policies
- Provide mechanisms for users to request their audit history
- **Audit Trail Preservation**: When a user is deleted, their audit logs are preserved with `actorId` set to NULL
  - This maintains compliance by keeping the audit trail intact
  - The logs still show what changed and when, just not who (since user was deleted)
  - This balances "right to be forgotten" with regulatory compliance requirements

## Testing

Always test audit logging in your controllers:

```typescript
describe('UserController', () => {
  it('should log user creation', async () => {
    const mockAuditLogger = {
      logCreate: vi.fn().mockResolvedValue(undefined)
    };

    const controller = new UserController(
      mockRepository,
      mockUseCase,
      mockPermissionChecker,
      mockAuditLogger
    );

    await controller.createUser(actorId, input);

    expect(mockAuditLogger.logCreate).toHaveBeenCalledWith(
      'user',
      expect.any(String),
      actorId,
      expect.objectContaining({ email: input.email })
    );
  });
});
```

## Future Enhancements

Potential improvements to consider:

1. **Audit Log Viewer UI**
   - Admin dashboard to browse audit logs
   - Filter by entity, actor, operation, date range
   - Export to CSV/JSON

2. **Change Diff Visualization**
   - Show before/after comparison
   - Highlight what changed
   - Make it easy to understand changes

3. **Automated Alerts**
   - Notify admins of suspicious activity
   - Alert on bulk deletions
   - Monitor failed permission checks

4. **Compliance Reports**
   - Generate GDPR compliance reports
   - Track data access for audits
   - Automated retention policy enforcement

5. **Performance Optimization**
   - Async logging with message queue
   - Log aggregation service
   - Time-series database for better query performance

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Controllers](../src/controllers/README.md)
- [Testing Guide](./testing.md)
- [Security](./security-summary-permission-checking.md)
