# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BC PHE curriculum delivery REST API — modules, concepts, quizzes, medals, teacher portal

## Stack

- **Runtime:** Node.js 20 + TypeScript (ESM)
- **Framework:** Express 5
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT
- **Testing:** Jest + Supertest

## Git Workflow

- **Never** create new branches, worktrees, or pull requests
- **Never** use `isolation: "worktree"` in Task tool calls
- Commit directly to `main` and push: `git add`, `git commit`, `git push`
- This project uses a single-branch workflow on `main`

## Commands

Available commands:

```bash
npm run dev        # Dev server
npm test           # Run test suite
npm run build      # Production build
npx tsc --noEmit   # TypeScript type check
```

## TDD Workflow

This project uses a strict two-phase TDD workflow enforced by Claude Code hooks (`.claude/hooks/`):

**Phase 1 — Write tests first:**
```
/project:write-tests <feature>
```
- Writes failing integration tests into `__tests__/integration/`
- Confirms all new tests are in red state before stopping
- Test files ONLY — no implementation code

**Phase 2 — Implement to pass tests:**
```
/project:implement <feature>
```
- Test files are locked by `guard-test-files.sh` — edits to `__tests__/` are rejected
- Implement minimum code to pass each test
- Never modify test files; if a test seems wrong, explain why and let the user decide

**Active hooks:**
- `PreToolUse[Edit|Write]`: `guard-test-files.sh` — blocks edits to test files during implement phase
- `PreToolUse[Bash]`: `guard-npm-install.sh` — blocks unauthorized package installs
- `PreToolUse[Bash]`: `guard-git-commit.sh` — runs tests before allowing commits
- `PostToolUse[Write]`: `post-write-lint.sh` — runs ESLint/tsc after each file write
- `Stop`: `stop-check-tests.sh` — verifies test suite on session end

## Architecture

### Layering
```
Routes -> Controllers -> Services -> Repositories -> Prisma
```
- Routes (`src/routes/`): HTTP method + path mapping, no business logic
- Controllers (`src/controllers/`): parse request, call service, send response
- Services (`src/services/`): business logic, orchestration
- Repositories (`src/repositories/`): database queries, typed returns

### Key Type Definitions
```typescript
// From Prisma schema: User, Module, Concept, Quiz, Question,
// QuestionOption, QuizAttempt, MedalTier, UserMedal,
// ClassRoom, ClassStudent, TeacherAssignment
```

### Feature Phases
- Phase 1 (medals): done
- Phase 2 (teacher portal): done
- Phase 3 (student dashboard): remaining
- Phase 4 (parent portal): remaining
- Phase 5 (gamification): remaining
- Phase 6 (analytics): remaining

### Explicitly Out of Scope
- Frontend
- Redis caching
- Deployment infra
