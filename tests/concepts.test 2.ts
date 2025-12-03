import { api, prisma, getAuthToken, authGet, authPost } from "./setup.js";

describe("Concept Endpoints", () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/concepts/:conceptId/tutorial", () => {
    it("should return tutorial for valid concept ID", async () => {
      const response = await authGet("/api/concepts/1/tutorial", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("definition");
      expect(response.body).toHaveProperty("whyItWorks");
      expect(response.body).toHaveProperty("tutorial");
      expect(response.body.tutorial).toHaveProperty("goodExample");
      expect(response.body.tutorial).toHaveProperty("badExample");
    });

    it("should return 500 for non-existent concept", async () => {
      const response = await authGet("/api/concepts/9999/tutorial", authToken);

      expect(response.status).toBe(500);
    });

    it("should return 400 for invalid concept ID", async () => {
      const response = await authGet("/api/concepts/invalid/tutorial", authToken);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid concept ID");
    });

    it("should reject request without auth token", async () => {
      const response = await api.get("/api/concepts/1/tutorial");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/concepts/:conceptId/quiz", () => {
    it("should return quizzes for valid concept ID", async () => {
      const response = await authGet("/api/concepts/1/quiz", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("questions");
      expect(Array.isArray(response.body.questions)).toBe(true);

      if (response.body.questions.length > 0) {
        expect(response.body.questions[0]).toHaveProperty("question");
        expect(response.body.questions[0]).toHaveProperty("options");
        expect(response.body.questions[0]).toHaveProperty("questionType");
      }
    });

    it("should return 400 for invalid concept ID", async () => {
      const response = await authGet("/api/concepts/abc/quiz", authToken);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/concepts/:conceptId/summary", () => {
    it("should return summary for valid concept ID", async () => {
      const response = await authGet("/api/concepts/1/summary", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("summaryContent");
      expect(response.body).toHaveProperty("nextConceptIntro");
    });

    it("should return 400 for invalid concept ID", async () => {
      const response = await authGet("/api/concepts/xyz/summary", authToken);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/concepts/quiz/:quizId/answer", () => {
    it("should save quiz answer with valid data", async () => {
      const response = await authPost("/api/concepts/quiz/1/answer", authToken, {
        responseType: "quiz",
        userId: 1,
        userAnswerIndices: [0],
        timeSpent: 30,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("userAnswerIndices");
      expect(response.body).toHaveProperty("correctOptionIndices");
      expect(response.body).toHaveProperty("score");
    });

    it("should reject quiz answer without required fields", async () => {
      const response = await authPost("/api/concepts/quiz/1/answer", authToken, {
        responseType: "quiz",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required field(s)");
    });

    it("should return 400 for invalid quiz ID", async () => {
      const response = await authPost(
        "/api/concepts/quiz/invalid/answer",
        authToken,
        {
          responseType: "quiz",
          userId: 1,
          userAnswerIndices: [0],
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/concepts/:conceptId/progress", () => {
    it("should update progress with valid data", async () => {
      const response = await authPost("/api/concepts/1/progress", authToken, {
        userId: 1,
        isCompleted: true,
        timeSpent: 300,
      });

      expect(response.status).toBe(200);
    });

    it("should reject progress update without required fields", async () => {
      const response = await authPost("/api/concepts/1/progress", authToken, {
        timeSpent: 100,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing userId or isCompleted");
    });
  });
});
