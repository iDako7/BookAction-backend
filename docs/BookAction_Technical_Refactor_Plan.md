# BookAction — Technical Refactor Plan

**Version:** 2.0 (Phase-Based, Trimmed Scope)
**Author:** Dako

---

## 1. System Performance Goals

**Target** : 200–500 concurrent users. Architecture designed for horizontal scaling; initial deployment on a single Fly.io instance.

| Metric                         | Target      | Rationale                                                         |
| ------------------------------ | ----------- | ----------------------------------------------------------------- |
| API response (standard CRUD)   | < 200ms p95 | Student quiz/tutorial/progress endpoints must feel instant        |
| API response (teacher reports) | < 1s p95    | Aggregation queries over ~200 students are heavier but infrequent |
| API response (AI generation)   | < 15s p95   | LLM calls are inherently slow; show loading state                 |
| Frontend Time to Interactive   | < 2s        | Next.js SSR + code splitting keeps initial load fast              |

**AI budget math ($5–10/month)** :

- gpt-4o-mini: ~$0.15/1M input, ~$0.60/1M output tokens
- Practice generation: ~500 tokens/request → ~$0.0003/request
- 400 students × 5 practice sessions/week × 4 weeks = 8,000 AI calls/month → ~$2.50
- Course generation: ~2000 tokens/request → ~$0.0012/request, very infrequent (5–10/month)
- Total estimated: $5–10/month — well within budget

---

## 2. Deployment Architecture

```
┌──────────────┐     ┌──────────────────────────────────┐     ┌───────────────┐
│   Vercel     │────▶│   Fly.io                         │────▶│ Render        │
│   (Frontend) │     │   ┌──────────────────────────┐   │     │ PostgreSQL    │
│   Next.js 16 │     │   │   Express Instance        │   │     │               │
│              │     │   │   (Single)                │   │     └───────────────┘
└──────────────┘     │   └────────────┬─────────────┘   │
                     │                │                 │     ┌───────────────┐
                     └────────────────┼─────────────────┘     │ Redis         │
                                      │                       │ (Upstash)     │
                                      └──────────────────────▶│ Cache + Rate  │
                                      │                       └───────────────┘
                               ┌──────┴──────────┐
                               │ OpenAI /         │
                               │ Anthropic API    │
                               └─────────────────┘
```

### Deployment Details

| Component | Platform           | Plan                      | Config                                |
| --------- | ------------------ | ------------------------- | ------------------------------------- |
| Frontend  | Vercel             | Free (Hobby)              | Auto-deploy from `main`branch         |
| Backend   | Fly.io             | Single instance ($3–5/mo) | Health check on `/api/health`         |
| Database  | Render PostgreSQL  | Standard ($20/mo, 4GB)    | Default Prisma connection pooling     |
| Cache     | Redis (Upstash)    | Pro (~$10/mo)             | Distributed caching, AI rate limiting |
| AI APIs   | OpenAI + Anthropic | Pay-as-you-go             | API keys in Fly.io env vars           |

### Environment Variables (Backend)

```env
# Existing
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# Phase 3+
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_PRACTICE=gpt-4o-mini
AI_MODEL_COURSE=gpt-4o
AI_CACHE_TTL_SECONDS=3600

# Phase 6
REDIS_URL=redis://...
```

### Environment Variables (Frontend)

```env
NEXT_PUBLIC_API_URL=https://bookaction-api.fly.dev
```

---

## 3. Development Workflow

### Two-Chat TDD Pattern

Each phase follows this workflow:

```
Step 1: Learn (Desktop Claude)
  → Understand the phase architecture, confirm testable requirements

Step 2: Test Chat (Claude Code — new chat)
  → Write integration tests ONLY, run tests, verify all FAIL

Step 3: Code Chat (Claude Code — new chat)
  → Implement feature to make tests pass, do NOT modify test files
  → Pre-commit hook enforces tests pass before commit

Step 4: Verify (You — 5 min)
  → Manual smoke test with REST client (backend) or browser (frontend)
```

### Key Rules

- Test Chat and Code Chat use separate Claude Code sessions (different context windows)
- Code Chat NEVER modifies files in `__tests__/`
- Pre-commit hook runs `npm test` — blocks commit if tests fail
- Git branch per phase: `feature/{phase-name}`

---

## 4. Phase Plans

### Phase Overview

