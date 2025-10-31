# Copilot Instructions for App Template Repository

## Repository Overview
This is a NextJS Full Stack App Template repository designed to provide a starting point for building full-stack web applications.

## Development Guidelines

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript/JavaScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth for email/password authentication
- **Testing**: Vitest with Testing Library
- **Type**: Full-stack web application template

### Code Style and Standards
- Follow Next.js best practices and conventions
- Use TypeScript for type safety when applicable
- Follow modern ES6+ JavaScript syntax
- Maintain consistent code formatting throughout the project

### Project Structure
- Follow Next.js standard directory structure
- Keep components modular and reusable
- Separate concerns between client and server code
- Use appropriate Next.js features (App Router, Server Components, etc.)

#### Architecture Layers (Functional DDD)
The project follows functional Domain-Driven Design principles with clear layer separation:

1. **API Layer** (`src/app/api/`)
   - HTTP request/response handling
   - Input validation using Zod schemas
   - Response formatting
   - Should be thin—delegate to controllers

2. **Controllers Layer** (`src/controllers/`) - **Imperative Shell**
   - Orchestrate operations between layers
   - Initialize and coordinate repositories and use cases
   - Handle all I/O operations (database, external services)
   - Take actions, don't make business decisions
   - Use dependency injection for testability

3. **Use Cases Layer** (`src/use-cases/`) - **Functional Core**
   - Contain business logic and rules
   - Pure functions where possible
   - Validate business constraints
   - Make business decisions
   - Independent of infrastructure concerns

4. **Repository Layer** (`src/infrastructure/repositories/`)
   - Data access and persistence
   - Database queries
   - Abstract database implementation details

5. **Domain Layer** (`src/domain/`)
   - Type definitions and schemas
   - Domain models
   - Validation schemas (Zod)

**Dependency Flow**: API → Controllers → Use Cases → Repositories → Database

**Key Principle**: Controllers (Imperative Shell) handle I/O and coordination. Use Cases (Functional Core) handle business logic. Never mix these concerns.

### Development Practices
- Write clean, maintainable, and well-documented code
- Follow React and Next.js best practices
- Ensure responsive design for all UI components
- Optimize for performance and SEO
- Handle errors gracefully with proper error boundaries

### Testing
- Use Vitest as the testing framework (not Jest)
- Write comprehensive unit, component, and integration tests
- Use Testing Library for component testing
- Mock external dependencies with vi.fn() from Vitest
- Write tests for critical functionality including use cases and domain logic
- Ensure components are testable and follow best practices
- Test both client and server-side code when applicable
- Use in-memory mocks for integration tests

### Dependencies
- Keep dependencies up to date
- Prefer well-maintained and widely-used packages
- Document any significant dependencies and their purpose

### Documentation
- Maintain clear and concise README documentation
- Document any setup steps or configuration requirements
- Provide examples for common use cases
- Keep inline code comments for complex logic

## Copilot Usage Guidelines
When assisting with this repository:
- Respect the Next.js framework conventions
- Maintain consistency with existing code patterns
- Provide modern, up-to-date solutions
- Consider both development and production environments
- Ensure accessibility standards are met
- Follow security best practices

### Working with Controllers
When creating or modifying API endpoints:

1. **Keep API endpoints thin**: They should only handle HTTP concerns (parsing, validation, response formatting)
2. **Use Controllers for orchestration**: All coordination logic goes in controllers, not in API routes
3. **Don't import `db` in API routes**: Only controllers should know about database connections
4. **Don't instantiate repositories in API routes**: Controllers handle repository initialization
5. **Pattern for API routes**:
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateSchema.parse(body);  // Validation
  
  const controller = new EntityController();       // Controller handles everything else
  const result = await controller.createEntity(validatedData);
  
  return NextResponse.json(result, { status: 201 });
}
```

### Creating New Controllers

1. **Name**: Use `EntityController` naming convention (e.g., `UserController`, `OrderController`)
2. **Location**: Place in `src/controllers/entity.controller.ts`
3. **Pattern**: Follow existing controller pattern with dependency injection:
```typescript
export class EntityController {
  private readonly repository: EntityRepository;
  private readonly useCases: UseCaseTypes;

