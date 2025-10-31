# Controllers (Imperative Shell)

This directory contains the application's controllers, which serve as the orchestration/coordination layer following functional Domain-Driven Design principles.

## What are Controllers?

Controllers represent the **Imperative Shell** in functional DDD architecture. They:

- **Coordinate** asynchronous system operations
- **Retrieve** data from repositories
- **Call** use cases for business decisions
- **Execute** side effects based on use case outcomes
- **Handle** all I/O operations (database, external services, etc.)

## Key Principle: Take Actions, Don't Make Business Decisions

Controllers should:
- ✅ Orchestrate calls to repositories and use cases
- ✅ Handle infrastructure concerns (database connections, etc.)
- ✅ Coordinate I/O operations
- ✅ Manage transaction boundaries

Controllers should NOT:
- ❌ Contain business logic
- ❌ Make business decisions
- ❌ Implement validation rules
- ❌ Calculate derived values

Business logic belongs in **Use Cases** (Functional Core), not Controllers.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         API Layer (Next.js Routes)          │
│  - HTTP request/response handling           │
│  - Input validation (Zod schema parsing)    │
│  - Response formatting                      │
└─────────────────┬───────────────────────────┘
                  │ (validated input)
                  ▼
┌─────────────────────────────────────────────┐
│         Controllers (Imperative Shell)       │
│  - Orchestrate operations                   │
│  - Initialize repositories & use cases      │
│  - Coordinate I/O                           │
│  - Handle infrastructure concerns           │
└─────────────────┬───────────────────────────┘
                  │ (validated input)
                  ▼
┌─────────────────────────────────────────────┐
│         Use Cases (Functional Core)          │
│  - Business logic                           │
│  - Business rules validation                │
│  - Domain operations                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│              Repositories                    │
│  - Data access                              │
│  - Database queries                         │
└─────────────────────────────────────────────┘
```

## Validation Strategy

**Input Validation** (format, types, constraints):
- ✅ Happens at the **API layer** using Zod schemas
- Controllers and Use Cases receive already-validated typed input
- Prevents duplicate validation across layers

**Business Rules Validation** (domain logic):
- ✅ Happens in **Use Cases**
- Examples: "User email must be unique", "Order must have at least one item"
- These are business constraints, not input format checks

## Controller Pattern

Each controller follows this pattern:

```typescript
export class UserController {
  private readonly userRepository: UserRepository;
  private readonly createUserUseCase: CreateUserUseCase;
  // ... other dependencies

  constructor(
    // Optional dependencies for testing (dependency injection)
    userRepository?: UserRepository,
    createUserUseCase?: CreateUserUseCase,
    // ...
  ) {
    // Initialize infrastructure or use injected dependencies
    this.userRepository = userRepository || new UserRepository(db);
    this.createUserUseCase = createUserUseCase || new CreateUserUseCase(this.userRepository);
    // ...
  }

  /**
   * Coordinate user creation
   * - Calls use case for business logic
   * - Use case handles validation and business rules
   */
  async createUser(input: CreateUserInput): Promise<User> {
    return await this.createUserUseCase.execute(input);
  }

