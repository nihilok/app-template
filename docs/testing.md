# Testing Guide

This document explains the testing strategy and practices for this application.

## Testing Stack

- **Jest** - Testing framework
- **Testing Library** - React component testing
- **ts-jest** - TypeScript support for Jest

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

### Coverage Report

```bash
npm run test -- --coverage
```

### Run Specific Test

```bash
npm run test -- create-user.test.ts
```

### Run Tests Matching Pattern

```bash
npm run test -- --testNamePattern="should create a user"
```

## Writing Tests

### Use Case Tests

Use cases are the easiest to test because they're isolated from external dependencies.

Example:

```typescript
import { CreateUserUseCase } from '@/use-cases/user/create-user.use-case';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

// Mock the repository
jest.mock('@/infrastructure/repositories/user.repository');

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    } as any;

    // Instantiate use case with mock
    createUserUseCase = new CreateUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(expectedUser);

      // Act
      const result = await createUserUseCase.execute(input);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      });
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const input = {
        email: 'existing@example.com',
        name: 'Test User',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
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

### API Route Tests

Test API routes using Next.js testing utilities:

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/users/route';

// Mock database
jest.mock('@/infrastructure/database/client');

describe('POST /api/users', () => {
  it('should create a user', async () => {
    const body = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.email).toBe('test@example.com');
  });

  it('should return 400 for invalid data', async () => {
    const body = {
      email: 'invalid-email',
      name: 'Test User',
    };

    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### Component Tests

Test React components using Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should display validation errors', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
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

### Mock Pattern

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

## Testing Database

### Test Database Setup

Use a separate test database:

```bash
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb_test
```

### Database Cleanup

Clean database between tests:

```typescript
beforeEach(async () => {
  // Clean all tables
  await db.delete(users);
  await db.delete(rolePermissions);
  await db.delete(roles);
  await db.delete(permissions);
  // ... other tables
});
```

### Transactions

Use transactions for test isolation:

```typescript
let testDb: Database;

beforeEach(async () => {
  // Start transaction
  testDb = await db.transaction();
});

afterEach(async () => {
  // Rollback transaction
  await testDb.rollback();
});
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

### Run Single Test

```bash
npm run test -- --testNamePattern="should create a user"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npm run test -- --verbose
```

### Show Console Logs

```bash
npm run test -- --silent=false
```
