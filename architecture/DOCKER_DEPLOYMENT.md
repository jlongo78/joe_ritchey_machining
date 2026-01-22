# Docker Deployment Architecture for Both Applications

## Overview
This document describes the containerized deployment architecture for both the Performance Car Parts E-Commerce platform and the Precision Engine and Dyno business management system.

---

## 1. Docker Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX Reverse Proxy                             │
│                              (Port 80/443)                                   │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Docker Network: app_network                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    APP 1: E-COMMERCE PLATFORM                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │  React      │  │  FastAPI    │  │   Celery    │  │   Redis    │  │    │
│  │  │  Frontend   │  │  Backend    │  │   Worker    │  │   Cache    │  │    │
│  │  │  (Nginx)    │  │             │  │             │  │            │  │    │
│  │  │  Port:3001  │  │  Port:8001  │  │             │  │  Port:6379 │  │    │
│  │  └─────────────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │    │
│  │                          │                │                │         │    │
│  │                          ▼                ▼                │         │    │
│  │                   ┌─────────────────────────────────┐     │         │    │
│  │                   │      SQLite Volume              │◄────┘         │    │
│  │                   │  /data/ecommerce/database.db    │               │    │
│  │                   └─────────────────────────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    APP 2: MACHINING BUSINESS                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │  React      │  │  FastAPI    │  │   Celery    │  │   Redis    │  │    │
│  │  │  Frontend   │  │  Backend    │  │   Worker    │  │   Cache    │  │    │
│  │  │  (Nginx)    │  │             │  │             │  │            │  │    │
│  │  │  Port:3002  │  │  Port:8002  │  │             │  │  Port:6380 │  │    │
│  │  └─────────────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │    │
│  │                          │                │                │         │    │
│  │                          ▼                ▼                │         │    │
│  │                   ┌─────────────────────────────────┐     │         │    │
│  │                   │      SQLite Volume              │◄────┘         │    │
│  │                   │  /data/machining/database.db    │               │    │
│  │                   └─────────────────────────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SHARED SERVICES                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │  Mailhog    │  │  MinIO      │  │  Celery     │                  │    │
│  │  │  (Dev Email)│  │  (Storage)  │  │  Beat       │                  │    │
│  │  │  Port:8025  │  │  Port:9000  │  │  (Scheduler)│                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Directory Structure

```
deployment/
├── docker-compose.yml                 # Main compose file
├── docker-compose.override.yml        # Development overrides
├── docker-compose.prod.yml            # Production overrides
├── .env.example                       # Environment template
├── .env                               # Environment variables (gitignored)
│
├── nginx/
│   ├── nginx.conf                     # Main nginx config
│   ├── conf.d/
│   │   ├── ecommerce.conf            # E-commerce app config
│   │   └── machining.conf            # Machining app config
│   └── ssl/                           # SSL certificates
│       ├── ecommerce.crt
│       ├── ecommerce.key
│       ├── machining.crt
│       └── machining.key
│
├── app1-ecommerce/
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── nginx.conf
│   └── backend/
│       ├── Dockerfile
│       └── Dockerfile.dev
│
├── app2-machining/
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── nginx.conf
│   └── backend/
│       ├── Dockerfile
│       └── Dockerfile.dev
│
├── scripts/
│   ├── init-db.sh
│   ├── backup-db.sh
│   ├── restore-db.sh
│   └── deploy.sh
│
└── data/                              # Persistent volumes (gitignored)
    ├── ecommerce/
    │   ├── database/
    │   ├── uploads/
    │   └── backups/
    ├── machining/
    │   ├── database/
    │   ├── uploads/
    │   └── backups/
    ├── redis/
    └── minio/
```

---

## 3. Docker Compose Configuration

