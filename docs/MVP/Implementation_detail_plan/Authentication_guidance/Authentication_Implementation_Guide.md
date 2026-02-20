# BookAction Authentication - Step-by-Step Implementation Guide
**Purpose:** Add JWT authentication to your backend  
**Time Estimate:** 3-4 days for a beginner  
**Approach:** Build incrementally, test everything!  

---

## 🎯 What You'll Build
A complete authentication system with:
- User registration (signup)
- User login with JWT tokens
- Protected routes (require authentication)
- Password hashing for security
- Refresh tokens for better UX

---

## 📋 Pre-Implementation Checklist

### ✅ Verify Your Current Setup
```bash
# Make sure everything is working NOW before adding auth
npm run dev

# Test an existing endpoint
curl http://localhost:3000/api/modules/3/theme
# Should return theme data

# Check your database is running
npm run prisma:studio
# Should open Prisma Studio in browser
```

### ✅ Create a New Branch
```bash
git checkout -b feature/authentication
git status  # Should show you're on feature/authentication
```

### ✅ Install Required Packages
```bash
# Authentication packages
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken

# Validation package (for email, password validation)
npm install zod

# Cookie parser (for refresh tokens)
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

---

## 📅 Day 1: Database Setup & User Model

### Step 1: Update Your Prisma Schema

Open `prisma/schema.prisma` and add the User model:

```prisma
// Add this BEFORE the User_concept_progress model
model User {
  id                    Int                    @id @default(autoincrement())
  email                 String                 @unique
  username              String                 @unique
  password_hash         String
  first_name            String?
  last_name             String?
  role                  String                 @default("student") // student, teacher, admin
  is_active             Boolean                @default(true)
  last_login            DateTime?
  created_at            DateTime               @default(now())
  updated_at            DateTime               @updatedAt
  
  // Relations
  concept_progress      User_concept_progress[]
  responses             User_response[]
  refresh_tokens        RefreshToken[]
  
  @@index([email])
  @@index([username])
}

// Add this new model for refresh tokens
model RefreshToken {
  id            Int      @id @default(autoincrement())
  token         String   @unique
  user          User     @relation(fields: [user_id], references: [id])
  user_id       Int
  expires_at    DateTime
  created_at    DateTime @default(now())
  
  @@index([token])
  @@index([user_id])
}
```

### Step 2: Update Existing Relations

Now update your existing models to properly relate to User:

```prisma
// Update User_concept_progress model
model User_concept_progress {
  id          Int       @id @default(autoincrement())
  concept     Concept   @relation(fields:[concept_id], references: [id])
  concept_id  Int
  
  user        User      @relation(fields: [user_id], references: [id])  // ADD THIS
  user_id     Int 
  
  order_index Int
  completed   Boolean
  time_spent  Int
  completed_at DateTime?
  created_at  DateTime  @default(now())
  
  @@unique([concept_id, user_id])
}

// Update User_response model
model User_response {
  id            Int         @id @default(autoincrement())
  quiz          Quiz?       @relation(fields:[quiz_id], references: [id])
  quiz_id       Int?
  reflection    Reflection? @relation(fields:[reflection_id], references: [id])
  reflection_id Int?
  
  user          User        @relation(fields: [user_id], references: [id])  // ADD THIS
  user_id       Int
  
  created_at    DateTime    @default(now())
  response_type String
  text_answer   String?     @db.Text
  answer        Json?       @db.JsonB
  is_correct    Boolean?
  time_spent    Int?
  
  @@index([quiz_id, user_id])
  @@index([reflection_id, user_id])
}

// Update Reflection model (remove user_id since it's not directly related to user)
model Reflection {
  id                        Int      @id @default(autoincrement())
  module                    Module   @relation(fields:[module_id], references: [id])
  module_id                 Int      
  order_index               Int
  // user_id                Int      // REMOVE THIS LINE
  module_summary            String   @db.Text
  module_summary_media_url  String   @db.Text
  learning_advice           String   @db.Text
  created_at                DateTime @default(now())
  user_responses            User_response[]
}
```

### Step 3: Run Migration

```bash
# Create and apply the migration
npm run prisma:migrate
# When prompted, enter a name like: add_user_model

# Generate Prisma Client
npm run prisma:generate

# Verify in Prisma Studio
npm run prisma:studio
# You should see the new User and RefreshToken tables
```

### Step 4: Test Your Changes Didn't Break Anything

```bash
# Run your app
npm run dev

