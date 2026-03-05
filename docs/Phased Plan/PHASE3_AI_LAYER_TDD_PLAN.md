# Phase 3: AI Layer + Learning Style + Personalized Practice - TDD Plan

## Context

Phase 3 adds student learning style profiling and AI-generated practice questions. Students take a style quiz (`Visual` / `Verbal` / `Scenario`), get a profile, then receive AI-personalized practice cached in the database.

This follows:

- Phase 1: medals
- Phase 2: teacher portal

## TDD Phase 1 - Test Files To Create

### 1. `__tests__/unit/learningStyle.test.ts` (2 tests)

Tests the pure `evaluateStyle()` function, analogous to `calculateMedalTier` in `__tests__/unit/medal.test.ts`.

| Test | Description |
| --- | --- |
| `FR-3.1` | `evaluateStyle([5 VISUAL, 2 VERBAL, 1 SCENARIO])` returns `{ primaryStyle: "VISUAL", scores: { VISUAL: 5, VERBAL: 2, SCENARIO: 1 } }` |
| `FR-3.2` | `evaluateStyle([equal scores])` returns a deterministic result. `SCENARIO` wins ties, alphabetical first. |

Import from: `../../src/constants/learningStyleEvaluator.js`

### 2. `__tests__/integration/learningStyle.test.ts` (~8 tests)

Tests learning style endpoints. Uses static imports like existing tests.

Setup: create test student, then login for token.  
Teardown: delete `User_learning_profile`, then user.

| Test | Endpoint | Expected |
| --- | --- | --- |
| `FR-3.6` | `GET /api/learning-style/profile` before submit | `404` |
| `FR-3.3a` | `GET /api/learning-style/questions` | `200`, array of `8-10` questions, each with `3` options |
| `FR-3.3b` | `GET /api/learning-style/questions` without auth | `401` |
| `FR-3.4a` | `POST /api/learning-style/submit` with valid responses | `200`, `{ primaryStyle, scores }` |
| `FR-3.4b` | Verify profile saved to DB via direct Prisma query | DB has matching record |
| `FR-3.4c` | `POST /api/learning-style/submit` without auth | `401` |
| `FR-3.5a` | `GET /api/learning-style/profile` after submit | `200`, matches submission |
| `FR-3.5b` | Profile contains `primaryStyle` and `scores` matching `FR-3.4` result | Exact match |

Order matters:

- `FR-3.6` (`404`) runs before `FR-3.4` (submit)
- `FR-3.5` runs after `FR-3.4`
- Jest runs `describe` blocks sequentially within a file

### 3. `__tests__/integration/practice.test.ts` (~7 tests)

Tests AI practice generation. Requires mocking the AI provider.

ESM mocking strategy: use `jest.unstable_mockModule()` before dynamic `import()` of setup. The mock returns deterministic questions. A `mockShouldFail` flag controls `FR-3.11`.

```ts
const mockGenerate = jest.fn();
jest.unstable_mockModule("../../src/services/ai/AIProviderFactory.js", () => ({
  createAIProvider: () => ({ generatePracticeQuestions: mockGenerate }),
}));
const { app, prisma } = await import("../../tests/setup.js");
```

Setup: create student, login, submit learning style, create test module + concept (`order_index=996`) with quiz questions for fallback.  
Teardown: delete cache, profile, concept, module, user.

| Test | Endpoint | Expected |
| --- | --- | --- |
| `FR-3.10` | `POST /api/practice/generate` without auth | `401` |
| `FR-3.9` | `POST /api/practice/generate { conceptId: 99999999 }` | `404` |
| `FR-3.7a` | `POST /api/practice/generate { conceptId }` | `200`, array of `3` questions |
| `FR-3.7b` | Each question has `question`, `options`, `correct_option_index`, `explanation` | Structure validated |
| `FR-3.8a` | Second call with same concept returns identical response body | Deep equality |
| `FR-3.8b` | Cache entry exists in `AI_practice_cache` table | DB verification |
| `FR-3.11` | AI provider throws and service returns fallback from `Quiz` table | `200`, questions from DB |

## TDD Phase 2 - Implementation Order

### Step 1: Schema + Migration

File: `prisma/schema.prisma`

- Add `LearningStyle` enum: `VISUAL`, `VERBAL`, `SCENARIO`
- Add `User_learning_profile` model: `user_id @unique`, `primary_style`, `style_scores Json`, `quiz_responses Json`
- Add `AI_practice_cache` model: `concept_id`, `learning_style`, `generated_content Json`, `expires_at`, `@@unique`
- Add relation fields on `User` and `Concept` models
- Run: `npx prisma migrate dev --name add-learning-style-and-practice-cache`

### Step 2: Pure Function (`FR-3.1`, `FR-3.2`)

Create: `src/constants/learningStyleEvaluator.ts`

