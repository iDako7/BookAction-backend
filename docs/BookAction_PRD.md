# BookAction — Product Requirements Document

**Document Type:** Product Requirements Document (PRD)\*\*
**Version: 2.2
\*\*\*\***Author:** Dako** \***\*Target Users:** BC Secondary Students (Grades 8-12), PHE Teachers

---

## 1. Introduction / Overview

**Problem:** There are no standard digital resources that can reach all secondary students in British Columbia in the Physical Health Education (PHE) curriculum. Teachers lack tools to deliver consistent, engaging health education content at scale, and students have no interactive platform to learn PHE concepts at their own pace.

**Solution:** BookAction is a full-stack web-based learning platform that delivers BC's PHE curriculum through structured, gamified, and AI-personalized learning experiences. Students progress through gated modules covering health education topics (e.g., healthy relationships, consent, online safety), complete quizzes, earn performance-based medals, and receive AI-generated practice tailored to their individual learning style. Teachers upload curriculum content, use AI to structure it into interactive modules, monitor student progress, and generate class-level reports.

**Goal:** Provide a scalable, accessible platform that standardizes PHE content delivery across BC secondary schools while personalizing the learning experience for each student and empowering teachers with content creation and monitoring tools.

---

## 2. Goals

| **#**  | **Goal**                                                                      | **Success Metric**                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **G1** | **Deliver structured PHE curriculum digitally**                               | **100% of module content (tutorials, quizzes, summaries, reflections) accessible via the platform**                                                                                    |
| **G2** | **Personalize learning through AI**                                           | **Each student receives practice questions adapted to their identified learning style (Visual, Verbal, or Scenario)**                                                                  |
| **G3** | **Drive student engagement through gamification**                             | **Students earn medals on ≥ 80% of attempted concepts; average quiz retry rate ≥ 1.5x (students re-attempt to improve tier)**                                                          |
| **G4** | **Enable teachers to create and publish courses without engineering support** | **A teacher can go from raw curriculum document to published student-facing module in under 1 hour**                                                                                   |
| **G5** | **Give teachers visibility into student progress**                            | **Teachers can view per-student and class-level completion, accuracy, and time-spent reports**                                                                                         |
| **G6** | **Support 200–500 concurrent users with responsive performance**              | **API p95 latency < 200ms for standard operations; frontend Time to Interactive < 2s. Architecture is designed for horizontal scaling; initial deployment runs on a single instance.** |
| **G7** | **Keep operational cost low for school adoption**                             | **Total infrastructure + AI cost < $60/month for 500 active users**                                                                                                                    |

---

## 3. User Personas

### 3.1 Student (Primary User)

- **Who:** BC secondary student (Grades 8-12)
- **Context:** Taking a PHE course; may access the platform in class or at home
- **Needs:** Clear learning path, engaging content, immediate feedback on quizzes, motivation to improve
- **Pain points:** PHE content is often delivered via worksheets or lectures with no interactivity; no way to practice or self-assess

### 3.2 Teacher

- **Who:** BC PHE teacher responsible for one or more classes
- **Context:** Needs to deliver standardized curriculum, track student progress, and potentially supplement with custom content
- **Needs:** Dashboard to monitor students, ability to create new modules from existing curriculum documents, exportable reports
- **Pain points:** No centralized tool to track PHE learning outcomes; creating interactive digital content requires technical skills they don't have

### 3.3 Admin

- **Who:** Platform administrator (developer or school IT)
- **Context:** Manages seed data, system configuration, and user roles
- **Needs:** Seed endpoints, role management
- **Note:** Admin is a technical role, not a primary product persona. Included for completeness.

---

## 4. User Stories

### Student Stories

