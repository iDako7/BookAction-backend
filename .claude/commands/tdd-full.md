---
description: "Full TDD cycle: write failing tests, then implement. Orchestrates both phases with sub-agents."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Agent
---

You are a TDD orchestrator. You will run **both** TDD phases in sequence for: **$ARGUMENTS**

---

## Phase 1 — Write Failing Tests (Red)

Spawn a sub-agent with the following prompt. Wait for it to complete before continuing.

**Sub-agent instructions:**

> You are in TEST WRITING mode.
>
> ## Task
> Write integration tests for: $ARGUMENTS
>
> ## Process
> 1. Read the feature requirements from `docs/BookAction_Technical_Design_v4.md` and `TASKS.md` (or the description provided)
> 2. Identify all behaviors, interactions, and edge cases to test
> 3. Write integration test files in `__tests__/integration/`
> 4. Use Jest + Supertest for testing
> 5. Run `npm test` and confirm ALL new tests FAIL (red state)
>
> ## Test file structure
> Each integration test must:
> 1. `const { app, prisma, getAuthToken } = await import('../../tests/setup');`
> 2. Simulate user interactions or API calls
> 3. Assert the resulting state matches expected behavior
>
> ```typescript
> describe('Feature: [feature name]', () => {
>   function setup() {
>     const { app, prisma, getAuthToken } = await import('../../tests/setup');
>   }
>
>   it('should [expected behavior] when [condition]', async () => {
>     // 1. Arrange: set up initial state
>     // 2. Act: perform the action
>     // 3. Assert: check the result
>   });
> });
> ```
>
> ## Constraints
> - Write test files ONLY — no implementation code
> - Do NOT modify any files outside `__tests__/`
> - Do NOT modify existing test files unless extending them for the current feature
> - Test assertions come from the functional requirements, not from guessing implementation details
> - Use descriptive test names: `should [expected behavior] when [condition]`
>
> ## Output
> After writing tests, run `npm test` and report:
> - List of test files created
> - Summary of each test case
> - Confirmation that all new tests fail with expected reasons

**Allowed tools for the sub-agent:** Read, Glob, Grep, Write, Bash

---

## Checkpoint 1 — Verify Red State and Commit

After the Phase 1 sub-agent finishes:

1. Run `npm test` yourself to verify the new tests fail
2. If any new test passes unexpectedly, stop and report the issue to the user
3. Run `git status` to identify test files created in Phase 1
4. Stage only those files (do not use `git add -A`)
5. Run: `git commit -m "TDD[1:write-tests] $ARGUMENTS — N tests, all red"` (replace N with the actual count)

---

## Phase 2 — Implement to Pass Tests (Green)

Spawn a sub-agent with the following prompt. Wait for it to complete before continuing.

**Sub-agent instructions:**

> You are in IMPLEMENTATION mode.
>
> ## Task
> Make all failing tests pass for: $ARGUMENTS
>
> ## Process
> 1. Run `npm test` to see current failures
> 2. Read the failing test files to understand expected behavior
> 3. Implement the minimum code needed to pass each test
> 4. Follow Routes -> Controllers -> Services -> Repositories -> Prisma layering
> 5. Run `npm test` after each meaningful change
> 6. Repeat until ALL tests pass
>
> ## Architecture rules
> - Routes (`src/routes/`): HTTP method + path mapping, no business logic
> - Controllers (`src/controllers/`): parse request, call service, send response
> - Services (`src/services/`): business logic, orchestration
> - Repositories (`src/repositories/`): database queries, typed returns
>
> ## Constraints
> - **NEVER modify files in `__tests__/`** — treat all test files as completely read-only. You may READ them but NEVER WRITE or EDIT them. If you attempt to modify a test file, you are violating the TDD contract.
> - Do NOT add npm packages unless the task explicitly requires it
> - Keep modules focused — no 300+ line files
> - Service functions return typed data matching your defined types
>
> ## If a test seems wrong
> Explain why you think the test is incorrect and what behavior you expected. Do NOT attempt to modify the test. The orchestrator will report this to the user.
>
> ## Output
> Run `npm test` one final time and report:
> - Confirmation all tests pass
> - List of files created or modified
> - Any concerns about test correctness (if applicable)

**Allowed tools for the sub-agent:** Read, Glob, Grep, Write, Edit, Bash

---

## Checkpoint 2 — Verify Green State and Commit

After the Phase 2 sub-agent finishes:

1. Run `npm test` yourself to verify ALL tests pass
2. If any test still fails, report the failures and stop — do NOT commit broken code
3. Run `git status` to identify implementation files created/modified in Phase 2
4. Stage only those files (do not use `git add -A`)
5. Run: `git commit -m "TDD[2:implement] $ARGUMENTS — N tests pass"` (replace N with the actual total test count)

---

## Final Report

After both phases complete, output a summary:

```
## TDD Full Cycle Complete: $ARGUMENTS

### Phase 1 — Tests Written (Red)
- Test files: [list]
- Test count: N
- Commit: [hash]

### Phase 2 — Implementation (Green)
- Files created/modified: [list]
- All N tests passing
- Commit: [hash]

### Notes
- [any concerns about test correctness or implementation decisions]
```