| Phase | Feature                                  | Verification                                                    |
| ----- | ---------------------------------------- | --------------------------------------------------------------- |
| 0     | Setup (CLAUDE.md, TASKS.md, hook)        | Hook blocks failing commit                                      |
| 1     | Medal System (backend)                   | REST: quiz → medal awarded                                      |
| 2     | Teacher Portal (backend)                 | REST: teacher endpoints return data, student gets 403           |
| 3     | AI + Learning Style + Practice (backend) | REST: style quiz → AI practice generated                        |
| 4     | Course Generation Pipeline (backend)     | REST: upload → generate → publish → module appears              |
| 5     | Frontend (all features)                  | Browser: click through student + teacher flows                  |
| 6     | Redis + Deploy                           | Health check returns `{ db: true, redis: true }`on deployed URL |

### Trimmed Scope (explicitly excluded from implementation)

| Item                        | Rationale                                                            |
| --------------------------- | -------------------------------------------------------------------- |
| Load testing (autocannon)   | Performance targets validated through manual testing                 |
| Graceful shutdown (SIGTERM) | Not needed for single instance; can be added later                   |
| PgBouncer                   | Not needed for single instance; default Prisma pooling is sufficient |
| CI/CD (GitHub Actions)      | Manual deploy is sufficient;`fly deploy`+ Vercel auto-deploy         |
| Multi-instance deployment   | Architecture supports it but single instance is deployed initially   |
| Request timing middleware   | Nice-to-have; deferred                                               |

---

### Phase 0: Setup

**Goal** : Prepare the repo for the two-chat TDD workflow.

**Tasks** :

- [ ] Add CLAUDE.md to project root (architecture rules, coding rules, testing rules)
- [ ] Add TASKS.md to project root (phase checklists with testable requirements)
- [ ] Create `.claude/hooks/pre-commit.sh` → runs `npm test`, blocks commit on failure
- [ ] Install hook: `cp .claude/hooks/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`
- [ ] Create `__tests__/integration/` and `__tests__/unit/` directories
- [ ] Verify hook works: failing test → commit blocked

---

### Phase 1: Medal System

**Goal** : After quiz submission, calculate and store a medal (Bronze/Silver/Gold) based on accuracy. Medals never downgrade.

**Branch** : `feature/medal-system`

#### Schema Changes

```
New enum: MedalTier (NONE, BRONZE, SILVER, GOLD)
New model: User_concept_medal (user_id, concept_id, tier, accuracy, timestamps)
  - @@unique([user_id, concept_id])
New model: User_module_medal (user_id, module_id, tier, accuracy, timestamps)
  - @@unique([user_id, module_id])
```

#### New Files

| Layer      | File                                  | Purpose                                          |
| ---------- | ------------------------------------- | ------------------------------------------------ |
| Constants  | `src/constants/medalThresholds.ts`    | `calculateMedalTier()`pure function + thresholds |
| Repository | `src/repositories/MedalRepository.ts` | Upsert (upgrade-only), find medals               |
| Service    | `src/services/MedalService.ts`        | Award concept/module medals, get medal summary   |
| Controller | `src/controller/MedalController.ts`   | `getMedals(req, res)`                            |
| Route      | `src/routes/medal.routes.ts`          | `GET /api/medals`(auth required)                 |
| DTO        | `src/dtos/response/MedalDTO.ts`       | Response shape                                   |

#### Modified Files

| File                             | Change                                        |
| -------------------------------- | --------------------------------------------- |
| `src/app.ts`                     | Wire medal stack                              |
| `src/services/ConceptService.ts` | After quiz scoring, trigger medal calculation |

#### Medal Calculation Logic

```
Per concept:
  1. Get all quizzes for this concept
  2. For each quiz, get user's LATEST response (most recent by created_at)
  3. accuracy = count(is_correct=true) / total_quizzes
  4. Apply threshold → tier (Gold ≥ 90%, Silver ≥ 70%, Bronze ≥ 50%)
  5. UPGRADE-ONLY: Only update if new accuracy > existing accuracy

Per module:
  1. Get all concept medals for user in module
  2. If any concept has no medal → skip (requires all concepts attempted)
  3. module_accuracy = average(concept_medal.accuracy)
  4. Apply threshold → tier. Same upgrade-only rule.
```

#### Testable Requirements

**Unit** : `calculateMedalTier()` with 0%, 49%, 50%, 70%, 89.9%, 90%, 91%, 100%

**Integration** :

