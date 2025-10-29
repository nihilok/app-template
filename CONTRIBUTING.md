# Contributing to NextJS App Template

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this template.

## Getting Started

1. **Fork the repository**
<<<<<<< HEAD
=======
   <!-- Replace 'nihilok/app-template' with your repository name if you have customized this template -->
   <!-- Replace 'nihilok/app-template' with your repository name if you have customized this template -->
>>>>>>> e31498b (Update CONTRIBUTING.md)
   ```bash
   # Replace 'nihilok/app-template' with your repository name if you have customized this template
   gh repo fork nihilok/app-template
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/app-template
   cd app-template
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

5. **Start database**
   ```bash
   docker-compose up postgres -d
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 2. Make Changes

Follow the [Architecture Guide](./docs/architecture.md) when making changes.

### 3. Run Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run linter
npm run lint

# Run build
npm run build
```

### 4. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add user profile page"
git commit -m "fix: resolve authentication bug"
git commit -m "docs: update API documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use TypeScript strictly - no `any` types unless absolutely necessary
- Define interfaces for complex objects
- Use type inference where possible

```typescript
// Good
const user: User = await repository.findById(id);

// Also good (type inference)
const user = await repository.findById(id);

// Bad
const user: any = await repository.findById(id);
```

### Naming Conventions

- **Files**: kebab-case (`user-repository.ts`)
- **Classes**: PascalCase (`UserRepository`)
- **Functions**: camelCase (`createUser`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix optional (`IUserRepository` or `UserRepository`)

### Code Organization

```typescript
// 1. Imports
import { something } from 'somewhere';

// 2. Types/Interfaces
interface MyInterface {}

// 3. Constants
const CONSTANT = 'value';

// 4. Main code
export class MyClass {}
```

### Comments

```typescript
// Good - explain WHY, not WHAT
// Retry up to 3 times because the API is occasionally flaky
const maxRetries = 3;

// Bad - obvious comment
// Set maxRetries to 3
const maxRetries = 3;
```

## Architecture Guidelines

### Adding New Features

Follow the DDD layer approach:

1. **Domain Layer** - Define types and validation
2. **Infrastructure Layer** - Create schema and repository
3. **Use Case Layer** - Implement business logic
4. **API Layer** - Expose HTTP endpoints

See [Architecture Guide](./docs/architecture.md) for details.

### Repository Pattern

Extend `BaseRepository` for new entities:

```typescript
export class PostRepository extends BaseRepository<typeof posts> {
  constructor(db: Database) {
    super(db, posts);
  }

  // Add custom methods
  async findBySlug(slug: string): Promise<Post | null> {
    const results = await this.db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    
    return results[0] || null;
  }
}
```

### Use Case Pattern

```typescript
export class MyUseCase {
  constructor(
    private readonly myRepository: MyRepository
  ) {}

  async execute(input: MyInput): Promise<MyOutput> {
    // 1. Validate input
    const validatedData = MySchema.parse(input);

    // 2. Check business rules
    // 3. Execute logic
    // 4. Return result
  }
}
```

## Testing

### Writing Tests

Every new feature should include tests:

```typescript
describe('MyUseCase', () => {
  let useCase: MyUseCase;
  let mockRepository: jest.Mocked<MyRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;

    useCase = new MyUseCase(mockRepository);
  });

  it('should do something', async () => {
    // Arrange
    const input = { /* ... */ };
    mockRepository.findById.mockResolvedValue(null);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
```

### Test Coverage

Aim for:
- Use Cases: 90%+
- Repositories: 80%+
- API Routes: 70%+

Check coverage:
```bash
npm run test -- --coverage
```

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Creates a new user in the system.
 * 
 * @param input - User creation data
 * @returns The created user
 * @throws {Error} If email already exists
 */
async createUser(input: CreateUserInput): Promise<User> {
  // Implementation
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing setup instructions
- Updating dependencies

### Architecture Documentation

Update `docs/architecture.md` when:
- Adding new layers or patterns
- Changing architectural decisions
- Adding significant features

## Database Changes

### Creating Migrations

1. Modify schema files in `src/infrastructure/database/schema/`

2. Generate migration:
   ```bash
   npm run db:generate
   ```

3. Review the generated migration in `src/infrastructure/database/migrations/`

4. Test migration:
   ```bash
   npm run db:migrate
   ```

### Schema Conventions

- Use UUIDs for primary keys
- Include timestamps: `createdAt`, `updatedAt`, `deletedAt`
- Use snake_case for column names
- Add foreign key constraints with CASCADE

```typescript
export const myTable = pgTable('my_table', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts

### PR Description

Include:

1. **What**: Brief description of changes
2. **Why**: Reason for the changes
3. **How**: Technical approach
4. **Testing**: How you tested the changes
5. **Screenshots**: For UI changes

Example:

```markdown
## What
Adds user profile editing functionality

## Why
Users need to be able to update their profile information

## How
- Created UpdateUserUseCase
- Added PATCH /api/users/:id endpoint
- Added validation with Zod

## Testing
- Added unit tests for use case
- Tested API endpoint manually
- All existing tests still pass

## Screenshots
![Profile Edit Form](link-to-screenshot)
```

### Review Process

1. Automated checks must pass (CI/CD)
2. At least one approval required
3. Address review feedback
4. Maintainer will merge

## Common Pitfalls

### 1. Forgetting Soft Delete

Always check for soft-deleted records:

```typescript
// Bad
const user = await db.select().from(users).where(eq(users.id, id));

// Good
const user = await userRepository.findById(id);
```

### 2. Not Validating Input

Always validate at boundaries:

```typescript
// Bad
async execute(input: any) {
  return await this.repository.create(input);
}

// Good
async execute(input: CreateUserInput) {
  const validatedData = CreateUserSchema.parse(input);
  return await this.repository.create(validatedData);
}
```

### 3. Mixing Concerns

Keep layers separate:

```typescript
// Bad - Use case accessing database directly
async execute(input: Input) {
  return await db.select().from(users);
}

// Good - Use case using repository
async execute(input: Input) {
  return await this.userRepository.findAll();
}
```

### 4. Not Testing

Every feature needs tests:

```typescript
// Always write tests
describe('MyFeature', () => {
  it('should work correctly', () => {
    // Test implementation
  });
});
```

## Getting Help

> **Note:** Replace `nihilok/app-template` with your actual repository name in the URLs below after creating your project from this template.

- **Questions**: Open a [Discussion](https://github.com/nihilok/app-template/discussions)
- **Bugs**: Open an [Issue](https://github.com/nihilok/app-template/issues)
- **Features**: Open an [Issue](https://github.com/nihilok/app-template/issues) with `enhancement` label

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards others

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! 🎉
