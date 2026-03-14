# Stage 1: Base - Setup pnpm and workspace
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# Stage 2: Dependencies - Optimized layer caching
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 3: Build - The Nx Build Engine
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Critical Principal Engineer Flags for Docker:
ENV NX_DAEMON=false
RUN pnpm exec nx build customer --prod --no-cloud

# Stage 4: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# --- PRINCIPAL TIP: Install curl for health checks ---
RUN apk add --no-cache curl

# Copy built files from the Nx dist folder
COPY --from=builder /app/dist/apps/customer ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure NestJS listens on the correct port
ENV PORT=3000
EXPOSE 3000

# Run the entry point
CMD ["node", "dist/main.js"]