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

**DON'T**:
- ❌ Include business logic (that's for use cases)
- ❌ Make business decisions (use cases decide, controllers act)
- ❌ Validate business rules (use cases validate)
- ❌ Calculate derived values (use cases calculate)

**Remember**: Controllers take actions, Use Cases make decisions.
