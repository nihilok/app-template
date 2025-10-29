# NextJS 16 Full Stack App Template

A production-ready NextJS 16 template with PostgreSQL, Better Auth, and Domain-Driven Design architecture.

## Features

- 🚀 **NextJS 16** - Latest version with App Router and Server Actions
- 🔐 **Better Auth** - Modern authentication solution with email/password and session management
- 🗄️ **PostgreSQL** - Reliable relational database
- 🔄 **Drizzle ORM** - Type-safe database queries
- 🏗️ **DDD Architecture** - Clean separation of concerns with Repository, Use Case, and API layers
- 🗑️ **Soft Delete** - Default soft-delete implementation across all entities
- 🐳 **Docker** - Development and production containers
- 🧪 **Vitest Testing** - Fast unit, component, and integration tests with Vitest and Testing Library
- 🔄 **CI/CD** - GitHub Actions for automated testing and builds
- 💅 **ESLint & Prettier** - Code quality and formatting
- 📝 **TypeScript** - Full type safety
- 🎨 **Landing Page** - Professional landing page showcasing the template
- 🔒 **Auth Pages** - Ready-to-use sign-up, sign-in, and dashboard pages

## Quick Start

📖 **See the [Quick Start Guide](./docs/quick-start.md) for detailed step-by-step instructions.**

### TL;DR

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local

# 3. Start PostgreSQL
docker-compose up postgres -d

# 4. Push schema to database:
npm run db:push

# 5. Start development
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## What's Included

### Landing Page

A professional landing page at `/` that showcases:
- Hero section highlighting the template features
- Feature cards for Next.js 16, Better Auth, PostgreSQL, DDD Architecture, Vitest, and Docker
- Use case examples (SaaS, Internal Tools, APIs, E-commerce)
- Clear call-to-action buttons

### Authentication Flow

Complete authentication system powered by Better Auth:

- **Sign Up** (`/signup`) - User registration with name, email, and password
- **Sign In** (`/signin`) - User authentication
- **Dashboard** (`/dashboard`) - Protected page showing user profile
- Session management and automatic redirects

### Architecture

The template demonstrates Domain-Driven Design with:
- **Domain Layer** - Business types and validation
- **Use Cases** - Application logic (create, read, update user)
- **Repositories** - Data access with soft-delete support
- **API Routes** - RESTful endpoints and auth handlers

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── users/        # User management endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── domain/                # Domain layer (business logic & types)
│   └── user.types.ts
├── infrastructure/        # Infrastructure layer
│   ├── database/
│   │   ├── schema/       # Drizzle schema definitions
│   │   ├── migrations/   # Database migrations
│   │   ├── base-repository.ts
│   │   └── client.ts
│   └── repositories/     # Repository implementations
│       └── user.repository.ts
├── use-cases/            # Use case layer (application logic)
│   └── user/
│       ├── create-user.use-case.ts
│       ├── get-user.use-case.ts
│       ├── update-user.use-case.ts
│       └── delete-user.use-case.ts
└── lib/                  # Shared utilities
    └── auth/             # Better Auth configuration
```

## Architecture

This template follows Domain-Driven Design (DDD) principles with a functional approach:

### Layers

1. **Domain Layer** (`src/domain/`)
   - Contains business entities, types, and validation schemas
   - Pure business logic with no external dependencies

2. **Infrastructure Layer** (`src/infrastructure/`)
   - Database access and ORM configuration
   - Repository pattern implementations
   - External service integrations

3. **Use Case Layer** (`src/use-cases/`)
   - Application-specific business rules
   - Orchestrates data flow between layers
   - Input validation and error handling

4. **API Layer** (`src/app/api/`)
   - HTTP endpoint definitions
   - Request/response handling
   - Integrates use cases with HTTP layer

## Documentation

### Getting Started
- [Quick Start Guide](./docs/quick-start.md) - Get running in 5 minutes
- [Architecture Overview](./docs/architecture.md) - Understand the DDD design
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

### Guides
- [Authentication](./src/lib/auth/README.md) - Better Auth setup and usage
- [RBAC System](./docs/rbac.md) - Role-Based Access Control implementation
- [Database](./src/infrastructure/database/README.md) - Drizzle ORM and soft-delete pattern
- [Database Schema](./src/infrastructure/database/schema/README.md) - Schema definitions
- [Use Cases](./src/use-cases/README.md) - Business logic layer
- [Docker Setup](./docs/docker.md) - Development and production Docker
- [Testing Guide](./docs/testing.md) - Testing strategy and examples

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Database Management

### Generate Migrations

After modifying the schema files:

```bash
npm run db:generate
```

### Apply Migrations

```bash
npm run db:migrate
```

### Push Schema (Development)

For quick schema updates in development:

```bash
npm run db:push
```

## Docker

### Development

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up postgres
```

### Production

```bash
# Build and start
docker-compose up --build app
```

## Testing

This template includes comprehensive testing with Vitest:

Run the test suite:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with UI:

```bash
npm run test:ui
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Test Coverage

- **Unit Tests** - Use case and domain logic
- **Component Tests** - React components with Testing Library
- **Integration Tests** - Complete user workflows

See the [Testing Guide](./docs/testing.md) for more details.

## CI/CD

The project includes GitHub Actions workflows for:

- Running tests on every push and PR
- Building Docker images
- Code quality checks (linting)

See `.github/workflows/ci.yml` for details.

## License

MIT