| **ID**  | **Story**                                                                                                                                                | **Acceptance Criteria**                                                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1**  | **As a student, I want to register and log in so that my progress is saved across sessions.**                                                            | **Student can register with email/username/password; login persists via token refresh; progress survives browser close.**                                   |
| **S2**  | **As a student, I want to see all available modules so that I know what topics I can learn.**                                                            | **Module overview page displays all published modules with title, theme image, and completion percentage.**                                                 |
| **S3**  | **As a student, I want to progress through a module in order (theme → concepts → reflection) so that I learn content in a structured sequence.**         | **Concepts are gated: next concept unlocks only after the previous concept's quiz and summary are completed.**                                              |
| **S4**  | **As a student, I want to read tutorials with good/bad scenario stories so that I understand each concept through relatable examples.**                  | **Each concept has a tutorial page with structured stories, media, and context.**                                                                           |
| **S5**  | **As a student, I want to take quizzes after each concept so that I can test my understanding.**                                                         | **Quiz page presents MCQ questions; on submission, student sees score, correct answers, and explanations.**                                                 |
| **S6**  | **As a student, I want to earn Bronze, Silver, or Gold medals based on my quiz accuracy so that I feel motivated to improve.**                           | **After quiz submission, medal is calculated (Bronze ≥ 50%, Silver ≥ 70%, Gold ≥ 90%) and displayed. Medal upgrades if student retakes and scores higher.** |
| **S7**  | **As a student, I want to see all my medals on my profile so that I can track my achievements.**                                                         | **Profile page shows a medal collection grid with per-concept and per-module medals.**                                                                      |
| **S8**  | **As a student, I want to take a learning style quiz so that the platform knows how I learn best.**                                                      | **8-10 question quiz determines primary style (Visual, Verbal, or Scenario); result is saved and shown on profile.**                                        |
| **S9**  | **As a student, I want to practice with AI-generated questions tailored to my learning style so that I can reinforce concepts in the way I learn best.** | **After completing a concept summary, a "Practice More with AI" button generates 3 personalized questions matching the student's style.**                   |
| **S10** | **As a student, I want to write reflections for each module so that I can process what I've learned.**                                                   | **Reflection page shows a prompt; student submits free-text response; past reflections are viewable.**                                                      |

### Teacher Stories

| **ID**  | **Story**                                                                                                                                                                               | **Acceptance Criteria**                                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T1**  | **As a teacher, I want to log in and be routed to a teacher dashboard so that I have a dedicated workspace.**                                                                           | **After login, users with TEACHER role are redirected to** `/teacher`; students cannot access `/teacher/*`routes.                                          |
| **T2**  | **As a teacher, I want to see a class overview dashboard so that I understand overall student performance at a glance.**                                                                | **Dashboard shows: total students, average completion rate, average quiz score, and per-module breakdown.**                                                |
| **T3**  | **As a teacher, I want to view a paginated list of all students with their progress so that I can identify who needs help.**                                                            | **Student table is searchable and sortable; shows username, completion count, last login; supports pagination.**                                           |
| **T4**  | **As a teacher, I want to view a detailed report for an individual student so that I can understand their specific strengths and gaps.**                                                | **Student detail page shows: overall accuracy, modules completed, time spent, per-concept medal and quiz accuracy.**                                       |
| **T5**  | **As a teacher, I want to export a class report as CSV so that I can share it with administrators or use it in grade calculations.**                                                    | **"Export CSV" button downloads a file with student rows and columns for completion, accuracy, and time spent.**                                           |
| **T6**  | **As a teacher, I want to upload a curriculum document (.docx or .md) so that I can start creating a new module.**                                                                      | **Upload form accepts .docx or .md file + title; creates a draft with status DRAFT.**                                                                      |
| **T7**  | **As a teacher, I want AI to structure my uploaded content into a module with themes, concepts, tutorials, quizzes, and summaries so that I don't have to manually create each piece.** | **After clicking "Generate", AI processes the content and returns a structured module JSON within 30 seconds; draft status moves to REVIEW.**              |
| **T8**  | **As a teacher, I want to review and edit the AI-generated module structure before publishing so that I can ensure accuracy and quality.**                                              | **Course editor page shows collapsible sections for module, concepts, tutorials, quizzes, summaries; all fields are editable; changes save to the draft.** |
| **T9**  | **As a teacher, I want to publish a reviewed draft so that students can access the new module.**                                                                                        | **"Publish" button creates a live module atomically; new module appears in student module overview immediately.**                                          |
| **T10** | **As a teacher, I want to see all my course drafts and their statuses so that I can manage my content pipeline.**                                                                       | **Courses page lists all drafts with status badges (Draft, Review, Published, Archived), timestamps, and action buttons.**                                 |

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

