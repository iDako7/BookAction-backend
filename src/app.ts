// Load environment variables first
import "dotenv/config"; //? do we need it and why?
import { prisma } from "./lib/prisma.js";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";

import cors from "cors";

// import repository
import { UserRepository } from "./repositories/UserRepository.js";
import { RefreshTokenRepository } from "./repositories/RefreshTokenRepository.js";
import { ConceptRepository } from "./repositories/ConceptRepository.js";
import { UserProgressRepository } from "./repositories/UserProgressRepository.js";
import { ModuleRepository } from "./repositories/ModuleRepository.js";
import { MedalRepository } from "./repositories/MedalRepository.js";
import { TeacherRepository } from "./repositories/TeacherRepository.js";
import { LearningProfileRepository } from "./repositories/LearningProfileRepository.js";
import { PracticeCacheRepository } from "./repositories/PracticeCacheRepository.js";

// import service
import { AuthService } from "./services/AuthService.js";
import { ConceptService } from "./services/ConceptService.js";
import { UserProgressService } from "./services/UserProgressService.js";
import { ModuleService } from "./services/ModuleService.js";
import { SeedService } from "./services/SeedService.js";
import { MedalService } from "./services/MedalService.js";
import { TeacherService } from "./services/TeacherService.js";
import { LearningStyleService } from "./services/LearningStyleService.js";
import { PracticeGeneratorService } from "./services/PracticeGeneratorService.js";

// import controller
import { AuthController } from "./controller/AuthController.js";
import { ConceptController } from "./controller/ConceptController.js";
import { ModuleController } from "./controller/ModuleController.js";
import { SeedController } from "./controller/SeedController.js";
import { MedalController } from "./controller/MedalController.js";
import { TeacherController } from "./controller/TeacherController.js";
import { LearningStyleController } from "./controller/LearningStyleController.js";
import { PracticeController } from "./controller/PracticeController.js";

// import middleware
import { errorHandler } from "./middleware/errorHandler.js";

// import routes
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createConceptRoutes } from "./routes/concept.routes.js";
import { createModuleRoutes } from "./routes/module.routes.js";
import { createSeedRoutes } from "./routes/seed.routes.js";
import { createMedalRoutes } from "./routes/medal.routes.js";
import { createTeacherRoutes } from "./routes/teacher.routes.js";
import { createLearningStyleRoutes } from "./routes/learningStyle.routes.js";
import { createPracticeRoutes } from "./routes/practice.routes.js";

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
// for medal system
const medalRepo = new MedalRepository(prismaClient);
// for teacher portal
const teacherRepo = new TeacherRepository(prismaClient);
// for AI learning style + practice
const learningProfileRepo = new LearningProfileRepository(prismaClient);
const practiceCacheRepo = new PracticeCacheRepository(prismaClient);

// 1.3 initialize service
const authService = new AuthService(userRepo, refreshToken);
const conceptService = new ConceptService(conceptRepo);
// medalService must be created before userProgressService (it's a dependency)
const medalService = new MedalService(medalRepo);
const userProgressService = new UserProgressService(userProgressRepo, medalService);
const moduleService = new ModuleService(moduleRepo);
const seedService = new SeedService(prismaClient);
const teacherService = new TeacherService(teacherRepo);
const learningStyleService = new LearningStyleService(learningProfileRepo);
const practiceGeneratorService = new PracticeGeneratorService(
  learningProfileRepo,
  practiceCacheRepo,
  conceptRepo
);

// 1.4 initialize controller
const authController = new AuthController(authService);
const conceptController = new ConceptController(
  conceptService,
  userProgressService
);
const moduleController = new ModuleController(moduleService);
const seedController = new SeedController(seedService);
const medalController = new MedalController(medalService);
const teacherController = new TeacherController(teacherService);
const learningStyleController = new LearningStyleController(learningStyleService);
const practiceController = new PracticeController(practiceGeneratorService);

// ===== typical REST API start part
// 1. Create app
const app = express();

// 2. Add middleware
app.use(
  cors({
    // only the "customer" in the cors origin is allowed to visit our backend store which address is config in server.ts
    origin: ["http://localhost:3002", "http://localhost:3000"],

    // the backend can get sensitive information from cookies in frontend
    credentials: true,

    // Only the listed method is allowed. implementation of "Least Privilege" rule.
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    // Only the listed header is allowed to send. necessary to have for JWT
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/media", express.static(path.join(process.cwd(), "public", "media")));

// ====== 3. Register routes =======

// Use routes
app.use("/api/modules", createModuleRoutes(moduleController));
app.use("/api/concepts", createConceptRoutes(conceptController));
app.use("/api/auth", createAuthRoutes(authController));
app.use("/api/admin", createSeedRoutes(seedController));
app.use("/api/medals", createMedalRoutes(medalController));
app.use("/api/teacher", createTeacherRoutes(teacherController));
app.use("/api/learning-style", createLearningStyleRoutes(learningStyleController));
app.use("/api/practice", createPracticeRoutes(practiceController));

// 4. Global error handler (must be after all routes)
app.use(errorHandler);

export { app, prisma };
