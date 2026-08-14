# Contributing to Studzee

Thank you for your interest in contributing to Studzee! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/studzee.git
   cd studzee
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original/studzee.git
   ```

## Development Setup

Each service has its own setup requirements. Refer to the respective README files:

| Service | Setup Guide                               |
| ------- | ----------------------------------------- |
| BACKEND | [BACKEND/README.md](../BACKEND/README.md) |
| MOBILE  | [MOBILE/README.md](../MOBILE/README.md)   |
| DESKTOP | [DESKTOP/README.md](../DESKTOP/README.md) |

Start with [CLAUDE.md](../CLAUDE.md) at the repository root for the fastest
route to a running project.

### Prerequisites

- **Node.js** v22. The backend Dockerfile builds on `node:22-alpine`, so that is
  what CI and production run.
- **Docker Desktop** with Compose v2. Commands are `docker compose`, not the
  retired `docker-compose` binary.
- **Git** for version control.

Bun is optional and only as a script runner. The Bun runtime was dropped on
10-08-2026, so do not add it to a lockfile, a Dockerfile or CI.

### Environment Setup

Run these from the service directory, not the repository root.

1. Copy the example environment file:
   ```bash
   cd BACKEND
   cp .env.example .env
   ```
2. Fill in required environment variables. The config schema validates at import
   time and the service exits at boot naming anything missing.
3. Start infrastructure services:
   ```bash
   docker compose up -d
   ```

## Making Changes

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit your changes** following our commit guidelines

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                 |
| ---------- | ------------------------------------------- |
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `docs`     | Documentation changes                       |
| `style`    | Code style changes (formatting, semicolons) |
| `refactor` | Code refactoring without feature/fix        |
| `perf`     | Performance improvements                    |
| `test`     | Adding or updating tests                    |
| `chore`    | Maintenance tasks (dependencies, configs)   |
| `ci`       | CI/CD configuration changes                 |

### Scopes

- `backend` - BACKEND service changes, including notifications and email
- `mobile` - MOBILE app changes
- `desktop` - DESKTOP app changes
- `docs` - Documentation updates

`notification` and `website` are no longer valid scopes. NOTIFICATION was merged
into BACKEND on 10-08-2026 and WEBSITE was removed the same day.

### Examples

```bash
feat(backend): add user profile endpoint
fix(mobile): resolve navigation crash on iOS
docs(backend): update the notification API documentation
chore(backend): upgrade express to v4.19
```

A commit message needs a body, not just a subject line. State what changed, why
it changed, and anything a reviewer needs to know. Do not add co-author or model
trailers of any kind.

## Pull Request Process

1. **Update documentation** if your changes require it
2. **Ensure all tests pass.** In BACKEND, `make check` runs lint, typecheck and
   the suite, which are the three gates that block the image build in CI. Start
   the compose stack first, because the integration tests use a real Mongo and
   Redis. Test commands for the other modules are in their own `package.json`.
3. **Run linting and formatting**:
   ```bash
   npm run lint
   npm run fmt
   ```
   The typecheck is separate and matters: Vitest transpiles without
   typechecking, so a test file can pass at runtime and still not compile.
   ```bash
   npx tsc --noEmit -p tsconfig.json
   ```
4. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against the `main` branch
6. **Fill out the PR template** completely
7. **Request review** from maintainers

### PR Requirements

- [ ] Code follows project coding standards
- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] All CI checks pass
- [ ] PR description clearly explains changes

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Document public APIs with JSDoc comments

### Code Style

- Use **Prettier** for formatting
- Use **ESLint** for linting
- Follow existing patterns in the codebase

Formatting and linting commands vary by service. Refer to the `package.json` or `README.md` in the respective service directory (`BACKEND/`, `MOBILE/`, `DESKTOP/`) for the correct commands.

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### File Naming

| Type       | Convention           | Example           |
| ---------- | -------------------- | ----------------- |
| Components | PascalCase           | `UserProfile.tsx` |
| Services   | camelCase.service.ts | `user.service.ts` |
| Routes     | camelCase.routes.ts  | `admin.routes.ts` |
| Types      | PascalCase           | `UserTypes.ts`    |
| Utils      | camelCase.ts         | `cache.ts`        |

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts
```

### Writing Tests

- Write tests for all new features
- Place tests in `src/tests/` or alongside source files as `*.test.ts`
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

## Documentation

- Update README files when adding features
- Document API endpoints in `API.md`
- Add inline comments for complex logic
- Keep documentation concise and up-to-date

## Questions?

If you have questions or need help:

1. Check existing documentation
2. Search existing issues
3. Open a new issue with the `question` label

Thank you for contributing to Studzee!
