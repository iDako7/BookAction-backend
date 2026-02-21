# TASKS.md — BookAction Refactor Implementation Plan

## Phase Overview

| **Phase** | **Feature**                                  | **Verification Method**                                             |
| --------- | -------------------------------------------- | ------------------------------------------------------------------- |
| **0**     | **Setup (CLAUDE.md, TASKS.md, hook)**        | **Files exist, hook blocks failing commit**                         |
| **1**     | **Medal System (backend)**                   | **REST client: quiz → medal awarded**                               |
| **2**     | **Teacher Portal (backend)**                 | **REST client: teacher endpoints return data, student gets 403**    |
| **3**     | **AI + Learning Style + Practice (backend)** | **REST client: style quiz → AI practice generated**                 |
| **4**     | **Course Generation Pipeline (backend)**     | **REST client: upload → generate → publish → module appears**       |
| **5**     | **Frontend (all features)**                  | **Browser: click through student + teacher flows**                  |
| **6**     | **Redis + Deploy**                           | **Health check returns** `{ db: true, redis: true }`on deployed URL |

## Trimmed Scope (explicitly excluded)

**These items from the original refactor plan are NOT being implemented:**

- **Load testing with autocannon**
- **Graceful shutdown (SIGTERM handler)**
- **PgBouncer setup**
- **CI/CD via GitHub Actions**
- **Multi-instance Fly.io deployment (deploy single instance only)**
- **Request timing middleware**

**These are kept in the Technical Design doc for interview discussion but not built.**

---

## Phase 0: Setup

**Goal**: Prepare the repo for the two-chat TDD workflow.

### Tasks

- [x] **Copy CLAUDE.md to project root**
- [x] **Copy TASKS.md to project root**
- [x] **Create **`.claude/hooks/pre-commit.sh` that runs `npm test` and blocks commit on failure
- [x] **Create **`__tests__/integration/` and `__tests__/unit/` directories
- [x] **Verify hook works: make a failing test, attempt commit, confirm it's blocked**
- [ ] **Create git branch: **`feature/medal-system`

### Verification

- **Commit a passing test file → commit succeeds**
- **Commit with a failing test → commit blocked**

---

## Phase 1: Medal System (backend)

**Goal**: After a student submits a quiz, the system calculates and stores a medal (Bronze/Silver/Gold) based on accuracy. Medals never downgrade.

**Branch**: `feature/medal-system`

### Schema Changes

```
New enum: MedalTier (NONE, BRONZE, SILVER, GOLD)
New model: User_concept_medal (user_id, concept_id, tier, accuracy, timestamps)
  - @@unique([user_id, concept_id])
New model: User_module_medal (user_id, module_id, tier, accuracy, timestamps)
  - @@unique([user_id, module_id])
Update: User → add concept_medals[], module_medals[] relations
Update: Concept → add medals[] relation
Update: Module → add medals[] relation
```

### Files to Create

| **Layer**      | **File**                              | **Purpose**                                                        |
| -------------- | ------------------------------------- | ------------------------------------------------------------------ |
| **Constants**  | `src/constants/medalThresholds.ts`    | `calculateMedalTier(accuracy)`pure function + threshold values     |
| **Repository** | `src/repositories/MedalRepository.ts` | `upsertConceptMedal()`,`upsertModuleMedal()`,`findUserMedals()`    |
| **Service**    | `src/services/MedalService.ts`        | `awardConceptMedal()`,`awardModuleMedal()`,`getUserMedalSummary()` |
| **Controller** | `src/controller/MedalController.ts`   | `getMedals(req, res)`                                              |
| **Route**      | `src/routes/medal.routes.ts`          | `GET /api/medals`(auth required)                                   |
| **DTO**        | `src/dtos/response/MedalDTO.ts`       | **Response shape**                                                 |

### Files to Modify

