/**
 * Integration tests for Phase 3: AI Practice Generation (FR-3.7 through FR-3.11).
 *
 * Assumptions:
 * 1. Routes are registered at /api/practice/* in app.ts
 * 2. POST /api/practice/generate body: { conceptId: number }
 *    The user's learning style is read from their saved User_learning_profile.
 *    Response: { questions: Array<{ question, options, correct_option_index, explanation }> }
 *    — exactly 3 questions when AI succeeds.
 * 3. Cache: AI_practice_cache keyed on (concept_id, learning_style) with expires_at.
 *    Prisma model accessor: prisma.aI_practice_cache
 * 4. Fallback (FR-3.11): when AI provider throws, the endpoint returns existing Quiz records
 *    for that concept as plain questions. Response shape is identical to AI-generated.
 * 5. AIProviderFactory reads the AI_PROVIDER env var.
 *    When AI_PROVIDER='mock', it returns a deterministic mock provider (no real API calls).
 *    When AI_PROVIDER='mock-failing', it returns a provider whose completeJSON always throws.
 *    The implementation must support these test modes.
 *
 * Note on FR-3.8 (cache verification):
 *   The test verifies that a cache entry is written to AI_practice_cache after the first
 *   call and that a second call returns the same response without creating a second DB row.
 *
 * Note on FR-3.11 (fallback verification):
 *   process.env.AI_PROVIDER is set to 'mock-failing' for the fallback test group and
 *   restored afterward. The implementation must honour this env var at runtime.
 *   Because the app is a singleton, this only works if AIProviderFactory reads the env
 *   var on each call (not cached during app startup). Alternative: accept that FR-3.11
 *   requires a real integration test with a separate app instance — see comment inline.
 *
 * Test isolation:
 * - A dedicated practice test user is created in beforeAll and deleted in afterAll.
 * - Two test concepts: aiConceptId (normal + cache path), fallbackConceptId (FR-3.11).
 * - All created records are cleaned up in afterAll.
 */
import request from "supertest";
import bcrypt from "bcrypt";
import { app, prisma } from "../../tests/setup.js";

// Tell the AI factory to use a deterministic mock — no real API calls in tests.
// The implementation's AIProviderFactory must check process.env.AI_PROVIDER and
// return a mock provider that returns MOCK_PRACTICE_QUESTIONS when this is 'mock'.
process.env.AI_PROVIDER = "mock";

