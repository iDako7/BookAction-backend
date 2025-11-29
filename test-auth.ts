import { RefreshTokenRepository } from "./src/repositories/RefreshTokenRepository.js";
import { UserRepository } from "./src/repositories/UserRepository.js";
import { AuthService } from "./src/services/AuthService.js";
import { prisma } from "./src/lib/prisma.js";
import dotenv from "dotenv";

dotenv.config();

async function testAuth() {
  const userRepo = new UserRepository(prisma);
  const refreshTokenRepo = new RefreshTokenRepository(prisma);
  const authService = new AuthService(userRepo, refreshTokenRepo);

  try {
    // test registration
    console.log("Testing registration...");
    const { user, token } = await authService.register({
      email: "test1@example.com",
      username: "testuser",
      password: "Test123!@#",
    });
    console.log("✅ User registered:", user.email);
    console.log("✅ Access token:", token.accessToken.substring(0, 20) + "...");

    // Test login
    console.log("\\nTesting login...");
    const loginResult = await authService.login({
      emailOrUsername: "test1@example.com",
      password: "Test123!@#",
    });

    // Test token verification
    console.log("\\nTesting token verification...");
    const payload = await authService.verifyAccessToken(
      loginResult.tokens.accessToken
    );
    console.log("✅ Token valid for user:", payload.username);
    console.log("✅ Login successful");

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log("\\n✅ Test user cleaned up");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect(); //? is this necessary??
  }
}

// Run the test
testAuth();
