# Base Stage
# Only the manifests, so the dependency layers rebuild when they change rather
# than on every source edit.
FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Build Stage
# The full dependency tree, because the build needs the compiler and the Prisma
# CLI. npm ci rather than npm install, so the lockfile is what gets installed.
FROM base AS build
RUN npm ci
COPY . .
# Runs prisma generate, then tsc and tsc-alias. The generated client is written
# into node_modules, which is why the production stage layers it in separately.
RUN npm run build

# Production Dependencies Stage
# The same lockfile with the toolchain omitted. This is what ships, so the
# image carries no compiler, no test runner and no linter.
FROM base AS production-deps
RUN npm ci --omit=dev

# Production Stage
FROM node:22-alpine AS production
WORKDIR /usr/src/app

# Runtime dependency tree first, then the generated Prisma client on top of it.
# prisma generate writes into node_modules/.prisma, so it cannot come from the
# same install that omitted the tooling, and it cannot be regenerated here
# without shipping the schema and running the CLI again at build time.
COPY --from=production-deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY package*.json ./

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck
# Port 3000 is the contract this image declares. Set PORT=3000 in the
# environment, as .env.container does, or this probe fails and the container is
# reported unhealthy while serving traffic normally.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD [ "node", "-e", "require('http').get('http://localhost:3000/health/liveness', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" ]

# Expose port
EXPOSE 3000

# Apply any pending Postgres migrations, then run the app. This is why the
# prisma CLI is a runtime dependency rather than a development one.
CMD [ "sh", "-c", "npx prisma migrate deploy && node dist/index.js" ]
