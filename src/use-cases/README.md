# Use Cases

This directory contains the application's use cases, which represent the business logic and orchestrate the flow of data between the domain and infrastructure layers.

## What are Use Cases?

Use cases are application-specific business rules that:

- Define what the application can do
- Orchestrate the flow of data to and from entities
- Direct entities to use their business rules to achieve use case goals
- Don't depend on external concerns like databases or UI
- Encapsulate and implement all application-specific business rules

## Structure

Use cases are organized by domain entity:

```
use-cases/
├── user/
│   ├── create-user.use-case.ts
│   ├── get-user.use-case.ts
│   ├── update-user.use-case.ts
│   └── delete-user.use-case.ts
└── [other-entities]/
```

## Use Case Pattern

Each use case follows this pattern:

```typescript
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // 1. Validate input
    const validatedData = CreateUserSchema.parse(input);

    // 2. Check business rules
    const existingUser = await this.userRepository.findByEmail(validatedData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 3. Execute business logic
    const user = await this.userRepository.createUser({
      email: validatedData.email,
      name: validatedData.name || null,
    });

    // 4. Return result
    return user;
  }
}
```

## Key Principles

### Single Responsibility

Each use case has one clear responsibility. For example:
- `CreateUserUseCase` - Creates a new user
- `GetUserUseCase` - Retrieves user information
- `UpdateUserUseCase` - Updates user data
- `DeleteUserUseCase` - Soft-deletes a user

### Dependency Injection

Use cases receive their dependencies through constructor injection:

```typescript
constructor(private readonly userRepository: UserRepository) {}
```

This makes use cases:
- Testable (can inject mocks)
- Flexible (can swap implementations)
- Explicit about dependencies

### Input Validation

Use cases validate their inputs using Zod schemas from the domain layer:

```typescript
const validatedData = CreateUserSchema.parse(input);
```

### Error Handling

Use cases throw meaningful errors that can be handled by the API layer:

```typescript
if (!existingUser) {
  throw new Error('User not found');
}
```

## Creating New Use Cases

1. **Identify the business operation**
   - What does the user want to accomplish?
   - What business rules apply?

2. **Create the use case file**
   ```typescript
   // use-cases/user/verify-email.use-case.ts
   export class VerifyEmailUseCase {
     constructor(
       private readonly userRepository: UserRepository,
       private readonly tokenRepository: TokenRepository
     ) {}

     async execute(token: string): Promise<User> {
       // Validate token
       const verificationToken = await this.tokenRepository.findByToken(token);
       if (!verificationToken) {
         throw new Error('Invalid token');
       }

       // Check expiration
       if (verificationToken.expiresAt < new Date()) {
         throw new Error('Token expired');
       }

       // Update user
       const user = await this.userRepository.update(
         verificationToken.userId,
         { emailVerified: true }
       );

       // Clean up token
       await this.tokenRepository.delete(verificationToken.id);

       return user;
     }
   }
   ```

3. **Write tests**
   ```typescript
   // __tests__/use-cases/verify-email.test.ts
   describe('VerifyEmailUseCase', () => {
     // Test valid token
     // Test invalid token
     // Test expired token
   });
   ```

4. **Integrate with API layer**
   ```typescript
   // app/api/auth/verify-email/route.ts
   export async function POST(request: NextRequest) {
     const { token } = await request.json();
     
     const useCase = new VerifyEmailUseCase(
       new UserRepository(db),
       new TokenRepository(db)
     );
     
     const user = await useCase.execute(token);
     return NextResponse.json(user);
   }
   ```

## Testing Use Cases

Use cases are highly testable because they:
- Accept dependencies through constructor
- Have clear inputs and outputs
- Don't depend on external systems directly

Example test:

```typescript
import { CreateUserUseCase } from './create-user.use-case';

jest.mock('@/infrastructure/repositories/user.repository');

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    } as any;

    useCase = new CreateUserUseCase(mockRepository);
  });

  it('should create a user', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.createUser.mockResolvedValue(mockUser);

    const result = await useCase.execute(input);

    expect(result).toEqual(mockUser);
  });
});
```

## Benefits of Use Case Pattern

1. **Testability** - Easy to test in isolation with mocked dependencies
2. **Maintainability** - Changes to business logic are localized
3. **Reusability** - Use cases can be called from different entry points
4. **Clear Intent** - Each use case clearly states what it does
5. **Flexibility** - Easy to modify or extend business logic
6. **Independence** - Not tied to delivery mechanism (HTTP, GraphQL, CLI, etc.)
