# Master Resume Template v2: BookAction

---

## Instructions for AI Agent

This template guides you to extract project information from a codebase and documentation for resume and interview preparation. Follow these rules:

### Extraction Rules

1. **Focus on extraction first, not generation.** Pull information from existing docs, commit history, README files, and code comments. Do not invent achievements.

2. **Mark gaps explicitly.** If information is not available in the codebase:
   - Use `[NEEDS INPUT]` as a placeholder
   - Add a specific question to the "Questions for Developer" section at the bottom

3. **Achievement Bullet Formula (Google XYZ):**

   ```
   [Action Verb] [X: what you accomplished] as measured by [Y: metric/outcome], by [Z: how you did it]
   ```

   - Every bullet MUST start with a strong ownership verb: Built, Designed, Implemented, Architected, Led, Delivered, Engineered, Diagnosed, Resolved
   - Every bullet SHOULD include at least one metric (time, percentage, count, comparison)
   - If no metric exists, use objective signals: "adopted by [X]", "enabled [capability]", "eliminated [problem]"

4. **Three Achievement Categories:** Categorize each achievement into exactly one type:
   - **Technical Achievement** — algorithms, architecture, system design, performance optimization, code quality
   - **Impact Achievement** — measurable outcomes, delivery speed, reliability improvements, user-facing results, comparison metrics (e.g., "X% improvement over baseline")
   - **Ownership/Leadership Achievement** — solo delivery, crisis management, team coordination, decision-making under constraints, scope pivots

5. **"Why" Documentation:** For each phase, capture TWO types of rationale:
   - **Business/Product Why:** What problem was being solved? What user need or project requirement drove this?
   - **Technical Why:** Why was this approach chosen over alternatives? What tradeoffs were considered?

---

## Project Overview

### Basic Information

| Field            | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| **Project Name** | BookAction                                                              |
| **Timeline**     | Oct 10 2024 – Dec 8 2024                                                |
| **Role**         | Solo Full-Stack Developer (Transitioned from Project Manager/Team Lead) |
| **Repository**   | [NEEDS INPUT - Repository URL]                                          |

### Description

A responsive educational platform built to facilitate modular learning. It features a hierarchical content structure (Modules → Concepts → Tutorials → Quizzes) and a secure, personalized user experience. The project demonstrates the transition from a team-based MVP to a robust, solo-delivered full-stack application.

### Tech Stack & Architecture

**Stack:**

- **Runtime:** Node.js (Backend)
- **Framework:** Express.js (Modular Monolith)
- **Database:** PostgreSQL (Relation Data), Prisma ORM
- **Frontend:** Next.js (React Framework), Tailwind CSS
- **Infrastructure:** Docker Compose, Render (Cloud Deployment)
- **Testing:** Jest / Supertest (Integration Testing)

**Architecture Pattern:**
Layered Modular Monolith (Controller → Service → Repository).
The application strictly separates HTTP concerns (Controllers) from Business Logic (Services) and Data Access (Repositories/Prisma). This ensured testability and maintainability, allowing the system to scale from a simple MVP to a secure, complex application without a complete rewrite.

**Key Design Decisions:**

1.  **Contract-First Development via DTOs** — Enforced strict TypeScript interfaces before implementation to prevent "AI Hallucinations" and ensure type safety across the stack.
2.  **Database-Backed Refresh Token Sessions** — Balances security and UX by using short-lived access tokens with HTTP-only refresh-token cookies persisted in Postgres, enabling server-side token validation and per-session revocation.
3.  **Tunnel Architecture** — Decoupled Frontend and Backend development completely, allowing parallel progress (or serial execution by a solo dev) without blocking dependencies.

---

## Development Phases

### Phase 0: System Design & Strategy Pivot

**Timeline:** Oct 26 – Nov 10

#### Context

- **Business/Product Why:** The project faced a critical resource collapse (4-person team → 1 active dev + 1 partial). Survival required a strategic pivot to a delivery model that could sustain full scope with 25% of the workforce.
- **Technical Why:** A "Measure Twice, Cut Once" approach was required because the 30-day timeline left minimal margin for schema refactoring. I prioritized a "Low-Refactor" foundation to maintain delivery velocity.

#### Challenges and Solutions

**Challenge 1: Crisis Management & Strategic Pivot**

