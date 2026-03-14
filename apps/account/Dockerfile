# Stage 1: Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN NX_DAEMON=false pnpm exec nx build account --prod --no-cloud

# Stage 4: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# --- FIX 1: Install curl so the health check works ---
RUN apk add --no-cache curl

# --- FIX 2: Ensure pathing is correct ---
COPY --from=builder /app/dist/apps/account ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure the port is explicitly set for the app to pick up
ENV PORT=3001
EXPOSE 3001

# Verify where main.js is. If nx puts it in a subfolder, 
# you might need "dist/apps/account/main.js"
CMD ["node", "dist/main.js"]