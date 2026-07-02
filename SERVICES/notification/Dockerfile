# Build context is the repo root: docker build -f SERVICES/notification/Dockerfile .
FROM node:22-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @studzee/shared build
RUN pnpm --filter @studzee/notification build

# ponytail: copies the whole workspace for a reliable Prisma + pnpm layout;
# slim with `pnpm deploy --prod` if image size matters.
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /app /app
WORKDIR /app/SERVICES/notification
EXPOSE 3000
CMD ["node", "dist/server.js"]
