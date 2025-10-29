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

## Adding New Features

### 1. Define Domain Types

```typescript
// src/domain/post.types.ts
export const CreatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
});
```

### 2. Create Database Schema

```typescript
// src/infrastructure/database/schema/posts.ts
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  deletedAt: timestamp('deleted_at'),
});
```

### 3. Create Repository

```typescript
// src/infrastructure/repositories/post.repository.ts
export class PostRepository extends BaseRepository<typeof posts> {
  // Add custom queries
}
```

### 4. Create Use Cases

```typescript
// src/use-cases/post/create-post.use-case.ts
export class CreatePostUseCase {
  execute(input: CreatePostInput): Promise<Post> {
    // Implementation
  }
}
```

### 5. Create API Routes

```typescript
// src/app/api/posts/route.ts
export async function POST(request: NextRequest) {
  // Implementation
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
