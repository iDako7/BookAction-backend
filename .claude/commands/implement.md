---
description: "TDD Phase 2: Implement code to make all failing tests pass. Test files are locked by a hook and cannot be modified."
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

You are in IMPLEMENTATION mode.

## Task

Make all failing tests pass for: $ARGUMENTS

## Process

1. Run `npm test` to see current failures
2. Read the failing test files to understand expected behavior
3. Implement the minimum code needed to pass each test
4. Follow Routes -> Controllers -> Services -> Repositories -> Prisma layering
5. Run `npm test` after each meaningful change
6. Repeat until ALL tests pass

## Architecture rules

- Routes (`src/routes/`): HTTP method + path mapping, no business logic
- Controllers (`src/controllers/`): parse request, call service, send response
- Services (`src/services/`): business logic, orchestration
- Repositories (`src/repositories/`): database queries, typed returns

## Constraints

- NEVER modify files in `__tests__/` — a hook blocks this and your edit will be rejected
- Do NOT add npm packages unless the task explicitly requires it
- Keep modules focused — no 300+ line files
- Service functions return typed data matching your defined types

## If a test seems wrong

Explain why you think the test is incorrect and what behavior you expected. Do NOT attempt to modify the test. The user will decide whether to adjust the test in a separate session.

## Output

Run `npm test` one final time and report:
- Confirmation all tests pass
- List of files created or modified
- Any concerns about test correctness (if applicable)

## Commit

After all tests pass, stage and commit your work:
1. Run `git status` to identify files you created or modified in this session
2. Stage only those files (do not use `git add -A`)
3. Run: `git commit -m "TDD[2:implement] $ARGUMENTS — N tests pass"`
   Replace N with the actual total test count from the final test run.
