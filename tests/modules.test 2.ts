import { api, prisma, getAuthToken, authGet, authPost } from "./setup.js";

describe("Module Endpoints", () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/modules/:moduleId/theme", () => {
    it("should return theme for valid module ID", async () => {
      const response = await authGet("/api/modules/1/theme", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("context");
      expect(response.body).toHaveProperty("mediaUrl");
      expect(response.body).toHaveProperty("mediaType");
      expect(response.body).toHaveProperty("question");
    });

    it("should return 404 for non-existent module", async () => {
      const response = await authGet("/api/modules/9999/theme", authToken);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid module ID", async () => {
      const response = await authGet("/api/modules/invalid/theme", authToken);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid module ID");
    });

    it("should reject request without auth token", async () => {
      const response = await api.get("/api/modules/1/theme");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/modules/overview", () => {
    it("should return modules overview", async () => {
      const response = await authGet("/api/modules/overview", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("modules");
      expect(Array.isArray(response.body.modules)).toBe(true);
    });

    it("should reject request without auth token", async () => {
      const response = await api.get("/api/modules/overview");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/modules/:moduleId/reflection", () => {
    it("should return reflection for valid module ID", async () => {
      const response = await authGet("/api/modules/1/reflection", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("type");
      expect(response.body).toHaveProperty("prompt");
    });

    it("should return 404 for non-existent module", async () => {
      const response = await authGet("/api/modules/9999/reflection", authToken);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/modules/:moduleId/reflection", () => {
    it("should save reflection with valid data", async () => {
      const response = await authPost("/api/modules/1/reflection", authToken, {
        reflectionId: 1,
        userId: 1,
        answer: "This is my reflection answer for testing.",
        timeSpent: 120,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Reflection saved successfully");
    });

    it("should reject reflection without required fields", async () => {
      const response = await authPost("/api/modules/1/reflection", authToken, {
        reflectionId: 1,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing required field(s)");
    });
  });
});
