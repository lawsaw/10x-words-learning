# ==========================================
# Stage 1: Base
# ==========================================
FROM node:20-alpine AS base
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# ==========================================
# Stage 2: Dependencies (for build)
# ==========================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies) for the build steps
RUN npm ci

# ==========================================
# Stage 3: Builder
# ==========================================
FROM base AS builder
WORKDIR /app

# Define build arguments for client-side variables
# Note: NEXT_PUBLIC_ vars must be present at build time to be inlined in client JS
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# ==========================================
# Stage 4: Production Dependencies
# ==========================================
FROM base AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./

# Install ONLY production dependencies to keep the image smaller
# This matches the requirement for "full node_modules" at runtime, but excludes dev tools
RUN npm ci --only=production

# ==========================================
# Stage 5: Runner
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install tini for proper signal handling (PID 1)
RUN apk add --no-cache tini

# Copy public assets
COPY --from=builder /app/public ./public

# Copy built artifacts
# We copy the .next folder for the standard Next.js server
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy production node_modules
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy package.json (needed for npm start)
COPY --from=builder /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose the configurable port
# Note: actual port binding is determined by the CMD/ENV, EXPOSE is for documentation
EXPOSE 3000

# Set default port environment variable
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use tini as entrypoint to handle signals, then start the app
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--dns-result-order=ipv4first", "node_modules/next/dist/bin/next", "start"]

