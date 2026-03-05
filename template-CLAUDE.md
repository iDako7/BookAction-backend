# Claude Code TDD Template for TypeScript Projects

A copy-paste-and-customize starting point for any TypeScript project with strict TDD workflow enforcement via Claude Code hooks, commands, and skills.

---

## Table of Contents

1. [Setup Checklist](#1-setup-checklist)
2. [CLAUDE.md Template](#2-claudemd-template)
3. [Hook Scripts](#3-hook-scripts)
4. [Command Files](#4-command-files)
5. [Skill File](#5-skill-file)
6. [settings.local.json](#6-settingslocaljson)

---

## 1. Setup Checklist

Run these commands from your project root:

```bash
# 1. Create directory structure
mkdir -p .claude/hooks
mkdir -p .claude/commands
mkdir -p .claude/skills/tdd-workflow
mkdir -p __tests__/integration
mkdir -p __tests__/unit

# 2. Create hook scripts (copy from Section 3 below)
touch .claude/hooks/guard-test-files.sh
touch .claude/hooks/guard-npm-install.sh
touch .claude/hooks/guard-git-commit.sh
touch .claude/hooks/post-write-lint.sh
touch .claude/hooks/stop-check-tests.sh

# 3. Make hooks executable
chmod +x .claude/hooks/*.sh

# 4. Create command files (copy from Section 4 below)
touch .claude/commands/write-tests.md
touch .claude/commands/implement.md

# 5. Create skill file (copy from Section 5 below)
touch .claude/skills/tdd-workflow/SKILL.md

# 6. Create settings file (copy from Section 6 below)
touch .claude/settings.local.json

# 7. Create CLAUDE.md at project root (copy from Section 2 below)
touch CLAUDE.md

# 8. Verify everything is in place
find .claude -type f | sort
ls CLAUDE.md
```

---

## 2. CLAUDE.md Template

Copy the content below into your project root `CLAUDE.md`. Replace all `[PLACEHOLDERS]` with your project-specific values.

````markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

[PROJECT_DESCRIPTION]

## Stack

[STACK]

<!-- Example for a frontend project:
- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **State:** Zustand for global state
- **Target viewport:** 390px mobile
-->

<!-- Example for a backend project:
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express / Fastify / Hono
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT via jose
-->

## Commands

Available commands:

```bash
[DEV_COMMAND]        # Dev server
[TEST_COMMAND]       # Run test suite
[BUILD_COMMAND]      # Production build
npx tsc --noEmit     # TypeScript type check
```

## TDD Workflow

This project uses a strict two-phase TDD workflow enforced by Claude Code hooks (`.claude/hooks/`):

**Phase 1 — Write tests first:**
```
/project:write-tests <feature>
```
- Writes failing integration tests into `__tests__/integration/`
- Confirms all new tests are in red state before stopping
- Test files ONLY — no implementation code

**Phase 2 — Implement to pass tests:**
```
/project:implement <feature>
```
- Test files are locked by `guard-test-files.sh` — edits to `__tests__/` are rejected
- Implement minimum code to pass each test
- Never modify test files; if a test seems wrong, explain why and let the user decide

**Active hooks:**
- `PreToolUse[Edit|Write]`: `guard-test-files.sh` — blocks edits to test files during implement phase
- `PreToolUse[Bash]`: `guard-npm-install.sh` — blocks unauthorized package installs
- `PreToolUse[Bash]`: `guard-git-commit.sh` — runs tests before allowing commits
- `PostToolUse[Write]`: `post-write-lint.sh` — runs ESLint/tsc after each file write
- `Stop`: `stop-check-tests.sh` — verifies test suite on session end

## Architecture

### Layering
```
[ARCHITECTURE_LAYERS]
```

<!-- Example for frontend:
```
App.tsx → Components (UI) → Hooks (stateful logic) → Services (data/API)
```
- Components: pure UI, receive props and callbacks
- Hooks: encapsulate reusable stateful logic
- Services: return typed data from APIs or mock sources
-->

<!-- Example for backend:
```
Routes → Controllers → Services → Repositories → Database
```
- Routes: HTTP method + path mapping, no business logic
- Controllers: parse request, call service, send response
- Services: business logic, orchestration
- Repositories: database queries, typed returns
-->

### Key Type Definitions
```typescript
[KEY_TYPES]
```

### Feature Phases
[FEATURE_PHASES]

### Explicitly Out of Scope
[OUT_OF_SCOPE]
````

---

## 3. Hook Scripts

### 3.1 guard-test-files.sh

Blocks modifications to test files when `CLAUDE_TDD_MODE=implement`. **Universal — no changes needed.**

```bash
#!/bin/bash
# guard-test-files.sh
# PreToolUse hook for Edit|Write
# Blocks modifications to test files when CLAUDE_TDD_MODE=implement

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    fp = data.get('tool_input', {}).get('file_path', '')
    if not fp:
        fp = data.get('tool_input', {}).get('file', '')
    print(fp)
except:
    print('')
" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

if [ "$CLAUDE_TDD_MODE" = "implement" ]; then
    if echo "$FILE_PATH" | grep -qE "(/__tests__/|\.test\.(ts|tsx|js|jsx)$|\.spec\.(ts|tsx|js|jsx)$)"; then
        echo "BLOCKED: Test files are read-only in implementation mode. Fix your implementation code to make the test pass. Do NOT modify the test." >&2
        exit 2
    fi
fi

exit 0
```

### 3.2 guard-npm-install.sh

Blocks unauthorized package installs. **Universal — no changes needed.**

```bash
#!/bin/bash
# guard-npm-install.sh
# PreToolUse hook for Bash
# Blocks npm install / npm add / yarn add unless CLAUDE_ALLOW_INSTALL=true
# This enforces the rule: "Do not add npm packages unless explicitly listed in the task"

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$COMMAND" ]; then
    exit 0
fi

if [ "$CLAUDE_ALLOW_INSTALL" = "true" ]; then
    exit 0
fi

if echo "$COMMAND" | grep -qE "(npm install|npm i |npm add|yarn add|pnpm add|pnpm install)"; then
    # Allow install with no arguments (restoring node_modules from lockfile)
    if echo "$COMMAND" | grep -qE "^(npm install|npm i|yarn install|pnpm install)$"; then
        exit 0
    fi
    # Allow dev dependency installs for @types packages only
    if echo "$COMMAND" | grep -qE "@types/"; then
        exit 0
    fi
    echo "BLOCKED: Adding new npm packages is not allowed unless the task explicitly requires it. If this package is needed, ask the user to confirm." >&2
    exit 2
fi

exit 0
```

### 3.3 guard-git-commit.sh

Runs tests before allowing git commit. **One placeholder on line 66: replace `[TEST_RUNNER_TARGETED]` with your targeted test runner command** (e.g., `npx vitest run` or `npx jest`).

```bash
#!/bin/bash
# guard-git-commit.sh
# PreToolUse hook for Bash
# Runs npm test before allowing git commit. Blocks commit if tests fail.

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$COMMAND" ]; then
    exit 0
fi

# Only intercept git commit (not git add, git status, etc.)
if echo "$COMMAND" | grep -qE "git commit"; then
    cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

    # Implement mode: all tests must pass (existing behavior)
    if [ "$CLAUDE_TDD_MODE" = "implement" ]; then
        TEST_OUTPUT=$(npm test 2>&1)
        TEST_EXIT=$?
        if [ $TEST_EXIT -ne 0 ]; then
            echo "BLOCKED: Tests failed. Fix failing tests before committing." >&2
            echo "$TEST_OUTPUT" | tail -20 >&2
            exit 2
        fi
        exit 0
    fi

    # Write-tests phase (CLAUDE_TDD_MODE unset or "write-tests"):
    # Newly added test files are intentionally red — exclude them.
    NEW_TEST_FILES=$(git diff --cached --name-only --diff-filter=A | grep -E "(^__tests__/|\.test\.(ts|tsx|js|jsx)$|\.spec\.(ts|tsx|js|jsx)$)")

    if [ -z "$NEW_TEST_FILES" ]; then
        # No new test files staged: run full suite
        TEST_OUTPUT=$(npm test 2>&1)
        TEST_EXIT=$?
        if [ $TEST_EXIT -ne 0 ]; then
            echo "BLOCKED: Tests failed. Fix failing tests before committing." >&2
            echo "$TEST_OUTPUT" | tail -20 >&2
            exit 2
        fi
    else
        # New test files detected: run only previously existing tests to check for regressions
        ALL_TEST_FILES=$(find __tests__ -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" 2>/dev/null | sort)

        EXISTING_TESTS=()
        while IFS= read -r f; do
            if ! echo "$NEW_TEST_FILES" | grep -qF "$f"; then
                EXISTING_TESTS+=("$f")
            fi
        done <<< "$ALL_TEST_FILES"

        if [ ${#EXISTING_TESTS[@]} -eq 0 ]; then
            # All test files are new — nothing pre-existing to regress
            exit 0
        fi

        # ⚠️ PLACEHOLDER: Replace with your targeted test runner command
        # Examples: npx vitest run, npx jest, npx mocha
        TEST_OUTPUT=$([TEST_RUNNER_TARGETED] "${EXISTING_TESTS[@]}" 2>&1)
        TEST_EXIT=$?
        if [ $TEST_EXIT -ne 0 ]; then
            echo "BLOCKED: Previously passing tests are now failing." >&2
            echo "$TEST_OUTPUT" | tail -20 >&2
            exit 2
        fi
    fi
fi

exit 0
```

### 3.4 post-write-lint.sh

Runs TypeScript type-check after each file write. **Universal — no changes needed.**

```bash
#!/bin/bash
# post-write-lint.sh
# PostToolUse hook for Write
# Runs TypeScript type-check on newly written .ts files.
# Provides feedback to Claude if there are type errors.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    fp = data.get('tool_input', {}).get('file_path', '')
    if not fp:
        fp = data.get('tool_input', {}).get('file', '')
    print(fp)
except:
    print('')
" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only lint TypeScript source files, skip test files and node_modules
echo "$FILE_PATH" | grep -qE "\.tsx?$" || exit 0
echo "$FILE_PATH" | grep -q "node_modules" && exit 0

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Run tsc --noEmit on the specific file if tsconfig exists
if [ -f "tsconfig.json" ]; then
    TSC_OUTPUT=$(npx tsc --noEmit 2>&1 | grep -A 2 "$FILE_PATH" | head -15)
    if [ -n "$TSC_OUTPUT" ]; then
        echo '{"decision": "block", "reason": "TypeScript errors found in '"$FILE_PATH"':\n'"$(echo "$TSC_OUTPUT" | sed 's/"/\\"/g')"'"}'
        exit 0
    fi
fi

exit 0
```

### 3.5 stop-check-tests.sh

Prevents Claude from stopping if tests are still failing in implement mode. **Universal — no changes needed.**

```bash
#!/bin/bash
# stop-check-tests.sh
# Stop hook
# In implement mode, prevents Claude from stopping if tests are still failing.

INPUT=$(cat)

# Check if a stop hook is already active to prevent infinite loops
STOP_HOOK_ACTIVE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(str(data.get('stop_hook_active', False)).lower())
except:
    print('false')
" 2>/dev/null)

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
    exit 0
fi

# Only enforce in implement mode
if [ "$CLAUDE_TDD_MODE" != "implement" ]; then
    exit 0
fi

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

TEST_OUTPUT=$(npm test 2>&1)
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
    FAILING=$(echo "$TEST_OUTPUT" | grep -E "(FAIL|✕|×)" | head -10)
    echo "Tests are still failing. Continue implementing until all tests pass:" >&2
    echo "$FAILING" >&2
    exit 2
fi

# Remind agent to commit if there are uncommitted changes
UNCOMMITTED=$(git -C "$CLAUDE_PROJECT_DIR" status --porcelain 2>/dev/null)
if [ -n "$UNCOMMITTED" ]; then
    echo "Reminder: uncommitted changes detected. Did you forget to commit?" >&2
    echo "$UNCOMMITTED" >&2
fi

exit 0
```

---

## 4. Command Files

### 4.1 .claude/commands/write-tests.md

Replace `[PLACEHOLDERS]` with your project-specific values.

````markdown
---
description: "TDD Phase 1: Write failing integration tests for a feature. Use this to start a new feature by creating tests first (red state)."
allowed-tools: Read, Glob, Grep, Write, Bash
---

You are in TEST WRITING mode.

## Task

Write integration tests for: $ARGUMENTS

## Process

1. Read the feature requirements from `[REQUIREMENTS_SOURCE]` (or the description provided in $ARGUMENTS)
2. Identify all behaviors, interactions, and edge cases to test
3. Write integration test files in `__tests__/integration/`
4. Use `[TEST_LIBRARY]` for testing
5. Run `[TEST_COMMAND]` and confirm ALL new tests FAIL (red state)

## Test file structure

Each integration test must:

1. [TEST_SETUP_TEMPLATE]
2. Simulate user interactions or API calls
3. Assert the resulting state matches expected behavior

```typescript
describe('Feature: [feature name]', () => {
  function setup() {
    [TEST_SETUP_TEMPLATE]
  }

  it('should [expected behavior] when [condition]', async () => {
    // 1. Arrange: set up initial state
    // 2. Act: perform the action
    // 3. Assert: check the result
  });
});
```

## Constraints

- Write test files ONLY — no implementation code
- Do NOT modify any files outside `__tests__/`
- Do NOT modify existing test files unless extending them for the current feature
- Test assertions come from the functional requirements, not from guessing implementation details
- Use descriptive test names: `should [expected behavior] when [condition]`

## Output

After writing tests, run `[TEST_COMMAND]` and report:
- List of test files created
- Summary of each test case
- Confirmation that all new tests fail with expected reasons

## Commit

After confirming red state, stage and commit your work:
1. Run `git status` to identify files you created in this session
2. Stage only those files (do not use `git add -A`)
3. Run: `git commit -m "TDD[1:write-tests] $ARGUMENTS — N tests, all red"`
   Replace N with the actual number of new tests.
````

### 4.2 .claude/commands/implement.md

Replace `[PLACEHOLDERS]` with your project-specific values.

````markdown
---
description: "TDD Phase 2: Implement code to make all failing tests pass. Test files are locked by a hook and cannot be modified."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

You are in IMPLEMENTATION mode.

## Task

Make all failing tests pass for: $ARGUMENTS

## Process

1. Run `[TEST_COMMAND]` to see current failures
2. Read the failing test files to understand expected behavior
3. Implement the minimum code needed to pass each test
4. Follow [ARCHITECTURE_LAYERS] layering
5. Run `[TEST_COMMAND]` after each meaningful change
6. Repeat until ALL tests pass

## Architecture rules

[ARCHITECTURE_LAYERS]

<!-- Example for frontend:
- Components (`src/components/`): UI rendering and local state only — receive props and callbacks
- Hooks (`src/hooks/`): encapsulate reusable stateful logic
- Services (`src/services/`): return typed data from APIs or mock sources — no UI concerns
- `App.tsx`: composes top-level state and passes callbacks to child components
-->

<!-- Example for backend:
- Routes (`src/routes/`): HTTP method + path mapping, no business logic
- Controllers (`src/controllers/`): parse request, call service, send response
- Services (`src/services/`): business logic, orchestration
- Repositories (`src/repositories/`): database queries, typed returns
-->

## Constraints

- NEVER modify files in `__tests__/` — a hook blocks this and your edit will be rejected
- Do NOT add npm packages unless the task explicitly requires it
- Keep modules focused — no 300+ line files
- Service functions return typed data matching your defined types

## If a test seems wrong

Explain why you think the test is incorrect and what behavior you expected. Do NOT attempt to modify the test. The user will decide whether to adjust the test in a separate session.

## Output

Run `[TEST_COMMAND]` one final time and report:
- Confirmation all tests pass
- List of files created or modified
- Any concerns about test correctness (if applicable)

## Commit

After all tests pass, stage and commit your work:
1. Run `git status` to identify files you created or modified in this session
2. Stage only those files (do not use `git add -A`)
3. Run: `git commit -m "TDD[2:implement] $ARGUMENTS — N tests pass"`
   Replace N with the actual total test count from the final test run.
````

---

## 5. Skill File

### .claude/skills/tdd-workflow/SKILL.md

Replace `[PLACEHOLDERS]` with your project-specific values.

````markdown
---
name: tdd-workflow
description: "Enforces test-driven development workflow rules. Consult this skill whenever writing tests, implementing features, or working with the __tests__/ directory. Also consult when Claude needs to decide whether to modify a test file or an implementation file. This skill applies to all test-related and implementation tasks."
---

# TDD Workflow Rules

This project uses strict two-phase TDD. The phases are enforced by hooks and slash commands.

## Phase 1: Write Tests (red state)

Invoked by: `/project:write-tests [feature description]`

In this phase:
- Create test files in `__tests__/integration/`
- Use [TEST_LIBRARY] for testing
- Cover happy paths, error cases, and edge cases
- Do not write any implementation code
- End state: all new tests FAIL

## Phase 2: Implement (green state)

Invoked by: `/project:implement [feature description]`
Requires: `CLAUDE_TDD_MODE=implement` environment variable

In this phase:
- Read failing tests to understand expected behavior
- Write minimum implementation to pass tests
- Files in `__tests__/` are blocked by a PreToolUse hook — do not attempt to edit them
- Follow [ARCHITECTURE_LAYERS] architecture
- End state: all tests PASS

## When to consult this skill

- Before creating any file in `__tests__/`: check which phase you are in
- Before modifying any test file: this is only allowed in Phase 1
- When a test fails during implementation: fix the implementation, not the test
- When deciding where to put new code: follow the file naming conventions below

## File placement reference

[FILE_PLACEMENT_TABLE]

<!-- Example for frontend:
| Type | Path pattern | Naming |
|------|-------------|--------|
| Integration test | `__tests__/integration/{phase}-{feature}.test.tsx` | kebab-case |
| Unit test | `__tests__/unit/{feature}.test.ts` | kebab-case |
| Component | `src/components/{Name}.tsx` | PascalCase |
| Hook | `src/hooks/use{Name}.ts` | camelCase |
| Service | `src/services/{feature}Service.ts` | camelCase |
| Types | `src/types.ts` | shared types file |
-->

<!-- Example for backend:
| Type | Path pattern | Naming |
|------|-------------|--------|
| Integration test | `__tests__/integration/{feature}.test.ts` | kebab-case |
| Unit test | `__tests__/unit/{feature}.test.ts` | kebab-case |
| Route | `src/routes/{feature}.ts` | kebab-case |
| Controller | `src/controllers/{feature}Controller.ts` | camelCase |
| Service | `src/services/{feature}Service.ts` | camelCase |
| Repository | `src/repositories/{feature}Repository.ts` | camelCase |
| Types | `src/types.ts` | shared types file |
-->

## Composition rule

[ARCHITECTURE_LAYERS]

## Test structure template

```typescript
describe('Feature: [feature name]', () => {
  function setup() {
    [TEST_SETUP_TEMPLATE]
  }

  it('should [expected behavior] when [condition]', async () => {
    // 1. Arrange: set up initial state
    // 2. Act: perform the action
    // 3. Assert: check the result
  });
});
```
````

---

## 6. settings.local.json

Copy into `.claude/settings.local.json`. This includes all TDD-related hooks and permissions. Project-specific permissions (like scaffolding tools) are excluded — add your own as needed.

```json
{
  "permissions": {
    "allow": [
      "Bash(rm:*)",
      "Bash(cp:*)",
      "Bash(ls:*)",
      "Bash(npx tsc:*)",
      "Bash(npm test:*)",
      "Bash(timeout 8 npm run:*)",
      "Skill(write-tests)",
      "Skill(implement)",
      "Bash(wc:*)",
      "Bash(echo CLAUDE_TDD_MODE=$CLAUDE_TDD_MODE:*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-test-files.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-npm-install.sh",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard-git-commit.sh",
            "timeout": 120
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/post-write-lint.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-check-tests.sh",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

---

## Placeholder Reference

| Placeholder | Where Used | Example Values |
|---|---|---|
| `[PROJECT_DESCRIPTION]` | CLAUDE.md | "A REST API for managing recipes" |
| `[STACK]` | CLAUDE.md | "Express + TypeScript + Prisma" |
| `[DEV_COMMAND]` | CLAUDE.md | `npm run dev` |
| `[TEST_COMMAND]` | CLAUDE.md, write-tests.md, implement.md | `npm test` |
| `[BUILD_COMMAND]` | CLAUDE.md | `npm run build` |
| `[ARCHITECTURE_LAYERS]` | CLAUDE.md, implement.md, SKILL.md | "Controllers → Services → Repositories" |
| `[KEY_TYPES]` | CLAUDE.md | Project-specific TypeScript interfaces |
| `[FEATURE_PHASES]` | CLAUDE.md | Project-specific phase table |
| `[OUT_OF_SCOPE]` | CLAUDE.md | "Auth, payments, ..." |
| `[REQUIREMENTS_SOURCE]` | write-tests.md | Path to requirements doc |
| `[TEST_LIBRARY]` | write-tests.md, SKILL.md | `@testing-library/react` or `supertest` |
| `[TEST_SETUP_TEMPLATE]` | write-tests.md, SKILL.md | `render(<App />)` or `app.get("/api/...")` |
| `[FILE_PLACEMENT_TABLE]` | SKILL.md | File path conventions table |
| `[TEST_RUNNER_TARGETED]` | guard-git-commit.sh (line 66) | `npx vitest run` or `npx jest` |

---

## What Stays Universal (No Placeholders Needed)

- **guard-test-files.sh** — blocks `__tests__/` edits in implement mode
- **guard-npm-install.sh** — blocks unauthorized package installs
- **post-write-lint.sh** — runs `npx tsc --noEmit` after writes
- **stop-check-tests.sh** — enforces test pass before session end
- **TDD Workflow section** in CLAUDE.md
- **Hook documentation** in CLAUDE.md
- **Commit message format**: `TDD[1:write-tests]` / `TDD[2:implement]`