### Main docker-compose.yml
```yaml
version: '3.8'

services:
  # ============================================
  # REVERSE PROXY
  # ============================================
  nginx-proxy:
    image: nginx:1.25-alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ecommerce-static:/var/www/ecommerce/static:ro
      - machining-static:/var/www/machining/static:ro
    depends_on:
      - ecommerce-frontend
      - ecommerce-backend
      - machining-frontend
      - machining-backend
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 1: E-COMMERCE - FRONTEND
  # ============================================
  ecommerce-frontend:
    build:
      context: ../app1-ecommerce/frontend
      dockerfile: ../../deployment/app1-ecommerce/frontend/Dockerfile
    container_name: ecommerce-frontend
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=${ECOMMERCE_API_URL}
      - REACT_APP_STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}
    volumes:
      - ecommerce-static:/app/build/static
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 1: E-COMMERCE - BACKEND
  # ============================================
  ecommerce-backend:
    build:
      context: ../app1-ecommerce/backend
      dockerfile: ../../deployment/app1-ecommerce/backend/Dockerfile
    container_name: ecommerce-backend
    environment:
      - APP_ENV=production
      - DATABASE_URL=sqlite:///data/database.db
      - SECRET_KEY=${ECOMMERCE_SECRET_KEY}
      - JWT_SECRET=${ECOMMERCE_JWT_SECRET}
      - REDIS_URL=redis://ecommerce-redis:6379/0
      - CELERY_BROKER_URL=redis://ecommerce-redis:6379/1
      - CELERY_RESULT_BACKEND=redis://ecommerce-redis:6379/2
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - MAIL_FROM_EMAIL=${ECOMMERCE_MAIL_FROM}
      - FRONTEND_URL=${ECOMMERCE_FRONTEND_URL}
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    volumes:
      - ecommerce-db:/app/data
      - ecommerce-uploads:/app/uploads
    depends_on:
      - ecommerce-redis
    networks:
      - app_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============================================
  # APP 1: E-COMMERCE - CELERY WORKER
  # ============================================
  ecommerce-celery-worker:
    build:
      context: ../app1-ecommerce/backend
      dockerfile: ../../deployment/app1-ecommerce/backend/Dockerfile
    container_name: ecommerce-celery-worker
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - APP_ENV=production
      - DATABASE_URL=sqlite:///data/database.db
      - SECRET_KEY=${ECOMMERCE_SECRET_KEY}
      - REDIS_URL=redis://ecommerce-redis:6379/0
      - CELERY_BROKER_URL=redis://ecommerce-redis:6379/1
      - CELERY_RESULT_BACKEND=redis://ecommerce-redis:6379/2
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    volumes:
      - ecommerce-db:/app/data
      - ecommerce-uploads:/app/uploads
    depends_on:
      - ecommerce-redis
      - ecommerce-backend
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 1: E-COMMERCE - CELERY BEAT (SCHEDULER)
  # ============================================
  ecommerce-celery-beat:
    build:
      context: ../app1-ecommerce/backend
      dockerfile: ../../deployment/app1-ecommerce/backend/Dockerfile
    container_name: ecommerce-celery-beat
    command: celery -A app.tasks.celery_app beat --loglevel=info
    environment:
      - APP_ENV=production
      - CELERY_BROKER_URL=redis://ecommerce-redis:6379/1
    depends_on:
      - ecommerce-redis
      - ecommerce-celery-worker
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 1: E-COMMERCE - REDIS
  # ============================================
  ecommerce-redis:
    image: redis:7-alpine
    container_name: ecommerce-redis
    command: redis-server --appendonly yes
    volumes:
      - ecommerce-redis-data:/data
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 2: MACHINING - FRONTEND
  # ============================================
  machining-frontend:
    build:
      context: ../app2-machining/frontend
      dockerfile: ../../deployment/app2-machining/frontend/Dockerfile
    container_name: machining-frontend
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=${MACHINING_API_URL}
      - REACT_APP_PORTAL_URL=${MACHINING_PORTAL_URL}
    volumes:
      - machining-static:/app/build/static
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 2: MACHINING - BACKEND
  # ============================================
  machining-backend:
    build:
      context: ../app2-machining/backend
      dockerfile: ../../deployment/app2-machining/backend/Dockerfile
    container_name: machining-backend
    environment:
      - APP_ENV=production
      - DATABASE_URL=sqlite:///data/database.db
      - SECRET_KEY=${MACHINING_SECRET_KEY}
      - JWT_SECRET=${MACHINING_JWT_SECRET}
      - REDIS_URL=redis://machining-redis:6380/0
      - CELERY_BROKER_URL=redis://machining-redis:6380/1
      - CELERY_RESULT_BACKEND=redis://machining-redis:6380/2
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
      - MAIL_FROM_EMAIL=${MACHINING_MAIL_FROM}
      - FRONTEND_URL=${MACHINING_FRONTEND_URL}
      - PORTAL_URL=${MACHINING_PORTAL_URL}
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    volumes:
      - machining-db:/app/data
      - machining-uploads:/app/uploads
    depends_on:
      - machining-redis
    networks:
      - app_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============================================
  # APP 2: MACHINING - CELERY WORKER
  # ============================================
  machining-celery-worker:
    build:
      context: ../app2-machining/backend
      dockerfile: ../../deployment/app2-machining/backend/Dockerfile
    container_name: machining-celery-worker
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - APP_ENV=production
      - DATABASE_URL=sqlite:///data/database.db
      - SECRET_KEY=${MACHINING_SECRET_KEY}
      - REDIS_URL=redis://machining-redis:6380/0
      - CELERY_BROKER_URL=redis://machining-redis:6380/1
      - CELERY_RESULT_BACKEND=redis://machining-redis:6380/2
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
    volumes:
      - machining-db:/app/data
      - machining-uploads:/app/uploads
    depends_on:
      - machining-redis
      - machining-backend
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 2: MACHINING - CELERY BEAT (SCHEDULER)
  # ============================================
  machining-celery-beat:
    build:
      context: ../app2-machining/backend
      dockerfile: ../../deployment/app2-machining/backend/Dockerfile
    container_name: machining-celery-beat
    command: celery -A app.tasks.celery_app beat --loglevel=info
    environment:
      - APP_ENV=production
      - CELERY_BROKER_URL=redis://machining-redis:6380/1
    depends_on:
      - machining-redis
      - machining-celery-worker
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # APP 2: MACHINING - REDIS
  # ============================================
  machining-redis:
    image: redis:7-alpine
    container_name: machining-redis
    command: redis-server --port 6380 --appendonly yes
    volumes:
      - machining-redis-data:/data
    networks:
      - app_network
    restart: unless-stopped

  # ============================================
  # SHARED SERVICES - MINIO (Object Storage)
  # ============================================
  minio:
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
    networks:
      - app_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  app_network:
    driver: bridge

volumes:
  ecommerce-db:
    driver: local
  ecommerce-uploads:
    driver: local
  ecommerce-static:
    driver: local
  ecommerce-redis-data:
    driver: local
  machining-db:
    driver: local
  machining-uploads:
    driver: local
  machining-static:
    driver: local
  machining-redis-data:
    driver: local
  minio-data:
    driver: local
```