# Test existing endpoints still work
curl http://localhost:3000/api/modules/3/theme
# Should still return data
```

---

## 📅 Day 2: Create Authentication Core

### Step 1: Create Environment Variables

Add to your `.env` file:

```env
# JWT Secrets (generate random strings)
JWT_ACCESS_SECRET=your_super_secret_access_key_change_this_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_67890
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

### Step 2: Create User Repository

Create `src/repositories/UserRepository.ts`:

```typescript
import { PrismaClient, User, Prisma } from '@prisma/client';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id }
    });
  }

  // Create new user
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase()
      }
    });
  }

  // Update last login
  async updateLastLogin(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { last_login: new Date() }
    });
  }

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() }
    });
    return count > 0;
  }

  // Check if username exists
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username: username.toLowerCase() }
    });
    return count > 0;
  }
}
```

### Step 3: Create Refresh Token Repository

Create `src/repositories/RefreshTokenRepository.ts`:

```typescript
import { PrismaClient, RefreshToken } from '@prisma/client';

export class RefreshTokenRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create refresh token
  async create(userId: number, token: string, expiresAt: Date): Promise<RefreshToken> {
    return await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token,
        expires_at: expiresAt
      }
    });
  }

  // Find valid refresh token
  async findValidToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    // Check if token exists and is not expired
    if (refreshToken && refreshToken.expires_at > new Date()) {
      return refreshToken;
    }

    return null;
  }

  // Delete refresh token (for logout)
  async deleteToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { token }
    }).catch(() => {
      // Token might not exist, that's okay
    });
  }

  // Delete all user's refresh tokens
  async deleteUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { user_id: userId }
    });
  }

  // Clean up expired tokens (run periodically)
  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
  }
}
```

### Step 4: Create Auth Service

Create `src/services/AuthService.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { User } from '@prisma/client';

// DTOs for Auth
export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDTO {
  emailOrUsername: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: string;
}

export class AuthService {
  private userRepo: UserRepository;
  private refreshTokenRepo: RefreshTokenRepository;
  private readonly saltRounds: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor(
    userRepo: UserRepository,
    refreshTokenRepo: RefreshTokenRepository
  ) {
    this.userRepo = userRepo;
    this.refreshTokenRepo = refreshTokenRepo;
    
    // Load from environment variables
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    this.accessSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    // Validate required env variables
    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error('JWT secrets are not configured in environment variables');
    }
  }

  // Register new user
  async register(data: RegisterDTO): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if email already exists
    if (await this.userRepo.emailExists(data.email)) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    if (await this.userRepo.usernameExists(data.username)) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, this.saltRounds);

    // Create user
    const user = await this.userRepo.create({
      email: data.email,
      username: data.username,
      password_hash: passwordHash,
      first_name: data.firstName || null,
      last_name: data.lastName || null
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  // Login user
  async login(data: LoginDTO): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email or username
    let user: User | null = null;
    
    if (data.emailOrUsername.includes('@')) {
      user = await this.userRepo.findByEmail(data.emailOrUsername);
    } else {
      user = await this.userRepo.findByUsername(data.emailOrUsername);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.userRepo.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<string> {
    // Find valid refresh token
    const tokenRecord = await this.refreshTokenRepo.findValidToken(refreshToken);
    
    if (!tokenRecord) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const user = await this.userRepo.findById(tokenRecord.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExpiry });
  }

  // Logout (invalidate refresh token)
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepo.deleteToken(refreshToken);
  }

  // Verify access token
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.accessSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Private helper: Generate both tokens
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    // Generate access token (short-lived)
    const accessToken = jwt.sign(payload, this.accessSecret, { 
      expiresIn: this.accessExpiry 
    });

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      this.refreshSecret, 
      { expiresIn: this.refreshExpiry }
    );

    // Calculate expiry date for refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Save refresh token to database
    await this.refreshTokenRepo.create(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }
}
```

### Step 5: Test Auth Service Directly

Create a test file `test-auth.ts` in your project root:

