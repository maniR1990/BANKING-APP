# apps/auth/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
# Copying ONLY these ensures we only re-install if packages change
COPY package.json pnpm-lock.yaml ./ 
# We need to make sure we have all types for the build
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Principal Architect Tip: Skip NX Cloud and Daemon for deterministic Docker builds
ENV NX_DAEMON=false
RUN pnpm exec nx build auth --prod --no-cloud

# Stage 4: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl

COPY --from=builder /app/dist/apps/auth ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]