| **#**    | **Requirement**                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-1** | **The system must allow users to register with a username, email, and password.**                                                                                         |
| **FR-2** | **The system must authenticate users via email or username + password and issue a JWT access token (15 min expiry) and a refresh token (7-day expiry, httpOnly cookie).** |
| **FR-3** | **The system must automatically refresh expired access tokens using the refresh token without requiring re-login.**                                                       |
| **FR-4** | **The system must support three roles: STUDENT, TEACHER, and ADMIN.**                                                                                                     |
| **FR-5** | **The system must restrict teacher-only routes (teacher portal, course management) to users with TEACHER or ADMIN roles, returning 403 for unauthorized access.**         |
| **FR-6** | **The system must clear auth state and redirect to login on refresh token failure, resetting local progress to prevent cross-user data leakage.**                         |

### 5.2 Learning Content Delivery

| **#**     | **Requirement**                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-7**  | **The system must display all published modules in an overview page with title, theme image, and the current user's completion percentage.**            |
| **FR-8**  | **Each module must contain a theme (intro context + media), one or more ordered concepts, and a reflection prompt.**                                    |
| **FR-9**  | **Each concept must contain a tutorial (good/bad stories + media), one or more quizzes (MCQ), and a summary.**                                          |
| **FR-10** | **The system must enforce a gated learning path: a student cannot access the next concept until the current concept's quiz and summary are completed.** |
| **FR-11** | **The system must track per-concept completion status and time spent for each user.**                                                                   |
| **FR-12** | **The system must allow students to submit free-text reflections per module and view their past reflections.**                                          |

### 5.3 Quiz System

| **#**     | **Requirement**                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-13** | **The system must present quiz questions as multiple-choice (single or multi-select) with options stored as JSON.**                                                                     |
| **FR-14** | **On quiz submission, the system must score answers, store the full response (selected answers, correctness, time spent), and return the score with correct answers and explanations.** |
| **FR-15** | **The system must allow students to retake quizzes; each attempt is stored as a separate response record.**                                                                             |

### 5.4 Medal System

| **#**     | **Requirement**                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR-16** | **The system must calculate a medal tier for each concept after quiz submission based on the user's latest quiz response accuracy: Gold (≥ 90%), Silver (≥ 70%), Bronze (≥ 50%), None (< 50%).** |
| **FR-17** | **The system must calculate a module-level medal by averaging all concept medal accuracies within that module; module medal requires all concepts attempted.**                                   |
| **FR-18** | **Medals must be upserted (upgraded if the student improves, never downgraded).**                                                                                                                |
| **FR-19** | **The system must provide a medal summary endpoint and a profile UI displaying all concept and module medals.**                                                                                  |

### 5.5 Learning Style & AI-Personalized Practice

| **#**     | **Requirement**                                                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-20** | **The system must present an 8-10 question learning style quiz where each answer maps to one of three styles: Visual, Verbal, or Scenario.**                                              |
| **FR-21** | **The system must calculate the primary learning style based on highest response count per category and persist the result (primary style + raw scores) in the user's learning profile.** |
| **FR-22** | **The system must generate AI-personalized practice questions (3 per request) for a given concept, adapted to the user's learning style.**                                                |
| **FR-23** | **The system must cache AI-generated practice questions per concept × learning style combination with a 1-hour TTL to reduce AI API costs.**                                              |
| **FR-24** | **The system must fall back to existing (non-personalized) quiz questions if the AI provider call fails.**                                                                                |
| **FR-25** | **The system must rate-limit AI calls to a maximum of 10 per user per hour.**                                                                                                             |