- FR-1.8: 95% accuracy quiz → GET /api/medals returns GOLD
- FR-1.9: 55% accuracy quiz → BRONZE
- FR-1.10: Earn GOLD → retake with 40% → still GOLD (never downgrade)
- FR-1.11: All concepts completed → module medal created
- FR-1.12: Not all concepts done → no module medal
- FR-1.13: No auth → 401
- FR-1.14: Valid auth → `{ conceptMedals, moduleMedals }`

---

### Phase 2: Teacher Portal

**Goal** : Teachers view class stats, paginated student list, individual reports, and export CSV. Students blocked from teacher endpoints.

**Branch** : `feature/teacher-portal`

#### Schema Changes

```
Update: Module → add is_published Boolean @default(true), created_by Int?
```

#### New Files

| Layer      | File                                    | Purpose                                            |
| ---------- | --------------------------------------- | -------------------------------------------------- |
| Repository | `src/repositories/TeacherRepository.ts` | Paginated student queries, aggregate stats         |
| Service    | `src/services/TeacherService.ts`        | Report assembly, CSV generation                    |
| Controller | `src/controller/TeacherController.ts`   | 5 endpoints                                        |
| Route      | `src/routes/teacher.routes.ts`          | All guarded with `requireRole('TEACHER', 'ADMIN')` |
| DTO        | `src/dtos/response/TeacherDTO.ts`       | Response shapes                                    |

#### New Endpoints

```
GET  /api/teacher/students              → paginated student list
GET  /api/teacher/students/:id          → student detail report
GET  /api/teacher/overview              → class-level aggregate stats
GET  /api/teacher/modules/:id/report    → module-level analytics
GET  /api/teacher/reports/export        → CSV download
```

#### NPM Packages: `json2csv`

#### Testable Requirements

- FR-2.1: Student → GET /api/teacher/students → 403
- FR-2.2: Teacher → GET /api/teacher/students → 200 with students
- FR-2.3: Pagination: `?page=1&limit=5` → exactly 5 + pagination metadata
- FR-2.4: Search: `?search=alice` → filtered results
- FR-2.5: Student detail includes `overallAccuracy`, per-concept breakdown
- FR-2.6: Non-existent student → 404
- FR-2.7: Overview returns `{ totalStudents, totalModules, avgCompletionRate, avgQuizScore }`
- FR-2.8: Module report returns `{ completionRate, avgScore, avgTimeSpent }`
- FR-2.9: CSV export has correct Content-Type header and valid content
- FR-2.10: No auth → 401

---

### Phase 3: AI Layer + Learning Style + Personalized Practice

**Goal** : Students take a learning style quiz, get a profile, then receive AI-personalized practice questions cached in the database.

**Branch** : `feature/ai-practice`

#### Schema Changes

```
New enum: LearningStyle (VISUAL, VERBAL, SCENARIO)
New model: User_learning_profile (user_id unique, primary_style, style_scores Json, quiz_responses Json)
New model: AI_practice_cache (concept_id, learning_style, generated_content Json, expires_at)
  - @@unique([concept_id, learning_style])
```

#### New Files

| Layer      | File                                            | Purpose                        |
| ---------- | ----------------------------------------------- | ------------------------------ |
| AI         | `src/services/ai/AIProvider.ts`                 | Interface                      |
| AI         | `src/services/ai/OpenAIProvider.ts`             | OpenAI implementation          |
| AI         | `src/services/ai/AnthropicProvider.ts`          | Anthropic implementation       |
| AI         | `src/services/ai/AIProviderFactory.ts`          | Factory from env var           |
| Repository | `src/repositories/LearningProfileRepository.ts` | CRUD                           |
| Repository | `src/repositories/PracticeCacheRepository.ts`   | Cache with TTL                 |
| Service    | `src/services/LearningStyleService.ts`          | Evaluate + persist style       |
| Service    | `src/services/PracticeGeneratorService.ts`      | Generate with cache + fallback |
| Controller | `src/controller/LearningStyleController.ts`     | Quiz + profile                 |
| Controller | `src/controller/PracticeController.ts`          | Generate + check               |
| Routes     | `src/routes/learningStyle.routes.ts`            | 3 endpoints                    |
| Routes     | `src/routes/practice.routes.ts`                 | 2 endpoints                    |

#### New Endpoints