### Development Overrides (docker-compose.override.yml)
```yaml
version: '3.8'

services:
  # Development: Hot-reloading for frontend
  ecommerce-frontend:
    build:
      dockerfile: ../../deployment/app1-ecommerce/frontend/Dockerfile.dev
    volumes:
      - ../app1-ecommerce/frontend/src:/app/src
      - ../app1-ecommerce/frontend/public:/app/public
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true

  # Development: Hot-reloading for backend
  ecommerce-backend:
    build:
      dockerfile: ../../deployment/app1-ecommerce/backend/Dockerfile.dev
    volumes:
      - ../app1-ecommerce/backend/app:/app/app
    ports:
      - "8001:8000"
    environment:
      - APP_ENV=development
      - DEBUG=true
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  machining-frontend:
    build:
      dockerfile: ../../deployment/app2-machining/frontend/Dockerfile.dev
    volumes:
      - ../app2-machining/frontend/src:/app/src
      - ../app2-machining/frontend/public:/app/public
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true

  machining-backend:
    build:
      dockerfile: ../../deployment/app2-machining/backend/Dockerfile.dev
    volumes:
      - ../app2-machining/backend/app:/app/app
    ports:
      - "8002:8000"
    environment:
      - APP_ENV=development
      - DEBUG=true
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Development email server
  mailhog:
    image: mailhog/mailhog
    container_name: mailhog
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - app_network
```

---

## 4. Dockerfiles

### Backend Dockerfile (Production)
```dockerfile
# deployment/app1-ecommerce/backend/Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for data and uploads
RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Backend Dockerfile (Development)
```dockerfile
# deployment/app1-ecommerce/backend/Dockerfile.dev
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-dev.txt

COPY . .

