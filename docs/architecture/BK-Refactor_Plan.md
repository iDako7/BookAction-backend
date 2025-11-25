**1. Background**

BookAction is an AI-powered reading habit builder that helps users reflect on what they read.

The MVP phase (completed in 2025 Q4) demonstrated the core flow and database design.

In the next stage, I will continue development individually, focusing on backend architecture and AI-assisted reflection before expanding the frontend (potentially with AI help).

The goal is to upgrade the backend to a **production-grade, OOP-based service architecture** , integrate **real authentication** , and implement an **AI reflection generator** using OpenAI or Claude.

---

## **2. Objectives (Nov–Dec 2025)**

1. **Refactor to OOP Architecture** – Introduce a layered structure with clear separation of concerns.
2. **Implement Secure Authentication** – Support real users with JWT-based login/register system.
3. **Integrate AI Reflection Service** – Generate intelligent reflections on user reading history.

Deliverable: A functional, tested backend deployed on a public endpoint, ready for frontend integration.

---

## **3. Scope & Priorities**

| **Priority** | **Feature**                  | **Description**                                                                                   | Status     |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------- | ---------- |
| P1           | **OOP Refactor**             | Migrate `src/services`to OOP classes with repositories, services, and interfaces.                 | Finished   |
| P1           | **Auth System**              | User model, register/login endpoints, JWT access & refresh tokens, middleware protection.         | Working on |
| P2           | **AI Reflection Service**    | Connect to OpenAI/Claude API, generate feedback on user reflections, handle caching and timeouts. | -          |
| P3           | **Logging & Error Handling** | Centralized logging, structured error responses, validation.                                      | -          |
| P3           | **Testing & Docs**           | Unit + integration tests, API docs (Swagger/OpenAPI).                                             | -          |

---

## **4. Implementation Plan**

### **Phase 0 – Preparation**

- Create new branch `feature/backend-architecture`.
- Verify existing MVP endpoints with `api.rest`.
- Snapshot current DB and seed data.

### **Phase 1 – OOP Refactor**

- Introduce folders:
  `src/interfaces`, `src/repositories`, `src/services`, `src/middleware`.
- Apply Dependency Injection between repositories and services.
- Controllers become thin HTTP layers calling service methods.
- Validate using `zod` and return standardized API responses.

### **Phase 2 – Authentication**

- Add `User` model in `prisma/schema.prisma`.
- Implement `AuthService` (bcrypt, JWT).
- Create `auth.middleware.ts` to verify tokens and attach `req.user`.
- Protect private routes and update all endpoints to use authenticated user context.
- Update API documentation and seed sample user.

### **Phase 3 – AI Reflection Integration**

- Create `AIService` implementing `generateReflectionFeedback()`.
- Connect to OpenAI or Claude API using `.env` keys.
- Update `ReflectionService` to save user reflections and request AI feedback.
- Implement caching, timeout, and logging for API calls.
- Store generated responses in the database for analytics.

### **Phase 4 – Hardening & Deployment**

- Add integration tests (`jest`, `supertest`) and seed scripts.
- Add structured logging (`pino`), request IDs, and error middleware.
- Publish OpenAPI docs at `/api/docs`.
- Optional: deploy to Render or Railway with environment config.

---

## **5. Milestones**

| **Week** | **Focus**        | **Key Deliverable**                                 |
| -------- | ---------------- | --------------------------------------------------- |
| Week 1   | OOP Refactor     | All old endpoints functional under new architecture |
| Week 2   | Auth System      | Login/Register/Protected routes working             |
| Week 3   | AI Reflection    | Functional AI feedback in reflection flow           |
| Week 4   | Testing & Deploy | Tests passing, docs published, live backend URL     |

---

## **6. Success Criteria**

- ✅ All old MVP features functional after refactor.
- ✅ JWT-based authentication operational and secure.
- ✅ Real AI feedback integrated and logged.
- ✅ API documentation and tests available.
- ✅ Deployed backend ready for AI-assisted frontend development.

---

## **7. Next Steps (Future Phase)**

- AI-powered frontend rebuild (React + Next.js).
- User dashboard and reflection history visualization.
- Team collaboration or open-source contribution setup.

---

**End of Document**
