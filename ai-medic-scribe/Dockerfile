# AI Medical Scribe - Docker Configuration
# Multi-stage build for optimized production image

# ===============================
# Dependencies Stage
# ===============================
FROM node:18-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ===============================
# Builder Stage
# ===============================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# ===============================
# Runner Stage (Production)
# ===============================
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 mediscribe
RUN adduser --system --uid 1001 mediscribe

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets
COPY --from=builder /app/public ./public

# Copy built application
COPY --from=builder --chown=mediscribe:mediscribe /app/.next/standalone ./
COPY --from=builder --chown=mediscribe:mediscribe /app/.next/static ./.next/static

# Create directories for application data
RUN mkdir -p /app/data/sessions /app/data/patients /app/logs
RUN chown -R mediscribe:mediscribe /app/data /app/logs

# Switch to non-root user
USER mediscribe


# Expose port 3010
EXPOSE 3010


# Health check for port 3010
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Set PORT env variable and start the application
ENV PORT=3010
CMD ["node", "server.js"]