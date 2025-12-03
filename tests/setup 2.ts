import request from "supertest";
import { app, prisma } from "../src/app.js";
import type { Server } from "http";

// Start the app on localhost with an ephemeral port and point supertest at that URL
const testServer: Server = app.listen(0, "127.0.0.1");
const address = testServer.address();
const baseUrl =
  typeof address === "string"
    ? address
    : `http://127.0.0.1:${address?.port ?? 0}`;

export const api = request(baseUrl);
export { app, prisma, testServer };

export const TEST_USER = {
  email: "student@example.com",
  username: "demo_student",
  password: "password123",
};

export const NEW_USER = {
  email: "newuser@test.com",
  username: "newuser",
  password: "Test123!@#",
};

/**
 * Helper: Login and get access token
 */
export async function getAuthToken(): Promise<string> {
  const response = await api.post("/api/auth/login").send({
    emailOrUsername: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.data.accessToken;
}

/**
 * Helper: Make authenticated GET request
 */
export async function authGet(url: string, token: string) {
  return api.get(url).set("Authorization", `Bearer ${token}`);
}

/**
 * Helper: Make authenticated POST request
 */
export async function authPost(url: string, token: string, body: object) {
  return api.post(url).set("Authorization", `Bearer ${token}`).send(body);
}

/**
 * Cleanup: Delete test user created during registration tests
 */
export async function cleanupTestUser(email: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { email },
    });
  } catch (error) {
    // User might not exist, ignore error
  }
}
