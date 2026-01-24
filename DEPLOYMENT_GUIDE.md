# Deploying Apps to thelongo.casa (Proxmox CT 109 - webapps)

## Overview

This guide covers deploying web applications to `*.thelongo.casa` using:
- **Proxmox Container**: CT 109 (webapps) - 192.168.1.109
- **Cloudflare Tunnel**: Wildcard routing for `*.thelongo.casa`
- **GitHub Actions**: Self-hosted runner for CI/CD
- **Nginx**: Reverse proxy and static file serving

---

## Prerequisites

The following are already set up on CT 109:

- GitHub Actions self-hosted runner (runs as `runner` user)
- Node.js and npm
- Python 3.11 with venv support (`apt install python3.11-venv python3-pip`)
- Nginx
- Cloudflare tunnel routing `*.thelongo.casa` to this container

---

## Deployment Steps for a New App

### 1. Create the Nginx Site Config

SSH into the container:
```bash
pct enter 109
```

Create the nginx config:
```bash
sudo nano /etc/nginx/sites-available/myapp
```

**For a static site (React/Vue/etc):**
```nginx
server {
    listen 80;
    server_name myapp.thelongo.casa;

    root /var/www/myapp;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**For a static site + API backend:**
```nginx
server {
    listen 80;
    server_name myapp.thelongo.casa;

    root /var/www/myapp;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Create Systemd Service (for backends)

Skip this step if your app is frontend-only.

```bash
sudo nano /etc/systemd/system/myapp-api.service
```

**For a Python/FastAPI backend:**
```ini
[Unit]
Description=MyApp API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/myapp-backend
ExecStart=/var/www/myapp-backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

**For a Node.js backend:**
```ini
[Unit]
Description=MyApp API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/myapp-backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp-api
```

### 3. Create Directories and Set Permissions

```bash
sudo mkdir -p /var/www/myapp
sudo mkdir -p /var/www/myapp-backend  # if you have a backend
sudo chown -R runner:runner /var/www/myapp
sudo chown -R runner:runner /var/www/myapp-backend
```

### 4. Add Sudoers Entry for Runner

Allow the runner user to restart the service without a password:

```bash
echo 'runner ALL=(ALL) NOPASSWD: /bin/systemctl restart myapp-api, /bin/systemctl status myapp-api' | sudo tee /etc/sudoers.d/runner-myapp
```

### 5. Create GitHub Actions Workflow

In your repo, create `.github/workflows/deploy.yml`:

**Frontend Only:**
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
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build

      - name: Deploy
        run: |
          mkdir -p /var/www/myapp
          rm -rf /var/www/myapp/*
          cp -r frontend/dist/* /var/www/myapp/
```

**Frontend + Python Backend:**
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

      # Frontend
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build frontend
        working-directory: ./frontend
        run: npm run build

      - name: Deploy frontend
        run: |
          mkdir -p /var/www/myapp
          rm -rf /var/www/myapp/*
          cp -r frontend/dist/* /var/www/myapp/

      # Backend
      - name: Deploy backend
        run: |
          mkdir -p /var/www/myapp-backend
          rsync -av --delete --exclude '__pycache__' --exclude 'venv' --exclude '*.pyc' --exclude '.env' --exclude 'data' backend/ /var/www/myapp-backend/

      - name: Install backend dependencies
        run: |
          cd /var/www/myapp-backend
          python3 -m venv venv || true
          ./venv/bin/pip install -r requirements.txt

      - name: Create .env file
        run: |
          cd /var/www/myapp-backend
          mkdir -p data
          if [ ! -f .env ]; then
            echo 'DEBUG=false' > .env
            echo 'DATABASE_URL=sqlite+aiosqlite:///./data/myapp.db' >> .env
            # Add other env vars as needed
          fi
          sudo chown -R www-data:www-data data || true

      - name: Restart backend
        run: sudo systemctl restart myapp-api
```

---

## Troubleshooting

### Check service status
```bash
sudo systemctl status myapp-api
```

### View service logs
```bash
sudo journalctl -u myapp-api -n 50 --no-pager
```

### Test nginx config
```bash
sudo nginx -t
```

### Test backend locally
```bash
curl http://127.0.0.1:8001/health
```

### Test through nginx
```bash
curl -X POST http://localhost/api/v1/auth/login -H "Host: myapp.thelongo.casa"
```

### Common Issues

**502 Bad Gateway**: Backend service not running
```bash
sudo systemctl start myapp-api
sudo systemctl status myapp-api
```

**404 Not Found on API**: Check nginx proxy_pass - trailing slashes matter!
- `location /api/` with `proxy_pass http://127.0.0.1:8001/api/;` (both have trailing slash)

**Permission denied on data directory**:
```bash
sudo chown -R www-data:www-data /var/www/myapp-backend/data
```

**Python venv issues**:
```bash
rm -rf venv
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

---

## Current Apps

| App | Domain | Port | Service |
|-----|--------|------|---------|
| Joe Ritchey | joeritchey.thelongo.casa | 8001 | joeritchey-api |
| Buddha's BBQ | buddhasbbq.thelongo.casa | 3001 | (Next.js) |
| Fantasy | fantasy.thelongo.casa | - | Static |
| Velocode | velocode.thelongo.casa | - | Static |

---

## Quick Reference

```bash
# Enter container from Proxmox host
pct enter 109

# Restart a service
sudo systemctl restart myapp-api

# View logs
sudo journalctl -u myapp-api -f

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Check what's listening on ports
ss -tlnp
```
