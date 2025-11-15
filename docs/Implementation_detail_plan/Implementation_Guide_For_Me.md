# BookAction Backend - My Implementation Guide


## 📅 Week 1: Build Your First Clean Endpoint

### Day 1-2: Your First Endpoint - Module Theme

**Goal:** Transform one endpoint from messy to clean  
**Endpoint:** `GET /api/modules/:moduleId/theme`

#### Step 1: Create Folder Structure
```bash
# Run these commands:
mkdir -p src/repositories
mkdir -p src/services
mkdir -p src/controllers
mkdir -p src/dtos
mkdir -p src/routes
```

#### Step 2: Build From Bottom Up

##### 2.1 Create Your First Repository
Create `src/repositories/ModuleRepository.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export class ModuleRepository {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  // Get module with its theme
  async findModuleWithTheme(moduleId: number) {
    return this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { theme: true }
    });
  }
}
```

**Test it immediately in app.ts:**
```typescript
// Temporary test at bottom of app.ts
const testRepo = new ModuleRepository(prisma);
testRepo.findModuleWithTheme(3).then(console.log);
// Should see module 3 data in console
```

##### 2.2 Create Your DTO (What Frontend Expects)
Create `src/dtos/ThemeDTO.ts`:
```typescript
export interface ThemeDTO {
  title: string;
  context: string;
  mediaUrl: string;     // Note: different from database media_url
  mediaType: string;    // Note: different from database media_type
  question: string;
}
```

##### 2.3 Create Your Service (Business Logic)
Create `src/services/ModuleService.ts`:
```typescript
import { ModuleRepository } from '../repositories/ModuleRepository';
import { ThemeDTO } from '../dtos/ThemeDTO';

export class ModuleService {
  private moduleRepo: ModuleRepository;
  
  constructor(moduleRepo: ModuleRepository) {
    this.moduleRepo = moduleRepo;
  }
  
  async getModuleTheme(moduleId: number): Promise<ThemeDTO> {
    // 1. Get data from repository
    const module = await this.moduleRepo.findModuleWithTheme(moduleId);
    
    // 2. Check if exists
    if (!module || !module.theme) {
      throw new Error('Theme not found for module ' + moduleId);
    }
    
    // 3. Transform to DTO (change field names)
    const themeDTO: ThemeDTO = {
      title: module.theme.title,
      context: module.theme.context,
      mediaUrl: module.theme.media_url,   // Transform name!
      mediaType: module.theme.media_type, // Transform name!
      question: module.theme.question
    };
    
    return themeDTO;
  }
}
```

##### 2.4 Create Your Controller (HTTP Handler)
Create `src/controllers/ModuleController.ts`:
```typescript
import { Request, Response } from 'express';
import { ModuleService } from '../services/ModuleService';

export class ModuleController {
  private moduleService: ModuleService;
  
  constructor(moduleService: ModuleService) {
    this.moduleService = moduleService;
  }
  
  async getTheme(req: Request, res: Response): Promise<void> {
    try {
      // 1. Get moduleId from URL
      const moduleId = parseInt(req.params.moduleId);
      
      // 2. Check if valid number
      if (isNaN(moduleId)) {
        res.status(400).json({ error: 'Invalid module ID' });
        return;
      }
      
      // 3. Call service
      const theme = await this.moduleService.getModuleTheme(moduleId);
      
      // 4. Send response
      res.json(theme);
      
    } catch (error: any) {
      // 5. Handle errors
      console.error('Error getting theme:', error);
      res.status(404).json({ error: error.message });
    }
  }
}
```

##### 2.5 Wire Everything in app.ts
Modify your `app.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import express from 'express';
// Import your new classes
import { ModuleRepository } from './repositories/ModuleRepository';
import { ModuleService } from './services/ModuleService';
import { ModuleController } from './controllers/ModuleController';

const app = express();
app.use(express.json());

// Create instances (manual wiring for now)
const prisma = new PrismaClient();
const moduleRepo = new ModuleRepository(prisma);
const moduleService = new ModuleService(moduleRepo);
const moduleController = new ModuleController(moduleService);

// Replace old endpoint with new one
app.get('/api/modules/:moduleId/theme', (req, res) => {
  moduleController.getTheme(req, res);
});

// Keep all your other old endpoints for now
// ... rest of your old code
```

