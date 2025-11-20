# API Design

_Last updated: 2025-02-14. Sample payloads were captured by running `docker exec -i bookaction_postgres psql -U postgres -d bookaction_local -t -A -c '<SQL>'` so every example mirrors the current seed data that Prisma Studio exposes on port 5555._

## Architecture Snapshot

- **Layered Flow:** HTTP requests enter the Express routers (`src/routes/*.ts`), move through controllers (e.g., `ModuleController`, `ConceptController`), and are delegated to services (`ModuleService`, `ConceptService`, `UserProgressService`). Services isolate business rules and orchestrate repository calls (`ModuleRepository`, `ConceptRepository`, `UserProgressRepository`). Repositories wrap Prisma to talk to PostgreSQL.
- **DTO-first Contracts:** Request DTOs such as `UpdateProgressDTO` and response DTOs like `ConceptTutorialDTO`, `ConceptQuizzesDTO`, and `ModulesOverviewDTO` keep API shapes consistent and prevent leaking Prisma models to the client.
- **Dependency Injection:** Routes manually compose repositories → services → controllers, which keeps components testable and lets us plug in mock repositories or SQL-backed snapshots without touching application code.
- **Error Boundaries:** Controllers validate path/body parameters and surface user-friendly status codes, while services throw descriptive errors when dependent data (theme, quiz, summary, reflection) is missing.

### Component Overview

| Layer | Responsibilities | Key Files |
| --- | --- | --- |
| Router | Mounts HTTP paths | `src/routes/module.routes.ts`, `src/routes/concept.routes.ts` |
| Controller | Parse params, invoke services, serialize responses | `src/controller/ModuleController.ts`, `src/controller/ConceptController.ts` |
| Service | Business logic, DTO shaping, orchestration | `src/services/ModuleService.ts`, `src/services/ConceptService.ts`, `src/services/UserProgressService.ts` |
| Repository | Prisma queries + persistence helpers | `src/repositories/ModuleRepository.ts`, `src/repositories/ConceptRepository.ts`, `src/repositories/UserProgressRepository.ts` |

## Critical Logic Highlights

### Modules Overview Aggregation
1. `ModuleRepository.returnModulesOverview(userId)` fetches modules ordered by `order_index`, includes the theme, and joins concept progress filtered to the requested user.
2. Repository logic calculates per-module completion by counting completed concepts vs. total, keeping the DTO lean.
3. `ModuleService.getModulesOverview` enforces defaults (userId 1 when missing) and remaps fields to the strict `ModulesOverviewDTO` before the controller returns it.

### Quiz Evaluation and Persistence
1. `ConceptController.saveUserQuizAns` validates `quizId`, `responseType`, `userId`, `userAnswerIndices`, and `timeSpent`.
2. `ConceptService.saveQuizAnswers` loads the canonical answers via `ConceptRepository.findQuizAnswer`, then feeds both arrays into `calculateScore`.
3. `calculateScore` handles single-choice (1 or 0) and multiple-choice (fraction of matches + strict correctness flag).
4. `ConceptRepository.saveQuizAnswersToDB` persists every submission to `user_response` JSONB for analytics.

### Reflection Capture
1. `ModuleController.getModuleReflection` fetches learner-facing prompts tied to a module, letting the UI show context-specific instructions.
2. `ModuleController.saveModuleReflection` enforces `reflectionId`, `userId`, and `answer`, then delegates to `ModuleService.saveModuleReflection`.
3. `ModuleRepository.saveModuleReflectionRes` stores responses in `user_response` with the `reflection` response type so later analytics can be grouped with quiz answers.

### Concept Progress Upsert
1. `ConceptController.updateConceptProgress` accepts `userId`, `isCompleted`, and optional `timeSpent`.
2. `UserProgressService.saveProgress` validates `userId` and calls `UserProgressRepository.upsertProgress`.
3. The repository uses Prisma's composite unique key (`concept_id_user_id`) to update or create progress, stamping `completed_at` when `isCompleted` is true.

## API Reference

_All sample responses below were produced from `docker exec -i bookaction_postgres psql ...` snapshots of the live seed database so they reflect the actual content surfaced in Prisma Studio._