describe("AI Practice Generation Endpoints", () => {
  let practiceUserId: number;
  let practiceUserToken: string;

  // Concept 1: used for FR-3.7 (AI success) and FR-3.8 (cache hit)
  let aiConceptId: number;

  // Concept 2: used for FR-3.11 (AI failure → fallback to existing quiz questions)
  let fallbackConceptId: number;

  let testModuleId: number;

  beforeAll(async () => {
    // 1. Create dedicated test student
    const hash = await bcrypt.hash("PracticeTest123!", 10);
    const user = await prisma.user.create({
      data: {
        email: "practice-test@example.com",
        username: "practice_test_user",
        password_hash: hash,
        role: "STUDENT",
        is_active: true,
      },
    });
    practiceUserId = user.id;

    // 2. Login to get access token
    const loginRes = await request(app).post("/api/auth/login").send({
      emailOrUsername: "practice-test@example.com",
      password: "PracticeTest123!",
    });
    practiceUserToken = loginRes.body.data.accessToken;

    // 3. Seed a learning style profile directly (skips the learning-style API)
    await prisma.user_learning_profile.create({
      data: {
        user_id: practiceUserId,
        primary_style: "VISUAL",
        style_scores: { VISUAL: 5, VERBAL: 2, SCENARIO: 1 },
        quiz_responses: [
          "VISUAL",
          "VISUAL",
          "VISUAL",
          "VISUAL",
          "VISUAL",
          "VERBAL",
          "VERBAL",
          "SCENARIO",
        ],
      },
    });

    // 4. Create test module
    const testModule = await prisma.module.create({
      data: {
        title: "Practice Integration Test Module",
        description: "Used for practice generation integration tests",
        order_index: 997,
      },
    });
    testModuleId = testModule.id;

    // 5. Concept 1 (AI success + cache path)
    const aiConcept = await prisma.concept.create({
      data: {
        module_id: testModuleId,
        order_index: 1,
        title: "AI Practice Test Concept",
        definition: "Test definition for AI practice tests",
        why_it_works: "Test why it works",
      },
    });
    aiConceptId = aiConcept.id;

    for (let i = 1; i <= 3; i++) {
      await prisma.quiz.create({
        data: {
          concept_id: aiConceptId,
          order_index: i,
          question: `AI Concept Quiz Question ${i}`,
          question_type: "single_choice",
          media_url: "",
          options: ["Option A", "Option B", "Option C"],
          correct_option_index: [0],
          explanation: `Option A is correct for question ${i}.`,
        },
      });
    }

    // 6. Concept 2 (fallback path — AI failure)
    const fallbackConcept = await prisma.concept.create({
      data: {
        module_id: testModuleId,
        order_index: 2,
        title: "Fallback Practice Test Concept",
        definition: "Test definition for fallback tests",
        why_it_works: "Test why it works for fallback",
      },
    });
    fallbackConceptId = fallbackConcept.id;

    for (let i = 1; i <= 3; i++) {
      await prisma.quiz.create({
        data: {
          concept_id: fallbackConceptId,
          order_index: i,
          question: `Fallback Concept Quiz Question ${i}`,
          question_type: "single_choice",
          media_url: "",
          options: ["Choice X", "Choice Y", "Choice Z"],
          correct_option_index: [1],
          explanation: `Choice Y is correct for fallback question ${i}.`,
        },
      });
    }
  });

  afterAll(async () => {
    process.env.AI_PROVIDER = "";

    const conceptIds = [aiConceptId, fallbackConceptId].filter(Boolean);

    // Clean up AI practice cache entries
    try {
      await prisma.aI_practice_cache.deleteMany({
        where: { concept_id: { in: conceptIds } },
      });
    } catch (_) {}

    // Clean up learning profile
    try {
      await prisma.user_learning_profile.deleteMany({
        where: { user_id: practiceUserId },
      });
    } catch (_) {}

    // Clean up user activity
    try {
      await prisma.user_response.deleteMany({
        where: { user_id: practiceUserId },
      });
    } catch (_) {}
    try {
      await prisma.user_concept_progress.deleteMany({
        where: { user_id: practiceUserId },
      });
    } catch (_) {}

    // Clean up user
    try {
      await prisma.user.delete({ where: { id: practiceUserId } });
    } catch (_) {}

    // Clean up test concepts and module
    try {
      if (conceptIds.length > 0) {
        await prisma.quiz.deleteMany({
          where: { concept_id: { in: conceptIds } },
        });
        await prisma.concept.deleteMany({ where: { module_id: testModuleId } });
      }
      await prisma.module.delete({ where: { id: testModuleId } });
    } catch (_) {}

    await prisma.$disconnect();
  });

  // ─── FR-3.10: Auth guard ─────────────────────────────────────────────────

  describe("FR-3.10: POST /api/practice/generate without auth → 401", () => {
    it("returns 401 when no Authorization header is provided", async () => {
      const response = await request(app)
        .post("/api/practice/generate")
        .send({ conceptId: 1 });

      expect(response.status).toBe(401);
    });
  });

  // ─── FR-3.9: Invalid concept → 404 ──────────────────────────────────────

  describe("FR-3.9: POST /api/practice/generate with non-existent conceptId → 404", () => {
    it("returns 404 for a conceptId that does not exist", async () => {
      const response = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: 99999999 });

      expect(response.status).toBe(404);
    });
  });

  // ─── FR-3.7: Successful AI practice generation ──────────────────────────

  describe("FR-3.7: POST /api/practice/generate with valid conceptId", () => {
    beforeEach(async () => {
      // Clear any cached result so each test gets a fresh AI call
      try {
        await prisma.aI_practice_cache.deleteMany({
          where: { concept_id: aiConceptId },
        });
      } catch (_) {}
    });

    it("returns exactly 3 questions with question, options, correct_option_index, explanation", async () => {
      const response = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: aiConceptId });

      expect(response.status).toBe(200);

      // Accept { questions: [...] } or a direct array
      const questions = Array.isArray(response.body)
        ? response.body
        : response.body.questions;

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(3);

      for (const q of questions) {
        expect(q).toHaveProperty("question");
        expect(q).toHaveProperty("options");
        expect(q).toHaveProperty("correct_option_index");
        expect(q).toHaveProperty("explanation");
        expect(Array.isArray(q.options)).toBe(true);
      }
    });
  });

  // ─── FR-3.8: Second call returns cached result ───────────────────────────

  describe("FR-3.8: POST /api/practice/generate called twice → second call uses cache", () => {
    beforeEach(async () => {
      // Clear cache so first call always goes to AI
      try {
        await prisma.aI_practice_cache.deleteMany({
          where: { concept_id: aiConceptId },
        });
      } catch (_) {}
    });

    it("a cache entry with a future expires_at exists in DB after first generate call", async () => {
      const response = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: aiConceptId });

      expect(response.status).toBe(200);

      const cacheEntry = await prisma.aI_practice_cache.findUnique({
        where: {
          concept_id_learning_style: {
            concept_id: aiConceptId,
            learning_style: "VISUAL",
          },
        },
      });

      expect(cacheEntry).not.toBeNull();
      expect(cacheEntry!.expires_at).toBeInstanceOf(Date);
      expect(cacheEntry!.expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it("second call returns the same questions and no new cache row is written", async () => {
      // First call
      const first = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: aiConceptId });

      expect(first.status).toBe(200);

      // Second call
      const second = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: aiConceptId });

      expect(second.status).toBe(200);

      // Only one cache entry should exist (no duplicate rows)
      const cacheCount = await prisma.aI_practice_cache.count({
        where: { concept_id: aiConceptId, learning_style: "VISUAL" },
      });
      expect(cacheCount).toBe(1);

      // Both calls should return the same content
      const q1 = Array.isArray(first.body) ? first.body : first.body.questions;
      const q2 = Array.isArray(second.body)
        ? second.body
        : second.body.questions;
      expect(q1).toEqual(q2);
    });

    it("second call returns within 500ms (cache hit is fast)", async () => {
      // Prime the cache with first call
      await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: aiConceptId });

      // Time the second call — should be a quick cache hit
      const start = Date.now();
      const second = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: aiConceptId });
      const elapsed = Date.now() - start;

      expect(second.status).toBe(200);
      expect(elapsed).toBeLessThan(500);
    });
  });

  // ─── FR-3.11: AI provider fails → fallback to existing quiz questions ────

  describe("FR-3.11: AI provider failure → fallback to existing quiz questions", () => {
    /**
     * The implementation's AIProviderFactory reads AI_PROVIDER from process.env.
     * When set to 'mock-failing', it must return a provider whose completeJSON
     * always rejects. The app re-reads the env var per request (not cached at startup).
     *
     * If the app wires the provider once at startup, this test can also be satisfied
     * by having a PracticeGeneratorService that catches AI errors and calls the
     * fallback method directly — the behaviour is the same from the HTTP perspective.
     */
    it("returns existing quiz questions (200) when AI provider fails", async () => {
      // Clear any cached result for fallbackConceptId so AI is attempted
      try {
        await prisma.aI_practice_cache.deleteMany({
          where: { concept_id: fallbackConceptId },
        });
      } catch (_) {}

      // Signal the AI factory to use a failing mock for this request.
      // The implementation must honour this env var (read per-request, not startup).
      const savedProvider = process.env.AI_PROVIDER;
      process.env.AI_PROVIDER = "mock-failing";

      const response = await request(app)
        .post("/api/practice/generate")
        .set("Authorization", `Bearer ${practiceUserToken}`)
        .send({ conceptId: fallbackConceptId });

      process.env.AI_PROVIDER = savedProvider;

      // Graceful fallback — must NOT return 500
      expect(response.status).toBe(200);

      const questions = Array.isArray(response.body)
        ? response.body
        : response.body.questions;

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);

      // Fallback questions (existing Quiz records) must have the same required shape
      for (const q of questions) {
        expect(q).toHaveProperty("question");
        expect(q).toHaveProperty("options");
        expect(q).toHaveProperty("correct_option_index");
        expect(q).toHaveProperty("explanation");
      }
    });
  });
});
