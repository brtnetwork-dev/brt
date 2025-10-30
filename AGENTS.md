# Repository Guidelines

## Project Structure & Module Organization
- `.codex/prompts/` — author and maintain prompt files (e.g., `speckit.tasks.md`).
- `.specify/templates/` — reusable Markdown templates (e.g., `*-template.md`).
- `.specify/scripts/bash/` — helper scripts for workflow automation.
- `.specify/memory/` — long‑lived reference docs (e.g., `constitution.md`).
- Create new app code under `src/` and tests under `tests/` if/when code is added.

## Build, Test, and Development Commands
- `bash .specify/scripts/bash/check-prerequisites.sh` — verify local tooling.
- `bash .specify/scripts/bash/create-new-feature.sh "Feature name"` — scaffold feature docs/tasks.
- `bash .specify/scripts/bash/update-agent-context.sh` — refresh agent context files.
- `bash .specify/scripts/bash/setup-plan.sh` — initialize a plan from templates.
- Optional linters (if installed): `shellcheck .specify/scripts/bash/*.sh`, `markdownlint '**/*.md'`.

## Coding Style & Naming Conventions
- Bash: `#!/usr/bin/env bash`, `set -euo pipefail`, 2‑space indent, functions `lower_snake_case`, scripts `kebab-case.sh`.
- Markdown: clear headings, lists, and code fences; wrap ~100 chars; filenames lowercase, use dots for prompt modules (e.g., `speckit.analyze.md`).
- New files live alongside similar assets (prompts in `.codex/prompts/`, templates in `.specify/templates/`).

## Testing Guidelines
- Scripts: run `shellcheck` locally; prefer small, testable functions.
- Markdown: run `markdownlint` and check links/headings.
- If adding runtime code: mirror files under `tests/` using `<name>.spec.<ext>`; aim for meaningful coverage of new logic.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:` (e.g., `docs(prompts): add planning checklist`).
- PRs must include: concise description, linked issue/task, list of affected paths, and any before/after examples.
- Keep changes scoped and incremental; run prerequisite and lint commands before opening a PR.

## Security & Configuration Tips
- Do not commit secrets or tokens. Prefer environment variables or local `.env` excluded by `.gitignore`.
- Avoid destructive scripts; if needed, require explicit flags (e.g., `--force`).

## Agent-Specific Notes
- Do not remove or rename `.codex` or `.specify` directories.
- Follow naming patterns shown above; update this guide when introducing new conventions.
