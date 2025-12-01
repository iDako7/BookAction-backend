// Load environment variables first
import "dotenv/config"; //? do we need it and why?
import { prisma } from "./lib/prisma.js";
import express from "express";

// import repository
import { UserRepository } from "./repositories/UserRepository.js";
import { RefreshTokenRepository } from "./repositories/RefreshTokenRepository.js";
import { ConceptRepository } from "./repositories/ConceptRepository.js";
import { UserProgressRepository } from "./repositories/UserProgressRepository.js";
import { ModuleRepository } from "./repositories/ModuleRepository.js";

// import service
import { AuthService } from "./services/AuthService.js";
import { ConceptService } from "./services/ConceptService.js";
import { UserProgressService } from "./services/UserProgressService.js";
import { ModuleService } from "./services/ModuleService.js";

// import controller
import { AuthController } from "./controller/AuthController.js";
import { ConceptController } from "./controller/ConceptController.js";
import { ModuleController } from "./controller/ModuleController.js";

// import routes
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createConceptRoutes } from "./routes/concept.routes.js";
import { createModuleRoutes } from "./routes/module.routes.js";

// 1.1 initialize data base
// why we don't call PrismaClient like repo layer did
// actually we are using the pre-configured prisma object, otherwise we need to finish series of action to initialize prisma
const prismaClient = prisma;

// 1.2 initialize repositories
// for user authentication usage
const userRepo = new UserRepository(prismaClient);
const refreshToken = new RefreshTokenRepository(prismaClient);
// for concept related routes
const conceptRepo = new ConceptRepository(prismaClient);
const userProgressRepo = new UserProgressRepository(prismaClient);
// for module related routes
const moduleRepo = new ModuleRepository(prismaClient);

// 1.3 initialize service
const authService = new AuthService(userRepo, refreshToken);
const conceptService = new ConceptService(conceptRepo);
const userProgressService = new UserProgressService(userProgressRepo);
const moduleService = new ModuleService(moduleRepo);

// 1.4 initialize controller
const authController = new AuthController(authService);
const conceptController = new ConceptController(
  conceptService,
  userProgressService
);
const moduleController = new ModuleController(moduleService);

// ===== typical REST API start part
// 1. Create app
const app = express();

// 2. Add middleware
app.use(express.json());
// todo add cookie middle ware

// ====== 3. Register routes =======

// Use routes
app.use("/api/modules", createModuleRoutes(moduleController));
app.use("/api/concepts", createConceptRoutes(conceptController));
app.use("/api/auth", createAuthRoutes(authController));

// 4. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
