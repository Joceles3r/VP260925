# Multi-stage Dockerfile pour VISUAL Platform
# Stage 1: Build dependencies and compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Install security updates and required packages
RUN apk --no-cache add \
    ca-certificates \
    && addgroup -g 1001 -S visual \
    && adduser -S visual -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/client/dist/ ./client/dist/

# Copy necessary static files
COPY client/public/ ./client/public/

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads \
    && chown -R visual:visual /app \
    && chmod -R 755 /app

# Switch to non-root user
USER visual

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/healthz', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1); \
    }).on('error', () => process.exit(1));"

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["node", "dist/server.js"]