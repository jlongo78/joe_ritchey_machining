# ============================================
# PRECISION ENGINE AND DYNO, LLC
# Frontend Dockerfile - Production Multi-Stage Build (Vite)
# ============================================

# ============================================
# STAGE 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Add build arguments for environment variables
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_STRIPE_PUBLIC_KEY

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

# Copy package files for dependency installation
COPY package*.json ./

# Install ALL dependencies (need devDependencies for build tools)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application (Vite outputs to dist/)
RUN npm run build

# ============================================
# STAGE 2: Production Stage with Nginx
# ============================================
FROM nginx:1.25-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for nginx
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage (Vite outputs to dist/)
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Create directory for runtime environment config
RUN mkdir -p /usr/share/nginx/html/config && \
    chown -R nginx:nginx /usr/share/nginx/html/config

# Copy entrypoint script for runtime environment variable injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Use entrypoint for runtime config
ENTRYPOINT ["/docker-entrypoint.sh"]

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