| **File**                         | **Change**                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/app.ts`                     | **Wire MedalRepository → MedalService → MedalController → medal routes**                        |
| `src/services/ConceptService.ts` | **After** `saveQuizAnswers()`, call `medalService.awardConceptMedal()`+ check module completion |

### New Endpoint

```
GET /api/medals → returns all user medals (concept + module level), requires auth
```

### Testable Requirements

**Unit tests** (pure function):

- **FR-1.1: **`calculateMedalTier(0.91)` returns GOLD
- **FR-1.2: **`calculateMedalTier(0.90)` returns GOLD (boundary)
- **FR-1.3: **`calculateMedalTier(0.70)` returns SILVER (boundary)
- **FR-1.4: **`calculateMedalTier(0.50)` returns BRONZE (boundary)
- **FR-1.5: **`calculateMedalTier(0.49)` returns NONE
- **FR-1.6: **`calculateMedalTier(0.0)` returns NONE
- **FR-1.7: **`calculateMedalTier(1.0)` returns GOLD

**Integration tests** (Supertest):

- **FR-1.8: Student submits quiz with 95% accuracy → POST returns score → GET /api/medals returns GOLD medal for that concept**
- **FR-1.9: Student submits quiz with 55% accuracy → GET /api/medals returns BRONZE medal**
- **FR-1.10: Student earns GOLD → retakes quiz with 40% accuracy → GET /api/medals still shows GOLD (never downgrade)**
- **FR-1.11: Student completes all concepts in a module → module-level medal is created with averaged accuracy**
- **FR-1.12: Student has NOT completed all concepts in module → no module medal exists**
- **FR-1.13: GET /api/medals without auth token → 401**
- **FR-1.14: GET /api/medals with valid auth → returns **`{ conceptMedals: [...], moduleMedals: [...] }`

### Manual Verification (REST client)

```
1. Login as student
2. POST quiz answers with high accuracy
3. GET /api/medals → verify medal appears with correct tier
4. POST quiz answers with lower accuracy
5. GET /api/medals → verify medal did NOT downgrade
```

### NOT in scope for Phase 1

- **Frontend medal display (Phase 5)**
- **Any teacher-related functionality**

---

## Phase 2: Teacher Portal (backend)

**Goal**: Teachers can view class overview stats, paginated student list, individual student reports, and export CSV. Students are blocked from teacher endpoints.

**Branch**: `feature/teacher-portal`

### Schema Changes

```
Update: Module → add is_published Boolean @default(true), created_by Int?
```

### Files to Create

| **Layer**      | **File**                                | **Purpose**                                                      |
| -------------- | --------------------------------------- | ---------------------------------------------------------------- |
| **Repository** | `src/repositories/TeacherRepository.ts` | **Paginated student queries, aggregate stats, module analytics** |
| **Service**    | `src/services/TeacherService.ts`        | **Report assembly, stats calculation, CSV generation**           |
| **Controller** | `src/controller/TeacherController.ts`   | **5 endpoints**                                                  |
| **Route**      | `src/routes/teacher.routes.ts`          | **All guarded with** `requireRole('TEACHER', 'ADMIN')`           |
| **DTO**        | `src/dtos/response/TeacherDTO.ts`       | `StudentListItemDTO`,`StudentDetailDTO`,`ClassOverviewDTO`       |

### Files to Modify

| **File**                           | **Change**                                               |
| ---------------------------------- | -------------------------------------------------------- |
| `src/app.ts`                       | **Wire teacher stack + register** `/api/teacher`routes   |
| `src/middleware/authMiddleware.ts` | **Add/export** `requireRole(...roles)`middleware factory |
| `src/dtos/response/UserInfoDTO.ts` | **Add** `role`to returned user object                    |

### New Endpoints

```
GET  /api/teacher/students              → paginated student list (query: page, limit, search, sort)
GET  /api/teacher/students/:id          → single student detailed report
GET  /api/teacher/overview              → class-level aggregate stats
GET  /api/teacher/modules/:id/report    → module-level analytics
GET  /api/teacher/reports/export        → CSV download of class report
```

### NPM Packages to Add

```
json2csv (for CSV export)
```

### Testable Requirements

**Integration tests**:

- **FR-2.1: Student user calls GET /api/teacher/students → 403 Forbidden**
- **FR-2.2: Teacher user calls GET /api/teacher/students → 200 with paginated student list**
- **FR-2.3: GET /api/teacher/students?page=1&limit=5 → returns exactly 5 students + pagination metadata **`{ page, limit, total, totalPages }`
- **FR-2.4: GET /api/teacher/students?search=alice → returns only students matching "alice"**
- **FR-2.5: GET /api/teacher/students/:id → returns student detail with **`overallAccuracy`, `modulesCompleted`, per-concept breakdown
- **FR-2.6: GET /api/teacher/students/:nonExistentId → 404**
- **FR-2.7: GET /api/teacher/overview → returns **`{ totalStudents, totalModules, avgCompletionRate, avgQuizScore, moduleBreakdown }`
- **FR-2.8: GET /api/teacher/modules/:id/report → returns **`{ completionRate, avgScore, avgTimeSpent }`
- **FR-2.9: GET /api/teacher/reports/export → response has **`Content-Type: text/csv` header and valid CSV content
- **FR-2.10: Unauthenticated request to any teacher endpoint → 401**

### Manual Verification (REST client)

```
1. Login as teacher
2. GET /api/teacher/overview → see aggregate stats
3. GET /api/teacher/students?page=1&limit=5 → see paginated list
4. GET /api/teacher/students/:id → see detailed report
5. GET /api/teacher/reports/export → download CSV file
6. Login as student → GET /api/teacher/students → confirm 403
```

### NOT in scope for Phase 2

- **Frontend teacher dashboard (Phase 5)**
- **Course management (Phase 4)**

---

## Phase 3: AI Layer + Learning Style + Personalized Practice (backend)

**Goal**: Students take a learning style quiz, get a style profile (Visual/Verbal/Scenario), then receive AI-generated practice questions personalized to their style. AI responses are cached in the database.

**Branch**: `feature/ai-practice`

### Schema Changes

```
New enum: LearningStyle (VISUAL, VERBAL, SCENARIO)
New model: User_learning_profile
  - user_id Int @unique
  - primary_style LearningStyle
  - style_scores Json
  - quiz_responses Json

