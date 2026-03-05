# Phase 0 Setup Notes — Reference for Future Phases

## Two items deferred to Phase 1/2 Code Chat

### 1. CLAUDE.md — Error Handling Section Needs Implementation

CLAUDE.md describes this error handling pattern:

```
- Services throw typed errors (extend AppError base class)
- Controllers do NOT have try/catch — errors propagate to global error handler
- Global error handler in src/middleware/errorHandler.ts returns { error: { code, message } }
```

**Current reality:** Neither `AppError` nor `errorHandler.ts` exist yet. The only error class is `AuthError` in `src/utils/errors.ts` (extends `Error` directly). Controllers currently use inline try/catch.

**Action for Phase 1 Code Chat:** Create these two files as part of implementation:

```
src/utils/errors.ts → Add AppError base class, keep AuthError extending it
src/middleware/errorHandler.ts → Global Express error handler middleware, register in app.ts
```

Example implementation:

```ts
// src/utils/errors.ts — add to existing file
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Update AuthError to extend AppError
export class AuthError extends AppError {
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
    this.name = "AuthError";
  }
}
```

```ts
// src/middleware/errorHandler.ts — new file
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ error: { code: err.statusCode, message: err.message } });
    return;
  }
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ error: { code: 500, message: "Internal server error" } });
}
```

Then in `app.ts`, register after all routes:

```ts
app.use(errorHandler);
```

---

### 2. Refactor `roleRequire` → `requireRole` Factory Pattern

**Current code** in `src/middleware/authMiddleware.ts` (line 79):

```ts
export function roleRequire(
  legalRoles: string[],
  req: Request,
  res: Response,
  next: NextFunction
): void { ... }
```

This is a 4-parameter function, never imported or called anywhere in the codebase.

**CLAUDE.md and TASKS.md expect** a middleware factory pattern:

```ts
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
```

**Action for Phase 2 Code Chat:** Replace `roleRequire` with `requireRole` in `src/middleware/authMiddleware.ts`. Since `roleRequire` has zero callers, this is a safe rename+refactor with no breaking changes.

**Usage in routes (Phase 2):**

```ts
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

router.get(
  "/students",
  authMiddleware,
  requireRole("TEACHER", "ADMIN"),
  controller.getStudents,
);
```
