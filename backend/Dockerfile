# =====================================================
# STAGE 1: Builder
# =====================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for compiling native addons (if any)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --only=production

# =====================================================
# STAGE 2: Runner
# =====================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy production node_modules and code
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Create a non-root user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /usr/src/app

# Use the non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check using the live endpoint we created
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
