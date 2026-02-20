# Global Context Injection via TypeScript Module Augmentation

## What Was Achieved

Implemented **stateless user context injection** that makes authenticated user information available throughout the application without prop drilling or polluting function signatures.

## How It Was Achieved

### 1. TypeScript Module Augmentation

**Location:** [src/middleware/authMiddleware.ts](../../src/middleware/authMiddleware.ts#L9-L15)

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Extends Express.Request globally
    }
  }
}
```

Extends the Express `Request` interface to include an optional `user` property containing JWT payload data.

### 2. Middleware Injection

**Location:** [src/middleware/authMiddleware.ts](../../src/middleware/authMiddleware.ts#L57-L60)

```typescript
const payload = jwt.verify(token, accessSecret) as JwtPayload;
req.user = payload; // Inject user context once
next();
```

The `authMiddleware` verifies JWT tokens and attaches the decoded payload to every authenticated request.

### 3. Controller Usage

**Location:** [src/controller/ModuleController.ts](../../src/controller/ModuleController.ts#L36)

```typescript
const userId = req.user?.userId;
```

Controllers access user context directly without function parameter passing.

## The Problem: Prop Drilling

**Without Context Injection:**

```typescript
// ❌ BAD: userId passed through every layer
Controller  → getModulesOverview(userId)
  ↓
Service     → formatModules(modules, concepts, userId)
  ↓
Helper      → enrichModule(module, concepts, userId)
  ↓
Calculate   → calculateProgress(moduleId, userId)
```

**Issues:**

- Every function signature includes `userId` parameter
- Intermediate functions that don't use `userId` still carry it
- Adding/removing user context requires changes across entire call chain
- High coupling between authentication and business logic

## The Solution: Context Injection

**With Global Context:**

```typescript
// ✅ GOOD: Context available where needed
Middleware  → req.user = payload (inject once)
  ↓
Controller  → const userId = req.user?.userId (extract once)
  ↓
Service     → formatModules(modules, concepts) // Clean signatures
  ↓
Helper      → enrichModule(module, concepts)   // No auth params
```

## Benefits

| Aspect                  | Before                       | After                     |
| ----------------------- | ---------------------------- | ------------------------- |
| **Function Signatures** | Cluttered with auth params   | Clean business logic only |
| **Refactoring**         | Update 10+ signatures        | Update only where used    |
| **Testability**         | Mock userId everywhere       | Mock req.user once        |
| **Coupling**            | High (auth + business logic) | Low (separated concerns)  |
| **Maintainability**     | Difficult                    | Easy                      |

## Example Comparison

### Without Context (Prop Drilling)

```typescript
class ModuleService {
  async getModulesOverview(userId: number) {
    const modules = await this.moduleRepository.findAll(userId);
    return this.formatModules(modules, userId);
  }

  private formatModules(modules: any[], userId: number) {
    return modules.map((m) => this.enrichModule(m, userId));
  }

  private enrichModule(module: any, userId: number) {
    return {
      ...module,
      progress: this.calculateProgress(module.id, userId),
    };
  }
}
```

### With Context Injection

```typescript
class ModuleService {
  async getModulesOverview(userId: number) {
    const modules = await this.moduleRepository.findAll(userId);
    return this.formatModules(modules); // ✅ Clean signature
  }

  private formatModules(modules: any[]) {
    // ✅ No userId needed
    return modules.map((m) => this.enrichModule(m));
  }

  private enrichModule(module: any) {
    // ✅ Pure business logic
    return {
      ...module,
      conceptCount: this.countConcepts(module),
    };
  }
}
```

## Key Takeaways

1. **Separation of Concerns:** Authentication logic stays in middleware layer
2. **Clean Architecture:** Business logic functions remain focused and testable
3. **Type Safety:** TypeScript knows `req.user` exists at compile time
4. **Zero Runtime Overhead:** No performance penalty for cleaner code
5. **Standard Pattern:** Follows Express.js community best practices

## References

- [Extending Express Request in TypeScript](https://stackoverflow.com/questions/37377731/extend-express-request-object-using-typescript)
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