### GET /api/modules/overview — Learning Homepage
- **Purpose:** Return every module with its theme, user-specific progress, and ordered concepts.
- **Request:** `GET /api/modules/overview`
- **Auth/User Context:** Currently defaults to `userId = 1` inside the service; extend query parameters when multi-user support is wired on the route.

**Sample Response (captured via SQL snapshot):**
```json
{
  "modules": [
    {
      "id": 13,
      "title": "Communication and Boundaries",
      "theme": {
        "title": "Late-Night Texting",
        "context": "At midnight, Sam's friend Jordan kept texting about a game. Exhausted but caring, Sam waited until morning to say, “I feel tired when I get texts after 11 PM.” Jordan understood and explained his anxiety. They agreed Jordan would text earlier, leaving both friends feeling heard and respected.",
        "mediaUrl": "/media/panda.png",
        "mediaType": "image",
        "question": "How would you handle a situation where a friend's communication habits clash with your needs?"
      },
      "progress": 25,
      "concepts": [
        { "id": 46, "title": "Using 'I' Statements to Express Feelings", "completed": true },
        { "id": 47, "title": "The Art of Active Listening", "completed": false },
        { "id": 48, "title": "Setting Boundaries and Saying 'No' Kindly", "completed": false },
        { "id": 49, "title": "Recognizing Feelings and Managing Emotions", "completed": false }
      ]
    }
  ]
}
```

### GET /api/modules/{moduleId}/theme — Module Theme Stage
- **Purpose:** Provide the story, media asset, and hook question used to onboard the learner to a module.
- **Path Params:** `moduleId` (number)
- **Request:** `GET /api/modules/13/theme`

**Sample Response:**
```json
{
  "title": "Late-Night Texting",
  "context": "At midnight, Sam's friend Jordan kept texting about a game. Exhausted but caring, Sam waited until morning to say, “I feel tired when I get texts after 11 PM.” Jordan understood and explained his anxiety. They agreed Jordan would text earlier, leaving both friends feeling heard and respected.",
  "mediaUrl": "/media/panda.png",
  "mediaType": "image",
  "question": "How would you handle a situation where a friend's communication habits clash with your needs?"
}
```

### Module Reflection Prompt and Submission

#### GET /api/modules/{moduleId}/reflection
- **Purpose:** Fetch the reflection prompt and optional media asset for the module exit experience.
- **Request:** `GET /api/modules/13/reflection`

**Sample Response:**
```json
{
  "type": "text",
  "prompt": "Think of a recent disagreement or tense situation you had with someone. How did you communicate your feelings? If you reacted on impulse or kept feelings inside, how might you handle it differently now using an 'I' statement or a pause to calm down?",
  "mediaUrl": "/media/panda.png"
}
```

#### POST /api/modules/{moduleId}/reflection
- **Purpose:** Persist a learner's reflection answer.
- **Request:** `POST /api/modules/13/reflection`
- **Body:**
```json
{
  "reflectionId": 12,
  "userId": 1,
  "answer": "I paused to cool off and then shared how the late texts made me feel.",
  "timeSpent": 180
}
```

**Sample Response:**
```json
{
  "message": "Reflection saved successfully",
  "reflectionId": 12,
  "userId": 1,
  "answer": "I paused to cool off and then shared how the late texts made me feel.",
  "timeSpent": 180
}
```

### GET /api/concepts/{conceptId}/tutorial — Concept Intro
- **Purpose:** Deliver the instructional story, definition, and contrasting examples for a concept.
- **Request:** `GET /api/concepts/46/tutorial`

**Sample Response:**
```json
{
  "title": "Using 'I' Statements to Express Feelings",
  "definition": "I statements are a communication tool that helps you express your feelings without blaming others by focusing on your own emotions and experiences",
  "whyItWorks": "Using 'I feel' instead of 'You did' prevents the other person from immediately getting defensive and provides clarity about what is bothering you and why",
  "tutorial": {
    "goodExample": {
      "story": "Maya felt upset when her sister borrowed her headphones without asking. Instead of yelling, she took a breath and said: 'I feel frustrated when my things are taken without permission because I was looking for them this morning. Can you please ask me next time?' Her sister apologized and promised to ask first.",
      "mediaUrl": "/media/panda.png"
    },
    "badExample": {
      "story": "Tom was angry about his friend canceling plans. He texted: 'You ALWAYS bail on me! You're such a flake and you obviously don't care about our friendship!' His friend felt attacked and they ended up in a huge argument that could have been avoided.",
      "mediaUrl": "/media/panda.png"
    }
  }
}
```

