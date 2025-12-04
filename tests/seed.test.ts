import { jest } from "@jest/globals";
import request from "supertest";
import { app, prisma } from "./setup.js";
import { SeedService } from "../src/services/SeedService.js";

describe("Seed Routes", () => {
  const originalEnv = {
    enableSeed: process.env.ENABLE_SEED_ENDPOINT,
    seedToken: process.env.SEED_ENDPOINT_TOKEN,
  };

  const enableSeedEndpoint = (token = "test-seed-token") => {
    setEnv("ENABLE_SEED_ENDPOINT", "true");
    setEnv("SEED_ENDPOINT_TOKEN", token);
    return token;
  };

  const setEnv = (key: "ENABLE_SEED_ENDPOINT" | "SEED_ENDPOINT_TOKEN", value: string | undefined) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  };

  const resetEnv = () => {
    setEnv("ENABLE_SEED_ENDPOINT", originalEnv.enableSeed);
    setEnv("SEED_ENDPOINT_TOKEN", originalEnv.seedToken);
  };

  afterEach(() => {
    resetEnv();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    resetEnv();
    jest.restoreAllMocks(); 
    await prisma.$disconnect();
  });

  it("returns 403 when the seed endpoint is disabled", async () => {
    setEnv("ENABLE_SEED_ENDPOINT", undefined);
    setEnv("SEED_ENDPOINT_TOKEN", undefined);

    const response = await request(app).post("/api/admin/seed");

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/Seed endpoint disabled/i);
  });

  it("returns 500 when the seed token is not configured", async () => {
    setEnv("ENABLE_SEED_ENDPOINT", "true");
    setEnv("SEED_ENDPOINT_TOKEN", undefined);

    const seedSpy = jest.spyOn(SeedService.prototype, "seed");

    const response = await request(app).post("/api/admin/seed");

    expect(seedSpy).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Seed token not configured");
  });

  it("rejects requests with an invalid token", async () => {
    enableSeedEndpoint("expected-token");
    const seedSpy = jest.spyOn(SeedService.prototype, "seed");

    const response = await request(app)
      .post("/api/admin/seed")
      .set("x-seed-token", "wrong-token");

    expect(seedSpy).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized seed request");
  });

  it("runs the seed when enabled and the token matches", async () => {
    const seedToken = enableSeedEndpoint("secret-seed-token");
    const seedSpy = jest
      .spyOn(SeedService.prototype, "seed")
      .mockResolvedValue({
        user: { id: 1, email: "student@example.com" } as any,
        refreshToken: { token: "refresh-token" } as any,
        modulesSeeded: 2,
        conceptsSeeded: 4,
        quizzesSeeded: 6,
      });

    const response = await request(app)
      .post("/api/admin/seed")
      .set("Authorization", `Bearer ${seedToken}`);

    expect(seedSpy).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Database seeded");
    expect(response.body.user).toEqual({
      id: 1,
      email: "student@example.com",
      refreshToken: "refresh-token",
    });
    expect(response.body.stats).toEqual({
      modules: 2,
      concepts: 4,
      quizzes: 6,
    });
  });
});
