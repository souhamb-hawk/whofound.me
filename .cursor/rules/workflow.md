# Workflow Rules

These rules are **hard constraints** that all agents MUST follow. Git discipline is mandatory.

## Branch Structure

- `main` — stable, production-ready branch
- `dev` — integration branch for completed features
- `feature/*` — short-lived branches for individual features or changes

## Branch Rules

- **No direct commits to `main` or `dev`**
- Feature branches created from `dev` only
- Feature branches merge only into `dev`

## Feature Branch Creation

A new `feature/*` branch MUST be created **only if the work requires ≥4 commits**.

- Changes completable in 1–3 commits SHOULD be done directly and merged via PR
- If scope grows beyond 3 commits, immediately create a `feature/*` branch

## Commit Discipline

All commits MUST be:
- **Small** — single logical change only
- **Focused** — no mixing unrelated concerns
- **Readable** — understandable without external context
- **Descriptive** — explain *what* changed and *why*

Forbidden commit messages:
- "fix"
- "update"
- "wip"
- "changes"

## Pull Request Requirements

Every PR MUST include:
- Clear summary of the feature
- Rationale (why the change exists)
- **Before/after screenshots or diagrams** (visual PR)
- List of tests added or updated
- Confirmation that all CI checks pass

PRs without visual context or test descriptions MUST be rejected.

## UI PRs

UI-related PRs MUST include:
- Screenshots of the Astro page/component
- Visual comparison (before/after if applicable)
- Mobile and desktop views if responsive

## Merge Policy

- Feature branches merge only into `dev`
- `dev → main` merges occur only when:
  - Every 6 commits have been merged into `dev`, OR
  - The project or milestone is complete

Each `dev → main` merge MUST:
- Be performed via a PR
- Include a consolidated changelog
- Pass full CI (unit, integration, and E2E tests)

## Agent Behavior

Agents MUST explicitly remind users of these rules when proposing changes.