  constructor(
    repository?: EntityRepository,
    useCase?: UseCase,
    // Optional params for testing (dependency injection)
  ) {
    // Initialize or use injected dependencies
    this.repository = repository || new EntityRepository(db);
    this.useCase = useCase || new UseCase(this.repository);
  }

  async operation(input: Input): Promise<Output> {
    return await this.useCase.execute(input);
  }
}
```
4. **Export**: Add to `src/controllers/index.ts`
5. **Test**: Create tests in `src/__tests__/controllers/` using dependency injection
6. **Documentation**: Add inline comments explaining coordination logic

### Controller Best Practices

**DO**:
- ✅ Coordinate between repositories and use cases
- ✅ Handle infrastructure concerns (db, external APIs)
- ✅ Manage transaction boundaries
- ✅ Use dependency injection for testability
- ✅ Keep methods focused on coordination
- ✅ Enforce RBAC permissions before operations

**DON'T**:
- ❌ Include business logic (that's for use cases)
- ❌ Make business decisions (use cases decide, controllers act)
- ❌ Validate business rules (use cases validate)
- ❌ Calculate derived values (use cases calculate)

**Remember**: Controllers take actions, Use Cases make decisions.

### Permission Checking in Controllers

Controllers are responsible for enforcing RBAC permissions before executing operations. This is part of the Imperative Shell's coordination role.

**Pattern**:
```typescript
import { PermissionChecker } from '@/lib/permissions';

export class EntityController {
  private readonly permissionChecker: PermissionChecker;

  constructor(
    repository?: EntityRepository,
    useCase?: UseCase,
    permissionChecker?: PermissionChecker
  ) {
    this.repository = repository || new EntityRepository(db);
    this.useCase = useCase || new UseCase(this.repository);
    this.permissionChecker = permissionChecker || new PermissionChecker();
  }

  async operation(actorId: string, input: Input): Promise<Output> {
    // 1. Check permission (Imperative Shell responsibility)
    await this.permissionChecker.require(actorId, 'resource', 'action');
    
    // 2. Execute business logic (Functional Core)
    return await this.useCase.execute(input);
  }
}
```

**Security Guidelines**:
- ✅ Always pass `actorId` as the first parameter to controller methods
- ✅ Use `permissionChecker.require()` to throw on denied access
- ✅ Use generic "Forbidden" errors that don't leak information
- ✅ Check permissions before any business logic or database queries
- ✅ Test both authorized and unauthorized scenarios
- ❌ Never reveal user existence, role structure, or permission details in errors
- ❌ Don't skip permission checks even for "read" operations

**Permission Naming Convention**: Use `resource:action` format
- Resources: `users`, `reports`, `settings`, `orders`, etc.
- Actions: `read`, `write`, `delete`, `manage`, etc.
- Examples: `users:read`, `users:write`, `users:delete`, `reports:manage`

**Common Patterns**:
```typescript
// Read operation
async getEntity(actorId: string, id: string): Promise<Entity | null> {
  await this.permissionChecker.require(actorId, 'entities', 'read');
  return await this.useCase.execute(id);
}

// Write operation (create/update)
async createEntity(actorId: string, input: CreateInput): Promise<Entity> {
  await this.permissionChecker.require(actorId, 'entities', 'write');
  return await this.useCase.execute(input);
}

// Delete operation
async deleteEntity(actorId: string, id: string): Promise<Entity | null> {
  await this.permissionChecker.require(actorId, 'entities', 'delete');
  return await this.useCase.execute(id);
}

// Multiple permissions (requires all)
async complexOperation(actorId: string, input: Input): Promise<Result> {
  const hasAll = await this.permissionChecker.hasAll(actorId, [
    { resource: 'users', action: 'read' },
    { resource: 'reports', action: 'write' },
  ]);
  if (!hasAll) throw new Error('Forbidden');
  return await this.useCase.execute(input);
}
```

**API Route Pattern with Permission Checks**:
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input
    const body = await request.json();
    const validatedData = CreateSchema.parse(body);

    // 3. Execute (includes permission check)
    const controller = new EntityController();
    const result = await controller.createEntity(session.user.id, validatedData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Handle other errors...
  }
}
```

For more details, see [Permission Checking Documentation](../docs/permission-checking.md).

### Audit Logging in Controllers

Controllers are responsible for logging all database operations for compliance and debugging. This is part of the Imperative Shell's coordination role.