New model: AI_practice_cache
  - concept_id Int
  - learning_style LearningStyle
  - generated_content Json
  - expires_at DateTime
  - @@unique([concept_id, learning_style])
```

### Files to Create

| **Layer**      | **File**                                        | **Purpose**                                                                |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| **AI**         | `src/services/ai/AIProvider.ts`                 | **Interface:**`complete(messages)`,`completeJSON<T>(messages)`             |
| **AI**         | `src/services/ai/OpenAIProvider.ts`             | **OpenAI SDK implementation**                                              |
| **AI**         | `src/services/ai/AnthropicProvider.ts`          | **Anthropic SDK implementation**                                           |
| **AI**         | `src/services/ai/AIProviderFactory.ts`          | **Reads** `AI_PROVIDER`env → returns provider instance                     |
| **Repository** | `src/repositories/LearningProfileRepository.ts` | **CRUD for User_learning_profile**                                         |
| **Repository** | `src/repositories/PracticeCacheRepository.ts`   | **Cache CRUD with TTL check**                                              |
| **Service**    | `src/services/LearningStyleService.ts`          | `evaluateStyle(responses)`,`saveProfile()`,`getProfile()`                  |
| **Service**    | `src/services/PracticeGeneratorService.ts`      | `generatePractice(conceptId, userId)`with cache check + AI call + fallback |
| **Controller** | `src/controller/LearningStyleController.ts`     | **Quiz submission + profile retrieval**                                    |
| **Controller** | `src/controller/PracticeController.ts`          | **Practice generation + answer checking**                                  |
| **Route**      | `src/routes/learningStyle.routes.ts`            | `GET /questions`,`POST /submit`,`GET /profile`                             |
| **Route**      | `src/routes/practice.routes.ts`                 | `POST /generate`,`POST /check`                                             |

### Files to Modify

| **File**     | **Change**                                                |
| ------------ | --------------------------------------------------------- |
| `src/app.ts` | **Wire AI factory, learning style stack, practice stack** |

### New Endpoints

```
GET  /api/learning-style/questions  → returns learning style quiz questions (hardcoded)
POST /api/learning-style/submit     → submit answers, returns style profile
GET  /api/learning-style/profile    → retrieve saved profile
POST /api/practice/generate         → generate AI practice for concept × style (cached)
POST /api/practice/check            → check AI practice answers
```

### NPM Packages to Add

```
openai
@anthropic-ai/sdk
```

### Testable Requirements

**Unit tests**:

- **FR-3.1: **`evaluateStyle()` with 5 VISUAL, 2 VERBAL, 1 SCENARIO → returns primary_style VISUAL
- **FR-3.2: **`evaluateStyle()` with equal scores → returns a deterministic result (not random)

**Integration tests**:

- **FR-3.3: GET /api/learning-style/questions → returns array of 8-10 questions, each with 3 options**
- **FR-3.4: POST /api/learning-style/submit with valid responses → returns **`{ primaryStyle, scores }` and saves profile to DB
- **FR-3.5: GET /api/learning-style/profile after submission → returns saved profile matching what was submitted**
- **FR-3.6: GET /api/learning-style/profile before any submission → 404**
- **FR-3.7: POST /api/practice/generate with valid conceptId → returns 3 questions with **`question`, `options`, `correct_option_index`, `explanation` fields
- **FR-3.8: POST /api/practice/generate called twice for same concept + style → second call returns cached result (verify via **`expires_at` or response time < 500ms)
- **FR-3.9: POST /api/practice/generate with invalid conceptId → 404**
- **FR-3.10: POST /api/practice/generate without auth → 401**
- **FR-3.11: AI provider fails → returns fallback (existing non-personalized quiz questions)**

**Note on AI testing**: For integration tests, mock the AI provider to return a fixed response. Do NOT call the real OpenAI/Anthropic API in tests. The AI provider interface makes this easy to mock via dependency injection.

### Manual Verification (REST client)

```
1. Login as student
2. GET /api/learning-style/questions → see quiz
3. POST /api/learning-style/submit → see style result
4. POST /api/practice/generate { conceptId: 1 } → see AI-generated questions
5. Call again → should return quickly (cached)
```

### NOT in scope for Phase 3

- **Redis-based rate limiting (Phase 6 — use simple in-memory counter for now, replaced in Phase 6)**
- **Frontend learning style quiz UI (Phase 5)**

---

## Phase 4: Course Generation Pipeline (backend)

**Goal**: Teachers can upload a .docx or .md file, trigger AI to structure it into a module, review/edit the result, and publish it as a live module visible to students. Publishing is atomic.

**Branch**: `feature/course-pipeline`

### Schema Changes

```
New enum: CourseStatus (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
New model: Course_draft
  - teacher_id Int (FK → User)
  - title String
  - status CourseStatus @default(DRAFT)
  - source_content String @db.Text
  - source_type String ("markdown" | "docx")
  - generated_json Json? @db.JsonB
  - edited_json Json? @db.JsonB
  - published_module_id Int?
  - timestamps
```

### Files to Create

| **Layer**      | **File**                                    | **Purpose**                                                                            |
| -------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Repository** | `src/repositories/CourseDraftRepository.ts` | **CRUD, findByTeacher, findByStatus**                                                  |
| **Service**    | `src/services/CourseGeneratorService.ts`    | `parseUpload()`,`generateStructure()`,`publishDraft()`                                 |
| **Controller** | `src/controller/CourseController.ts`        | **Upload, generate, get drafts, update, publish, delete**                              |
| **Route**      | `src/routes/course.routes.ts`               | **All teacher-guarded**                                                                |
| **Validation** | `src/validation/courseValidation.ts`        | **Zod schema for course JSON structure**                                               |
| **Utility**    | `src/utils/courseSeeder.ts`                 | **Extract** `seedModuleFromJSON()`from existing seed script — shared by seed + publish |

### Files to Modify

| **File**                 | **Change**                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| `src/app.ts`             | **Wire course stack**                                                      |
| **Existing seed script** | **Import** `seedModuleFromJSON`from shared utility instead of inline logic |

### New Endpoints

```
POST   /api/courses/upload              → upload .docx/.md + title, create draft (DRAFT)
POST   /api/courses/:draftId/generate   → trigger AI structuring (DRAFT → REVIEW)
GET    /api/courses/drafts              → list teacher's drafts with status
GET    /api/courses/:draftId            → draft detail with generated JSON
PUT    /api/courses/:draftId            → save teacher edits to edited_json
POST   /api/courses/:draftId/publish    → publish to live module (REVIEW → PUBLISHED, atomic)
DELETE /api/courses/:draftId            → delete unpublished draft
```

### NPM Packages to Add

```
mammoth
multer
@types/multer
```

### Testable Requirements

**Integration tests**:

- **FR-4.1: Teacher uploads .md file → 201 with **`{ draftId, status: "DRAFT" }` and `source_content` stored in DB
- **FR-4.2: Teacher uploads .docx file → 201 with text content extracted and stored**
- **FR-4.3: Student calls POST /api/courses/upload → 403**
- **FR-4.4: POST /api/courses/:draftId/generate → status changes from DRAFT to REVIEW, **`generated_json` is populated
- **FR-4.5: GET /api/courses/drafts → returns only the current teacher's drafts, not other teachers'**
- **FR-4.6: PUT /api/courses/:draftId with modified JSON → **`edited_json` is updated in DB
- **FR-4.7: POST /api/courses/:draftId/publish → creates Module + Theme + Concepts + Tutorials + Quizzes + Summaries in DB, status is PUBLISHED**
- **FR-4.8: After publish, GET /api/modules/overview includes the newly published module**
- **FR-4.9: Publish is atomic: if any child record insertion fails, no module or child records exist in DB**
- **FR-4.10: DELETE /api/courses/:draftId for unpublished draft → draft removed**
- **FR-4.11: DELETE /api/courses/:draftId for another teacher's draft → 403**
- **FR-4.12: POST /api/courses/:draftId/publish for a DRAFT status (not REVIEW) → 400**

**Note on AI testing**: Mock the AI provider for `generateStructure()`. Return a valid course JSON fixture that matches the expected schema.

### Manual Verification (REST client)

```
1. Login as teacher
2. POST /api/courses/upload with a .md file → see draft created
3. POST /api/courses/:draftId/generate → see generated JSON structure
4. PUT /api/courses/:draftId with edits → save
5. POST /api/courses/:draftId/publish → see module created
6. Login as student → GET /api/modules/overview → new module appears
```

### NOT in scope for Phase 4

- **Frontend course editor (Phase 5)**
- **Archive/unpublish endpoint (nice-to-have, cut)**

---

## Phase 5: Frontend (all features)

**Goal**: Build all student-facing and teacher-facing pages. Connect to the working backend API.

**Branch**: `feature/frontend`

### Student Pages

```
app/profile/page.tsx                → MedalCollection component showing all medals
app/learning-style/page.tsx         → Multi-step learning style quiz
app/module/[moduleId]/concept/[conceptId]/practice/ai/page.tsx → AI practice page
```

### Student Components

```
components/medal/MedalBadge.tsx         → Bronze/Silver/Gold badge with distinct colors
components/medal/MedalCollection.tsx    → Grid of concept + module medals
components/practice/LearningStyleQuiz.tsx → Step-by-step quiz component
components/practice/AIPracticeQuestion.tsx → AI question display with loading skeleton
```

### Student Modifications

```
app/module/[moduleId]/concept/[conceptId]/practice/question/page.tsx → Invalidate ["medals"] after quiz
app/module/[moduleId]/concept/[conceptId]/summary/page.tsx → Add "Practice More with AI" button
lib/types/api.ts   → Add Medal, MedalSummary, LearningStyle types
lib/api/client.ts  → Add getMedals(), getLearningStyleQuestions(), submitLearningStyle(), generatePractice()
lib/hooks/useApi.ts → Add useMedals(), useLearningStyle(), usePractice() hooks
```

### Teacher Pages

```
app/teacher/layout.tsx              → TeacherSidebar nav
app/teacher/page.tsx                → Dashboard with ClassOverviewCards
app/teacher/students/page.tsx       → Searchable/sortable student table with pagination
app/teacher/students/[id]/page.tsx  → Individual student report
app/teacher/courses/page.tsx        → Course list (drafts + published, status badges)
app/teacher/courses/new/page.tsx    → Upload form (file + title)
app/teacher/courses/[draftId]/page.tsx     → Draft overview
app/teacher/courses/[draftId]/edit/page.tsx → Course editor (collapsible sections)
app/teacher/reports/page.tsx        → Class report table + CSV export button
```

### Teacher Components

```
components/teacher/TeacherSidebar.tsx    → Navigation sidebar
components/teacher/StudentTable.tsx      → Sortable table with progress columns
components/teacher/ClassOverviewCards.tsx → Stat cards
components/teacher/StudentReportView.tsx → Detailed student breakdown
components/teacher/CourseUpload.tsx      → File drop zone
components/teacher/CourseEditor.tsx      → Form-based editor for course JSON
components/teacher/CourseStatusBadge.tsx → Colored status indicator
```

### Auth Modifications

```
components/guards/AuthGuard.tsx → Block students from /teacher/*, redirect teachers to /teacher after login
components/layout/Header.tsx    → Show "Dashboard" link when role === 'TEACHER'
lib/types/api.ts               → Add role to User interface
lib/hooks/useTeacherApi.ts     → React Query hooks for all teacher endpoints
lib/types/teacher.ts           → TypeScript interfaces for teacher DTOs
```

### Verification

```
As student:
1. Login → see module overview
2. Complete quiz → medal appears on profile
3. Take learning style quiz → see result
4. Generate AI practice → see personalized questions

As teacher:
1. Login → redirected to /teacher dashboard
2. See class overview stats
3. Browse paginated student list
4. View individual student report
5. Upload course file → generate → edit → publish
6. New module appears in student view
7. Export CSV report
```

### NOT in scope for Phase 5

- **Dynamic imports / code splitting (Phase 6)**
- **Optimistic UI for quiz submissions (Phase 6)**
- **Medal prefetch on login (Phase 6)**

---

## Phase 6: Redis + Deploy

**Goal**: Add Redis for distributed caching (teacher reports) and AI rate limiting. Deploy to Fly.io single instance with Render PostgreSQL and Upstash Redis.

**Branch**: `feature/redis-deploy`

### Files to Create

| **Layer** | **File**           | **Purpose**                                                                                                         |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Lib**   | `src/lib/redis.ts` | **Redis client singleton (ioredis), connection config**                                                             |
| **Lib**   | `src/lib/cache.ts` | **Redis-backed cache utility:**`get(key)`,`set(key, value, ttlSeconds)`,`rateLimitCheck(key, limit, windowSeconds)` |

### Files to Modify

| **File**                                   | **Change**                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `src/services/TeacherService.ts`           | **Wrap report queries with Redis cache (5 min TTL)**                    |
| `src/services/PracticeGeneratorService.ts` | **Replace in-memory rate limiter with Redis-based distributed counter** |
| `src/app.ts`                               | **Import Redis client, add health check endpoint**                      |

### New Endpoint

```
GET /api/health → { status: "ok", timestamp, db: true/false, redis: true/false }
```

### NPM Packages to Add

```
ioredis
@types/ioredis
```

### Testable Requirements

**Integration tests**:

- **FR-6.1: GET /api/health → 200 with **`{ status: "ok", db: true, redis: true }`
- **FR-6.2: Teacher report called twice within 5 min → second call is faster (cache hit)**
- **FR-6.3: AI rate limit: after 10 calls in 1 hour, next call returns 429 Too Many Requests**

### Deploy Checklist

- [ ] **Create Fly.io app (single instance)**
- [ ] **Set environment variables on Fly.io (DATABASE_URL, JWT secrets, AI keys, REDIS_URL)**
- [ ] **Create Upstash Redis instance, get REDIS_URL**
- [ ] **Verify DATABASE_URL points to Render PostgreSQL**
- [ ] **Deploy: **`fly deploy`
- [ ] **Verify: **`curl https://bookaction-api.fly.dev/api/health` → `{ db: true, redis: true }`
- [ ] **Set **`NEXT_PUBLIC_API_URL` on Vercel to Fly.io URL
- [ ] **Deploy frontend to Vercel**
- [ ] **Verify full flow in production**

### NOT in scope for Phase 6

- **Multi-instance deployment (single instance is sufficient)**
- **PgBouncer (not needed for single instance)**
- **Load testing**
- **Graceful shutdown handler**
- **CI/CD pipeline**