### 5.6 Teacher Portal — Student Monitoring

| **#**     | **Requirement**                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-26** | **The system must provide a teacher dashboard showing class-level aggregate statistics: total students, total modules, average completion rate, average quiz score, and per-module breakdown.** |
| **FR-27** | **The system must provide a paginated, searchable, sortable student list showing username, email, last login, and completed concept count.**                                                    |
| **FR-28** | **The system must provide a student detail view showing overall accuracy, modules completed, total time spent, and a per-concept breakdown (completion, quiz accuracy, time spent, medal).**    |
| **FR-29** | **The system must provide per-module analytics showing completion rate, average score, and average time spent.**                                                                                |
| **FR-30** | **The system must allow teachers to export a class report as a downloadable CSV file.**                                                                                                         |

### 5.7 Course Generation Pipeline

| **#**     | **Requirement**                                                                                                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-31** | **The system must allow teachers to upload a .docx or .md file with a title to create a course draft (status: DRAFT).**                                                                                                                             |
| **FR-32** | **For .docx files, the system must parse the document to extract text content (using Mammoth for conversion).**                                                                                                                                     |
| **FR-33** | **The system must store the raw uploaded text content in the database (not the filesystem).**                                                                                                                                                       |
| **FR-34** | **The system must allow teachers to trigger AI generation, which structures the raw content into a module JSON (theme, concepts, tutorials, quizzes, summaries). The AI-generated structure must be stored in the draft (status moves to REVIEW).** |
| **FR-35** | **The system must provide a course editor UI where teachers can review and modify all fields of the AI-generated structure before publishing.**                                                                                                     |
| **FR-36** | **The system must allow teachers to publish a reviewed draft, which atomically inserts the module and all child records (theme, concepts, tutorials, quizzes, summaries) into the database. On success, status moves to PUBLISHED.**                |
| **FR-37** | **The system must allow teachers to delete unpublished drafts and archive published modules.**                                                                                                                                                      |
| **FR-38** | **Course drafts must track lifecycle status: DRAFT → REVIEW → PUBLISHED → ARCHIVED.**                                                                                                                                                               |

### 5.8 AI Provider Integration

| **#**     | **Requirement**                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR-39** | **The system must support both OpenAI and Anthropic as AI providers through a provider-agnostic abstraction layer.**                                         |
| **FR-40** | **The active AI provider must be configurable via environment variable without code changes.**                                                               |
| **FR-41** | **The system must use a cost-efficient model (e.g., gpt-4o-mini) for practice generation and a higher-quality model (e.g., gpt-4o) for course structuring.** |

### 5.9 Health & Caching

| **#**     | **Requirement**                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-42** | **The system must expose a** `GET /api/health`endpoint that returns server status, database connectivity, and Redis connectivity.                                                     |
| **FR-43** | **The system must be stateless at the application layer — no instance-local state for caching, rate limiting, or session data — to support horizontal scaling without code changes.** |
| **FR-44** | **The system must use Redis as the shared state store for backend caching (teacher reports, AI rate limiting).**                                                                      |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| **#**     | **Requirement**                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------- |
| **NFR-1** | **Standard CRUD API responses must be < 200ms at p95.**                                                   |
| **NFR-2** | **Teacher report aggregation responses must be < 1 second at p95.**                                       |
| **NFR-3** | **AI generation responses must be < 15 seconds at p95 (practice) and < 30 seconds (course structuring).** |
| **NFR-4** | **Frontend Time to Interactive must be < 2 seconds.**                                                     |
| **NFR-5** | **All list endpoints must support pagination to prevent unbounded query sizes.**                          |
| **NFR-6** | **Database queries must avoid N+1 patterns; use selective field fetching and aggregation queries.**       |

### 6.2 Security

| **#**      | **Requirement**                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------- |
| **NFR-7**  | **Passwords must be hashed with bcrypt before storage.**                                            |
| **NFR-8**  | **Refresh tokens must be stored as httpOnly, secure (in production), sameSite=strict cookies.**     |
| **NFR-9**  | **All protected endpoints must validate JWT access tokens via middleware.**                         |
| **NFR-10** | **Role-restricted endpoints must enforce role checks via middleware, not client-side logic alone.** |
| **NFR-11** | **AI API keys must be stored as server-side environment variables, never exposed to the client.**   |

