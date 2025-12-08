0. Start clean

- `git status`
- **If only that image is untracked and you don’t need it: **`rm assets/image-f46d8f7b-82dc-4fab-be21-f83bafc8845c.png` (or add to `.gitignore`, or commit it).

1. **Update the base (**`integration_test`)

- `git checkout integration_test`
- `git pull --rebase origin integration_test`
  - **Purpose: bring integration_test up to its remote tip, keeping history linear.**

2. **Rebase each branch onto **`integration_test` (one at a time)\*_ \*\*
   **Order suggestion: **`feature/authentication` (ahead 2), `refactor/oop-architecture` (ahead 1). Skip the `backup/_` branch unless you need it.

**For each branch (example: **`feature/authentication`):

- `git checkout feature/authentication`
- `git pull --rebase`
  - **Purpose: sync the branch with its remote before rewriting. **
- `git rebase -X theirs integration_test`
  - **Purpose: replay this branch on top of integration_test; on conflicts, automatically take the integration_test side. **
  - **If conflicts still appear: **
    - **take integration_test everywhere: **`git checkout --theirs .`
    - `git add .`
    - `git rebase --continue`
    - **bail-out if needed: **`git rebase --abort`
- `git push --force-with-lease origin feature/authentication`
  - **Purpose: publish the rewritten branch safely.**
  - `--force` blindly overwrites remote (dangerous—can lose others' work)
  - `--force-with-lease` fails if someone else pushed while you were rebasing, preventing accidental overwrites

**Repeat for **`refactor/oop-architecture` (same commands with that branch name).

3. **Rebase **`main` last onto `integration_test`

- `git checkout main`
- `git pull --rebase origin main`
  - **Organ main is not mandatory under most conditions **
- `git rebase -X theirs integration_test`
- `git push --force-with-lease origin main`
  - **Purpose: main now sits on integration_test with integration_test winning conflicts.**

4. **(Optional) Clean up merged branches **

- **See merged: **`git branch --merged main`
- **Delete local: **`git branch -d <branch>`
- **Delete remote: **`git push origin --delete <branch>`

**Why this is simpler **

- **No separate **`fetch`; `pull --rebase` does fetch+replay in one step.
- `-X theirs` auto-picks integration_test in conflicts.
- `--force-with-lease` is the only “force” you need after rebases.
