# CLAUDE.md

## 🧠 Project Overview
- Domain/context summary
- Repo layout highlights (e.g. `src/modules`, `tests/`)
- Core commands: test, lint, build

## ⚙️ Branching & Workflow
- Branch format: `feature/<target>-stabilization`
- Write minimal failing test first
- Implement just enough to pass test
- Refactor only when complexity threshold reached
- Run full test suite after each change
- Squash history before remote push or PR

## 🔁 Cloud AI Stabilization Loop
Each cycle:
1. Write failing test for single target
2. Commit `test: add failing test for <target>`
3. Push branch
4. Run tests; save CLI output
5. Commit `wip: stabilize <target>` including log
6. Invoke Cloud AI with current HEAD + test log
7. Apply suggestions
8. Re-run tests and repeat if needed
9. Refactor when necessary, commit as `refactor: simplify <target>`
10. Loop until stable: tests pass, complexity acceptable
11. Squash commits, re-run full suite, open PR or merge

## 🧩 File Structure Guidance
- `CLAUDE.md` in root
- Optional `.claude/commands/stabilize-cycle.md` for slash command
- `.claude/logs` for test logs (optional)

## 🧰 Tools & Shortcuts
- `/init` generates baseline CLAUDE.md
- Use `/project:stabilize-cycle` (custom command) to start loop
- Use `#` to add environment or style rules
- Pre‑commit hooks should enforce tests, lint, type checks

## 📜 Conventions & Style
- Use ES modules
- Always run `npm test -- <file>` locally before full suite
- Error types: `MalformedInputError`, etc.
