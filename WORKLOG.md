# Worklog

Running record of work done on this repository. Newest entry first.
One entry per unit of work, with the branch, what changed, and why.

## Conventions

- Language: TypeScript for all new code.
- Commits: Conventional Commits, with a detailed body explaining what changed and why.
- Branching: all work happens on a feature branch, never directly on `main`.
- Delivery: every branch ends in a pull request. The repository owner merges.
- Style: no em dashes, no emoji, in code, comments, commits, and documentation.
- Comments: specific and professional, explaining intent rather than restating the code.

## 2026-08-10

**Branch:** `feat/v2-architecture`

- Created the `feat/v2-architecture` working branch off `main`.
- Added this worklog to track all subsequent v2 architecture work.
- Added the `.docs` documentation set: `RULES.md` (agent rules), `RECORDS.md`
  (feature implementation table), `FIXES.md` (problem and fix log), and
  `TCSK.md` (things Claude should know about the project).
- Reviewed BACKEND, NOTIFICATION, MOBILE, and DESKTOP ahead of the v2 rewrite
  and recorded the findings in `.docs/V2-ARCHITECTURE-REVIEW.md`. Convex is out
  of scope by decision of the repository owner and is excluded from v2.

