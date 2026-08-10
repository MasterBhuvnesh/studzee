# RULES

Rules the Claude agent must follow when working in this repository.

## COMMITS

- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `build:`, `ci:`).
- Commit messages are detailed. Keep the subject line short and imperative, then write a body that states what changed, why it changed, and anything a reviewer needs to know. A bare subject line is not acceptable.
- Scope the commit to the service it touches when useful, for example `feat(backend):`, `fix(mobile):`, `docs(website):`.
- Never add model or co-author trailers such as `Co-Authored-By: Claude ...`. No mention of Claude, Anthropic, or any model in commit messages.
- Commit every change that is made. Do not leave work uncommitted.

## WRITING STYLE

- Do not use em dashes.
- Do not use emoji.
- Use ALL CAPS for all titles and headings in every markdown file, including the README.
- Be concise.

## LANGUAGE

- TypeScript for all new code across BACKEND, WEBSITE, MOBILE, DESKTOP, NOTIFICATION, SERVICES, and PACKAGES.
- Write specific, professional comments that explain intent rather than restate the code.

## RECORDS

- Always keep [`RECORDS.md`](RECORDS.md) up to date. When a feature changes state, add or update a row so any other person or agent knows what is done and what is not.
- The record table columns are: FEATURE, DEVELOPER, STATUS, DATE.
- Write the developer name in capitals (BHUVNESH, ABHAY, or the relevant person).
- Commit the updated `RECORDS.md` along with the feature.
- Always keep [`FIXES.md`](FIXES.md) up to date. When a problem is fixed, add a row so the same problem is not repeated. Columns are: PROBLEM, FIX, CAUSE / OCCUR, DATE.
- Commit `FIXES.md` with the change that fixed the problem.
- Keep [`WORKLOG.md`](../WORKLOG.md) at the repository root updated with a dated entry per unit of work.

## VERSION CONTROL

- Do not commit directly to `main`. Branch first.
- Branch naming follows the type of work, for example `feat/v2-architecture`, `fix/notification-retry`.
- Every branch ends in a pull request. The repository owner merges. Never merge without being asked.
- The pull request description must list every change made on the branch.
- Ask before destructive or irreversible Git actions (`reset --hard`, `push --force`, history rewrites).

## WORKING BEHAVIOR

- If a request seems wrong, or a terminal command is taking too long, ask the user once whether to continue.
- If anything is unclear, ask the user rather than guessing.
- Read [`TCSK.md`](TCSK.md) (Things Claude Should Know) at the start of work and use it as memory of what the user wants Claude to know.
- Do not claim work is done until it is verified. If a step was skipped or a test failed, say so.
- Reuse existing code, helpers, and patterns before writing new ones. Prefer the smallest change that works.

## SECURITY

- Never commit credentials, API keys, tokens, or `.env` files. Keep secrets outside the codebase.
- Secrets belong in the deployment environment or in `K8S/secrets`, never in tracked source.
- Never send any email, push notification, or outreach automatically. Drafts only, user approval required.
- Keep each user's data separated. Do not let one user's data appear in another user's workflow.
