# Architecture Overview

This document provides a comprehensive overview of the application architecture, design patterns, and best practices used in this NextJS 16 template.

## Architecture Style

This template implements **Domain-Driven Design (DDD)** with a functional approach, focusing on:

- Clear separation of concerns
- Dependency inversion
- Testability
- Maintainability
- Scalability

## Layer Architecture

The application is structured in four distinct layers:

```
┌─────────────────────────────────────────┐
│         API Layer (Presentation)        │
│    Next.js App Router & API Routes     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Use Case Layer (Application)    │
│      Business Logic Orchestration       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Infrastructure Layer (Data Access)   │
│    Repositories, Database, External     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Domain Layer (Business Rules)     │
│    Entities, Types, Validation Rules    │
└─────────────────────────────────────────┘
```

### 1. Domain Layer (`src/domain/`)

**Purpose**: Defines the core business entities, types, and validation rules.

**Characteristics**:
- No dependencies on other layers
- Pure business logic
- Framework-agnostic
- Contains Zod schemas for validation

**Example**:
```typescript
// src/domain/user.types.ts
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

**Files**:
- `user.types.ts` - User entity types and validation schemas

### 2. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Handles all external concerns like database access, file storage, and third-party services.

**Characteristics**:
- Implements repository pattern
- Database schema definitions
- External service integrations
- Depends on Domain layer only

**Components**:

#### Database (`infrastructure/database/`)
- `schema/` - Drizzle ORM table definitions
- `migrations/` - Database migration files
- `client.ts` - Database connection setup
- `base-repository.ts` - Base class with CRUD operations and soft-delete

#### Repositories (`infrastructure/repositories/`)
- Concrete repository implementations
- Extend BaseRepository
- Add entity-specific query methods

**Example**:
```typescript
// src/infrastructure/repositories/user.repository.ts
export class UserRepository extends BaseRepository<typeof users> {
  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return results[0] || null;
  }
}
```

### 3. Use Case Layer (`src/use-cases/`)

**Purpose**: Orchestrates business logic by coordinating between domain entities and repositories.

**Characteristics**:
- Single responsibility (one use case per operation)
- Input validation using domain schemas
- Business rule enforcement
- Error handling
- Dependency injection ready

**Example**:
```typescript
// src/use-cases/user/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // 1. Validate
    const validatedData = CreateUserSchema.parse(input);
    
    // 2. Business rules
    const existingUser = await this.userRepository.findByEmail(
      validatedData.email
    );
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // 3. Execute
    return await this.userRepository.createUser(validatedData);
  }
}
```

### 4. API Layer (`src/app/api/`)

**Purpose**: Exposes use cases as HTTP endpoints using Next.js App Router.

**Characteristics**:
- HTTP request/response handling
- Status code management
- Error formatting
- Use case instantiation and execution

**Example**:
```typescript
// src/app/api/users/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userRepository = new UserRepository(db);
    const createUserUseCase = new CreateUserUseCase(userRepository);
    const user = await createUserUseCase.execute(body);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

## Key Design Patterns

### 1. Repository Pattern

Abstracts data access logic behind interfaces.

**Benefits**:
- Separation of concerns
- Easier testing (mock repositories)
- Database-agnostic business logic
- Centralized query logic

**Implementation**:
```typescript
class BaseRepository<T> {
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T | null>
  softDelete(id: string): Promise<T | null>
}
```

### 2. Use Case Pattern

Each business operation is encapsulated in a use case class.

**Benefits**:
- Single responsibility
- Clear business intent
- Testable in isolation
- Reusable across different entry points

**Structure**:
```typescript
class UseCase {
  constructor(dependencies) {}
  execute(input): Promise<output> {
    // 1. Validate input
    // 2. Check business rules
    // 3. Execute logic
    // 4. Return result
  }
}
```

### 3. Dependency Injection

Dependencies are passed through constructors.

**Benefits**:
- Loose coupling
- Easier testing
- Flexible implementations
- Clear dependencies

**Example**:
```typescript
const repository = new UserRepository(db);
const useCase = new CreateUserUseCase(repository);
await useCase.execute(input);
```

### 4. Soft Delete Pattern

Records are marked as deleted rather than physically removed.

**Benefits**:
- Data recovery
- Audit trails
- Referential integrity
- Compliance

**Implementation**:
- All tables have `deletedAt` timestamp
- Queries exclude soft-deleted by default
- `includeSoftDeleted` flag available

## Data Flow

### Create User Flow

```
1. Client Request
   POST /api/users
   { email: "user@example.com", name: "John" }
   
2. API Route Handler
   src/app/api/users/route.ts
   - Receives HTTP request
   - Parses JSON body
   
3. Use Case Instantiation
   - Creates UserRepository
   - Creates CreateUserUseCase
   
4. Use Case Execution
   src/use-cases/user/create-user.use-case.ts
   - Validates input with Zod schema
   - Checks if email already exists
   - Calls repository to create user
   
5. Repository Layer
   src/infrastructure/repositories/user.repository.ts
   - Executes database query
   - Returns created user
   
6. Response
   - Use case returns user
   - API route sends JSON response
   - Status: 201 Created
```

## Authentication Flow

Using Better Auth:

