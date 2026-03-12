FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy the entire monorepo for npm workspace resolution
COPY . .

# Install all workspace dependencies
RUN npm ci --include=dev

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy node_modules with all workspace deps + generated Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/ ./packages/database/
COPY --from=deps /app/packages/sync/ ./packages/sync/
COPY --from=deps /app/package.json ./package.json

# Create tmp directory for FTP downloads
RUN mkdir -p /tmp/sync-worker

EXPOSE 8080

CMD ["tsx", "packages/sync/src/worker.ts"]