- **Problem:** Two teammates became unavailable due to severe injury and work conflicts immediately after project kick-off.
- **Root Cause / Analysis:** The original collaborative plan relied on distributed roles which became single points of failure.
- **Solution:** I leveraged my **Senior PM experience** to assume full technical ownership. I drafted a new **"Tunnel Approach"** strategy (`docs/120-Team Plan Summary.md`) to decouple dependencies, allowing me to build the backend in isolation while reducing the frontend to a manageable integration surface.
- **Evidence:** `archived collaboration doc/120-Team Plan Summary.md` (Risk Management Table & Tunnel Strategy).

**Challenge 2: Engineering a "Low-Refactor" Foundation**

- **Problem:** Mid-development schema changes could cause cascading delays and put the deadline at risk.
- **Root Cause / Analysis:** Complex content hierarchy (Module -> Concept -> Tutorial -> Quiz) is prone to normalization errors if not designed holistically.
- **Solution:** I treated the system design as a commercial product launch. I authored a comprehensive **Product Proposal** and designed a highly normalized **9-entity database schema** (ERD) before writing a single line of code.
- **Evidence:** `archived collaboration doc/1.md` (ERD) and `archived collaboration doc/100-Product Proposal.md`.

#### Achievements

**Ownership/Leadership Achievements:**

- **Architected** and executed the **"Tunnel Approach"** development strategy, a risk-mitigation plan that decoupled frontend/backend dependencies, allowing the project to survive a sudden 75% reduction in team capacity.
- **Defined** the complete product vision and "Risk Management" protocols in the _Team Plan Summary_, identifying potential failure points (e.g., "Deployment fails") and prescribing mitigation strategies (e.g., "Local demo as backup") that supported final delivery under reduced team capacity.

**Technical Achievements:**

- **Designed** a production-ready **9-entity relational schema** (Modules, Themes, Concepts, Tutorials, Quizzes, etc.) with JSONB support, creating a robust data blueprint with no major structural migrations during the 4-week development cycle.

---

### Phase 1: MVP Delivery & Core Infrastructure

**Timeline:** Nov 8 – Nov 10

#### Context

- **Business/Product Why:** Needed a working backend demo for the fast-approaching class presentation milestone.
- **Technical Why:** Prioritized "Speed to Delivery" over perfect code structure (Monolith first) to ensure a testable API existed for the frontend (or manual) verification.

#### Challenges and Solutions

**Challenge 1: Cloud Data Initialization (The "Seeding" Problem)**

- **Problem:** `npm run seed` worked locally but failed on Render (Cloud), blocking the deployment of the demo with content.
- **Root Cause / Analysis:** Cloud build environments often lack access to the live production database instance for security/network reasons.
- **Solution:** Built a **Remote Seeding Pipeline** via a protected API endpoint (`POST /api/seed`) relative to the running application, secured by a custom secret token.
- **Evidence:** `seed.ts` script and `api/seed` route handler.

**Challenge 2: Designing a Scalable Education Schema**

- **Problem:** Mapping complex hierarchical course data without over-complicating the relational model.
- **Solution:** Leveraged **Prisma** with mixed Relational + Document (JSONB) typing.
- **Evidence:** Prisma schema definition for `Quiz` / `Question`.

#### Achievements

**Impact Achievements:**

- **Delivered** a fully functional backend API in **3 days** (72 hours), enabling the successful capabilities demo despite the team restructuring.

**Technical Achievements:**

- **Engineered** a secure remote seeding pipeline using a token-gated REST endpoint, reducing cloud initialization failures and enabling on-demand production data resets.
- **Deployed** the full application stack using **Docker Compose**, improving environment consistency between local development and the Render cloud environment.

---

### Phase 2: Architecture Refactoring (OOP & Layered Design)

**Timeline:** Nov 14 – Nov 27

#### Context

- **Business/Product Why:** The "Spaghetti Code" MVP was unmaintainable and made adding complex features like Authentication risky.
- **Technical Why:** Needed to isolate Business Logic from Database logic to enable unit testing and clean validation.

#### Challenges and Solutions

**Challenge 1: Transforming the Monolith**

- **Problem:** Single-file architecture made authentication changes high-risk and hard to validate.
- **Root Cause / Analysis:** lack of separation of concerns; Logic, Routing, and DB access were mixed.
- **Solution:** Refactored into a **Modular Monolith** using Controller-Service-Repository pattern. Used Sequence Diagrams to plan the "cuts" before coding.
- **Evidence:** Creation of `src/services`, `src/controllers`, `src/repositories` folders.