##### 2.6 TEST IT!
```bash
# Run your server
npm run dev

# Test with curl or your api.rest file
GET http://localhost:3000/api/modules/3/theme

# Should return:
{
  "title": "Late Night Texting",
  "context": "...",
  "mediaUrl": "...",  # Note: not media_url anymore!
  "mediaType": "image",
  "question": "..."
}
```

---

### Day 3: Add Your Second Endpoint

**Goal:** Add concept endpoint, start seeing patterns  
**Endpoint:** `GET /api/concepts/:conceptId`

#### Step 1: Create ConceptRepository
Create `src/repositories/ConceptRepository.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export class ConceptRepository {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  async findConceptWithTutorial(conceptId: number) {
    return this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: { tutorial: true }
    });
  }
}
```

#### Step 2: Create ConceptService
Similar pattern to ModuleService...

#### Step 3: Notice the Pattern!
Both repositories have:
- Same constructor pattern
- Similar error handling needs
- Similar find methods

**But don't create base class yet!** Wait until Day 4.

---

### Day 4: Extract Your First Base Class

After implementing 2-3 endpoints, you'll see patterns. NOW create base classes:

Create `src/repositories/BaseRepository.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  protected prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  // Common error handler
  protected handleError(error: any, resource: string): never {
    console.error(`Repository error for ${resource}:`, error);
    throw new Error(`Failed to fetch ${resource}`);
  }
}
```

Now refactor ModuleRepository:
```typescript
import { BaseRepository } from './BaseRepository';

export class ModuleRepository extends BaseRepository {
  // No need for constructor now! Inherited from base
  
  async findModuleWithTheme(moduleId: number) {
    try {
      return await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: { theme: true }
      });
    } catch (error) {
      this.handleError(error, 'module theme');
    }
  }
}
```

---

### Day 5-6: Complete All GET Endpoints

#### Your TODO List:
```typescript
// Simple endpoints to implement:
[x] GET /api/modules/:id/theme         // DONE!
[x] GET /api/concepts/:id              // DONE!
[ ] GET /api/concepts/:id/quiz         // Do this next
[ ] GET /api/concepts/:id/summary      // Then this
[ ] GET /api/modules/:id/reflection    // Then this
```

#### For Each Endpoint:
1. Create/Update Repository method
2. Create/Update Service method  
3. Create/Update Controller method
4. Wire in app.ts
5. Test immediately
6. Only move to next after current works

---

### Day 7: The Big One - Learning Homepage

This endpoint needs multiple services working together:

```typescript
// LearningController.ts
export class LearningController {
  constructor(
    private userProgressService: UserProgressService,
    private moduleService: ModuleService
  ) {}
  
  async getLearningHomepage(req: Request, res: Response) {
    const userId = parseInt(req.params.userId);
    
    // This needs data from multiple places:
    // 1. User's progress (from UserProgressService)
    // 2. Module information (from ModuleService)
    // 3. Calculations (business logic)
    
    // Start simple - even if incomplete!
  }
}
```

---

## 📅 Week 2: Add Complex Features

### Day 1-2: Quiz Submission (Your First POST)

**New Concepts:** Transactions, multiple table updates

```typescript
// UserProgressService.ts
async submitQuizResponse(userId: number, quizId: number, answer: any) {
  // This is complex because it needs to:
  // 1. Save the response
  // 2. Check if correct
  // 3. Update progress
  // 4. All in one transaction!
  
  // Start without transaction first, get it working
  // Then add transaction:
  
  return await this.prisma.$transaction(async (tx) => {
    // All database operations here
    // If any fail, all rollback!
  });
}
```

---

## 🛠️ Common Problems & Solutions

### Problem: "Cannot find module"
```bash
# Your import is probably wrong
# Wrong:
import { ModuleService } from 'services/ModuleService';
# Right:
import { ModuleService } from '../services/ModuleService';
```

### Problem: "Property doesn't exist"
```typescript
// You forgot to include relations in Prisma
// Add 'include' to your query:
const module = await this.prisma.module.findUnique({
  where: { id: moduleId },
  include: { theme: true }  // <-- Don't forget this!
});
```

### Problem: "Undefined" errors
```typescript
// Always check if data exists before using it
if (!module || !module.theme) {
  throw new Error('Not found');
}
// Only now safe to use module.theme.title
```

---

