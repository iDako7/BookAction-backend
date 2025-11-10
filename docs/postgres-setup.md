# Local Postgres + Prisma workflow

This project now ships with a Dockerized Postgres instance plus npm helpers
that mirror the manual steps from the setup checklist.

## 1. Requirements

- Docker Desktop (or any Docker engine) running locally.
- Node.js + npm (already required for the project).

## 2. Start the database

```bash
docker compose up -d postgres
```

The service definition lives in `docker-compose.yml` and exposes Postgres on
`localhost:5432` with the credentials that already exist in `.env`
(`postgres/postgres`, database `bookaction_local`).

Confirm that the container is healthy:

```bash
docker compose ps
docker compose logs -f postgres   # optional
pg_isready -h localhost -p 5432
```

## 3. (Optional) inspect using psql

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres
CREATE DATABASE bookaction_local;
\q
```

Running the migrations in the next step implicitly creates the database, but
this matches the earlier manual instructions if you still want to do it.

## 4. Point Prisma and run migrations

`.env` already contains `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookaction_local?schema=public"`.

Regenerate the Prisma Client and sync the schema:

```bash
npm run prisma:generate
npm run prisma:migrate   # or npm run prisma:db-push for a schema-only sync
```

## 5. Seed development data

`npm run prisma:seed` runs `prisma/seed.ts`, which loads
`prisma/seed/module1.json`. If you need to reset data, stop the app and rerun
the seed after clearing tables (see comments in `prisma/seed.ts`).

## 6. Open Prisma Studio

```bash
npm run prisma:studio
```

Studio connects straight to `bookaction_local` so you can browse Modules,
Themes, Concepts, etc. Keep the Express server running with the `/media`
static middleware to preview media URLs from Studio (e.g., `/media/panda.png`).

## 7. Shutdown and cleanup

```bash
docker compose down        # stop the container
docker compose down -v     # stop and remove the volume if you need a fresh DB
```

That is the full loop: start Postgres via Docker, sync Prisma, seed, and open
Studio.