**Challenge 2: Managing AI "Hallucinations" (The Context Gap)**

- **Problem:** AI tools generated code with incorrect fields/logic when given vague instructions.
- **Root Cause / Analysis:** AI lacked the full semantic context of the specific database schema and business rules.
- **Solution:** Shifted to **"Contract-First Development"**. Manually defined Zod schemas and TypeScript Interfaces _before_ asking AI to implement logic.
- **Evidence:** `src/dto` or `src/types` definition files.

#### Achievements

**Technical Achievements:**

- **Refactored** the entire codebase into a strict **Layered Architecture** (Controller/Service/Repository), reducing component coupling and enabling independent testing of business logic.
- **Standardized** API communication by implementing **Data Transfer Objects (DTOs)** and Zod validation, reducing response-shape drift and enforcing type safety across application boundaries.

**Ownership/Leadership Achievements:**

- **Optimized** the AI development workflow by implementing an "Interface-First" strategy, reducing debugging time significantly by constraining AI generation with strict TypeScript contracts.

---

### Phase 3: Security Implementation (Auth & Identity)

**Timeline:** Nov 27 – Nov 30

#### Context

- **Business/Product Why:** The platform needed to support individual progress tracking and secure user accounts.
- **Technical Why:** JWTs are stateless (good for scale) but hard to revoke (bad for security); needed a hybrid approach.

#### Challenges and Solutions

**Challenge 1: Concurrent User Sessions (Multi-Device)**

- **Problem:** Logouts on one device shouldn't kill sessions on other devices; simple JWT doesn't support this.
- **Root Cause / Analysis:** Need state to track specific refresh tokens.
- **Solution:** **Stateful Refresh Token Persistence**. Stored refresh tokens in a DB table, validated token expiry server-side, and revoked specific sessions on logout. Added UUID `jti` in refresh-token payload for uniqueness across concurrent sessions.
- **Evidence:** `src/services/AuthService.ts`, `src/repositories/RefreshTokenRepository.ts`, `src/controller/AuthController.ts`.

**Challenge 2: Integrating User Context**

- **Problem:** "Prop-drilling" user IDs through every service method is messy and error-prone.
- **Solution:** **Global Context Injection**. Extended Express.Request via TypeScript Module Augmentation to hold `user` payload.
- **Evidence:** `src/middleware/authMiddleware.ts` (Express.Request module augmentation).

**Challenge 3: Unifying Error Handling**

- **Problem:** Inconsistent error returns (500 vs 400 vs 401) confused the client.
- **Solution:** Centralized **Custom Error Architecture**. `AuthError` class with controller-level error mapping for consistent status codes.
- **Evidence:** `src/utils/errors.ts`, `src/controller/AuthController.ts`, `src/services/AuthService.ts`.

#### Achievements

**Technical Achievements:**

- **Architected** a dual-token security system (Access + Refresh) with HTTP-only refresh-token cookies, bcrypt password hashing, and database-backed refresh token validation/revocation, improving session security while keeping access-token authorization stateless.
- **Implemented** a centralized error handling architecture using custom Exception classes, standardizing HTTP status codes (401/403/400) and user-facing error messages across the stack.
- **Integrated** "Defense-in-Depth" security via **Zod middleware**, validating all incoming request bodies against strict schemas before execution reached the business logic layer.

---

### Phase 4: Full-Stack Integration & QA

**Timeline:** Dec 4 – Dec 8

#### Context

- **Business/Product Why:** Needed a modern, responsive UI to visualize the backend achievements and complete the product vision.
- **Technical Why:** Had limited time and frontend expertise; chose Next.js for its strong typed integration with the backend.

#### Challenges and Solutions

**Challenge 1: Deliver Full-Stack without Senior Frontend Skills**

- **Problem:** Needed a complex Next.js app in 2 days.
- **Solution:** **Systematic AI Delegation Pipeline**. Wrote "Rules" and "Task Lists" instead of code. Acted as PM/Architect, letting AI be the coder.
- **Evidence:** `docs/rules/Generating a PRD.md`, `docs/rules/task_generate_rule.md`.

**Challenge 2: The "Invisible" Race Condition**