## 📊 Progress Tracking

### Week 1 Checklist
- [ ] Day 1: First endpoint working (module theme)
- [ ] Day 2: Clean up and test thoroughly  
- [ ] Day 3: Second endpoint (concept)
- [ ] Day 4: Extract first base class
- [ ] Day 5: All quiz endpoints
- [ ] Day 6: All summary endpoints  
- [ ] Day 7: Learning homepage

### Week 2 Checklist
- [ ] Day 1: Quiz submission
- [ ] Day 2: Test transactions
- [ ] Day 3: Reflection submission
- [ ] Day 4: Error handling improvements
- [ ] Day 5: Create Container class
- [ ] Day 6: Move wiring from app.ts to Container
- [ ] Day 7: Final testing and cleanup

---

## 🎓 Learning Tips

### 1. Test After Every Change
```bash
# Don't write 100 lines then test
# Write 10 lines, test
# Write 10 more, test again
```

### 2. Console.log Is Your Friend
```typescript
console.log('Step 1: Got moduleId:', moduleId);
console.log('Step 2: Found module:', module);
console.log('Step 3: Created DTO:', themeDTO);
```

### 3. Keep Old Code While Building New
```typescript
// Don't delete old endpoint until new one works
app.get('/api/modules/:id/theme', newController.method); // New
// app.get('/api/modules/:id/theme', oldFunction);      // Old (commented)
```

### 4. Make Small Commits
```bash
git add .
git commit -m "Add ModuleRepository"
git add .
git commit -m "Add ModuleService"
# Not one giant commit!
```

---

## 🚀 When You're Stuck

### Step 1: Check the Basics
- Is the server running?
- Is the database connected?
- Did you save the file?
- Did you restart the server?

### Step 2: Read the Error
```
TypeError: Cannot read property 'theme' of null
         # ^^^ This tells you 'theme' is the problem
         # The module is probably null
```

### Step 3: Trace the Data
```typescript
// Add console.log at each step:
async getModuleTheme(moduleId: number) {
  console.log('1. Getting module ID:', moduleId);
  const module = await this.moduleRepo.findModuleWithTheme(moduleId);
  console.log('2. Found module:', module);
  // Where does it break?
}
```

### Step 4: Simplify
```typescript
// Too complex? Make it simpler first:
// Instead of:
const result = await this.complex.chain.of.methods();

// Try:
const step1 = await this.complex;
console.log('step1:', step1);
const step2 = step1.chain;
console.log('step2:', step2);
// Find where it breaks
```

---

## 📝 Quick Reference

### File Naming Convention
```
repositories/ModuleRepository.ts    # Pascal case, ends with Repository
services/ModuleService.ts          # Pascal case, ends with Service  
controllers/ModuleController.ts    # Pascal case, ends with Controller
dtos/ThemeDTO.ts                   # Pascal case, ends with DTO
```

### Method Naming Convention
```typescript
// Repository methods: findXXX, createXXX, updateXXX, deleteXXX
findModuleWithTheme()
findByUserId()

// Service methods: getXXX, createXXX, updateXXX, deleteXXX, calculateXXX
getModuleTheme()
calculateProgress()

// Controller methods: match HTTP verbs
getTheme()      // GET request
createModule()  // POST request
updateModule()  // PUT request
```

### Testing Each Layer
```bash
# Test repository alone:
node -e "
  const { PrismaClient } = require('@prisma/client');
  const { ModuleRepository } = require('./dist/repositories/ModuleRepository');
  const prisma = new PrismaClient();
  const repo = new ModuleRepository(prisma);
  repo.findModuleWithTheme(3).then(console.log);
"

# Test with curl:
curl http://localhost:3000/api/modules/3/theme

# Test with api.rest file (recommended)
```

---

## 🎉 Remember

1. **Perfect is the enemy of good** - Get it working first
2. **You're learning** - It's okay to be slow at first
3. **Each endpoint gets easier** - The pattern becomes natural
4. **Ask for help** - When stuck for more than 30 minutes
5. **Celebrate small wins** - Each working endpoint is progress!

---

## Next: After Week 2

Once all endpoints are refactored and working:
1. Add authentication (Phase 2)
2. Add AI integration (Phase 3)  
3. Add tests (Phase 4)

But that's for later. Focus on Week 1 first!

Good luck! You've got this! 💪
