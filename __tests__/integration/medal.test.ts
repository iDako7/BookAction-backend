/**
 * Integration tests for Phase 1: Medal System.
 *
 * Documented assumptions:
 * 1. Accuracy = average of all quiz scores for a concept (sum of scores / number of quiz submissions).
 *    Tests are structured so this holds regardless of whether the implementation counts
 *    "per unique quiz" or "all submissions".
 * 2. Module medal is created when ALL concepts in the module have User_concept_progress.completed=true
 *    for that user. Tests always call POST /api/concepts/:id/progress with isCompleted=true.
 * 3. GET /api/medals returns { conceptMedals: [...], moduleMedals: [...] } with camelCase fields:
 *    conceptMedal: { conceptId, tier, accuracy }
 *    moduleMedal:  { moduleId, tier, accuracy }
 * 4. userId is passed in req.body for quiz submissions (existing ConceptController pattern).
 * 5. The medal route is registered at /api/medals in app.ts.
 *
 * Test isolation strategy:
 * - Dedicated test users are created in beforeAll and deleted in afterAll.
 * - All test module/concept/quiz data is created in beforeAll and deleted in afterAll.
 * - The shared TEST_USER (student@example.com) is never used here.
 * - Medal records are deleted explicitly before user deletion (in case FK cascade is not set).
 */
import request from "supertest";
import bcrypt from "bcrypt";
import { app, prisma } from "../../tests/setup.js";