```
1. Sign Up
   POST /api/auth/sign-up
   → Better Auth Handler
   → Creates user in database
   → Returns session
   
2. Sign In
   POST /api/auth/sign-in
   → Better Auth Handler
   → Validates credentials
   → Creates session
   → Returns token
   
3. Protected Route
   GET /api/users
   → Check session via Better Auth
   → Execute use case if authenticated
   → Return data or 401
```

## Database Schema Design

### Conventions

1. **Primary Keys**: UUIDs for global uniqueness
2. **Timestamps**: `createdAt`, `updatedAt`, `deletedAt`
3. **Foreign Keys**: CASCADE delete for referential integrity
4. **Naming**: snake_case for columns, PascalCase for types

### Relationships

```typescript
users (1) ──── (N) sessions
users (1) ──── (N) accounts
```

### Soft Delete

All tables include:
```typescript
deletedAt: timestamp('deleted_at')
```

Queries automatically filter where `deletedAt IS NULL`.

## Error Handling

### Layers

1. **Domain Layer**: Validation errors (Zod)
2. **Use Case Layer**: Business rule violations
3. **Infrastructure Layer**: Database errors
4. **API Layer**: HTTP error responses

### Example

```typescript
try {
  const user = await useCase.execute(input);
  return NextResponse.json(user, { status: 201 });
} catch (error) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
  if (error.message === 'User already exists') {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    );
  }
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Testing Strategy

### Unit Tests

Test individual components in isolation:

```typescript
describe('CreateUserUseCase', () => {
  it('should create user', async () => {
    // Mock repository
    const mockRepo = { createUser: jest.fn() };
    const useCase = new CreateUserUseCase(mockRepo);
    
    await useCase.execute(validInput);
    
    expect(mockRepo.createUser).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test multiple layers together:

```typescript
describe('POST /api/users', () => {
  it('should create user', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject(userData);
  });
});
```

## Best Practices

### 1. Keep Layers Separate

- Domain doesn't import from Infrastructure
- Use Cases don't import from API
- Dependencies flow inward

### 2. Single Responsibility

- One use case per operation
- One repository per entity
- One API route per resource operation

### 3. Explicit Dependencies

```typescript
// Good
constructor(private repo: UserRepository) {}

// Bad
const repo = new UserRepository(db);
```

### 4. Type Safety

- Use TypeScript strictly
- Validate at boundaries (API, Database)
- Infer types from schemas

### 5. Error Handling

- Throw errors at the source
- Handle errors at the boundary (API layer)
- Provide meaningful error messages

## Scalability Considerations

### Horizontal Scaling

- Stateless API routes
- Session storage in database
- Database connection pooling

### Performance

- Database indexing on frequently queried columns
- Pagination for large result sets
- Caching strategies (Redis, etc.)

### Monitoring

- Structured logging
- Error tracking (Sentry)
- Performance metrics (APM)
- Audit logging (see [Audit Logging documentation](./audit-logging.md))

## Audit Logging

The application includes comprehensive audit logging to track all database operations. Every create, update, delete, and restore operation is automatically logged with:

- What changed (old values vs new values)
- Who made the change (actor ID)
- When it happened (timestamp)
- Context (metadata like IP address, request ID, etc.)

**Key Features**:
- Immutable audit trail for compliance
- Detailed change tracking for debugging
- Support for data recovery by examining historical states
- Follows functional DDD principles (logging in controller layer)

For detailed information, see the [Audit Logging documentation](./audit-logging.md).

## Adding New Features

### 1. Define Domain Types

```typescript
// src/domain/role.types.ts
export const CreateRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  groupId: z.string().uuid(),
});

export const AssignPermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});
```

### 2. Create Database Schema

```typescript
// src/infrastructure/database/schema/roles.ts
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 3. Create Repository

```typescript
// src/infrastructure/repositories/role.repository.ts
export class RoleRepository extends BaseRepository<typeof roles> {
  async findByGroup(groupId: string): Promise<Role[]> {
    return await this.db
      .select()
      .from(roles)
      .where(eq(roles.groupId, groupId));
  }
  
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    await this.db.insert(rolePermissions).values({ roleId, permissionId });
  }
}
```

### 4. Create Use Cases

```typescript
// src/use-cases/role/create-role.use-case.ts
export class CreateRoleUseCase {
  constructor(private readonly roleRepository: RoleRepository) {}
  
  async execute(input: CreateRoleInput): Promise<Role> {
    const validatedData = CreateRoleSchema.parse(input);
    return await this.roleRepository.create(validatedData);
  }
}
```

### 5. Create API Routes

```typescript
// src/app/api/roles/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const roleRepository = new RoleRepository(db);
  const createRoleUseCase = new CreateRoleUseCase(roleRepository);
  const role = await createRoleUseCase.execute(body);
  return NextResponse.json(role, { status: 201 });
}
```

## Conclusion

This architecture provides:

- **Clear separation of concerns**
- **Easy testing** at all layers
- **Flexibility** to change implementations
- **Scalability** for growing applications
- **Maintainability** through organized code

The DDD approach ensures that business logic stays at the center, independent of frameworks and infrastructure, making the application resilient to change and easy to understand.
