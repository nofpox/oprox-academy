# Production Dockerfile for OPROX OS
FROM node:22-alpine AS builder

WORKDIR /app

# Install Bun binary for dependency management
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

# Copy package manifests and lockfile
COPY package.json bun.lock ./

# Install all dependencies using Bun
RUN bun install --frozen-lockfile

# Copy source code and build production bundle
COPY . .
RUN bun run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install Bun binary for runtime dependency installation
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

# Create non-root system user and group
RUN addgroup -S oprox && adduser -S oprox -G oprox

# Copy package manifests and install production dependencies only
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy compiled dist bundle and database migration files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Set ownership to non-root user
RUN chown -R oprox:oprox /app

USER oprox

EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
