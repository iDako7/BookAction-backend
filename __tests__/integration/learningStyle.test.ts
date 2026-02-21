/**
 * Integration tests for Phase 3: Learning Style endpoints (FR-3.3 through FR-3.6).
 *
 * Assumptions:
 * 1. Routes are registered at /api/learning-style/* in app.ts
 * 2. GET /api/learning-style/questions → hardcoded questions array, auth required
 * 3. POST /api/learning-style/submit body: { responses: string[] }
 *    where each element is 'VISUAL' | 'VERBAL' | 'SCENARIO'
 *    response: { primaryStyle: string, scores: { VISUAL, VERBAL, SCENARIO } }
 * 4. GET /api/learning-style/profile → returns saved User_learning_profile
 *    response: { primaryStyle, scores }
 * 5. Schema: User_learning_profile has user_id (unique), primary_style, style_scores, quiz_responses
 *
 * Test isolation strategy:
 * - FR-3.4 and FR-3.5 use the shared student@example.com (studentToken) and
 *   run in document order — FR-3.4 saves a profile that FR-3.5 then reads.
 * - FR-3.6 uses a fresh second student (ls-test-nosubmit@example.com) who
 *   has never submitted a learning style quiz.
 * - All created resources are cleaned up in afterAll.
 */
import request from "supertest";
import bcrypt from "bcrypt";
import { app, prisma, getAuthToken } from "../../tests/setup.js";

describe("Learning Style Endpoints", () => {
  let studentToken: string;
  let studentUserId: number;

  // Second student: used for FR-3.6 (no profile → 404)
  const secondStudentEmail = "ls-test-nosubmit@example.com";
  let secondStudentToken: string;

  beforeAll(async () => {
    // Use the shared seeded student for submit/profile tests
    studentToken = await getAuthToken();

    const student = await prisma.user.findUnique({
      where: { email: "student@example.com" },
      select: { id: true },
    });
    studentUserId = student!.id;

    // Clean up any leftover profile from previous runs
    try {
      await prisma.user_learning_profile.delete({
        where: { user_id: studentUserId },
      });
    } catch (_) {}

    // Create a fresh student with no profile (for FR-3.6)
    const hash = await bcrypt.hash("LSTest123!", 10);
    await prisma.user.upsert({
      where: { email: secondStudentEmail },
      update: {},
      create: {
        email: secondStudentEmail,
        username: "ls_test_nosubmit",
        password_hash: hash,
        role: "STUDENT",
        is_active: true,
      },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ emailOrUsername: secondStudentEmail, password: "LSTest123!" });
    secondStudentToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Remove learning profiles created during tests
    try {
      await prisma.user_learning_profile.deleteMany({
        where: { user_id: studentUserId },
      });
    } catch (_) {}

    // Remove second test student (and their profile if created)
    try {
      const secondUser = await prisma.user.findUnique({
        where: { email: secondStudentEmail },
        select: { id: true },
      });
      if (secondUser) {
        try {
          await prisma.user_learning_profile.deleteMany({
            where: { user_id: secondUser.id },
          });
        } catch (_) {}
        await prisma.user.delete({ where: { email: secondStudentEmail } });
      }
    } catch (_) {}

    await prisma.$disconnect();
  });

  // ─── FR-3.3: Questions endpoint ──────────────────────────────────────────

  describe("FR-3.3: GET /api/learning-style/questions", () => {
    it("returns an array of 8-10 questions each with exactly 3 options", async () => {
      const response = await request(app)
        .get("/api/learning-style/questions")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(8);
      expect(response.body.length).toBeLessThanOrEqual(10);

      for (const q of response.body) {
        expect(q).toHaveProperty("question");
        expect(q).toHaveProperty("options");
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(3);
      }
    });

    it("returns 401 without auth token", async () => {
      const response = await request(app).get(
        "/api/learning-style/questions"
      );
      expect(response.status).toBe(401);
    });
  });

  // ─── FR-3.4: Submit learning style quiz ──────────────────────────────────

  describe("FR-3.4: POST /api/learning-style/submit", () => {
    it("returns { primaryStyle, scores } and saves profile to DB", async () => {
      const responses = [
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VISUAL",
        "VERBAL",
        "VERBAL",
        "SCENARIO",
      ];

      const response = await request(app)
        .post("/api/learning-style/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ responses });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("primaryStyle");
      expect(response.body).toHaveProperty("scores");
      expect(["VISUAL", "VERBAL", "SCENARIO"]).toContain(
        response.body.primaryStyle
      );
      // With 5 VISUAL, it must be VISUAL
      expect(response.body.primaryStyle).toBe("VISUAL");

      // Verify profile was persisted to the database
      const profile = await prisma.user_learning_profile.findUnique({
        where: { user_id: studentUserId },
      });
      expect(profile).not.toBeNull();
      expect(profile!.primary_style).toBe("VISUAL");
    });

    it("returns 401 without auth token", async () => {
      const response = await request(app)
        .post("/api/learning-style/submit")
        .send({ responses: ["VISUAL", "VERBAL"] });
      expect(response.status).toBe(401);
    });
  });

  // ─── FR-3.5: Get saved profile ───────────────────────────────────────────

  describe("FR-3.5: GET /api/learning-style/profile after submission", () => {
    it("returns saved profile matching what was submitted in FR-3.4", async () => {
      // Profile was saved in the FR-3.4 test above (tests run in order)
      const response = await request(app)
        .get("/api/learning-style/profile")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("primaryStyle");
      expect(response.body).toHaveProperty("scores");
      // Must match what was submitted in FR-3.4
      expect(response.body.primaryStyle).toBe("VISUAL");
    });
  });

  // ─── FR-3.6: Profile not found → 404 ─────────────────────────────────────

  describe("FR-3.6: GET /api/learning-style/profile before submission → 404", () => {
    it("returns 404 when student has never submitted a learning style quiz", async () => {
      // secondStudentToken has no saved profile
      const response = await request(app)
        .get("/api/learning-style/profile")
        .set("Authorization", `Bearer ${secondStudentToken}`);

      expect(response.status).toBe(404);
    });
  });
});