  /**
   * Coordinate user retrieval
   * - Simple repository query
   * - No business logic needed
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }
}
```

## Benefits of Controllers

### 1. Separation of Concerns
- API layer focuses on HTTP concerns
- Controllers handle coordination
- Use cases contain business logic
- Repositories handle data access

### 2. Testability
- Controllers can be tested with mocked dependencies
- Use dependency injection for easy testing
- Business logic (use cases) tested separately

### 3. Reusability
- Controllers can be called from multiple entry points:
  - HTTP APIs
  - GraphQL resolvers
  - CLI commands
  - Background jobs
  - WebSocket handlers

### 4. Maintainability
- Changes to infrastructure don't affect business logic
- Changes to business logic don't affect coordination
- Clear boundaries between layers

### 5. Abstraction
- API endpoints don't need to know about:
  - Database implementation
  - Repository structure
  - Use case internals
- They only need to know about controllers

## Usage in API Routes

Before (without controllers):
```typescript
// Too much logic in endpoint
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateUserSchema.parse(body);
  
  // Endpoint knows about db, repository, and use case
  const userRepository = new UserRepository(db);
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const user = await createUserUseCase.execute(validatedData);
  
  return NextResponse.json(user, { status: 201 });
}
```

After (with controllers):
```typescript
// Thin endpoint, delegates to controller
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateUserSchema.parse(body);
  
  // Endpoint only knows about controller
  const controller = new UserController();
  const user = await controller.createUser(validatedData);
  
  return NextResponse.json(user, { status: 201 });
}
```

## Creating New Controllers

When creating a new controller:

1. **Identify the domain** (e.g., User, Order, Product)

2. **Create the controller file**
```typescript
// controllers/order.controller.ts
export class OrderController {
  private readonly orderRepository: OrderRepository;
  private readonly createOrderUseCase: CreateOrderUseCase;

  constructor(
    orderRepository?: OrderRepository,
    createOrderUseCase?: CreateOrderUseCase
  ) {
    this.orderRepository = orderRepository || new OrderRepository(db);
    this.createOrderUseCase = createOrderUseCase || new CreateOrderUseCase(this.orderRepository);
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return await this.createOrderUseCase.execute(input);
  }

  async getOrders(): Promise<Order[]> {
    return await this.orderRepository.findAll();
  }
}
```

3. **Export from index.ts**
```typescript
// controllers/index.ts
export { UserController } from './user.controller';
export { OrderController } from './order.controller';
```

4. **Write tests**
```typescript
// __tests__/controllers/order.controller.test.ts
describe('OrderController', () => {
  let controller: OrderController;
  let mockRepository: OrderRepository;
  let mockUseCase: CreateOrderUseCase;

  beforeEach(() => {
    mockRepository = { /* ... */ } as unknown as OrderRepository;
    mockUseCase = { execute: vi.fn() } as unknown as CreateOrderUseCase;
    controller = new OrderController(mockRepository, mockUseCase);
  });

  it('should create an order', async () => {
    // Test implementation
  });
});
```

5. **Use in API routes**
```typescript
// app/api/orders/route.ts
import { OrderController } from '@/controllers';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = CreateOrderSchema.parse(body);
  
  const controller = new OrderController();
  const order = await controller.createOrder(validatedData);
  
  return NextResponse.json(order, { status: 201 });
}
```

## Testing Controllers

Controllers are highly testable using dependency injection:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from '@/controllers/user.controller';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';

describe('UserController', () => {
  let controller: UserController;
  let mockUserRepository: UserRepository;
  let mockCreateUserUseCase: CreateUserUseCase;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      createUser: vi.fn(),
    } as unknown as UserRepository;

    mockCreateUserUseCase = {
      execute: vi.fn(),
    } as unknown as CreateUserUseCase;

    // Inject mocks via constructor
    controller = new UserController(
      mockUserRepository,
      mockCreateUserUseCase
    );
  });

  it('should create a user', async () => {
    const input = { email: 'test@example.com', name: 'Test' };
    const expectedUser = { id: '1', ...input };

    vi.mocked(mockCreateUserUseCase.execute).mockResolvedValue(expectedUser);

    const result = await controller.createUser(input);

    expect(result).toEqual(expectedUser);
    expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(input);
  });
});
```

## Functional DDD Principles

Controllers follow these functional DDD principles:

### Imperative Shell
- Handle all side effects and I/O
- Coordinate between pure business logic and external systems
- Keep this layer thin—just coordination, no decisions

### Separation from Functional Core
- **Controllers (Imperative Shell)**: I/O, coordination, infrastructure
- **Use Cases (Functional Core)**: Business logic, validation, calculations

### Unidirectional Dependencies
```
API → Controllers → Use Cases → Repositories → Database
```
No layer should depend on layers above it.

### Testing Strategy
- **Controllers**: Integration-style tests with mocked dependencies
- **Use Cases**: Pure unit tests, no I/O mocking needed
- **Repositories**: Integration tests with test database

## When to Add Logic to Controllers

### ✅ Add to Controller When:
- Coordinating multiple repositories
- Managing transactions
- Calling external services
- Sending emails or notifications
- Handling file uploads/downloads
- Coordinating multiple use cases

### ❌ Don't Add to Controller When:
- Implementing business rules → Use Cases
- Validating business constraints → Use Cases
- Calculating derived values → Use Cases
- Making business decisions → Use Cases

### Simple Queries: Use Case or Direct Repository?

For **simple data retrieval** with no business logic:
- ✅ **Direct repository call** - When it's just fetching data (e.g., `findAll()`, `findById()`)
- ✅ **Use case** - When there's any business logic, filtering, or transformation

For **operations with business logic**:
- ✅ **Always use a use case** - Create, update, delete operations typically have business rules

Example:
```typescript
// Simple query - OK to call repository directly
async getAllUsers(): Promise<User[]> {
  return await this.userRepository.findAll();
}

// Has business logic - use a use case
async createUser(input: CreateUserInput): Promise<User> {
  return await this.createUserUseCase.execute(input);
}
```

Remember: **Controllers take actions, Use Cases make decisions.**

## Additional Resources

- [Functional Domain-Driven Design Simplified](https://antman-does-software.com/functional-domain-driven-design-simplified)
- See `/docs` for more architecture documentation
- See `/use-cases/README.md` for Use Case patterns
- See `/infrastructure/repositories` for Repository patterns