```typescript
import { PrismaClient } from '@prisma/client';
import { UserRepository } from './src/repositories/UserRepository';
import { RefreshTokenRepository } from './src/repositories/RefreshTokenRepository';
import { AuthService } from './src/services/AuthService';
import dotenv from 'dotenv';

dotenv.config();

async function testAuth() {
  const prisma = new PrismaClient();
  const userRepo = new UserRepository(prisma);
  const refreshTokenRepo = new RefreshTokenRepository(prisma);
  const authService = new AuthService(userRepo, refreshTokenRepo);

  try {
    // Test registration
    console.log('Testing registration...');
    const { user, tokens } = await authService.register({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ User registered:', user.email);
    console.log('✅ Access token:', tokens.accessToken.substring(0, 20) + '...');

    // Test login
    console.log('\nTesting login...');
    const loginResult = await authService.login({
      emailOrUsername: 'test@example.com',
      password: 'Test123!@#'
    });
    console.log('✅ Login successful');

    // Test token verification
    console.log('\nTesting token verification...');
    const payload = await authService.verifyAccessToken(loginResult.tokens.accessToken);
    console.log('✅ Token valid for user:', payload.username);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log('\n✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuth();
```

Run it:
```bash
ts-node test-auth.ts
```

You should see successful registration, login, and token verification!

---

## 📅 Day 3: Create Auth Endpoints

### Step 1: Create Validation Schemas

Create `src/validation/authValidation.ts`:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional()
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
```

### Step 2: Create Auth Controller

Create `src/controller/AuthController.ts`:

```typescript
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { 
  registerSchema, 
  loginSchema, 
  refreshSchema,
  RegisterInput,
  LoginInput
} from '../validation/authValidation';
import { User } from '@prisma/client';

// Response DTO - don't send password hash to frontend!
interface UserResponseDTO {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // Register endpoint
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Call service
      const { user, tokens } = await this.authService.register({
        email: validatedData.email,
        username: validatedData.username,
        password: validatedData.password,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      });

      // Prepare response (exclude sensitive data)
      const userResponse = this.mapUserToDTO(user);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Send response
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: userResponse,
          accessToken: tokens.accessToken
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle validation errors
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
        return;
      }

      // Handle duplicate email/username
      if (error.message.includes('already')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      // Generic error
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  // Login endpoint
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Call service
      const { user, tokens } = await this.authService.login({
        emailOrUsername: validatedData.emailOrUsername,
        password: validatedData.password
      });

      // Prepare response
      const userResponse = this.mapUserToDTO(user);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Send response
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken: tokens.accessToken
        }
      });

    } catch (error: any) {
      console.error('Login error:', error);

      // Handle validation errors
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
        return;
      }

      // Handle invalid credentials
      if (error.message.includes('Invalid credentials')) {
        res.status(401).json({
          success: false,
          message: 'Invalid email/username or password'
        });
        return;
      }

      // Handle deactivated account
      if (error.message.includes('deactivated')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      // Generic error
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  // Refresh token endpoint
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      // Get new access token
      const accessToken = await this.authService.refreshAccessToken(refreshToken);

      // Send response
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken
        }
      });

    } catch (error: any) {
      console.error('Refresh token error:', error);

      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }

  // Logout endpoint
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // Clear cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error: any) {
      console.error('Logout error:', error);

      // Even if error, clear cookie and return success
      res.clearCookie('refreshToken');
      res.json({
        success: true,
        message: 'Logout successful'
      });
    }
  }

  // Get current user endpoint (requires auth middleware)
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // User will be attached by auth middleware
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
        return;
      }

      // Get user from database
      const userRepo = (this.authService as any).userRepo;
      const user = await userRepo.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const userResponse = this.mapUserToDTO(user);

      res.json({
        success: true,
        data: {
          user: userResponse
        }
      });

    } catch (error: any) {
      console.error('Get current user error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  }

  // Helper: Map user entity to DTO
  private mapUserToDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    };
  }
}
```

### Step 3: Create Auth Routes

Create `src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controller/AuthController';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  // Public routes
  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));
  router.post('/logout', (req, res) => authController.logout(req, res));

  // Protected route (needs auth middleware later)
  router.get('/me', (req, res) => authController.getCurrentUser(req, res));

  return router;
}
```

### Step 4: Wire Everything in app.ts

Update your `src/app.ts`:

```typescript
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

// Import repositories
import { ModuleRepository } from './repositories/ModuleRepository';
import { ConceptRepository } from './repositories/ConceptRepository';
import { UserProgressRepository } from './repositories/UserProgressRepository';
import { UserRepository } from './repositories/UserRepository';
import { RefreshTokenRepository } from './repositories/RefreshTokenRepository';

