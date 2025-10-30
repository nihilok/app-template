# Testing Guide

This document explains the testing strategy and practices for this application.

## Testing Stack

- **Vitest** - Fast, modern testing framework with native ESM and TypeScript support
- **Testing Library** - React component testing utilities
- **jsdom** - DOM implementation for testing browser-like environments

## Test Structure

Tests are organized alongside the code they test:

```
src/
├── __tests__/
│   ├── use-cases/
│   │   └── create-user.test.ts
│   ├── repositories/
│   │   └── user.repository.test.ts
│   └── api/
│       └── users.test.ts
└── components/
    └── __tests__/
        └── Button.test.tsx
```

## Running Tests

### Run All Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### UI Mode

Vitest provides a beautiful UI for running and debugging tests:

```bash
npm run test:ui
```

### Coverage Report

```bash
npm run test:coverage
```

### Run Specific Test

```bash
npm run test -- create-user.test.ts
```

### Run Tests Matching Pattern

```bash
npm run test -- -t "should create a user"
```

## Writing Tests

### Use Case Tests

Use cases are the easiest to test because they're isolated from external dependencies.

Example:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = {
      findByEmail: vi.fn(),
      createUser: vi.fn(),
    } as unknown as UserRepository;

    // Instantiate use case with mock
    createUserUseCase = new CreateUserUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const input = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const expectedUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUserRepository.createUser).mockResolvedValue(expectedUser);

      // Act
      const result = await createUserUseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.createUser).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const input = {
        email: 'existing@example.com',
        name: 'Test User',
      };

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
        id: '123',
        email: 'existing@example.com',
        name: 'Existing User',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      // Act & Assert
      await expect(createUserUseCase.execute(input)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const input = {
        email: 'invalid-email',
        name: 'Test User',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(input)).rejects.toThrow();
    });
  });
});
```

### Repository Tests

Repository tests typically require database integration:

```typescript
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { db } from '@/infrastructure/database/client';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeAll(() => {
    repository = new UserRepository(db);
  });

  beforeEach(async () => {
    // Clean database before each test
    await db.delete(users);
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const user = await repository.createUser(userData);

      expect(user).toMatchObject(userData);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.deletedAt).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await repository.createUser(userData);
      const user = await repository.findByEmail('test@example.com');

      expect(user).toMatchObject(userData);
    });

    it('should not find soft-deleted user by default', async () => {
      const user = await repository.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      await repository.softDelete(user.id);
      const foundUser = await repository.findByEmail('test@example.com');

      expect(foundUser).toBeNull();
    });

    it('should find soft-deleted user when includeSoftDeleted is true', async () => {
      const user = await repository.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      await repository.softDelete(user.id);
      const foundUser = await repository.findByEmail('test@example.com', true);

      expect(foundUser).toBeDefined();
      expect(foundUser?.deletedAt).toBeInstanceOf(Date);
    });
  });
});
```

### Integration Tests

Test complete workflows with in-memory storage:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';

describe('User Workflow Integration Tests', () => {
  let createUserUseCase: CreateUserUseCase;
  let getUserUseCase: GetUserUseCase;
  let updateUserUseCase: UpdateUserUseCase;
  
  // In-memory storage for testing
  const mockDatabase = new Map();

  beforeEach(() => {
    mockDatabase.clear();
    // Setup mock repository with in-memory storage
    // Initialize use cases with mock repository
  });

  it('should handle full user lifecycle', async () => {
    // Create user
    const user = await createUserUseCase.execute({
      email: 'test@example.com',
      name: 'Test User',
    });

    // Retrieve user
    const retrieved = await getUserUseCase.execute(user.id);
    expect(retrieved?.email).toBe('test@example.com');

    // Update user
    await updateUserUseCase.execute(user.id, { name: 'Updated Name' });
    
    // Verify update
    const updated = await getUserUseCase.execute(user.id);
    expect(updated?.name).toBe('Updated Name');
  });
});
```

### Component Tests

