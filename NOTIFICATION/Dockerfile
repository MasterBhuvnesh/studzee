# ---------- Base Image ----------
FROM oven/bun:1.1.30 AS base
WORKDIR /app

# ---------- Install Dependencies ----------
FROM base AS deps

# Copy only dependency files first (better caching)
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# ---------- Build Stage ----------
FROM deps AS build

# Copy full source
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# If you build TypeScript -> JS
# Uncomment if you have a build step
# RUN bun run build

# ---------- Production Runtime ----------
FROM oven/bun:1.1.30 AS runner
WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy only required files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# Prisma needs this at runtime
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Expose app port
EXPOSE 3000

# Run Prisma migrations + start app
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]