- Export `evaluateStyle(responses: LearningStyle[]): { primaryStyle: LearningStyle; scores: Record<string, number> }`
- Count occurrences and return the highest
- Tie-break rule: alphabetical, so `SCENARIO > VERBAL > VISUAL`

### Step 3: Learning Style Stack (`FR-3.3`-`FR-3.6`)

| Layer | File | Key Methods |
| --- | --- | --- |
| DTO | `src/dtos/response/LearningStyleDTO.ts` | `Question`, `SubmitResponse`, `ProfileResponse` types |
| Repository | `src/repositories/LearningProfileRepository.ts` | `findByUserId()`, `upsert()` |
| Service | `src/services/LearningStyleService.ts` | `getQuestions()` with hardcoded `8-10` questions, `submit(userId, responses)`, `getProfile(userId)` |
| Controller | `src/controller/LearningStyleController.ts` | `getQuestions()`, `submit()`, `getProfile()` |
| Routes | `src/routes/learningStyle.routes.ts` | `createLearningStyleRoutes(controller)`, all routes use `authMiddleware` |

### Step 4: AI Provider Abstraction

| File | Purpose |
| --- | --- |
| `src/services/ai/AIProvider.ts` | Interface: `generatePracticeQuestions(title, definition, style): Promise<GeneratedQuestion[]>` |
| `src/services/ai/OpenAIProvider.ts` | OpenAI SDK implementation |
| `src/services/ai/AnthropicProvider.ts` | Anthropic SDK implementation |
| `src/services/ai/AIProviderFactory.ts` | `createAIProvider()` reads `AI_PROVIDER` env var and returns instance |

NPM packages:

- `openai`
- `@anthropic-ai/sdk`

### Step 5: Practice Generation Stack (`FR-3.7`-`FR-3.10`)

| Layer | File | Key Methods |
| --- | --- | --- |
| DTO | `src/dtos/response/PracticeDTO.ts` | `GeneratedQuestion` type |
| Repository | `src/repositories/PracticeCacheRepository.ts` | `findValid(conceptId, style)` checks `expires_at`, `upsert()` |
| Service | `src/services/PracticeGeneratorService.ts` | `generate(userId, conceptId)` gets user style, checks cache, calls AI, saves cache |
| Controller | `src/controller/PracticeController.ts` | `generate()` |
| Routes | `src/routes/practice.routes.ts` | `createPracticeRoutes(controller)`, all routes use `authMiddleware` |

### Step 6: Fallback Logic (`FR-3.11`)

In `PracticeGeneratorService.generate()`, wrap the AI call in `try/catch`. On failure, query `Quiz` records for the concept via `ConceptRepository` and return them as fallback questions.

### Step 7: Wire In `app.ts`

Modify: `src/app.ts`

- Import and instantiate `LearningProfileRepository`, `PracticeCacheRepository`, `LearningStyleService`, `PracticeGeneratorService` with AI provider from factory, `LearningStyleController`, and `PracticeController`
- Register:
  - `app.use("/api/learning-style", createLearningStyleRoutes(...))`
  - `app.use("/api/practice", createPracticeRoutes(...))`

## Key Design Decisions

1. Tie-breaking in `FR-3.2`: `SCENARIO` wins ties because it is alphabetical first in the chosen ordering.
2. AI mocking in tests: use `jest.unstable_mockModule()` plus dynamic imports for ESM compatibility.
3. Learning style questions: use a hardcoded constant array rather than DB-backed data, similar to `medalThresholds.ts`.
4. Cache TTL: default to 24 hours in `PracticeGeneratorService`.
5. Fallback in `FR-3.11`: return existing `Quiz` questions from DB when the AI provider fails.

## Verification

1. After Phase 1: run `npm test` and confirm all new tests fail, red state.
2. After Phase 2: run `npm test` and confirm all tests pass, green state.
3. Manual flow: login as student, `GET` questions, `POST` submit, `POST` generate, then call again to confirm cached behavior.

## Files Summary

### New Test Files (3)

- `__tests__/unit/learningStyle.test.ts`
- `__tests__/integration/learningStyle.test.ts`
- `__tests__/integration/practice.test.ts`

### New Source Files (15)

- `src/constants/learningStyleEvaluator.ts`
- `src/dtos/response/LearningStyleDTO.ts`
- `src/dtos/response/PracticeDTO.ts`
- `src/repositories/LearningProfileRepository.ts`
- `src/repositories/PracticeCacheRepository.ts`
- `src/services/LearningStyleService.ts`
- `src/services/PracticeGeneratorService.ts`
- `src/services/ai/AIProvider.ts`
- `src/services/ai/OpenAIProvider.ts`
- `src/services/ai/AnthropicProvider.ts`
- `src/services/ai/AIProviderFactory.ts`
- `src/controller/LearningStyleController.ts`
- `src/controller/PracticeController.ts`
- `src/routes/learningStyle.routes.ts`
- `src/routes/practice.routes.ts`

### Modified Files (2)

- `prisma/schema.prisma`
- `src/app.ts`
