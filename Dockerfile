# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .


# Build application
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S nest && adduser -S nest -G nest

# Copy package files
COPY package*.json ./

# Install production dependencies only
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nest:nest /app
USER nest

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