Test React components using Testing Library:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInForm } from '@/components/auth/SignInForm';

// Mock dependencies
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('SignInForm', () => {
  it('should render sign-in form', () => {
    render(<SignInForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should require all fields', () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });
});
```

## Test Patterns

### AAA Pattern

Structure tests using Arrange-Act-Assert:

```typescript
it('should do something', async () => {
  // Arrange - Set up test data and mocks
  const input = { /* ... */ };
  mockRepository.findById.mockResolvedValue(mockData);

  // Act - Execute the code under test
  const result = await useCase.execute(input);

  // Assert - Verify the results
  expect(result).toEqual(expectedResult);
});
```

### Mock Pattern with Vitest

Create reusable mock factories:

```typescript
// __tests__/factories/user.factory.ts
export const createMockUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: false,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

// Usage in tests
const user = createMockUser({ email: 'custom@example.com' });
```

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
  },
}));

// Mock specific functions
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

### Test Data Builders

Use builders for complex test data:

```typescript
class UserBuilder {
  private user = {
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
  };

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  withName(name: string) {
    this.user.name = name;
    return this;
  }

  verified() {
    this.user.emailVerified = true;
    return this;
  }

  build() {
    return this.user;
  }
}

// Usage
const user = new UserBuilder()
  .withEmail('custom@example.com')
  .verified()
  .build();
```

## Testing Strategy

### Unit Tests

Test individual functions and use cases in isolation with mocked dependencies:
- Use case logic
- Domain validation
- Utility functions

### Component Tests

Test React components with Testing Library:
- Form validation
- User interactions
- Conditional rendering
- Props handling

### Integration Tests

Test complete workflows with in-memory storage:
- User lifecycle (create, read, update)
- Multi-step processes
- Cross-layer interactions
- Error handling flows

### In-Memory Testing

For integration tests, use in-memory mock repositories:

```typescript
const mockDatabase = new Map<string, any>();

const mockRepository = {
  findById: vi.fn(async (id) => mockDatabase.get(id) || null),
  create: vi.fn(async (data) => {
    const id = String(Date.now());
    const entity = { id, ...data };
    mockDatabase.set(id, entity);
    return entity;
  }),
};
```

## Continuous Integration

Tests run automatically in CI:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm run test
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/appdb_test
```

## Coverage Goals

Aim for:

- **Use Cases**: 90%+ coverage
- **Repositories**: 80%+ coverage
- **API Routes**: 70%+ coverage
- **Components**: 70%+ coverage

Check coverage:

```bash
npm run test -- --coverage
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should be resilient to refactoring

2. **Keep Tests Simple**
   - One assertion per test when possible
   - Clear test names that describe the scenario

3. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should throw error when email is already taken')
   
   // Bad
   it('test email validation')
   ```

4. **Isolate Tests**
   - Each test should be independent
   - No shared state between tests
   - Clean up after each test

5. **Mock External Dependencies**
   - Mock database calls
   - Mock API calls
   - Mock third-party services

6. **Test Edge Cases**
   - Empty inputs
   - Null values
   - Boundary conditions
   - Error conditions

7. **Don't Test Framework Code**
   - Don't test Next.js internals
   - Don't test library code
   - Focus on your business logic

8. **Keep Tests Fast**
   - Use mocks instead of real databases when possible
   - Run slow tests separately
   - Optimize test setup/teardown

## Debugging Tests

### Run Single Test File

```bash
npm run test -- create-user.test.ts
```

### Run Tests Matching Pattern

```bash
npm run test -- -t "should create a user"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest Debug",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Use Vitest UI

The UI provides an interactive way to run and debug tests:

```bash
npm run test:ui
```

### Verbose Output

```bash
npm run test -- --reporter=verbose
```

## Vitest Benefits

- **Fast** - Native ESM support and smart test re-running
- **Compatible** - Jest-like API for easy migration
- **Modern** - Built for modern JavaScript/TypeScript projects
- **UI** - Beautiful browser-based test runner
- **Coverage** - Built-in coverage with v8
