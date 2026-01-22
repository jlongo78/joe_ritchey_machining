# Deploying a New App to Your Proxmox Server                                                                                                                                                                                                                                                                                                              

This guide explains how to add a new app to your self-hosted deployment pipeline.

## Overview

Your setup:
- **Webapps container** (CT 109 - 192.168.1.109) hosts all demo/portfolio apps
- **Self-hosted GitHub runner** on the container handles builds and deployments
- **Cloudflare Tunnel** with wildcard routing exposes `*.thelongo.casa`
- **Nginx** routes traffic to the correct app

## Prerequisites

Before starting, ensure your repo is on GitHub under your account (`jlongo78`).

---

## Step 1: Determine Your App Type

### Static Site (Vite, Create React App, static Next.js export)
- Build output is just HTML/CSS/JS files
- No server-side code needed
- Examples: Vite, plain React, Vue, static HTML

### Server App (Next.js with API routes, Express, Node.js backend)
- Needs Node.js running to serve
- Has API routes or server-side rendering
- Examples: Next.js (non-static), Express, Fastify

---

## Step 2: Add the GitHub Actions Workflow

Create `.github/workflows/deploy.yml` in your repo:

### For Static Sites

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        run: |
          mkdir -p /var/www/YOUR_APP_NAME
          rm -rf /var/www/YOUR_APP_NAME/*
          cp -r dist/* /var/www/YOUR_APP_NAME/
```

> **Note:** Replace `dist` with your build output folder:
> - Vite: `dist`
> - Create React App: `build`
> - Next.js static export: `out`

### For Server Apps (Next.js, Express, etc.)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        run: |
          mkdir -p /var/www/YOUR_APP_NAME
          rm -rf /var/www/YOUR_APP_NAME/*
          cp -r . /var/www/YOUR_APP_NAME/

      - name: Restart app
        run: sudo systemctl restart YOUR_APP_NAME
```

---

## Step 3: Register the Runner with Your Repo

The runner is currently only registered with `buddhas_bbq`. For a new repo:

1. Go to your repo on GitHub
2. **Settings** → **Actions** → **Runners**
3. Click **New self-hosted runner**
4. Copy the token
5. SSH into Proxmox and run:

```bash
pct exec 109 -- su - runner -c 'cd /home/runner/actions-runner && \
  ./config.sh --url https://github.com/jlongo78/YOUR_REPO \
  --token YOUR_TOKEN \
  --unattended \
  --name webapps-runner \
  --labels self-hosted,linux,webapps \
  --replace'
```

**Alternative:** Set up an organization-level runner to avoid this per-repo.

---

## Step 4: Server Apps Only - Create a Systemd Service

For apps that need Node.js running (skip for static sites):

SSH into Proxmox and run:

```bash
pct exec 109 -- bash -c 'cat > /etc/systemd/system/YOUR_APP_NAME.service << EOF
[Unit]
Description=YOUR_APP_NAME
After=network.target

[Service]
Type=simple
User=runner
WorkingDirectory=/var/www/YOUR_APP_NAME
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=YOUR_PORT

[Install]
WantedBy=multi-user.target
EOF'

pct exec 109 -- systemctl daemon-reload
pct exec 109 -- systemctl enable YOUR_APP_NAME
pct exec 109 -- systemctl start YOUR_APP_NAME
```

Choose a unique port (3001 is used by buddhasbbq). Use 3002, 3003, etc.

Then add sudo permission for the runner to restart it:

```bash
pct exec 109 -- bash -c 'echo "runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart YOUR_APP_NAME" >> /etc/sudoers.d/runner'
```

---

## Step 5: Server Apps Only - Update Nginx Config

Add a proxy block to `/etc/nginx/sites-available/webapps`:

```bash
pct exec 109 -- nano /etc/nginx/sites-available/webapps
```

Add this server block:

```nginx
# YOUR_APP_NAME - Server app on port YOUR_PORT
server {
    listen 80;
    server_name YOUR_APP_NAME.thelongo.casa;

    location / {
        proxy_pass http://127.0.0.1:YOUR_PORT;
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

Then reload nginx:

```bash
pct exec 109 -- nginx -t && pct exec 109 -- systemctl reload nginx
```

---

## Step 6: Add DNS (if not using wildcard)

The wildcard `*.thelongo.casa` should already route all subdomains. If your app doesn't work:

1. Go to Cloudflare DNS for `thelongo.casa`
2. Add a CNAME record:
   - Name: `YOUR_APP_NAME`
   - Target: `daaa0956-17b9-48e2-8087-6235b4b82edb.cfargotunnel.com`
   - Proxy: ON

---

## Step 7: Environment Variables (if needed)

If your app needs a `.env` file:

```bash
pct exec 109 -- nano /var/www/YOUR_APP_NAME/.env
```

Add your variables, then restart the app:

```bash
pct exec 109 -- systemctl restart YOUR_APP_NAME
```

---

## Quick Reference

| App Type | Build Output | Needs Service? | Needs Nginx Proxy? |
|----------|--------------|----------------|-------------------|
| Vite/React (static) | `dist` | No | No (static serving) |
| Next.js static export | `out` | No | No (static serving) |
| Next.js (with API) | `.next` | Yes | Yes |
| Express/Node backend | N/A | Yes | Yes |

---

## Current Apps

| App | URL | Type | Port |
|-----|-----|------|------|
| Fantasy Playoff | https://fantasy.thelongo.casa | Static | N/A |
| Buddha's BBQ | https://buddhasbbq.thelongo.casa | Next.js Server | 3001 |

---

## Troubleshooting

### Check if app is running
```bash
pct exec 109 -- systemctl status YOUR_APP_NAME
```

### View logs
```bash
pct exec 109 -- journalctl -u YOUR_APP_NAME -f
```

### Check nginx config
```bash
pct exec 109 -- nginx -t
```

### Test locally inside container
```bash
pct exec 109 -- curl http://localhost:YOUR_PORT
```

### Restart everything
```bash
pct exec 109 -- systemctl restart YOUR_APP_NAME
pct exec 109 -- systemctl reload nginx
```