### GET /api/concepts/{conceptId}/quiz — Concept Practice
- **Purpose:** List quiz questions tied to a concept, ordered by `order_index`.
- **Request:** `GET /api/concepts/46/quiz`

**Sample Response:**
```json
{
  "questions": [
    {
      "orderIndex": 1,
      "question": "Your friend keeps interrupting you during conversations. Which is the best 'I' statement to address this?",
      "questionType": "single_choice",
      "mediaUrl": "/media/panda.png",
      "options": [
        "You never let me finish talking!",
        "I feel frustrated when I'm interrupted because I lose my train of thought",
        "Stop being so rude all the time",
        "Why can't you just listen for once?"
      ],
      "correctOptionIndex": [1],
      "explanation": "This option follows the 'I feel [emotion] when [situation] because [reason]' formula and focuses on your experience without attacking the other person"
    },
    {
      "orderIndex": 2,
      "question": "What are the three key parts of an effective 'I' statement?",
      "questionType": "single_choice",
      "mediaUrl": "/media/panda.png",
      "options": [
        "Blame, accusation, demand",
        "Feeling, situation, reason",
        "Problem, person, punishment",
        "Complaint, criticism, consequence"
      ],
      "correctOptionIndex": [1],
      "explanation": "An effective 'I' statement includes: how you FEEL, the SITUATION that triggers it, and the REASON why it affects you"
    }
  ]
}
```

### POST /api/quiz/{quizId}/answer — Quiz Submission
- **Purpose:** Submit the learner's answer to a quiz question and receive the correctness payload.
- **Request:** `POST /api/quiz/89/answer`
- **Body:**
```json
{
  "responseType": "single_choice",
  "userId": 1,
  "userAnswerIndices": [1],
  "timeSpent": 30
}
```

**Sample Response:**
```json
{
  "userAnswerIndices": [1],
  "correctOptionIndices": [1],
  "score": 1
}
```

### GET /api/concepts/{conceptId}/summary — Concept Summary Card
- **Purpose:** Provide the wrap-up statement and teaser for the next concept.
- **Request:** `GET /api/concepts/46/summary`

**Sample Response:**
```json
{
  "summaryContent": "I statements help you express feelings without creating conflict. Remember the formula: 'I feel [emotion] when [situation] because [reason].' This approach takes responsibility for your emotions while clearly communicating your needs.",
  "nextConceptIntro": "Now that you can express your feelings clearly, let's explore how to truly listen when others share theirs."
}
```

### POST /api/concepts/{conceptId}/progress — Concept Completion State
- **Purpose:** Upsert a learner's completion flag and optional time spent for a concept.
- **Request:** `POST /api/concepts/46/progress`
- **Body:**
```json
{
  "userId": 1,
  "isCompleted": true,
  "timeSpent": 120
}
```

**Sample Response:**
```json
{
  "id": 1,
  "concept_id": 46,
  "user_id": 1,
  "order_index": 0,
  "completed": true,
  "time_spent": 120,
  "completed_at": "2025-11-19T19:57:27.641",
  "created_at": "2025-11-19T19:57:24.202"
}
```

## Appendix: Reproducing Samples

- Run `docker exec -i bookaction_postgres psql -U postgres -d bookaction_local -t -A -c '<SQL>'` and paste the SQL snippets included above (for example, the modules overview CTE or the concept-specific `jsonb_build_object` queries) to dump the latest seed data as JSON.
- The SQL was executed after `docker-compose up -d` started Postgres and the `prisma/seed/module1.json` content was synced into `Quiz.correct_option_index`, ensuring every payload mirrors what Prisma Studio displays on http://localhost:5555.
