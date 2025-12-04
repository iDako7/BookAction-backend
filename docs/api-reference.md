# BookAction API Reference

Base URL: `http://localhost:3000/api` (set `PORT` to override host port)

- Auth flow: call `/auth/register` or `/auth/login` to get an `accessToken` (JWT) and an httpOnly `refreshToken` cookie. Send `Authorization: Bearer <accessToken>` on protected routes. Use `/auth/refresh` with the refresh token (cookie or body) to obtain a new access token.
- Content type: JSON for all bodies.
- Time fields are seconds unless stated otherwise.

## Auth

- `POST /auth/register` — create account  
  Body: `{ "email": string, "username": string, "password": string }`  
  Response 201: `{ success: true, message, data: { user: { id, email, username, role, isActive, createdAt }, accessToken } }` and sets `refreshToken` cookie.

- `POST /auth/login` — get tokens  
  Body: `{ "emailOrUsername": string, "password": string }`  
  Response: `{ success: true, message, data: { user, accessToken } }` plus `refreshToken` cookie.

- `POST /auth/refresh` — swap refresh for new access token  
  Body (if not using cookie): `{ "refreshToken": string }`  
  Response: `{ success: true, message, data: { newAccessToken } }`.

- `POST /auth/logout` (auth required) — revoke refresh token and clear cookie  
  Headers: `Authorization: Bearer <accessToken>`  
  Response: `{ success: true, message }`.

- `GET /auth/me` (auth required) — current user profile  
  Headers: `Authorization: Bearer <accessToken>`  
  Response: `{ success: true, data: { user } }`.

## Modules (auth required)

Headers for all: `Authorization: Bearer <accessToken>`

- `GET /modules/overview` — list modules with progress for the user (defaults to userId=1 in service)  
  Response:  
  ```json
  {
    "modules": [
      {
        "id": 1,
        "title": "Intro Module",
        "theme": { "title": "...", "context": "...", "mediaUrl": "...", "mediaType": "video", "question": "..." },
        "progress": 50,
        "concepts": [
          { "id": 10, "title": "Concept A", "completed": true },
          { "id": 11, "title": "Concept B", "completed": false }
        ]
      }
    ]
  }
  ```

- `GET /modules/:moduleId/theme` — module theme  
  Response: `{ "title", "context", "mediaUrl", "mediaType", "question" }`.

- `GET /modules/:moduleId/reflection` — reflection prompt for module (per user, defaults to userId=1)  
  Response: `{ "type": "text", "prompt": string, "mediaUrl": string }`.

- `POST /modules/:moduleId/reflection` — submit reflection answer  
  Body: `{ "reflectionId": number, "userId": number, "answer": string, "timeSpent": number }`  
  Response 200: `{ "message": "Reflection saved successfully", "reflectionId": ..., "userId": ..., "answer": "...", "timeSpent": 60 }`.

## Concepts (auth required)

Headers for all: `Authorization: Bearer <accessToken>`

- `GET /concepts/:conceptId/tutorial` — tutorial content  
  Response:  
  ```json
  {
    "title": "...",
    "definition": "...",
    "whyItWorks": "...",
    "tutorial": {
      "goodExample": { "story": "...", "mediaUrl": "..." },
      "badExample": { "story": "...", "mediaUrl": "..." }
    }
  }
  ```

- `GET /concepts/:conceptId/quiz` — quizzes for concept (includes correct answers)  
  Response:  
  ```json
  {
    "questions": [
      {
        "orderIndex": 1,
        "question": "...",
        "questionType": "single_choice | multiple_choice",
        "mediaUrl": "...",
        "options": ["A", "B", "C"],
        "correctOptionIndex": [0],
        "explanation": "..."
      }
    ]
  }
  ```

- `GET /concepts/:conceptId/summary` — summary and next concept intro  
  Response: `{ "summaryContent": string, "nextConceptIntro": string }`.

- `POST /concepts/quiz/:quizId/answer` — submit quiz answer  
  Body: `{ "responseType": "single_choice"|"multiple_choice", "userId": number, "userAnswerIndices": number[], "timeSpent": number }`  
  Response 200: `{ "userAnswerIndices": [...], "correctOptionIndices": [...], "score": number }`.

- `POST /concepts/:conceptId/progress` — upsert user progress for a concept  
  Body: `{ "userId": number, "isCompleted": boolean, "timeSpent": number }`  
  Response: Prisma record `{ "id": number, "concept_id": number, "user_id": number, "completed": boolean, "time_spent": number, "completed_at": string|null, "created_at": string }`.

## Seed (admin / ops)

- `POST /admin/seed` — seed database (disabled unless `ENABLE_SEED_ENDPOINT=true` and `SEED_ENDPOINT_TOKEN` match).  
  Header: `x-seed-token: <token>` or `Authorization: Bearer <token>`  
  Response 201: `{ message: "Database seeded", user: { id, email, refreshToken }, stats: { modules, concepts, quizzes } }`.

## Common errors

- 400: validation/invalid params (`success: false`, `message` or `errors`).  
- 401/403: missing/invalid token.  
- 404: resource not found.  
- 500: unexpected server error.
