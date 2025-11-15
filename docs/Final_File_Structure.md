# BookAction Backend - Final File Structure Reference
**Purpose:** Complete file structure after all refactoring is done  
**Use this as:** Your target structure to build towards  

---

## 📁 Complete Project Structure

```
BookAction_BackEnd/
├── .env                           # Environment variables
├── .env.example                   # Example environment variables
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── README.md                      # Project documentation
├── api.rest                       # HTTP request testing file
│
├── docs/                          # Documentation
│   ├── Architecture_Design_v2.0.md
│   ├── Implementation_Guide_For_Me.md
│   └── Final_File_Structure.md   # This file
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Database seeding script
│   └── migrations/                # Database migrations (auto-generated)
│       └── [timestamp]_init/
│           └── migration.sql
│
└── src/
    ├── app.ts                     # Express app setup and middleware
    ├── server.ts                  # Server startup (calls app.ts)
    ├── app.backup.ts              # Backup of original app.ts (temporary)
    │
    ├── config/                    # Configuration files
    │   ├── database.ts            # Database configuration
    │   ├── env.ts                 # Environment variable validation
    │   └── constants.ts           # App constants
    │
    ├── types/                     # TypeScript type definitions
    │   ├── express.d.ts           # Extend Express Request type
    │   └── index.ts               # Shared type definitions
    │
    ├── container/                 # Dependency Injection
    │   ├── Container.ts           # Main DI container
    │   └── index.ts              # Container initialization
    │
    ├── repositories/              # Data Access Layer
    │   ├── base/
    │   │   └── BaseRepository.ts # Abstract base repository
    │   ├── prismaClient.ts       # Singleton Prisma instance
    │   ├── ModuleRepository.ts   # Module data access
    │   ├── ConceptRepository.ts  # Concept data access
    │   ├── QuizRepository.ts     # Quiz data access
    │   ├── UserRepository.ts     # User data access (Phase 2)
    │   ├── UserProgressRepository.ts  # Progress tracking
    │   └── UserResponseRepository.ts  # User responses
    │
    ├── services/                  # Business Logic Layer
    │   ├── base/
    │   │   └── BaseService.ts    # Abstract base service
    │   ├── domain/                # Domain services
    │   │   ├── ModuleService.ts  # Module business logic
    │   │   ├── ConceptService.ts # Concept business logic
    │   │   ├── UserProgressService.ts  # Progress tracking logic
    │   │   ├── LearningService.ts      # Learning orchestration
    │   │   └── AuthService.ts    # Authentication (Phase 2)
    │   ├── external/              # External service integrations
    │   │   └── AIService.ts      # AI integration (Phase 3)
    │   └── utils/
    │       └── TransactionManager.ts   # Transaction utilities
    │
    ├── controllers/               # HTTP Request Handlers
    │   ├── base/
    │   │   └── BaseController.ts # Abstract base controller
    │   ├── ModuleController.ts   # /api/modules/* endpoints
    │   ├── ConceptController.ts  # /api/concepts/* endpoints
    │   ├── LearningController.ts # /api/users/*/learning endpoints
    │   ├── ResponseController.ts # /api/*/submit endpoints
    │   └── AuthController.ts     # /api/auth/* endpoints (Phase 2)
    │
    ├── dtos/                      # Data Transfer Objects
    │   ├── request/               # Input validation schemas
    │   │   ├── SubmitQuizDTO.ts
    │   │   ├── SubmitReflectionDTO.ts
    │   │   ├── LoginDTO.ts       # (Phase 2)
    │   │   └── RegisterDTO.ts    # (Phase 2)
    │   └── response/              # Output contracts
    │       ├── ModuleDTO.ts
    │       ├── ThemeDTO.ts
    │       ├── ConceptDTO.ts
    │       ├── QuizDTO.ts
    │       ├── QuizResultDTO.ts
    │       ├── LearningHomepageDTO.ts
    │       ├── ProgressDTO.ts
    │       └── AuthResponseDTO.ts # (Phase 2)
    │
    ├── mappers/                   # Entity to DTO conversion
    │   ├── base/
    │   │   └── BaseMapper.ts     # Abstract base mapper
    │   ├── ModuleMapper.ts       # Module entity → DTO
    │   ├── ThemeMapper.ts        # Theme entity → DTO
    │   ├── ConceptMapper.ts      # Concept entity → DTO
    │   ├── QuizMapper.ts         # Quiz entity → DTO
    │   └── ProgressMapper.ts     # Progress calculations → DTO
    │
    ├── middleware/                # Express Middleware
    │   ├── auth.middleware.ts    # JWT verification (Phase 2)
    │   ├── error.middleware.ts   # Global error handler
    │   ├── validation.middleware.ts  # Request validation
    │   ├── rateLimiter.middleware.ts # Rate limiting (Phase 4)
    │   ├── requestLogger.middleware.ts # Request logging
    │   └── tempAuth.middleware.ts    # Temporary auth (Phase 1)
    │
    ├── routes/                    # Route Definitions
    │   ├── index.ts              # Main router aggregator
    │   ├── module.routes.ts      # Module endpoints
    │   ├── concept.routes.ts     # Concept endpoints
    │   ├── learning.routes.ts    # Learning endpoints
    │   ├── response.routes.ts    # Response submission endpoints
    │   └── auth.routes.ts        # Auth endpoints (Phase 2)
    │
    ├── errors/                    # Error Classes
    │   ├── AppError.ts           # Base error class
    │   ├── NotFoundError.ts      # 404 errors
    │   ├── ValidationError.ts    # 400 validation errors
    │   ├── UnauthorizedError.ts  # 401 errors
    │   └── index.ts              # Error exports
    │
    ├── utils/                     # Utility Functions
    │   ├── logger.ts             # Winston/Pino logger setup
    │   ├── pagination.ts         # Pagination helpers
    │   ├── validators.ts         # Zod schemas
    │   └── helpers.ts            # General helpers
    │
    └── old_services/              # Temporary - old code reference
        └── LearnHomepage.ts       # Original service (delete after refactor)

tests/                             # Test files (Phase 4)
├── unit/
│   ├── services/
│   │   ├── ModuleService.test.ts
│   │   └── UserProgressService.test.ts
│   └── repositories/
│       └── ModuleRepository.test.ts
├── integration/
│   ├── module.test.ts
│   └── learning.test.ts
└── fixtures/
    └── testData.ts
```