```
GET  /api/learning-style/questions  → quiz questions (hardcoded)
POST /api/learning-style/submit     → submit answers, get profile
GET  /api/learning-style/profile    → saved profile
POST /api/practice/generate         → AI practice (cached)
POST /api/practice/check            → check answers
```

#### NPM Packages: `openai`, `@anthropic-ai/sdk`

#### Testable Requirements

**Unit** : `evaluateStyle()` scoring logic

**Integration** (mock AI provider in tests):

- FR-3.3: GET /questions → 8-10 questions with 3 options each
- FR-3.4: POST /submit → returns `{ primaryStyle, scores }`, saved to DB
- FR-3.5: GET /profile after submission → matches submitted data
- FR-3.6: GET /profile before submission → 404
- FR-3.7: POST /practice/generate → 3 questions with correct fields
- FR-3.8: Second call same concept+style → cached (fast response)
- FR-3.9: Invalid conceptId → 404
- FR-3.10: No auth → 401
- FR-3.11: AI failure → returns fallback quiz questions

---

### Phase 4: Course Generation Pipeline

**Goal** : Teachers upload .docx/.md, trigger AI structuring, review/edit, and publish as a live module. Publishing is atomic.

**Branch** : `feature/course-pipeline`

#### Schema Changes

```
New enum: CourseStatus (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
New model: Course_draft (teacher_id, title, status, source_content Text, source_type, generated_json JsonB?, edited_json JsonB?, published_module_id Int?)
```

#### New Files

| Layer      | File                                        | Purpose                           |
| ---------- | ------------------------------------------- | --------------------------------- |
| Repository | `src/repositories/CourseDraftRepository.ts` | CRUD, findByTeacher               |
| Service    | `src/services/CourseGeneratorService.ts`    | Parse, generate, publish (atomic) |
| Controller | `src/controller/CourseController.ts`        | All CRUD + publish                |
| Route      | `src/routes/course.routes.ts`               | Teacher-guarded                   |
| Validation | `src/validation/courseValidation.ts`        | Zod schema for course JSON        |
| Utility    | `src/utils/courseSeeder.ts`                 | Shared `seedModuleFromJSON()`     |

#### New Endpoints

```
POST   /api/courses/upload              → create draft (DRAFT)
POST   /api/courses/:draftId/generate   → AI structuring (→ REVIEW)
GET    /api/courses/drafts              → list teacher's drafts
GET    /api/courses/:draftId            → draft detail
PUT    /api/courses/:draftId            → save edits
POST   /api/courses/:draftId/publish    → publish to live module (atomic)
DELETE /api/courses/:draftId            → delete draft
```

#### NPM Packages: `mammoth`, `multer`, `@types/multer`

#### Testable Requirements (mock AI provider)

- FR-4.1: Upload .md → 201 with `{ draftId, status: "DRAFT" }`
- FR-4.2: Upload .docx → text extracted and stored
- FR-4.3: Student upload → 403
- FR-4.4: Generate → status REVIEW, `generated_json` populated
- FR-4.5: GET /drafts → only current teacher's drafts
- FR-4.6: PUT with edits → `edited_json` updated
- FR-4.7: Publish → Module + all children created in DB, status PUBLISHED
- FR-4.8: After publish → module visible in /api/modules/overview
- FR-4.9: Publish is atomic: partial failure → nothing persisted
- FR-4.10: Delete unpublished draft → removed
- FR-4.11: Delete another teacher's draft → 403
- FR-4.12: Publish DRAFT status (not REVIEW) → 400

---

### Phase 5: Frontend

**Goal** : Build all student-facing and teacher-facing pages connected to the working backend API.

**Branch** : `feature/frontend`

#### Student Pages

```
app/profile/page.tsx                    → MedalCollection
app/learning-style/page.tsx             → Multi-step learning style quiz
app/module/[moduleId]/concept/[conceptId]/practice/ai/page.tsx → AI practice
```

#### Student Components

```
components/medal/MedalBadge.tsx         → Bronze/Silver/Gold badge
components/medal/MedalCollection.tsx    → Grid of medals
components/practice/LearningStyleQuiz.tsx → Step-by-step quiz
components/practice/AIPracticeQuestion.tsx → AI question with loading skeleton
```

#### Teacher Pages

