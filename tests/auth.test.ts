import request from "supertest";
import { app, prisma, TEST_USER, NEW_USER, cleanupTestUser } from "./setup.js";

describe("Auth Endpoints", () => {
  afterAll(async () => {
    await cleanupTestUser(NEW_USER.email);
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(NEW_USER);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(NEW_USER.email);
      expect(response.body.data.user.username).toBe(NEW_USER.username);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it("should reject registration with existing email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: TEST_USER.email,
          username: "different_username",
          password: "Test123!@#",
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "not-an-email",
          username: "validuser",
          password: "Test123!@#",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject registration with short password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "short@test.com",
          username: "shortpwd",
          password: "12345",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid email and password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: TEST_USER.email,
          password: TEST_USER.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it("should login with valid username and password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: TEST_USER.username,
          password: TEST_USER.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: TEST_USER.email,
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject login with non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: "nonexistent@test.com",
          password: "anypassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh token with valid refresh token", async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: TEST_USER.email,
          password: TEST_USER.password,
        });

      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", cookies || []);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newAccessToken).toBeDefined();
    });

    it("should reject refresh with invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: TEST_USER.email,
          password: TEST_USER.password,
        });

      const token = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_USER.email);
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully with valid token", async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          emailOrUsername: TEST_USER.email,
          password: TEST_USER.password,
        });

      const token = loginResponse.body.data.accessToken;
      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", cookies || []);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