---

## 📝 File Contents Reference

### Core Application Files

#### `src/app.ts`
```typescript
// Express application setup
// Middleware registration
// Route mounting
// Error handling setup
// NO business logic here!
```

#### `src/server.ts`
```typescript
// Server startup
// Port configuration
// Graceful shutdown handling
// Starts app from app.ts
```

#### `src/container/Container.ts`
```typescript
// Dependency injection container
// Wires all classes together
// Creates singletons for services
// Provides getters for all components
```

---

### Repository Layer Files

#### `src/repositories/ModuleRepository.ts`
```typescript
export class ModuleRepository extends BaseRepository<Module> {
  // Database queries for modules
  findById(id: number): Promise<Module | null>
  findWithTheme(id: number): Promise<ModuleWithTheme>
  findWithConcepts(id: number): Promise<ModuleWithConcepts>
  findWithReflections(id: number): Promise<ModuleWithReflections>
  findAll(): Promise<Module[]>
}
```

#### `src/repositories/UserProgressRepository.ts`
```typescript
export class UserProgressRepository extends BaseRepository<UserProgress> {
  // Progress tracking queries
  findByUserAndModule(userId: number, moduleId: number): Promise<UserProgress[]>
  findByUserAndConcept(userId: number, conceptId: number): Promise<UserProgress | null>
  upsertProgress(data: ProgressData): Promise<UserProgress>
  calculateCompletionRate(userId: number, moduleId: number): Promise<number>
}
```

---

### Service Layer Files

#### `src/services/domain/ModuleService.ts`
```typescript
export class ModuleService extends BaseService {
  // Module business logic
  getModule(moduleId: number): Promise<ModuleDTO>
  getModuleTheme(moduleId: number): Promise<ThemeDTO>
  getModuleReflection(moduleId: number): Promise<ReflectionDTO>
  getModuleComplete(moduleId: number): Promise<ModuleCompleteDTO>
  isModuleAccessible(moduleId: number, userId: number): Promise<boolean>
}
```

#### `src/services/domain/UserProgressService.ts`
```typescript
export class UserProgressService extends BaseService {
  // User progress and submission logic
  submitQuizResponse(data: SubmitQuizDTO): Promise<QuizResultDTO>
  submitReflection(data: SubmitReflectionDTO): Promise<ReflectionResultDTO>
  getModuleProgress(userId: number, moduleId: number): Promise<ProgressDTO>
  updateConceptProgress(userId: number, conceptId: number): Promise<void>
  // Uses transactions for data consistency
}
```

#### `src/services/domain/LearningService.ts`
```typescript
export class LearningService extends BaseService {
  // Orchestrates multiple services
  getLearningHomepage(userId: number): Promise<LearningHomepageDTO>
  getNextLearningStep(userId: number): Promise<NextStepDTO>
  generateLearningPath(userId: number): Promise<LearningPathDTO>
  calculateOverallProgress(userId: number): Promise<number>
}
```

