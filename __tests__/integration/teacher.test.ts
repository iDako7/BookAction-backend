import request from "supertest";
import bcrypt from "bcrypt";
import { app, prisma, getAuthToken } from "../../tests/setup.js";

describe("Teacher Portal Endpoints", () => {
  let studentToken: string;
  let teacherToken: string;
  let studentUserId: number;

  beforeAll(async () => {
    // Get student token from existing seeded user
    studentToken = await getAuthToken();

    // Look up seeded student's id
    const student = await prisma.user.findUnique({
      where: { email: "student@example.com" },
      select: { id: true },
    });
    studentUserId = student!.id;

    // Create a teacher user for tests
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        email: "teacher@test.com",
        username: "test_teacher",
        password_hash: passwordHash,
        role: "TEACHER",
        is_active: true,
      },
    });

    // Login as teacher to get JWT
    const teacherLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ emailOrUsername: "teacher@test.com", password: "password123" });

    teacherToken = teacherLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: "teacher@test.com" } });
    await prisma.$disconnect();
  });

  // ─── FR-2.1: Student is blocked from teacher endpoints ───────────────────

  describe("FR-2.1: Role guard — student gets 403", () => {
    it("student calling GET /api/teacher/students → 403 Forbidden", async () => {
      const response = await request(app)
        .get("/api/teacher/students")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  // ─── FR-2.10: Unauthenticated requests are blocked ───────────────────────

  describe("FR-2.10: Unauthenticated requests → 401", () => {
    it("GET /api/teacher/students without auth → 401", async () => {
      const response = await request(app).get("/api/teacher/students");
      expect(response.status).toBe(401);
    });

    it("GET /api/teacher/overview without auth → 401", async () => {
      const response = await request(app).get("/api/teacher/overview");
      expect(response.status).toBe(401);
    });

    it("GET /api/teacher/reports/export without auth → 401", async () => {
      const response = await request(app).get("/api/teacher/reports/export");
      expect(response.status).toBe(401);
    });
  });

  // ─── FR-2.2: Paginated student list ──────────────────────────────────────

  describe("FR-2.2: GET /api/teacher/students — paginated student list", () => {
    it("teacher gets 200 with paginated student list", async () => {
      const response = await request(app)
        .get("/api/teacher/students")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("totalPages");
    });
  });

  // ─── FR-2.3: Pagination params respected ─────────────────────────────────

  describe("FR-2.3: GET /api/teacher/students?page=1&limit=5 — pagination metadata", () => {
    it("returns at most 5 students and correct pagination metadata", async () => {
      const response = await request(app)
        .get("/api/teacher/students?page=1&limit=5")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(typeof response.body.pagination.total).toBe("number");
      expect(typeof response.body.pagination.totalPages).toBe("number");
    });
  });

  // ─── FR-2.4: Search filter ────────────────────────────────────────────────

  describe("FR-2.4: GET /api/teacher/students?search=demo — search filter", () => {
    it("returns only students matching the search term", async () => {
      const response = await request(app)
        .get("/api/teacher/students?search=demo")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      // Every returned student must match the search term in username or email
      for (const student of response.body.data) {
        const matchesUsername = student.username?.toLowerCase().includes("demo");
        const matchesEmail = student.email?.toLowerCase().includes("demo");
        expect(matchesUsername || matchesEmail).toBe(true);
      }
    });
  });

  // ─── FR-2.5: Individual student detail ───────────────────────────────────

  describe("FR-2.5: GET /api/teacher/students/:id — student detail report", () => {
    it("returns student detail with overallAccuracy, modulesCompleted, and per-concept breakdown", async () => {
      const response = await request(app)
        .get(`/api/teacher/students/${studentUserId}`)
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("overallAccuracy");
      expect(response.body).toHaveProperty("modulesCompleted");
      expect(response.body).toHaveProperty("conceptBreakdown");
      expect(Array.isArray(response.body.conceptBreakdown)).toBe(true);
    });
  });

  // ─── FR-2.6: Non-existent student → 404 ──────────────────────────────────

  describe("FR-2.6: GET /api/teacher/students/:nonExistentId → 404", () => {
    it("returns 404 for a student ID that does not exist", async () => {
      const response = await request(app)
        .get("/api/teacher/students/99999999")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ─── FR-2.7: Class overview stats ────────────────────────────────────────

  describe("FR-2.7: GET /api/teacher/overview — class-level aggregate stats", () => {
    it("returns totalStudents, totalModules, avgCompletionRate, avgQuizScore, moduleBreakdown", async () => {
      const response = await request(app)
        .get("/api/teacher/overview")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("totalStudents");
      expect(response.body).toHaveProperty("totalModules");
      expect(response.body).toHaveProperty("avgCompletionRate");
      expect(response.body).toHaveProperty("avgQuizScore");
      expect(response.body).toHaveProperty("moduleBreakdown");
      expect(typeof response.body.totalStudents).toBe("number");
      expect(typeof response.body.totalModules).toBe("number");
      expect(Array.isArray(response.body.moduleBreakdown)).toBe(true);
    });
  });

  // ─── FR-2.8: Module-level analytics ──────────────────────────────────────

  describe("FR-2.8: GET /api/teacher/modules/:id/report — module analytics", () => {
    it("returns completionRate, avgScore, avgTimeSpent for module 1", async () => {
      const response = await request(app)
        .get("/api/teacher/modules/1/report")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("completionRate");
      expect(response.body).toHaveProperty("avgScore");
      expect(response.body).toHaveProperty("avgTimeSpent");
    });
  });

  // ─── FR-2.9: CSV export ───────────────────────────────────────────────────

  describe("FR-2.9: GET /api/teacher/reports/export — CSV download", () => {
    it("response has Content-Type: text/csv and valid CSV content", async () => {
      const response = await request(app)
        .get("/api/teacher/reports/export")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/text\/csv/);
      // CSV should have at least a header row
      expect(typeof response.text).toBe("string");
      expect(response.text.length).toBeGreaterThan(0);
    });
  });
});
