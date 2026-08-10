# TCSK

Things Claude Should Know. This is what the user wants Claude to know about the project. Read it before starting work and treat it as memory. Add to it when the user shares something durable.

## PROJECT

- Studzee is a full-stack SaaS educational platform for creating, structuring, delivering, and consuming educational content across mobile, web, and desktop.
- Stakeholders are students and learners, educators and content creators, administrators, and contributing developers.
- The architecture is distributed and service oriented. Each service is independently deployable for fault isolation, horizontal scaling, and controlled rollouts.
- Content is currently uploaded and structured manually by administrators. An agentic AI layer for validation, structuring, quiz generation, and summaries is on the roadmap and will live in the `AGENTS` folder.
- Official website is `https://studzee.in`, with DNS handled through AWS Route 53 for production.

## REPOSITORY LAYOUT

- `BACKEND` is the core API (`studzee-api`). It owns business logic, content lifecycle, caching, and Clerk authentication.
- `NOTIFICATION` is a Bun service (`studzee-notification-api`) for Expo push and transactional email, using Prisma over Postgres. It is event driven and owns no business logic or data.
- `WEBSITE` is the Next.js web client.
- `MOBILE` is the Expo client.
- `DESKTOP` is the Electron client.
- `SERVICES` holds the extracted `api` and `notification` service layers.
- `PACKAGES/shared` holds code shared across the clients and services.
- `CONVEX` holds the Convex backend and its website.
- `AGENTS` is the home of the planned AI and content intelligence work.
- `TERRAFORM` holds infrastructure pipelines for backend, notification, and website.
- `K8S/secrets` holds Kubernetes secret material. Nothing sensitive is committed.
- `.github` holds the README, workflows, CODEOWNERS, and community docs.

## DATA AND INFRASTRUCTURE

- Persistence uses MongoDB and PostgreSQL. Redis is used for caching. Object storage holds uploaded assets.
- Authentication is centralized through Clerk and reaches the clients through the backend.
- There are two deployment panels. Panel 1 is free or community grade (Render, MongoDB Atlas, Neon Postgres, managed Redis, Docker). Panel 2 is production grade on AWS with Terraform, load balancing, auto scaling, and Route 53.
- Production pushes trigger redeployment of the listed services. Validate changes locally before pushing to production branches.

## PEOPLE

- Developers: BHUVNESH (Bhuvnesh Verma), ABHAY (Abhay Mishra).
- GitHub: @MasterBhuvnesh, @AbhayMishra1371.
- CODEOWNERS assigns the whole repository to @MasterBhuvnesh.
- Repository remote is `https://github.com/MasterBhuvnesh/studzee.git`.

## CONVENTIONS

- All new code is TypeScript.
- Documentation for agents and process lives in `.docs`. See [`RULES.md`](RULES.md), [`RECORDS.md`](RECORDS.md), and [`FIXES.md`](FIXES.md).
- The running work record is [`WORKLOG.md`](../WORKLOG.md) at the repository root.
- Work happens on feature branches and is delivered through pull requests. The user merges, not the agent.
- No em dashes, no emoji, ALL CAPS headings in markdown.

## NOTES

- The current working branch is `feat/v2-architecture`. The scope of the v2 architecture work has not been defined yet and the user will describe it.
- Add things the user wants Claude to remember here as the project progresses.