### 6.3 Reliability

| **#**      | **Requirement**                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| **NFR-12** | **Course publishing must be atomic: if any child record insertion fails, the entire operation must roll back.**  |
| **NFR-13** | **AI practice generation must gracefully fall back to existing quiz content on provider failure.**               |
| **NFR-14** | **The system must maintain high availability via production deployment on Fly.io with health check monitoring.** |

### 6.4 Scalability

| **#**      | **Requirement**                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NFR-15** | **The architecture must support horizontal scaling — the application is stateless, and all shared state is externalized to Redis or PostgreSQL. Initial deployment uses a single instance; additional instances can be added without code changes.** |
| **NFR-16** | **Database connection pool must be configured for the expected concurrent load (default Prisma pooling).**                                                                                                                                           |
| **NFR-17** | **AI API cost must remain under $10/month for 500 active users through caching and model tiering.**                                                                                                                                                  |

### 6.5 Accessibility & Compatibility

| **#**      | **Requirement**                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| **NFR-18** | **The platform must be usable on modern desktop browsers (Chrome, Firefox, Safari, Edge — latest 2 versions).**  |
| **NFR-19** | **The platform must be responsive and usable on tablet-sized screens (students may use school-issued tablets).** |

---

## 7. Out of Scope

**The following items are explicitly excluded from this product version:**

| **Item**                            | **Rationale**                                                                                                                                                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Native mobile app (iOS/Android)** | **Web app is accessible on mobile browsers; native app adds significant development cost with minimal benefit at this scale.**                                                                                                                        |
| **Parent/guardian portal**          | **Initial scope focuses on student-teacher interaction; parent visibility can be addressed via CSV exports.**                                                                                                                                         |
| **Payment / subscription system**   | **Platform is intended for school adoption, not individual purchase.**                                                                                                                                                                                |
| **Multi-language / localization**   | **Initial release targets English-speaking BC students; i18n can be layered on later.**                                                                                                                                                               |
| **Real-time collaboration**         | **No live classroom features (e.g., live polls, chat). Teachers monitor asynchronously via dashboard.**                                                                                                                                               |
| **Class/section entity**            | **Teachers see all students; there is no class grouping. Simplifies the data model for the initial version. However, database indexes and teacher queries must be designed to support a future** `class_id`filter column without major schema rework. |
| **Offline mode**                    | **Requires service workers and local DB sync; not justified at current scale with reliable school internet.**                                                                                                                                         |
| **Multi-instance deployment**       | **Architecture supports it (stateless design + Redis), but initial deployment runs on a single Fly.io instance. Multi-instance can be enabled by scaling Fly.io without code changes.**                                                               |
| **CI/CD pipeline**                  | **Manual deployment via** `fly deploy`and Vercel auto-deploy is sufficient for the initial version. GitHub Actions can be added later.                                                                                                                |
| **Load testing**                    | **Performance targets are design goals validated through manual testing. Formal load testing with tools like autocannon is deferred.**                                                                                                                |

---

## 8. Dependencies & Assumptions

### Dependencies

- **OpenAI and/or Anthropic API availability for AI features (practice generation, course structuring)**
- **Render PostgreSQL for managed database hosting**
- **Fly.io for backend application hosting (single instance, scalable to multiple)**
- **Redis (Upstash) for distributed caching and rate limiting**
- **Vercel platform for frontend hosting**

### Assumptions

- **Students have access to a modern web browser via school-issued or personal devices**
- **Teachers have existing curriculum content in .docx or markdown format**
- **Schools provide stable internet connectivity during class time**
- **A single teacher can reasonably monitor up to ~200 students with improved pagination, search, and filtering**
- **A single Fly.io instance can handle the expected load; horizontal scaling is available if needed without code changes**