**Pattern**:
```typescript
import { AuditLogger } from '@/lib/audit-logger';
import { AuditLogRepository } from '@/infrastructure/repositories/audit-log.repository';

export class EntityController {
  private readonly permissionChecker: PermissionChecker;
  private readonly auditLogger: AuditLogger;

  constructor(
    repository?: EntityRepository,
    useCase?: UseCase,
    permissionChecker?: PermissionChecker,
    auditLogger?: AuditLogger
  ) {
    this.repository = repository || new EntityRepository(db);
    this.useCase = useCase || new UseCase(this.repository);
    this.permissionChecker = permissionChecker || new PermissionChecker();
    
    const auditLogRepository = new AuditLogRepository(db);
    this.auditLogger = auditLogger || new AuditLogger(auditLogRepository);
  }

  async createEntity(actorId: string, input: CreateInput): Promise<Entity> {
    // 1. Check permission
    await this.permissionChecker.require(actorId, 'entities', 'write');
    
    // 2. Execute business logic
    const entity = await this.useCase.execute(input);
    
    // 3. Log the operation (Imperative Shell responsibility)
    await this.auditLogger.logCreate(
      'entity',
      entity.id,
      actorId,
      this.sanitizeEntityForAudit(entity)
    );
    
    return entity;
  }

  async updateEntity(actorId: string, id: string, input: UpdateInput): Promise<Entity | null> {
    await this.permissionChecker.require(actorId, 'entities', 'write');
    
    // Get old values BEFORE update for audit trail
    const oldEntity = await this.repository.findById(id);
    
    const updatedEntity = await this.useCase.execute(id, input);
    
    // Log with both old and new values
    if (updatedEntity && oldEntity) {
      await this.auditLogger.logUpdate(
        'entity',
        updatedEntity.id,
        actorId,
        this.sanitizeEntityForAudit(oldEntity),
        this.sanitizeEntityForAudit(updatedEntity)
      );
    }
    
    return updatedEntity;
  }

  async deleteEntity(actorId: string, id: string): Promise<Entity | null> {
    await this.permissionChecker.require(actorId, 'entities', 'delete');
    
    // Get old values BEFORE delete for audit trail
    const oldEntity = await this.repository.findById(id);
    
    const deletedEntity = await this.useCase.execute(id);
    
    if (deletedEntity && oldEntity) {
      await this.auditLogger.logDelete(
        'entity',
        deletedEntity.id,
        actorId,
        this.sanitizeEntityForAudit(oldEntity)
      );
    }
    
    return deletedEntity;
  }

  // Sanitize data before logging - remove sensitive fields
  private sanitizeEntityForAudit(entity: Entity): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      // Don't log passwords, tokens, credit cards, etc.
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }
}
```

**Audit Logging Guidelines**:
- ✅ Log all CREATE, UPDATE, DELETE, RESTORE operations
- ✅ Always sanitize data before logging (remove passwords, tokens, sensitive PII)
- ✅ Fetch old values BEFORE update/delete operations
- ✅ Log in controllers (Imperative Shell), not use cases (Functional Core)
- ✅ Include actorId to track who made changes
- ✅ Use metadata field for additional context (IP, user agent, etc.)
- ✅ Mock audit logger in tests for dependency injection
- ❌ Don't log READ operations (except for sensitive data)
- ❌ Don't log raw entity data without sanitization
- ❌ Don't skip logging on successful operations

**Testing Audit Logging**:
```typescript
describe('EntityController', () => {
  let mockAuditLogger: { logCreate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuditLogger = {
      logCreate: vi.fn().mockResolvedValue(undefined),
      logUpdate: vi.fn().mockResolvedValue(undefined),
      logDelete: vi.fn().mockResolvedValue(undefined),
    };

    controller = new EntityController(
      mockRepository,
      mockUseCase,
      mockPermissionChecker,
      mockAuditLogger as unknown as AuditLogger
    );
  });

  it('should log entity creation', async () => {
    await controller.createEntity(actorId, input);

    expect(mockAuditLogger.logCreate).toHaveBeenCalledWith(
      'entity',
      expect.any(String),
      actorId,
      expect.objectContaining({ name: input.name })
    );
  });
});
```

For more details, see [Audit Logging Documentation](../docs/audit-logging.md).
