// Load environment variables first
import "dotenv/config";
import { prisma } from "./lib/prisma.js";
import express from "express";

// todo refactor old routes using new method
import moduleRoutes from "./routes/module.routes.js";
import conceptRoutes from "./routes/concept.routes.js";

// import repository
import { UserRepository } from "./repositories/UserRepository.js";
import { RefreshToken } from "../generated/prisma/client.js";

// import service
import { AuthService } from "./services/AuthService.js";

// import controller
import { AuthController } from "./controller/AuthController.js";

// import routes
import { createAuthRoutes } from "./routes/auth.routes.js";
import { RefreshTokenRepository } from "./repositories/RefreshTokenRepository.js";

// 1.1 initialize data base
// why we don't call PrismaClient like repo layer did
// actually we are using the pre-configured prisma object, otherwise we need to finish series of action to initialize prisma
const prismaClient = prisma;

// 1.2 initialize repositories
const userRepo = new UserRepository(prismaClient);
const refreshToken = new RefreshTokenRepository(prismaClient);

// 1.3 initialize service
const authService = new AuthService(userRepo, refreshToken);

// 1.4 initialize controller
const authController = new AuthController(authService);

// ===== typical REST API start part
// 1. Create app
const app = express();

// 2. Add middleware
app.use(express.json());
// todo add cookie middle ware

// ====== 3. Register routes =======

// Use routes
app.use("/api", moduleRoutes);
app.use("/api", conceptRoutes);
app.use("/api/auth", createAuthRoutes(authController));

// 4. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
