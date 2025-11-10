# BookAction Backend

TypeScript/Express API that powers BookAction’s learning experience. It exposes read/write endpoints for modules, concepts, quizzes, and reflections backed by a PostgreSQL database managed with Prisma.

## Highlights
- Express 5 server with strongly typed Prisma data access and lightweight service layer (`src/services`).
- PostgreSQL schema models theme → concept → quiz/summary/reflection relationships (`prisma/schema.prisma`).
- Seedable, ordered learning content sourced from JSON files (`prisma/seed/module1.json`).
- Ready-to-run REST contract documented in `docs/api_design.md` plus `api.rest` for quick manual calls.
- Supports local dev via `npm run dev`, production builds via `npm run build && npm start`, and database orchestration through Docker Compose.

## Project Structure
- `src/app.ts` – Express entrypoint registering all public routes.
- `src/routes` – WIP modular route handlers for users, modules, concepts, quizzes, and reflections.
- `src/services/LearnHomepage.ts` – Service helpers for assembling homepage data and fetching typed resources.
- `src/utils` – Shared helpers (e.g., response formatting, seed utilities).
- `prisma/` – Prisma schema, migration config, and seed scripts/data.
- `docs/` – Product and API design notes referenced by the frontend team.

## Prerequisites
1. Node.js 20+ and npm.
2. PostgreSQL 15+ (or Docker).
3. `.env` file with at least:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/bookaction"
   PORT=3000 # optional, defaults to 3000
   ```

## Local Setup
1. Install dependencies  
   ```bash
   npm install
   ```
2. (Optional) start the bundled Postgres instance  
   ```bash
   docker compose up -d postgres
   ```
3. Apply the schema (choose one)  
   ```bash
   npm run prisma:migrate   # keeps full migration history
   # or
   npm run prisma:db-push   # quick sync during experimentation
   ```
4. Seed initial learning content  
   ```bash
   npm run prisma:seed
   ```
5. Launch the API
   ```bash
   npm run dev        # tsx + nodemon, reload on change
   npm run build      # emit dist/ JS
   npm start          # run compiled server
   ```

Prisma Client is regenerated automatically on install (`postinstall`), but you can run `npm run prisma:generate` whenever the schema changes.

## Key npm Scripts
- `npm run dev` – Start the TypeScript server with live reload.
- `npm run build` – Compile to `dist/`.
- `npm start` – Serve the compiled code.
- `npm run prisma:*` – Generate client, run migrations, push schema, seed data, or open Prisma Studio.

## Database + Seeding Notes
- `prisma/schema.prisma` defines modules, themes, concepts, tutorials, quizzes, summaries, reflections, and user progress tables.
- `prisma/seed.ts` populates the first module using `prisma/seed/module1.json`. Extend that JSON file or add new ones to introduce additional content.
- Uncomment `clearDatabase()` inside the seed script if you need to reset local data during development.

## API Surface
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/users/:userId/learning_homepage` | Returns modules plus concept progress for the learner dashboard. |
| `GET` | `/api/modules/:moduleId/theme` | Story-driven module introduction. |
| `GET` | `/api/concepts/:conceptId` | Concept definition plus good/bad tutorial examples. |
| `GET` | `/api/concepts/:conceptId/quiz` | Practice questions (multiple types). |
| `POST` | `/api/quiz/:quizId/submit` | Placeholder scoring endpoint (returns canned success today). |
| `GET` | `/api/concepts/:conceptId/summary` | Short recap and teaser for the next concept. |
| `GET` | `/api/modules/:moduleId/reflection` | Reflection prompt and media. |
| `POST` | `/api/modules/:moduleId/reflection/submit` | Captures reflection response (static response today). |

Use the VS Code REST Client compatible `api.rest` file or any HTTP client (Hoppscotch, Postman) to exercise these routes. Exact payloads live in `docs/api_design.md`.

## Deployment Tips
1. Ensure `DATABASE_URL` and any other secrets are available to the host (e.g., Render, Railway).
2. Run `npm run build` during CI/CD, then start with `npm start`.
3. Prisma migrations (`npm run prisma:migrate:deploy`) should run as part of your release pipeline before the app process starts.

## Troubleshooting
- Prisma errors usually indicate a missing or incorrect `DATABASE_URL`. Verify the connection string and that the database is reachable.
- If TypeScript changes do not reflect, ensure you are running `npm run dev` (tsx) rather than `npm start`.
- Remove any lingering Docker containers/volumes (`docker compose down -v`) if you need a clean Postgres instance.
