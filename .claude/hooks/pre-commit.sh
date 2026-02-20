#!/bin/bash
# Pre-commit hook: blocks commit if tests fail
# 
# Installation:
#   cp .claude/hooks/pre-commit.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# This ensures Claude Code (or any git commit) cannot succeed
# unless all tests pass first.

echo "🧪 Running tests before commit..."

npm test 2>&1

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Tests failed. Commit blocked."
  echo "Fix the failing tests before committing."
  exit 1
fi

echo "✅ All tests passed. Proceeding with commit."
exit 0
