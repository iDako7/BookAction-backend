```
 Plan to implement                                                                                                                                         │
│                                                                                                                                                           │
│ Phase 4: Course Generation Pipeline Implementation Plan                                                                                                   │
│                                                                                                                                                           │
│ Context                                                                                                                                                   │
│                                                                                                                                                           │
│ 12 failing tests in __tests__/integration/course.test.ts (FR-4.1 through FR-4.12) define a course generation pipeline where teachers upload content       │
│ (.md/.docx), AI structures it into JSON, teachers review/edit, then publish as a full module tree. No implementation exists yet.                          │
│                                                                                                                                                           │
│ Prerequisites                                                                                                                                             │
│                                                                                                                                                           │
│ 1. Install dependencies                                                                                                                                   │
│                                                                                                                                                           │
│ npm install multer mammoth                                                                                                                                │
│ npm install -D @types/multer                                                                                                                              │
│ - multer: multipart file upload (tests use .attach("file", ...))                                                                                          │
│ - mammoth: .docx → text extraction                                                                                                                        │
│                                                                                                                                                           │
│ 2. Add course_draft model to Prisma schema                                                                                                                │
│                                                                                                                                                           │
│ File: prisma/schema.prisma                                                                                                                                │
│ model Course_draft {                                                                                                                                      │
│   id                  Int      @id @default(autoincrement())                                                                                              │
│   teacher_id          Int                                                                                                                                 │
│   title               String                                                                                                                              │
│   source_content      String   @db.Text                                                                                                                   │
│   source_type         String                    // "markdown" | "docx"                                                                                    │
│   status              String   @default("DRAFT") // DRAFT | REVIEW | PUBLISHED                                                                            │
│   generated_json      Json?    @db.JsonB                                                                                                                  │
│   edited_json         Json?    @db.JsonB                                                                                                                  │
│   published_module_id Int?                                                                                                                                │
│   created_at          DateTime @default(now())                                                                                                            │
│   updated_at          DateTime @updatedAt                                                                                                                 │
│                                                                                                                                                           │
│   @@map("course_draft")                                                                                                                                   │
│ }                                                                                                                                                         │
│                                                                                                                                                           │
│ 3. Run Prisma migration                                                                                                                                   │
│                                                                                                                                                           │
│ npx prisma migrate dev --name add_course_draft                                                                                                            │
│                                                                                                                                                           │
│ Implementation (Routes → Controllers → Services → Repositories)                                                                                           │
│                                                                                                                                                           │
│ 4. Add generateStructure to AIProvider interface                                                                                                          │
│                                                                                                                                                           │
│ File: src/services/ai/AIProvider.ts                                                                                                                       │
│ - Add method: generateStructure(content: string): Promise<any>                                                                                            │
│ - The test mocks createAIProvider to return { generateStructure: mockFn }                                                                                 │
│                                                                                                                                                           │
│ 5. Create CourseRepository                                                                                                                                │
│                                                                                                                                                           │
│ File: src/repositories/CourseRepository.ts                                                                                                                │
│ - create(data) — insert draft                                                                                                                             │
│ - findById(id) — get single draft                                                                                                                         │
│ - findByTeacherId(teacherId) — list teacher's drafts                                                                                                      │
│ - update(id, data) — update draft fields                                                                                                                  │
│ - delete(id) — remove draft                                                                                                                               │
│                                                                                                                                                           │
│ 6. Create CourseService                                                                                                                                   │
│                                                                                                                                                           │
│ File: src/services/CourseService.ts                                                                                                                       │
│                                                                                                                                                           │
│ Methods:                                                                                                                                                  │
│ - uploadContent(teacherId, title, file) — detect type (.md → read as text, .docx → mammoth extract), create draft with status DRAFT                       │
│ - generateStructure(draftId, teacherId) — call aiProvider.generateStructure(sourceContent), store result in generated_json, set status REVIEW             │
│ - listDrafts(teacherId) — return teacher's own drafts                                                                                                     │
│ - updateDraft(draftId, teacherId, editedJson) — verify ownership, store edited_json                                                                       │
│ - publishDraft(draftId, teacherId) — verify status is REVIEW or has edited_json; use prisma.$transaction to create Module + Theme + Concepts + Tutorials  │
│ + Quizzes + Summaries atomically; set status PUBLISHED + published_module_id                                                                              │
│ - deleteDraft(draftId, teacherId) — verify ownership (403 if not owner), delete                                                                           │
│                                                                                                                                                           │
│ Schema field mapping for publish (MOCK_COURSE_JSON → Prisma models):                                                                                      │
│ - Tutorial: content → good_story, media_url → good_media_url, empty strings for bad_story/bad_media_url                                                   │
│ - Quiz: options stays as JSON, correct_option_index: N → [N] (array), media_url → empty string                                                            │
│ - Summary: content → summary_content, empty string for next_chapter_intro                                                                                 │
│ - Module: title from JSON, empty description, order_index auto-assigned                                                                                   │
│                                                                                                                                                           │
│ 7. Create CourseController                                                                                                                                │
│                                                                                                                                                           │
│ File: src/controller/CourseController.ts                                                                                                                  │
│ - upload(req, res) — get file from multer, call service, return { draftId, status } with 201                                                              │
│ - generate(req, res) — call service, return { status } with 200                                                                                           │
│ - listDrafts(req, res) — return { data: [...] } with 200                                                                                                  │
│ - updateDraft(req, res) — call service, return 200                                                                                                        │
│ - publish(req, res) — call service, return { status, moduleId } with 200                                                                                  │
│ - deleteDraft(req, res) — call service, return 200                                                                                                        │
│                                                                                                                                                           │
│ 8. Create course.routes.ts                                                                                                                                │
│                                                                                                                                                           │
│ File: src/routes/course.routes.ts                                                                                                                         │
│ - Configure multer (memory storage, single file named "file")                                                                                             │
│ - Apply authMiddleware + requireRole("TEACHER", "ADMIN") to all routes                                                                                    │
│ - POST /upload — multer middleware + controller.upload                                                                                                    │
│ - POST /:draftId/generate — controller.generate                                                                                                           │
│ - GET /drafts — controller.listDrafts                                                                                                                     │
│ - PUT /:draftId — controller.updateDraft                                                                                                                  │
│ - POST /:draftId/publish — controller.publish                                                                                                             │
│ - DELETE /:draftId — controller.deleteDraft                                                                                                               │
│                                                                                                                                                           │
│ 9. Register routes in app.ts                                                                                                                              │
│                                                                                                                                                           │
│ File: src/app.ts                                                                                                                                          │
│ - Import CourseRepository, CourseService, CourseController, createCourseRoutes                                                                            │
│ - Wire up: app.use("/api/courses", createCourseRoutes(courseController))                                                                                  │
│                                                                                                                                                           │
│ Test-specific behaviors                                                                                                                                   │
│                                                                                                                                                           │
│ ┌─────────┬────────────────────────────────────────────────────┬────────────────────────────────────────────────────┐                                     │
│ │  Test   │                   Key assertion                    │                Implementation note                 │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.1  │ 201, draftId, status DRAFT, source_type "markdown" │ Read .md buffer as UTF-8 text                      │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.2  │ 201, source_type "docx"                            │ Try mammoth; catch errors → store empty string     │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.3  │ 403 for STUDENT                                    │ requireRole middleware handles this                │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.4  │ 200, status REVIEW, generated_json populated       │ Call mocked AI generateStructure                   │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.5  │ Only own drafts returned                           │ Filter by teacher_id from JWT                      │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.6  │ 200, edited_json stored                            │ Simple update                                      │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.7  │ 200, PUBLISHED, full module tree created           │ $transaction with field mapping                    │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.8  │ Published module in /api/modules/overview          │ Existing endpoint, just needs module to exist      │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.9  │ >= 400, no new modules                             │ Bad JSON → Prisma throws in transaction → rollback │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.10 │ 200, draft deleted                                 │ Simple delete                                      │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.11 │ 403 cross-teacher delete                           │ Check teacher_id !== draft.teacher_id              │                                     │
│ ├─────────┼────────────────────────────────────────────────────┼────────────────────────────────────────────────────┤                                     │
│ │ FR-4.12 │ 400 publish DRAFT status                           │ Check status !== DRAFT before publish              │                                     │
│ └─────────┴────────────────────────────────────────────────────┴────────────────────────────────────────────────────┘                                     │
│                                                                                                                                                           │
│ Files to create/modify                                                                                                                                    │
│                                                                                                                                                           │
│ - Create: src/repositories/CourseRepository.ts, src/services/CourseService.ts, src/controller/CourseController.ts, src/routes/course.routes.ts            │
│ - Modify: prisma/schema.prisma, src/services/ai/AIProvider.ts, src/app.ts                                                                                 │
│ - Run: npx prisma migrate dev                                                                                                                             │
│                                                                                                                                                           │
│ Verification                                                                                                                                              │
│                                                                                                                                                           │
│ npm test                                                                                                                                                  │
│ All 101 tests should pass (89 existing + 12 new course tests).  
```