// Import services
import { ModuleService } from './services/ModuleService';
import { ConceptService } from './services/ConceptService';
import { UserProgressService } from './services/UserProgressService';
import { AuthService } from './services/AuthService';

// Import controllers
import { ModuleController } from './controller/ModuleController';
import { ConceptController } from './controller/ConceptController';
import { AuthController } from './controller/AuthController';

// Import routes
import { createModuleRoutes } from './routes/module.routes';
import { createConceptRoutes } from './routes/concept.routes';
import { createAuthRoutes } from './routes/auth.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser()); // Add cookie parser for refresh tokens

// Initialize database
const prisma = new PrismaClient();

// Initialize repositories
const moduleRepo = new ModuleRepository(prisma);
const conceptRepo = new ConceptRepository(prisma);
const userProgressRepo = new UserProgressRepository(prisma);
const userRepo = new UserRepository(prisma);
const refreshTokenRepo = new RefreshTokenRepository(prisma);

// Initialize services
const moduleService = new ModuleService(moduleRepo);
const conceptService = new ConceptService(conceptRepo);
const userProgressService = new UserProgressService(userProgressRepo);
const authService = new AuthService(userRepo, refreshTokenRepo);

// Initialize controllers
const moduleController = new ModuleController(moduleService);
const conceptController = new ConceptController(conceptService);
const authController = new AuthController(authService);

// Routes
app.use('/api/modules', createModuleRoutes(moduleController));
app.use('/api/concepts', createConceptRoutes(conceptController));
app.use('/api/auth', createAuthRoutes(authController)); // NEW AUTH ROUTES

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
```

### Step 5: Test Your Auth Endpoints

Create or update your `api.rest` file:

```http
### Register a new user
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "username": "johndoe",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}

### Login with email
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john@example.com",
  "password": "Password123"
}

### Login with username
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "johndoe",
  "password": "Password123"
}

### Get current user (will fail without auth for now)
GET http://localhost:3000/api/auth/me

### Logout
POST http://localhost:3000/api/auth/logout
```

Test each endpoint:
```bash
npm run dev
# Then run each request in api.rest
```

---

## 📅 Day 4: Add Authentication Middleware

### Step 1: Create Auth Middleware

Create `src/middleware/authMiddleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../services/AuthService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export class AuthMiddleware {
  private readonly accessSecret: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET!;
    
    if (!this.accessSecret) {
      throw new Error('JWT access secret not configured');
    }
  }

  // Verify JWT token
  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'No token provided'
        });
        return;
      }

      // Check Bearer format
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          success: false,
          message: 'Invalid token format. Use: Bearer <token>'
        });
        return;
      }

      const token = parts[1];

      // Verify token
      const payload = jwt.verify(token, this.accessSecret) as JWTPayload;
      
      // Attach user to request
      req.user = payload;
      
      next();

    } catch (error: any) {
      console.error('Auth middleware error:', error.message);

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token expired'
        });
        return;
      }

      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  };

  // Optional authentication (doesn't fail if no token)
  optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No token, but that's okay
        next();
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        // Invalid format, but continue without user
        next();
        return;
      }

      const token = parts[1];
      const payload = jwt.verify(token, this.accessSecret) as JWTPayload;
      req.user = payload;

    } catch (error) {
      // Token invalid, but continue without user
      console.log('Optional auth: Invalid token, continuing without user');
    }

    next();
  };

  // Check specific roles
  requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();
```

### Step 2: Protect Your Routes

Update existing routes to require authentication. For example, update `src/routes/module.routes.ts`:

```typescript
import { Router } from 'express';
import { ModuleController } from '../controller/ModuleController';
import { authMiddleware } from '../middleware/authMiddleware';

export function createModuleRoutes(moduleController: ModuleController): Router {
  const router = Router();

  // Public route - no auth required
  router.get('/public/overview', (req, res) => 
    moduleController.getModulesOverview(req, res)
  );

  // Protected routes - require authentication
  router.get('/:moduleId/theme', 
    authMiddleware.authenticate,
    (req, res) => moduleController.getModuleTheme(req, res)
  );

  // Admin only route
  router.post('/', 
    authMiddleware.authenticate,
    authMiddleware.requireRole('admin', 'teacher'),
    (req, res) => moduleController.createModule(req, res)
  );

  return router;
}
```

### Step 3: Update Auth Routes to Use Middleware

Update `src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controller/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  // Public routes
  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));

  // Protected routes
  router.get('/me', 
    authMiddleware.authenticate,
    (req, res) => authController.getCurrentUser(req, res)
  );
  
  router.post('/logout',
    authMiddleware.authenticate,
    (req, res) => authController.logout(req, res)
  );

  return router;
}
```

### Step 4: Update Services to Use Authenticated User

Update your services to accept userId from authenticated request. For example, in `UserProgressService.ts`:

```typescript
export class UserProgressService {
  // ... existing code ...

