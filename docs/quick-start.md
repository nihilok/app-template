# Quick Start Guide

Get your NextJS application up and running in 5 minutes.

## Prerequisites

- Node.js 20 or higher
- Docker and Docker Compose
- npm or yarn

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd app-template
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 16
- React 19
- Drizzle ORM
- Better Auth
- TypeScript
- Testing libraries

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and update values as needed:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb

# Better Auth (change in production!)
BETTER_AUTH_SECRET=development-secret-key-min-32-chars-long-please-change
BETTER_AUTH_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### 4. Start PostgreSQL

```bash
docker-compose up postgres -d
```

Verify PostgreSQL is running:

```bash
docker-compose ps
```

### 5. Initialize Database

Push the schema to the database:

```bash
npm run db:push
```

This creates all necessary tables:
- users
- sessions
- accounts
- verification_tokens

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Verify Installation

### Test the Build

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
Route (app)
├ ○ /
├ ƒ /api/auth/[...all]
├ ƒ /api/users
└ ƒ /api/users/[id]
```

### Run Tests

```bash
npm run test
```

Expected output:
```
PASS src/__tests__/use-cases/create-user.test.ts
✓ should create a user successfully
✓ should throw error if user already exists

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

### Check Linting

```bash
npm run lint
```

Should complete without errors.

## Test API Endpoints

### Health Check

Visit: [http://localhost:3000](http://localhost:3000)

You should see the Next.js welcome page.

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "name": "Test User",
  "emailVerified": false,
  "image": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "deletedAt": null
}
```

### Get All Users

```bash
curl http://localhost:3000/api/users
```

### Get User by ID

```bash
curl http://localhost:3000/api/users/{user-id}
```

### Update User

```bash
curl -X PATCH http://localhost:3000/api/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

### Delete User (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/api/users/{user-id}
```

## What's Next?

### Explore the Architecture

Read the [Architecture Guide](./architecture.md) to understand:
- DDD layer structure
- Repository pattern
- Use case pattern
- Soft delete implementation

### View Database

Open Drizzle Studio to explore your database:

```bash
npm run db:studio
```

Visit: [https://local.drizzle.studio](https://local.drizzle.studio)

### Add Authentication

Check out [Better Auth documentation](../src/lib/auth/README.md) to:
- Set up sign-up/sign-in
- Add OAuth providers
- Protect routes

### Create New Features

Follow the guide in [Contributing](../CONTRIBUTING.md) to:
1. Define domain types
2. Create database schema
3. Implement repository
4. Create use cases
5. Add API routes

### Deploy to Production

#### Option 1: Docker

```bash
docker-compose up --build app
```

#### Option 2: Vercel

```bash
npm install -g vercel
vercel
```

#### Option 3: Your Own Server

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

## Common Issues

### Port Already in Use

If port 3000 is in use:

```bash
# Change port in package.json
"dev": "next dev -p 3001"
```

### Database Connection Failed

Check if PostgreSQL is running:

```bash
docker-compose ps postgres
docker-compose logs postgres
```

Restart if needed:

```bash
docker-compose restart postgres
```

### Build Errors

Clear Next.js cache:

```bash
rm -rf .next
npm run build
```

### Test Failures

Reset test database:

```bash
docker-compose down -v
docker-compose up postgres -d
npm run db:push
npm run test
```

## Useful Commands

### Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### Database

```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev only)
npm run db:studio    # Open Drizzle Studio
```

### Docker

```bash
docker-compose up postgres -d        # Start database
docker-compose up --build app        # Start app
docker-compose down                  # Stop all services
docker-compose down -v               # Stop and remove volumes
docker-compose logs -f postgres      # View database logs
```

## Project Structure

```
app-template/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Home page
│   ├── domain/             # Business types & validation
│   ├── infrastructure/     # Database & repositories
│   ├── use-cases/          # Business logic
│   └── lib/                # Shared utilities
├── docs/                   # Documentation
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Docker services
├── Dockerfile             # Production image
└── package.json           # Dependencies & scripts
```

## Next Steps

1. ✅ Installation complete
2. 📖 Read [Architecture Guide](./architecture.md)
3. 🔐 Set up [Authentication](../src/lib/auth/README.md)
4. 🗄️ Learn [Database patterns](../src/infrastructure/database/README.md)
5. 🧪 Read [Testing Guide](./testing.md)
6. 🐳 Explore [Docker Setup](./docker.md)
7. 🚀 Deploy to production

## Getting Help

- 📚 [Full Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/nihilok/app-template/discussions)
- 🐛 [Report Issues](https://github.com/nihilok/app-template/issues)

Happy coding! 🎉
