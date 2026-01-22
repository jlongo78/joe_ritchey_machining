# Next.js App Deployment Guide

Guide for deploying a Next.js application to your self-hosted server with GitHub Actions auto-deployment.

## Prerequisites

- GitHub repository with your Next.js app
- Self-hosted GitHub Actions runner already configured on your server
- Node.js 20+ installed on the server
- nginx installed and configured for reverse proxy
- Domain/subdomain pointing to your server

## Step 1: Prepare Your App

### Ensure build works locally

```bash
npm install
npm run build
```

### Fix common build issues

**SQLite instead of PostgreSQL (if applicable):**
- Change `prisma/schema.prisma` provider to `"sqlite"`
- Replace enums with String types (SQLite doesn't support enums)
- Replace Json fields with String (use JSON.stringify/parse)

**Environment variables at build time:**
- Don't throw errors for missing env vars at module import time
- Use lazy initialization for services like Stripe:

```typescript
// Bad - throws at build time
if (!process.env.API_KEY) throw new Error('API_KEY required');
export const client = new Client(process.env.API_KEY);

// Good - throws only when used
let _client: Client | null = null;
function getClient(): Client {
  if (!_client) {
    if (!process.env.API_KEY) throw new Error('API_KEY required');
    _client = new Client(process.env.API_KEY);
  }
  return _client;
}
```

## Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    env:
      NODE_OPTIONS: "--max-old-space-size=1024"
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        run: |
          rm -rf /var/www/YOUR_APP_NAME/*
          cp -r . /var/www/YOUR_APP_NAME/
          cd /var/www/YOUR_APP_NAME && npm ci --production

      - name: Restart app
        run: sudo systemctl restart YOUR_APP_NAME
```

**Replace:**
- `YOUR_APP_NAME` with your app's directory/service name

## Step 3: Server Configuration

### Create app directory

```bash
sudo mkdir -p /var/www/YOUR_APP_NAME
sudo chown runner:runner /var/www/YOUR_APP_NAME
```

### Create systemd service

Create `/etc/systemd/system/YOUR_APP_NAME.service`:

```ini
[Unit]
Description=YOUR_APP_NAME Next.js App
After=network.target

[Service]
Type=simple
User=runner
WorkingDirectory=/var/www/YOUR_APP_NAME
ExecStart=/usr/bin/node /var/www/YOUR_APP_NAME/node_modules/.bin/next start -p PORT_NUMBER
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
# Add your environment variables here:
Environment=DATABASE_URL=file:./prisma/dev.db
Environment=NEXTAUTH_SECRET=your-secret-here
Environment=NEXTAUTH_URL=https://your-domain.com

[Install]
WantedBy=multi-user.target
```

**Replace:**
- `YOUR_APP_NAME` with your app name
- `PORT_NUMBER` with unique port (3001, 3002, etc.)
- Add all required environment variables

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable YOUR_APP_NAME
sudo systemctl start YOUR_APP_NAME
```

### Grant sudo access for restart

```bash
echo "runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart YOUR_APP_NAME" | sudo tee /etc/sudoers.d/runner-YOUR_APP_NAME
sudo chmod 440 /etc/sudoers.d/runner-YOUR_APP_NAME
```

### Configure nginx

Create `/etc/nginx/sites-available/YOUR_APP_NAME`:

```nginx
server {
    listen 80;
    server_name your-subdomain.thelongo.casa;

    location / {
        proxy_pass http://127.0.0.1:PORT_NUMBER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/YOUR_APP_NAME /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Add SSL with Certbot

```bash
sudo certbot --nginx -d your-subdomain.thelongo.casa
```

## Step 4: Environment Variables

For sensitive env vars, you have options:

**Option A: In systemd service file** (shown above)

**Option B: Environment file**

Create `/var/www/YOUR_APP_NAME/.env.production`:

```
DATABASE_URL=...
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=...
```

Update service file:

```ini
EnvironmentFile=/var/www/YOUR_APP_NAME/.env.production
```

**Option C: GitHub Secrets** (for build-time vars only)

Add secrets in GitHub repo Settings → Secrets → Actions, then use in workflow:

```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

## Step 5: Push and Deploy

```bash
git add .
git commit -m "Add deployment workflow"
git push origin main
```

Monitor at: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

## Troubleshooting

### Build fails with heap out of memory

Increase memory limit in workflow:

```yaml
env:
  NODE_OPTIONS: "--max-old-space-size=2048"
```

Or add swap on server:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### TypeScript enum errors (SQLite)

Replace Prisma enum imports with string literal types:

```typescript
// Instead of importing from @prisma/client:
// import { Status } from '@prisma/client';

// Define your own:
export type Status = 'PENDING' | 'ACTIVE' | 'COMPLETED';
```

### Service won't start

Check logs:

```bash
sudo journalctl -u YOUR_APP_NAME -f
```

### 502 Bad Gateway

- Check if the app is running: `sudo systemctl status YOUR_APP_NAME`
- Check if port matches nginx config
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`

### Permission denied

Ensure runner user owns the directory:

```bash
sudo chown -R runner:runner /var/www/YOUR_APP_NAME
```

## Checklist

- [ ] App builds locally with `npm run build`
- [ ] `.github/workflows/deploy.yml` created
- [ ] App directory created: `/var/www/YOUR_APP_NAME`
- [ ] systemd service created and enabled
- [ ] sudo access granted for service restart
- [ ] nginx site configured
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] First push to main successful
- [ ] Site accessible at your domain