```
app/teacher/layout.tsx                  → TeacherSidebar
app/teacher/page.tsx                    → Dashboard (ClassOverviewCards)
app/teacher/students/page.tsx           → Student table (search, sort, pagination)
app/teacher/students/[id]/page.tsx      → Student report
app/teacher/courses/page.tsx            → Course list (drafts + published)
app/teacher/courses/new/page.tsx        → Upload form
app/teacher/courses/[draftId]/page.tsx  → Draft overview
app/teacher/courses/[draftId]/edit/page.tsx → Course editor
app/teacher/reports/page.tsx            → Class report + CSV export
```

#### Teacher Components

```
components/teacher/TeacherSidebar.tsx
components/teacher/StudentTable.tsx
components/teacher/ClassOverviewCards.tsx
components/teacher/StudentReportView.tsx
components/teacher/CourseUpload.tsx
components/teacher/CourseEditor.tsx
components/teacher/CourseStatusBadge.tsx
```

#### Auth/Shared Modifications

```
components/guards/AuthGuard.tsx  → Block students from /teacher/*, redirect teachers
components/layout/Header.tsx     → Role-aware nav
lib/types/api.ts                → Add Medal, LearningStyle, role types
lib/api/client.ts               → Add all new API methods
lib/hooks/useApi.ts             → Add medal, learning style, practice hooks
lib/hooks/useTeacherApi.ts      → Teacher endpoint hooks
lib/types/teacher.ts            → Teacher DTO types
```

#### Verification

```
As student:
1. Login → module overview
2. Complete quiz → medal on profile
3. Take learning style quiz → see result
4. Generate AI practice → personalized questions

As teacher:
1. Login → /teacher dashboard
2. Class overview stats visible
3. Paginated student list
4. Individual student report
5. Upload → generate → edit → publish course
6. New module appears in student view
7. Export CSV report
```

---

### Phase 6: Redis + Deploy

**Goal** : Add Redis for distributed caching and rate limiting. Deploy to production.

**Branch** : `feature/redis-deploy`

#### New Files

| Layer | File               | Purpose                                    |
| ----- | ------------------ | ------------------------------------------ |
| Lib   | `src/lib/redis.ts` | Redis client (ioredis)                     |
| Lib   | `src/lib/cache.ts` | `get()`,`set()`with TTL,`rateLimitCheck()` |

#### Modified Files

| File                                       | Change                                        |
| ------------------------------------------ | --------------------------------------------- |
| `src/services/TeacherService.ts`           | Wrap reports with Redis cache (5 min TTL)     |
| `src/services/PracticeGeneratorService.ts` | Redis-based rate limiter                      |
| `src/app.ts`                               | Health check endpoint with Redis connectivity |

#### New Endpoint

```
GET /api/health → { status: "ok", timestamp, db: true/false, redis: true/false }
```

#### NPM Packages: `ioredis`, `@types/ioredis`

#### Testable Requirements

- FR-6.1: GET /api/health → 200 with `{ status: "ok", db: true, redis: true }`
- FR-6.2: Teacher report called twice in 5 min → second call faster (cache hit)
- FR-6.3: 10 AI calls in 1 hour → next call returns 429

#### Deploy Checklist

- [ ] Create Fly.io app (single instance)
- [ ] Set env vars on Fly.io
- [ ] Create Upstash Redis, get REDIS_URL
- [ ] `fly deploy`
- [ ] Verify: `curl https://bookaction-api.fly.dev/api/health`
- [ ] Set `NEXT_PUBLIC_API_URL` on Vercel
- [ ] Deploy frontend
- [ ] Verify full flow in production

---

## 5. NPM Packages (across all phases)

**Backend:**

```
Phase 2: json2csv
Phase 3: openai, @anthropic-ai/sdk
Phase 4: mammoth, multer, @types/multer
Phase 6: ioredis, @types/ioredis
```

**Frontend:** No new packages — existing stack covers all features.

---

## 6. Testing Strategy

| Phase | Integration Tests                                     | Unit Tests             |
| ----- | ----------------------------------------------------- | ---------------------- |
| 1     | Quiz → medal flow, upgrade-only, auth                 | `calculateMedalTier()` |
| 2     | Auth (403 for students), report data, pagination, CSV | None                   |
| 3     | Learning style flow, AI cache hit/miss, fallback      | `evaluateStyle()`      |
| 4     | Upload parsing, publish atomicity, auth guards        | None                   |
| 5     | — (visual verification)                               | —                      |
| 6     | Health check, cache TTL, rate limiting                | None                   |

**Philosophy** : Integration-heavy, unit-light. Test the system, not individual functions. Mock only AI providers. Use real test database for everything else.