---

### Controller Layer Files

#### `src/controllers/ModuleController.ts`
```typescript
export class ModuleController extends BaseController {
  // Handles HTTP requests for modules
  getModule(req: Request, res: Response, next: NextFunction): Promise<void>
  getTheme(req: Request, res: Response, next: NextFunction): Promise<void>
  getReflection(req: Request, res: Response, next: NextFunction): Promise<void>
  // No business logic, just HTTP handling
}
```

#### `src/controllers/ResponseController.ts`
```typescript
export class ResponseController extends BaseController {
  // Handles submissions
  submitQuiz(req: Request, res: Response, next: NextFunction): Promise<void>
  submitReflection(req: Request, res: Response, next: NextFunction): Promise<void>
  // Validates input, calls service, formats response
}
```

---

### DTO Files

#### `src/dtos/response/ModuleDTO.ts`
```typescript
export interface ModuleDTO {
  id: number;
  title: string;
  description: string;
  // No internal fields exposed
}

export interface ModuleCompleteDTO extends ModuleDTO {
  theme: ThemeDTO;
  concepts: ConceptDTO[];
  progress: number;  // Computed field
}
```

#### `src/dtos/request/SubmitQuizDTO.ts`
```typescript
export interface SubmitQuizDTO {
  userId: number;    // From auth middleware
  quizId: number;
  answer: string | string[];
  timeSpent?: number;
}

// Zod schema for validation
export const submitQuizSchema = z.object({
  quizId: z.number().positive(),
  answer: z.union([z.string(), z.array(z.string())]),
  timeSpent: z.number().optional()
});
```

---

### Route Files

#### `src/routes/module.routes.ts`
```typescript
import { Router } from 'express';
import { container } from '../container';

const router = Router();
const controller = container.getModuleController();

// Module endpoints
router.get('/:moduleId', controller.getModule);
router.get('/:moduleId/theme', controller.getTheme);
router.get('/:moduleId/concepts', controller.getConcepts);
router.get('/:moduleId/reflection', controller.getReflection);

export default router;
```

#### `src/routes/index.ts`
```typescript
import { Router } from 'express';
import moduleRoutes from './module.routes';
import conceptRoutes from './concept.routes';
import learningRoutes from './learning.routes';
import responseRoutes from './response.routes';

const router = Router();

// Mount all routes
router.use('/modules', moduleRoutes);
router.use('/concepts', conceptRoutes);
router.use('/users', learningRoutes);
router.use('/', responseRoutes);  // For /quiz/*/submit etc

export default router;
```

---

## 📋 Implementation Phases

### Phase 1 Files (Week 1)
- All repositories
- All services (except AIService)
- All controllers
- All DTOs
- Basic middleware (error, validation)
- Container setup

### Phase 2 Files (Week 2)
- AuthService
- AuthController
- auth.middleware.ts
- User model in Prisma
- Auth DTOs

### Phase 3 Files (Week 3)
- AIService
- AI integration in UserProgressService
- Caching logic

### Phase 4 Files (Week 4)
- All test files
- Rate limiter middleware
- Performance monitoring
- Production configs

---

## 🎯 Endpoint to File Mapping

| Endpoint | Controller | Service | Repository |
|----------|------------|---------|------------|
| GET /api/modules/:id/theme | ModuleController | ModuleService | ModuleRepository |
| GET /api/concepts/:id | ConceptController | ConceptService | ConceptRepository |
| GET /api/concepts/:id/quiz | ConceptController | ConceptService | ConceptRepository, QuizRepository |
| GET /api/users/:id/learning_homepage | LearningController | LearningService | UserProgressRepository, ModuleRepository |
| POST /api/quiz/:id/submit | ResponseController | UserProgressService | UserResponseRepository, UserProgressRepository |

---

## 🔄 Data Flow Through Layers

```
1. HTTP Request arrives
   ↓
2. Express Route matches URL
   ↓
3. Middleware validates/authenticates
   ↓
4. Controller receives request
   ↓
5. Controller calls Service method
   ↓
6. Service executes business logic
   ↓
7. Service calls Repository for data
   ↓
8. Repository queries database (Prisma)
   ↓
9. Entity returned to Service
   ↓
10. Service transforms to DTO (via Mapper)
    ↓
11. DTO returned to Controller
    ↓
12. Controller sends HTTP Response
```

---

## 📌 Important Notes

1. **Don't create all files at once!** Follow the implementation guide
2. **Files marked (Phase 2/3/4)** come later - ignore for now
3. **Start with one endpoint** and build its complete stack
4. **Test each layer** before moving to the next
5. **Keep app.backup.ts** until everything works

This is your end goal. Build towards it incrementally!
