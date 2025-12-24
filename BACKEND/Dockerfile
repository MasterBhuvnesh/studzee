# Base Stage 
FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Dependencies Stage
FROM base AS dependencies
RUN npm ci

# Build Stage
FROM base AS build
COPY . .
RUN npm install
RUN npm run build

# Production Stage
FROM node:22-alpine AS production
WORKDIR /usr/src/app

# Copy dependencies and build artifacts
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD [ "node", "-e", "require('http').get('http://localhost:4000/health/liveness', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" ]

# Expose port 
EXPOSE 4000

# Run the app
CMD [ "node", "dist/index.js" ]