describe("Medal System Integration Tests", () => {
  // ---- Shared test state ----
  let medalTestUserId: number;
  let medalTestToken: string;

  // Test module shared across FR-1.8, FR-1.9, FR-1.10
  let testModuleId: number;

  // Concept + quizzes for FR-1.8 (GOLD — submit both correct)
  let goldConceptId: number;
  let goldQuiz1Id: number;
  let goldQuiz2Id: number;

  // Concept + quizzes for FR-1.9 (BRONZE — submit 1 correct + 1 wrong, avg = 0.50)
  let bronzeConceptId: number;
  let bronzeQuiz1Id: number;
  let bronzeQuiz2Id: number;

  // Concept + quizzes for FR-1.10 (no downgrade)
  let noDowngradeConceptId: number;
  let noDowngradeQuiz1Id: number;
  let noDowngradeQuiz2Id: number;

  beforeAll(async () => {
    // 1. Create dedicated medal test user
    const password_hash = await bcrypt.hash("TestMedal123!", 10);
    const user = await prisma.user.create({
      data: {
        email: "medal-test@example.com",
        username: "medal_test_user",
        password_hash,
        role: "STUDENT",
      },
    });
    medalTestUserId = user.id;

    // 2. Login to get access token
    const loginRes = await request(app).post("/api/auth/login").send({
      emailOrUsername: "medal-test@example.com",
      password: "TestMedal123!",
    });
    medalTestToken = loginRes.body.data.accessToken;

    // 3. Create test module (order_index=999 to avoid collision with seeded data)
    const testModule = await prisma.module.create({
      data: {
        title: "Medal Integration Test Module",
        description: "Used for medal integration tests only",
        order_index: 999,
      },
    });
    testModuleId = testModule.id;

    // 4. Concept 1 — for GOLD test (FR-1.8)
    //    2 single-choice quizzes, correct_option_index=[0]
    //    Submit both correct → avg = (1+1)/2 = 1.0 → GOLD
    const goldConcept = await prisma.concept.create({
      data: {
        module_id: testModuleId,
        order_index: 1,
        title: "Gold Test Concept",
        definition: "Test definition",
        why_it_works: "Test why",
      },
    });
    goldConceptId = goldConcept.id;

    const gq1 = await prisma.quiz.create({
      data: {
        concept_id: goldConceptId,
        order_index: 1,
        question: "Gold Q1: pick option 0",
        question_type: "single_choice",
        media_url: "",
        options: ["Correct", "Wrong"],
        correct_option_index: [0],
        explanation: "Option 0 is correct",
      },
    });
    goldQuiz1Id = gq1.id;

    const gq2 = await prisma.quiz.create({
      data: {
        concept_id: goldConceptId,
        order_index: 2,
        question: "Gold Q2: pick option 0",
        question_type: "single_choice",
        media_url: "",
        options: ["Correct", "Wrong"],
        correct_option_index: [0],
        explanation: "Option 0 is correct",
      },
    });
    goldQuiz2Id = gq2.id;

    // 5. Concept 2 — for BRONZE test (FR-1.9)
    //    2 single-choice quizzes, correct_option_index=[0]
    //    Submit quiz1 correct, quiz2 wrong → avg = (1+0)/2 = 0.50 → BRONZE
    const bronzeConcept = await prisma.concept.create({
      data: {
        module_id: testModuleId,
        order_index: 2,
        title: "Bronze Test Concept",
        definition: "Test definition",
        why_it_works: "Test why",
      },
    });
    bronzeConceptId = bronzeConcept.id;

    const bq1 = await prisma.quiz.create({
      data: {
        concept_id: bronzeConceptId,
        order_index: 1,
        question: "Bronze Q1: pick option 0",
        question_type: "single_choice",
        media_url: "",
        options: ["Correct", "Wrong"],
        correct_option_index: [0],
        explanation: "Option 0 is correct",
      },
    });
    bronzeQuiz1Id = bq1.id;

    const bq2 = await prisma.quiz.create({
      data: {
        concept_id: bronzeConceptId,
        order_index: 2,
        question: "Bronze Q2: pick option 0",
        question_type: "single_choice",
        media_url: "",
        options: ["Correct", "Wrong"],
        correct_option_index: [0],
        explanation: "Option 0 is correct",
      },
    });
    bronzeQuiz2Id = bq2.id;

    // 6. Concept 3 — for no-downgrade test (FR-1.10)
    //    Earn GOLD first (both correct), then submit both wrong → medal stays GOLD
    const noDowngradeConcept = await prisma.concept.create({
      data: {
        module_id: testModuleId,
        order_index: 3,
        title: "No Downgrade Test Concept",
        definition: "Test definition",
        why_it_works: "Test why",
      },
    });
    noDowngradeConceptId = noDowngradeConcept.id;

    const ndq1 = await prisma.quiz.create({
      data: {
        concept_id: noDowngradeConceptId,
        order_index: 1,
        question: "NoDown Q1: pick option 0",
        question_type: "single_choice",
        media_url: "",
        options: ["Correct", "Wrong"],
        correct_option_index: [0],
        explanation: "Option 0 is correct",
      },
    });
    noDowngradeQuiz1Id = ndq1.id;

    const ndq2 = await prisma.quiz.create({
      data: {
        concept_id: noDowngradeConceptId,
        order_index: 2,
        question: "NoDown Q2: pick option 0",
        question_type: "single_choice",
        media_url: "",
        options: ["Correct", "Wrong"],
        correct_option_index: [0],
        explanation: "Option 0 is correct",
      },
    });
    noDowngradeQuiz2Id = ndq2.id;
  });

  afterAll(async () => {
    // Clean up in reverse FK dependency order
    // Medal records first (may not cascade from user delete depending on implementation)
    try {
      await prisma.user_concept_medal.deleteMany({
        where: { user_id: medalTestUserId },
      });
    } catch (_) {}
    try {
      await prisma.user_module_medal.deleteMany({
        where: { user_id: medalTestUserId },
      });
    } catch (_) {}
    // User activity records
    try {
      await prisma.user_response.deleteMany({
        where: { user_id: medalTestUserId },
      });
    } catch (_) {}
    try {
      await prisma.user_concept_progress.deleteMany({
        where: { user_id: medalTestUserId },
      });
    } catch (_) {}
    // Delete user (cascades refresh tokens)
    try {
      await prisma.user.delete({ where: { id: medalTestUserId } });
    } catch (_) {}
    // Delete test course data
    try {
      const conceptIds = [
        goldConceptId,
        bronzeConceptId,
        noDowngradeConceptId,
      ].filter(Boolean);
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

  // =====================================================
  // FR-1.13: Auth guard
  // =====================================================
  describe("GET /api/medals without authentication", () => {
    it("FR-1.13: returns 401 when no auth token is provided", async () => {
      const response = await request(app).get("/api/medals");
      expect(response.status).toBe(401);
    });
  });

  // =====================================================
  // FR-1.14: Response shape
  // =====================================================
  describe("GET /api/medals with valid authentication", () => {
    it("FR-1.14: returns { conceptMedals, moduleMedals } as arrays", async () => {
      const response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${medalTestToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("conceptMedals");
      expect(response.body).toHaveProperty("moduleMedals");
      expect(Array.isArray(response.body.conceptMedals)).toBe(true);
      expect(Array.isArray(response.body.moduleMedals)).toBe(true);
    });
  });

  // =====================================================
  // FR-1.8: GOLD medal for 100% accuracy
  // =====================================================
  describe("FR-1.8: GOLD concept medal for 100% quiz accuracy", () => {
    it("awards GOLD when all quiz answers are correct (avg score = 1.0)", async () => {
      // Submit both quizzes correctly (score=1 each → avg=1.0 → GOLD)
      await request(app)
        .post(`/api/concepts/quiz/${goldQuiz1Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [0], // correct
          timeSpent: 10,
        });

      await request(app)
        .post(`/api/concepts/quiz/${goldQuiz2Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [0], // correct
          timeSpent: 10,
        });

      // Mark concept as completed (triggers module completion check)
      await request(app)
        .post(`/api/concepts/${goldConceptId}/progress`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          userId: medalTestUserId,
          isCompleted: true,
          timeSpent: 60,
        });

      const response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${medalTestToken}`);

      expect(response.status).toBe(200);

      const conceptMedal = response.body.conceptMedals.find(
        (m: { conceptId: number; tier: string; accuracy: number }) =>
          m.conceptId === goldConceptId
      );
      expect(conceptMedal).toBeDefined();
      expect(conceptMedal.tier).toBe("GOLD");
    });
  });

  // =====================================================
  // FR-1.9: BRONZE medal for 50% accuracy
  // =====================================================
  describe("FR-1.9: BRONZE concept medal for 50% quiz accuracy", () => {
    it("awards BRONZE when half of quiz answers are correct (avg score = 0.50)", async () => {
      // Submit quiz1 correctly (score=1), quiz2 incorrectly (score=0) → avg=0.50 → BRONZE
      await request(app)
        .post(`/api/concepts/quiz/${bronzeQuiz1Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [0], // correct
          timeSpent: 10,
        });

      await request(app)
        .post(`/api/concepts/quiz/${bronzeQuiz2Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [1], // wrong
          timeSpent: 10,
        });

      await request(app)
        .post(`/api/concepts/${bronzeConceptId}/progress`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          userId: medalTestUserId,
          isCompleted: true,
          timeSpent: 60,
        });

      const response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${medalTestToken}`);

      expect(response.status).toBe(200);

      const conceptMedal = response.body.conceptMedals.find(
        (m: { conceptId: number; tier: string; accuracy: number }) =>
          m.conceptId === bronzeConceptId
      );
      expect(conceptMedal).toBeDefined();
      expect(conceptMedal.tier).toBe("BRONZE");
    });
  });

  // =====================================================
  // FR-1.10: Medal tier never downgrades
  // =====================================================
  describe("FR-1.10: Concept medal tier never downgrades", () => {
    it("keeps GOLD after a subsequent low-accuracy attempt (both wrong)", async () => {
      // Round 1: Submit both correctly → avg=1.0 → GOLD
      await request(app)
        .post(`/api/concepts/quiz/${noDowngradeQuiz1Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [0], // correct
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/quiz/${noDowngradeQuiz2Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [0], // correct
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/${noDowngradeConceptId}/progress`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({ userId: medalTestUserId, isCompleted: true, timeSpent: 60 });

      // Verify GOLD was earned after round 1
      let response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${medalTestToken}`);
      const afterRound1 = response.body.conceptMedals.find(
        (m: { conceptId: number; tier: string }) =>
          m.conceptId === noDowngradeConceptId
      );
      expect(afterRound1?.tier).toBe("GOLD");

      // Round 2: Submit both wrong → would be NONE in isolation, but medal must stay GOLD
      await request(app)
        .post(`/api/concepts/quiz/${noDowngradeQuiz1Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [1], // wrong
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/quiz/${noDowngradeQuiz2Id}/answer`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({
          responseType: "single_choice",
          userId: medalTestUserId,
          userAnswerIndices: [1], // wrong
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/${noDowngradeConceptId}/progress`)
        .set("Authorization", `Bearer ${medalTestToken}`)
        .send({ userId: medalTestUserId, isCompleted: true, timeSpent: 60 });

      // Medal must STILL be GOLD (never downgrade)
      response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${medalTestToken}`);
      const afterRound2 = response.body.conceptMedals.find(
        (m: { conceptId: number; tier: string }) =>
          m.conceptId === noDowngradeConceptId
      );
      expect(afterRound2).toBeDefined();
      expect(afterRound2.tier).toBe("GOLD");
    });
  });

  // =====================================================
  // FR-1.11 & FR-1.12: Module medal awarding
  // Uses its own isolated beforeAll/afterAll and dedicated users.
  // =====================================================
  describe("Module medal awarding", () => {
    // User 1: completes ALL concepts → should get module medal (FR-1.11)
    let modUser1Id: number;
    let modUser1Token: string;

    // User 2: completes only 1 of 2 concepts → should NOT get module medal (FR-1.12)
    let modUser2Id: number;
    let modUser2Token: string;

    // Shared 2-concept module for both users
    let modModuleId: number;
    let modConcept1Id: number;
    let modConcept2Id: number;
    let modQuiz1Id: number;
    let modQuiz2Id: number;

    beforeAll(async () => {
      const hash = await bcrypt.hash("TestMedal123!", 10);

      // User 1: will complete all concepts
      const u1 = await prisma.user.create({
        data: {
          email: "medal-module-full@example.com",
          username: "medal_mod_full",
          password_hash: hash,
          role: "STUDENT",
        },
      });
      modUser1Id = u1.id;
      const login1 = await request(app).post("/api/auth/login").send({
        emailOrUsername: "medal-module-full@example.com",
        password: "TestMedal123!",
      });
      modUser1Token = login1.body.data.accessToken;

      // User 2: will complete only 1 concept
      const u2 = await prisma.user.create({
        data: {
          email: "medal-module-partial@example.com",
          username: "medal_mod_partial",
          password_hash: hash,
          role: "STUDENT",
        },
      });
      modUser2Id = u2.id;
      const login2 = await request(app).post("/api/auth/login").send({
        emailOrUsername: "medal-module-partial@example.com",
        password: "TestMedal123!",
      });
      modUser2Token = login2.body.data.accessToken;

      // Create a module with exactly 2 concepts, 1 quiz each
      const mod = await prisma.module.create({
        data: {
          title: "Module Medal Award Test",
          description: "For module medal integration tests",
          order_index: 998,
        },
      });
      modModuleId = mod.id;

      const c1 = await prisma.concept.create({
        data: {
          module_id: modModuleId,
          order_index: 1,
          title: "Module Test Concept 1",
          definition: "def",
          why_it_works: "why",
        },
      });
      modConcept1Id = c1.id;

      const c2 = await prisma.concept.create({
        data: {
          module_id: modModuleId,
          order_index: 2,
          title: "Module Test Concept 2",
          definition: "def",
          why_it_works: "why",
        },
      });
      modConcept2Id = c2.id;

      const q1 = await prisma.quiz.create({
        data: {
          concept_id: modConcept1Id,
          order_index: 1,
          question: "Mod Q1",
          question_type: "single_choice",
          media_url: "",
          options: ["Correct", "Wrong"],
          correct_option_index: [0],
          explanation: "Option 0 is correct",
        },
      });
      modQuiz1Id = q1.id;

      const q2 = await prisma.quiz.create({
        data: {
          concept_id: modConcept2Id,
          order_index: 1,
          question: "Mod Q2",
          question_type: "single_choice",
          media_url: "",
          options: ["Correct", "Wrong"],
          correct_option_index: [0],
          explanation: "Option 0 is correct",
        },
      });
      modQuiz2Id = q2.id;
    });

    afterAll(async () => {
      const userIds = [modUser1Id, modUser2Id].filter(Boolean);
      for (const uid of userIds) {
        try {
          await prisma.user_concept_medal.deleteMany({ where: { user_id: uid } });
        } catch (_) {}
        try {
          await prisma.user_module_medal.deleteMany({ where: { user_id: uid } });
        } catch (_) {}
        try {
          await prisma.user_response.deleteMany({ where: { user_id: uid } });
        } catch (_) {}
        try {
          await prisma.user_concept_progress.deleteMany({ where: { user_id: uid } });
        } catch (_) {}
        try {
          await prisma.user.delete({ where: { id: uid } });
        } catch (_) {}
      }
      const conceptIds = [modConcept1Id, modConcept2Id].filter(Boolean);
      try {
        if (conceptIds.length > 0) {
          await prisma.quiz.deleteMany({
            where: { concept_id: { in: conceptIds } },
          });
          await prisma.concept.deleteMany({ where: { module_id: modModuleId } });
        }
        await prisma.module.delete({ where: { id: modModuleId } });
      } catch (_) {}
    });

    it("FR-1.11: awards module medal when ALL concepts in module are completed", async () => {
      // Complete concept 1 for user 1
      await request(app)
        .post(`/api/concepts/quiz/${modQuiz1Id}/answer`)
        .set("Authorization", `Bearer ${modUser1Token}`)
        .send({
          responseType: "single_choice",
          userId: modUser1Id,
          userAnswerIndices: [0],
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/${modConcept1Id}/progress`)
        .set("Authorization", `Bearer ${modUser1Token}`)
        .send({ userId: modUser1Id, isCompleted: true, timeSpent: 30 });

      // Complete concept 2 for user 1
      await request(app)
        .post(`/api/concepts/quiz/${modQuiz2Id}/answer`)
        .set("Authorization", `Bearer ${modUser1Token}`)
        .send({
          responseType: "single_choice",
          userId: modUser1Id,
          userAnswerIndices: [0],
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/${modConcept2Id}/progress`)
        .set("Authorization", `Bearer ${modUser1Token}`)
        .send({ userId: modUser1Id, isCompleted: true, timeSpent: 30 });

      const response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${modUser1Token}`);

      expect(response.status).toBe(200);
      const moduleMedal = response.body.moduleMedals.find(
        (m: { moduleId: number; tier: string; accuracy: number }) =>
          m.moduleId === modModuleId
      );
      expect(moduleMedal).toBeDefined();
      expect(["BRONZE", "SILVER", "GOLD"]).toContain(moduleMedal.tier);
      expect(typeof moduleMedal.accuracy).toBe("number");
      expect(moduleMedal.accuracy).toBeGreaterThan(0);
    });

    it("FR-1.12: does NOT award module medal when only some concepts are completed", async () => {
      // Complete only concept 1 for user 2 — intentionally skip concept 2
      await request(app)
        .post(`/api/concepts/quiz/${modQuiz1Id}/answer`)
        .set("Authorization", `Bearer ${modUser2Token}`)
        .send({
          responseType: "single_choice",
          userId: modUser2Id,
          userAnswerIndices: [0],
          timeSpent: 10,
        });
      await request(app)
        .post(`/api/concepts/${modConcept1Id}/progress`)
        .set("Authorization", `Bearer ${modUser2Token}`)
        .send({ userId: modUser2Id, isCompleted: true, timeSpent: 30 });
      // Concept 2 intentionally NOT completed

      const response = await request(app)
        .get("/api/medals")
        .set("Authorization", `Bearer ${modUser2Token}`);

      expect(response.status).toBe(200);
      const moduleMedal = response.body.moduleMedals.find(
        (m: { moduleId: number }) => m.moduleId === modModuleId
      );
      expect(moduleMedal).toBeUndefined();
    });
  });
});