- **Problem:** Random logouts and data load failures during integration.
- **Root Cause / Analysis:** **Race Condition**. Multiple API calls fired simultaneously when token expired; all tried to refresh token at once, invalidating each other.
- **Solution:** **Request Queue**. Paused outgoing calls on 401, queued them, refreshed token once, then replayed queue.
- **Evidence:** Axios interceptor logic in frontend `api/client.ts`.

**Challenge 3: Velocity vs Stability**

- **Problem:** Rapid changes risked breaking core logic; no time for manual testing.
- **Solution:** **Test-Driven Velocity**. Used automated integration tests as the "Gatekeeper".
- **Evidence:** Integration test suite.

#### Achievements

**Ownership/Leadership Achievements:**

- **Architected** a customized "AI-Delegation Pipeline" (API → PRD → Tasks → Code), allowing the delivery of a complex React frontend in **2 days** by managing AI as a junior developer rather than coding manually.

**Technical Achievements:**

- **Diagnosed** and resolved a critical client-side token refresh race condition by implementing a single-refresh Axios request queue, stabilizing concurrent API calls during access-token renewal.
- **Established** a "Test-Driven Velocity" workflow, using automated integration tests as deployment gates to merge high-volume AI-generated code with lower regression risk.

---

## Project-Wide Achievements

### Technical Achievements

- **Designed** a robust Modular Monolith leveraging **TypeScript, Express, and Prisma**, separating concerns into 3 distinct layers while keeping the initial database schema largely stable throughout development.
- **Secured** the platform with a database-backed refresh-token session model and Zod-based input validation, reducing token abuse risk and hardening request boundaries.

### Impact Achievements

- **Delivered** a fully functional, full-stack MVP in **3 days** (backend) and **2 days** (frontend) respectively by effectively leveraging AI orchestration and rigorous architectural planning.
- **Reduced** cloud deployment initialization failures by engineering a custom remote data seeding pipeline, allowing production environments to be initialized through a controlled API path.

### Ownership/Leadership Achievements

- **Rescued** a failing team project by pivoting to a solo delivery model within 48 hours, absorbing frontend and PM responsibilities without reducing the original scope.
- **Pioneered** a "Contract-First" AI development workflow, using strict TypeScript DTOs and written rule-sets to prevent LLM hallucinations and reduce debugging overhead.

---

## Highlights (Resume-Ready Bullets)

1. **Architected** a scalable **Modular Monolith** backend using **Node.js, Express, and Prisma**, implementing a 9-entity normalized schema with no major structural refactors over the 4-week lifecycle.
2. **Led** the crisis recovery of a 4-person project by pivoting to solo delivery, utilizing **AI Orchestration** strategies to build a complex **Next.js** frontend in just **2 days** while maintaining full scope.
3. **Engineered** a secure **Dual-Token Authentication** system using short-lived JWT access tokens and HTTP-only, database-backed refresh-token sessions, plus **Global Context Injection** and **Zod** validation.
4. **Resolved** a critical **API Race Condition** in the client-side authentication layer by implementing a custom **Axios Request Queue** to serialize refresh attempts and replay blocked requests.
5. **Built** a custom **Remote Seeding Pipeline** to bypass cloud build restrictions on **Render**, enabling secure, token-gated production data initialization via REST API.

---

## Questions for Developer

### Business/Product Context

1. [NEEDS INPUT] What specific user metric or feedback proved the success of the "Modules -> Concepts" structure?
2. [NEEDS INPUT] Was there a specific target user persona (e.g., self-paced learners vs. structured students)?

### Technical Decisions

1. [NEEDS INPUT] Why choose Monolith over Microservices given the clear "Module" separation? (Likely: Complexity/Speed trade-off, but nice to confirm).
2. [NEEDS INPUT] Did you use any specific caching strategies (Redis?), or rely purely on Postgres performance?

### Metrics and Outcomes

1. [NEEDS INPUT] Can we quantify the "performance" of the backend? (e.g., avg response time < 100ms?)
2. [NEEDS INPUT] Exact number of Integration Tests written? (e.g., "Over 50 passing test cases")

---

## Notes to Self

- [ ] Fill in Repository URL
- [ ] Check if "3 days" and "2 days" numbers are accurate or need refinement.
- [ ] Review the "Highlights" section to ensure it targets the specific job level you are applying for (Junior vs Mid-Level vs Senior).