  // Update method to use authenticated userId
  async submitQuizResponse(
    userId: number, // Now comes from req.user.userId
    quizId: number,
    answer: any
  ) {
    // Use the authenticated userId instead of hardcoded value
    // ... rest of implementation
  }

  async getUserProgress(userId: number) {
    // Get progress for authenticated user
    return await this.userProgressRepo.findByUserId(userId);
  }
}
```

### Step 5: Test Protected Routes

Update your `api.rest`:

```http
### 1. First login to get token
# @name login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john@example.com",
  "password": "Password123"
}

### 2. Use the access token from login response
# @name getMe
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{login.response.body.data.accessToken}}

### 3. Test protected module endpoint
GET http://localhost:3000/api/modules/3/theme
Authorization: Bearer {{login.response.body.data.accessToken}}

### 4. Test without token (should fail)
GET http://localhost:3000/api/modules/3/theme
```

---

## 🐛 Common Problems & Solutions

### Problem: "Cannot find module" errors
```bash
# Make sure all imports use correct paths
# Wrong:
import { AuthService } from 'services/AuthService';
# Right:
import { AuthService } from '../services/AuthService';
```

### Problem: "JWT secret not configured"
```bash
# Check your .env file
cat .env | grep JWT
# Should show JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

# Make sure you're loading dotenv
import dotenv from 'dotenv';
dotenv.config();
```

### Problem: "Token expired" immediately
```typescript
// Check your JWT_ACCESS_EXPIRY in .env
// Should be something like '15m' or '1h'
// Not '15s' (too short!)
```

### Problem: Password validation fails
```typescript
// Make sure password meets requirements:
// - At least 8 characters
// - At least one uppercase letter
// - At least one lowercase letter  
// - At least one number
// Example: "Password123"
```

### Problem: Refresh token not working
```typescript
// Make sure cookie-parser is installed and configured:
app.use(cookieParser());

// Check cookies are being sent:
// In browser DevTools > Application > Cookies
```

### Problem: "User not found" after registration
```bash
# Check if user was created in database
npm run prisma:studio
# Look in User table

# If not there, check for migration issues:
npm run prisma:migrate:reset
npm run prisma:seed
```

---

## ✅ Final Checklist

### Day 1 Complete When:
- [ ] User model added to schema.prisma
- [ ] Migration successful
- [ ] Existing endpoints still work

### Day 2 Complete When:
- [ ] UserRepository created
- [ ] RefreshTokenRepository created
- [ ] AuthService created and tested
- [ ] Test file shows successful registration/login

### Day 3 Complete When:
- [ ] Auth validation schemas created
- [ ] AuthController created
- [ ] Auth routes wired up
- [ ] Can register via API
- [ ] Can login via API
- [ ] Tokens returned correctly

### Day 4 Complete When:
- [ ] Auth middleware created
- [ ] Routes protected
- [ ] Can access protected routes with token
- [ ] Cannot access without token
- [ ] Role-based access working

---

## 📚 Next Steps

Once authentication is working:

1. **Add password reset flow**
   - Forgot password endpoint
   - Reset token generation
   - Email service integration

2. **Add user profile endpoints**
   - Update profile
   - Change password
   - Delete account

3. **Add rate limiting**
   - Prevent brute force attacks
   - Limit registration attempts

4. **Add OAuth (optional)**
   - Google login
   - GitHub login

5. **Move to Phase 3: AI Integration**
   - Now that users are authenticated
   - Can save personalized AI feedback

---

## 🎉 Congratulations!

You've built a complete authentication system! Your app now has:
- Secure user registration
- JWT-based authentication
- Protected routes
- Refresh token rotation
- Role-based access control

Remember to:
- Never commit your .env file
- Use strong secrets in production
- Enable HTTPS in production
- Test thoroughly before deploying

Good luck! 💪