RUN mkdir -p /app/data /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Frontend Dockerfile (Production)
```dockerfile
# deployment/app1-ecommerce/frontend/Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for environment
ARG REACT_APP_API_URL
ARG REACT_APP_STRIPE_PUBLIC_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_STRIPE_PUBLIC_KEY=$REACT_APP_STRIPE_PUBLIC_KEY

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Frontend Dockerfile (Development)
```dockerfile
# deployment/app1-ecommerce/frontend/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Frontend Nginx Config
```nginx
# deployment/app1-ecommerce/frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

---

## 5. Nginx Reverse Proxy Configuration

### Main nginx.conf
```nginx
# deployment/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript application/x-javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Include virtual hosts
    include /etc/nginx/conf.d/*.conf;
}
```

### E-Commerce App Config
```nginx
# deployment/nginx/conf.d/ecommerce.conf

# Upstream definitions
upstream ecommerce_frontend {
    server ecommerce-frontend:80;
}

upstream ecommerce_backend {
    server ecommerce-backend:8000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name shop.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name shop.example.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/ecommerce.crt;
    ssl_certificate_key /etc/nginx/ssl/ecommerce.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Client max body size for file uploads
    client_max_body_size 50M;

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://ecommerce_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Auth routes with stricter rate limiting
    location /api/v1/auth/login {
        limit_req zone=login burst=5 nodelay;

        proxy_pass http://ecommerce_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Stripe webhooks
    location /api/v1/webhooks/stripe {
        proxy_pass http://ecommerce_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Don't buffer webhook requests
        proxy_buffering off;
    }

    # Static files from backend (uploads)
    location /uploads/ {
        proxy_pass http://ecommerce_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Frontend (React SPA)
    location / {
        proxy_pass http://ecommerce_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

### Machining App Config
```nginx
# deployment/nginx/conf.d/machining.conf

upstream machining_frontend {
    server machining-frontend:80;
}

upstream machining_backend {
    server machining-backend:8000;
}

# HTTP redirect
server {
    listen 80;
    server_name precision-engine.example.com portal.precision-engine.example.com;
    return 301 https://$server_name$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    server_name precision-engine.example.com;

    ssl_certificate /etc/nginx/ssl/machining.crt;
    ssl_certificate_key /etc/nginx/ssl/machining.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    add_header Strict-Transport-Security "max-age=63072000" always;

    client_max_body_size 100M;  # Larger for dyno data files

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://machining_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120;  # Longer timeout for reports
    }

    # Static files / uploads
    location /uploads/ {
        proxy_pass http://machining_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Frontend
    location / {
        proxy_pass http://machining_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Customer Portal (subdomain)
server {
    listen 443 ssl http2;
    server_name portal.precision-engine.example.com;

    ssl_certificate /etc/nginx/ssl/machining.crt;
    ssl_certificate_key /etc/nginx/ssl/machining.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=63072000" always;

    client_max_body_size 50M;

    # Portal API routes
    location /api/v1/portal/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://machining_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth routes for portal
    location /api/v1/auth/ {
        limit_req zone=login burst=5 nodelay;

        proxy_pass http://machining_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Portal frontend
    location / {
        proxy_pass http://machining_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Environment Variables Template

```bash
# deployment/.env.example

# ============================================
# GENERAL
# ============================================
COMPOSE_PROJECT_NAME=precision-apps
NODE_ENV=production

# ============================================
# APP 1: E-COMMERCE
# ============================================
ECOMMERCE_SECRET_KEY=your-super-secret-key-change-in-production
ECOMMERCE_JWT_SECRET=your-jwt-secret-change-in-production
ECOMMERCE_API_URL=https://shop.example.com/api/v1
ECOMMERCE_FRONTEND_URL=https://shop.example.com
ECOMMERCE_MAIL_FROM=noreply@shop.example.com

# ============================================
# APP 2: MACHINING
# ============================================
MACHINING_SECRET_KEY=your-super-secret-key-change-in-production
MACHINING_JWT_SECRET=your-jwt-secret-change-in-production
MACHINING_API_URL=https://precision-engine.example.com/api/v1
MACHINING_FRONTEND_URL=https://precision-engine.example.com
MACHINING_PORTAL_URL=https://portal.precision-engine.example.com
MACHINING_MAIL_FROM=info@precision-engine.example.com

# ============================================
# STRIPE (Shared)
# ============================================
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ============================================
# EMAIL (SendGrid)
# ============================================
SENDGRID_API_KEY=SG.xxx

# ============================================
# SMS (Twilio)
# ============================================
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# ============================================
# OBJECT STORAGE (MinIO)
# ============================================
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# ============================================
# DATABASE BACKUP
# ============================================
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=backups
```

---

## 7. Deployment Scripts

### Database Initialization
```bash
#!/bin/bash
# deployment/scripts/init-db.sh

set -e

echo "Initializing databases..."

# E-commerce database
docker compose exec ecommerce-backend python -c "
from app.db.database import init_db
import asyncio
asyncio.run(init_db())
print('E-commerce database initialized')
"

# Machining database
docker compose exec machining-backend python -c "
from app.db.database import init_db
import asyncio
asyncio.run(init_db())
print('Machining database initialized')
"

echo "Creating admin users..."

# Create admin for e-commerce
docker compose exec ecommerce-backend python scripts/create_admin.py \
    --email admin@shop.example.com \
    --password changeme123

# Create admin for machining
docker compose exec machining-backend python scripts/create_admin.py \
    --email admin@precision-engine.example.com \
    --password changeme123

echo "Database initialization complete!"
```

### Database Backup
```bash
#!/bin/bash
# deployment/scripts/backup-db.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

echo "Starting database backup..."

# Backup E-commerce database
docker compose exec -T ecommerce-backend sqlite3 /app/data/database.db ".backup '/tmp/backup.db'"
docker compose cp ecommerce-backend:/tmp/backup.db "${BACKUP_DIR}/ecommerce_${TIMESTAMP}.db"

# Backup Machining database
docker compose exec -T machining-backend sqlite3 /app/data/database.db ".backup '/tmp/backup.db'"
docker compose cp machining-backend:/tmp/backup.db "${BACKUP_DIR}/machining_${TIMESTAMP}.db"

# Compress backups
gzip "${BACKUP_DIR}/ecommerce_${TIMESTAMP}.db"
gzip "${BACKUP_DIR}/machining_${TIMESTAMP}.db"

# Upload to MinIO/S3 (optional)
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    docker compose exec minio mc cp "${BACKUP_DIR}/ecommerce_${TIMESTAMP}.db.gz" "local/${BACKUP_S3_BUCKET}/"
    docker compose exec minio mc cp "${BACKUP_DIR}/machining_${TIMESTAMP}.db.gz" "local/${BACKUP_S3_BUCKET}/"
fi

# Clean old backups
find "${BACKUP_DIR}" -name "*.db.gz" -mtime +${BACKUP_RETENTION_DAYS:-30} -delete

echo "Backup complete: ${TIMESTAMP}"
```

### Full Deployment Script
```bash
#!/bin/bash
# deployment/scripts/deploy.sh

set -e

echo "=========================================="
echo "Starting deployment..."
echo "=========================================="

# Pull latest code
git pull origin main

# Build images
echo "Building Docker images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Stop old containers gracefully
echo "Stopping old containers..."
docker compose down --remove-orphans

# Start new containers
echo "Starting new containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "Running migrations..."
docker compose exec ecommerce-backend alembic upgrade head
docker compose exec machining-backend alembic upgrade head

# Clear caches
echo "Clearing caches..."
docker compose exec ecommerce-redis redis-cli FLUSHDB
docker compose exec machining-redis redis-cli -p 6380 FLUSHDB

# Health check
echo "Running health checks..."
curl -f http://localhost/health || exit 1

echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
```

---

## 8. Monitoring & Logging

### Logging Configuration
```yaml
# Add to docker-compose.yml services
services:
  # Loki for log aggregation
  loki:
    image: grafana/loki:2.9.0
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki
    networks:
      - app_network

  # Promtail for log collection
  promtail:
    image: grafana/promtail:2.9.0
    container_name: promtail
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml:ro
    networks:
      - app_network

  # Grafana for visualization
  grafana:
    image: grafana/grafana:10.0.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - app_network
```

---

## 9. Production Checklist

### Pre-Deployment
- [ ] Generate strong secrets for all `SECRET_KEY` and `JWT_SECRET` values
- [ ] Configure SSL certificates
- [ ] Set up DNS records
- [ ] Configure firewall rules
- [ ] Set up backup schedule
- [ ] Configure monitoring alerts

### Security
- [ ] Enable HTTPS only
- [ ] Set secure headers
- [ ] Configure rate limiting
- [ ] Set up WAF (optional)
- [ ] Enable audit logging
- [ ] Configure CORS properly

### Performance
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Set up CDN for static assets
- [ ] Configure connection pooling
- [ ] Set resource limits in Docker

### Monitoring
- [ ] Set up health checks
- [ ] Configure log aggregation
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up alerting

---

This Docker deployment architecture provides a complete, production-ready setup for both applications with proper isolation, security, and scalability considerations.
