# CLAUDE.md — BookAction Project Rules

## Project Overview

BookAction is a full-stack learning platform for BC's PHE curriculum. Students progress through gated modules (tutorials → quizzes → summaries → reflections), earn medals, and get AI-personalized practice. Teachers monitor students and create courses via an AI pipeline.

## Tech Stack

- **Runtime** : Node.js + TypeScript
- **Framework** : Express 5
- **ORM** : Prisma (with `@prisma/adapter-pg`)
- **Database** : PostgreSQL
- **Auth** : JWT (access + refresh tokens) + bcrypt
- **Validation** : Zod
- **AI** : OpenAI SDK + Anthropic SDK (via provider abstraction)
- **Cache** : Redis (ioredis) — for teacher report caching and AI rate limiting
- **Frontend** : Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, TanStack React Query, Zustand, Axios

## Architecture Pattern

All backend code follows **Repository → Service → Controller** layering with explicit dependency injection:

```
Routes → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
                                      ↓
                                  AI Provider (for AI features)
```

- **Repository** : Data access only. Prisma queries. No business logic.
- **Service** : Business logic. Receives repositories and other services via constructor injection.
- **Controller** : HTTP concerns only. Parses request, calls service, formats response. Thin.
- **Routes** : Maps HTTP methods/paths to controller methods. Applies middleware.
- **app.ts** : Wires ALL dependencies. This is the only place where `new Repository()`, `new Service()`, `new Controller()` appear.

## Coding Rules

### General

- All new code in TypeScript with strict types
- Use Prisma `select` over `include` — only fetch fields needed
- Use Prisma `groupBy` + `_count`/`_avg` for aggregation — avoid N+1 queries
- All list endpoints must support pagination (`page`, `limit` params → `{ data, pagination }` response)
- No in-memory state (no module-level variables for caching or rate limiting)
- Wire all new dependencies in `app.ts` via constructor injection
- Do not create new architectural patterns — follow existing patterns in the codebase
- Do not add npm packages unless explicitly listed in the task

### File Naming

- Controllers: `src/controller/{Name}Controller.ts`
- Services: `src/services/{Name}Service.ts`
- Repositories: `src/repositories/{Name}Repository.ts`
- Routes: `src/routes/{name}.routes.ts`
- DTOs: `src/dtos/response/{Name}DTO.ts`
- Constants: `src/constants/{name}.ts`
- Validation: `src/validation/{name}Validation.ts`

### Error Handling

- Services throw typed errors (extend AppError base class)
- Controllers do NOT have try/catch — errors propagate to global error handler
- Global error handler in `src/middleware/errorHandler.ts` returns `{ error: { code, message } }`

### Auth Patterns

- `authMiddleware` validates JWT on all protected routes
- `requireRole('TEACHER', 'ADMIN')` guards teacher-only route groups
- Roles: STUDENT, TEACHER, ADMIN

## Testing Rules

### Philosophy: Integration-heavy, unit-light

We use the **testing trophy** approach: heavy on integration tests, light on unit tests. We care if the system works end-to-end, not if individual functions return expected outputs.

### What to test

- **Integration tests (primary)** : Use Supertest to test full HTTP request → response cycles. Test with a real test database. These are the tests that matter.
- **Unit tests (only for pure functions)** : Medal tier calculation, learning style scoring, and similar stateless logic. Nothing else.
- **Do NOT write** : Unit tests for repositories, controllers, or services. Do not mock Prisma. Do not test implementation details.

### Test file location

- Integration tests: `__tests__/integration/{feature}.test.ts`
- Unit tests: `__tests__/unit/{feature}.test.ts`

### Test structure

Each integration test should:

1. Set up test data (create user, create module/concept/quiz as needed)
2. Make HTTP request via Supertest
3. Assert response status + body
4. Assert database state changed correctly (query DB to verify)
5. Clean up test data

### CRITICAL RULE: Test files are read-only during implementation

When implementing features (making tests pass), NEVER modify test files in `__tests__/`.
If a test fails, fix the implementation code, NOT the test.
The ONLY exception: import path changes due to file restructuring.

### Test assertions come from TASKS.md

Test assertions are derived from the functional requirements listed in TASKS.md. They represent the specification, not the implementation. The test chat writes tests BEFORE implementation exists.

## Workflow Per Phase

This project uses a two-chat workflow:

### Chat 1 — Test Chat

- Reads the phase requirements from TASKS.md
- Writes integration test files ONLY
- Does NOT write any implementation code
- Runs `npm test` at the end to confirm all tests FAIL (red state)

### Chat 2 — Code Chat

- Implements the feature to make all existing tests pass
- Follows all rules in this CLAUDE.md
- Does NOT modify any files in `__tests__/`
- Pre-commit hook runs `npm test` — commit is blocked if tests fail

## Commands

```bash
# Development
npm run dev                    # Start backend server
npm run prisma:migrate         # Run pending migrations
npm run prisma:seed            # Seed database
npm run prisma:studio          # Open Prisma Studio

# Testing
npm test                       # Run all tests
npm test -- --testPathPattern="integration/medal"  # Run specific test file
```
