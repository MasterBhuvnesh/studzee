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

| Service      | Setup Guide                                         |
| ------------ | --------------------------------------------------- |
| BACKEND      | [BACKEND/README.md](../BACKEND/README.md)           |
| NOTIFICATION | [NOTIFICATION/README.md](../NOTIFICATION/README.md) |
| MOBILE       | [MOBILE/README.md](../MOBILE/README.md)             |

### Prerequisites

- **Node.js** v18+ or **Bun** v1.1.30+
- **Docker** and Docker Compose
- **Git** for version control

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in required environment variables
3. Start infrastructure services:
   ```bash
   docker-compose up -d
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

- `backend` - BACKEND service changes
- `notification` - NOTIFICATION service changes
- `mobile` - MOBILE app changes
- `website` - WEBSITE changes
- `desktop` - DESKTOP app changes
- `docs` - Documentation updates

### Examples

```bash
feat(backend): add user profile endpoint
fix(mobile): resolve navigation crash on iOS
docs(notification): update API documentation
chore(backend): upgrade express to v4.19
```

## Pull Request Process

1. **Update documentation** if your changes require it
2. **Ensure all tests pass**. Test commands vary by service; check the `package.json` or `README.md` in the respective service directory (e.g., `BACKEND/`, `NOTIFICATION/`).
3. **Run linting and formatting**:
   ```bash
   npm run lint
   npm run format
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

Formatting and linting commands vary by service. Refer to the `package.json` or `README.md` in the respective service directory (e.g., `BACKEND/`, `NOTIFICATION/`) for the correct commands.

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
