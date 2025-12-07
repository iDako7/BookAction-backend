# BookAction Backend — Learning & Release Notes

This doc distills what’s most valuable to study in the codebase, calls out the standout parts of the system, and maps releases to the V0–V3 roadmap.

## What to Learn First
- Layered architecture: `src/app.ts` wiring repositories → services → controllers via constructor injection. Trace Auth (`src/services/AuthService.ts`, `src/controller/AuthController.ts`) and a content slice (`src/services/ConceptService.ts` or `LearnHomepage.ts`).
- Prisma domain modeling: `prisma/schema.prisma` → repository queries (`src/repositories/*`) → DTO shaping (`src/dtos/response`), mirroring the structures in your architecture docs.
- JWT auth and session hygiene: refresh-token persistence with per-token `jti`, expiry math (`AuthService.generateTokens`), middleware flow (`src/routes/auth.routes.ts`), and `AuthError` handling (`src/utils/errors.ts`).
- Content pipeline: `prisma/seed.ts` and `prisma/seed/module1.json` attaching media URLs, ordering content, and enabling admin-triggered seeding.
- API surface and validation: REST contracts in `docs/api-reference.md`, Zod guards in `src/validation`, and DTO-based controllers that stay thin.
- Testing approach: Supertest coverage for auth/modules/concepts/seed in `tests/*.ts`, hitting the real HTTP stack.

## Project Highlights
- End-to-end learning experience API: modules → concepts → quizzes → reflections with typed DTOs and consistent envelopes across Express 5 routes.
- DDD refactor: repositories/services/controllers per domain (Concept, Module, LearnHomepage), aligned with `docs/architecture/BK-Refactor_Plan.md` and `docs/architecture/Architecture_Design_v2.0.md`.
- Robust authentication: registration/login/refresh/logout with persisted refresh tokens, cookie parsing, and validation/error hardening.
- Seedable, media-backed content: Prisma seed generates ordered learning content and serves static assets from `/media`.
- Operational readiness: Docker Compose for Postgres, environment validation, CORS configuration, and REST client files (`api.rest`, `public_api.rest`) for quick checks.

## Release Tags (aligned to V0–V3)
- Phase 0 — Core API Backbone  
  - `v0-core-backbone` (`f04a841`): Roll-up for schema, seed, Docker, first learning endpoints.  
  - Sub-phase markers: `v0.0-schema-seed` (`34eb348`), `v0.1-docker-prisma` (`f26e347`), `v0.2-seed-hardening` (`6d6c083`), `v0.3-learning-endpoints-mvp` (`f04a841`).
- Phase 1 — DDD Refactor (service slices)  
  - `v1.0-ddd-concept` (`247662e`), `v1.1-ddd-module` (`35ee6bd`), `v1.2-ddd-learn-homepage` (`4633704`).
- Phase 2 — Authentication  
  - `v2.0-auth-foundation` (`0373260`), `v2.1-auth-hardening` (`9e5b745`), `v2.2-auth-validation` (`6f5950e`).
- Phase 3 — Integration Stabilization  
  - `v3.0-static-media-seed` (`18bf264`), `v3.1-authenticated-modules` (`df22aba`), `v3.2-public-learning-api` (`dc6e471`), `v3.3-test-tooling` (`5a9116c`), `v3.5-integration-bugfixes` (`a1fc463`).

## How to Study the Code
- Start at `src/app.ts` for wiring, then read one vertical slice (Auth or Concepts/LearnHomepage) from controller → service → repository → Prisma types.
- Walk the seed path (`prisma/seed.ts` + JSON) to see ordering/media linking; call `/api/admin/seed` when enabled to watch it populate.
- Drive endpoints with `docs/api-reference.md` and `api.rest` while comparing DTOs to cement request/response shapes.
