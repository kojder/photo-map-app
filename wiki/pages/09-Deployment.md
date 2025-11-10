# Deployment Guide

> Complete deployment guide for Photo Map MVP - Docker Compose setup, Mikrus VPS deployment, SSL configuration, updates, and troubleshooting.

---

## 📖 Introduction

This guide describes the Docker Compose deployment strategy for Photo Map MVP on VPS hosting. The application runs in two containers (backend + frontend/nginx) with automatic SSL via provider proxy and shared PostgreSQL service.

**Deployment Strategy:**
- **Method:** Docker Compose (2 containers)
- **Target:** VPS hosting (4GB RAM recommended)
- **SSL:** Automatic (provider-managed wildcard domain)
- **PostgreSQL:** Shared service or dedicated instance
- **Storage:** Docker volume (photo-map-uploads)

**Related Pages:**
- [Architecture](Architecture) - System architecture overview
- [Development Setup](Development-Setup) - Local environment configuration
- [Scripts Reference](Scripts-Reference) - Build and deployment scripts

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Architecture](#deployment-architecture)
3. [Preparing .env](#preparing-env)
4. [Build Images Locally](#build-images-locally)
5. [Deploy to Mikrus VPS](#deploy-to-mikrus-vps)
6. [Deployment Verification](#deployment-verification)
7. [Updates and Maintenance](#updates-and-maintenance)
8. [SSL Configuration (Automatic)](#ssl-configuration-automatic)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### On local machine (development):
- ✅ Docker 20+ (for building images)
- ✅ Docker Compose 2+ (optional - only for local testing)
- ✅ SSH client (for connecting to Mikrus VPS)
- ✅ Java 17 JDK + Maven (for building backend JAR)
- ✅ Node.js 18+ + Angular CLI (for building frontend)

### On VPS:
- ✅ Docker + Docker Compose - installation via script
- ✅ SSH access - root access recommended
- ✅ PostgreSQL - Shared service or dedicated instance
- ✅ 4GB RAM - sufficient for Docker containers

### Required information from VPS provider:
- SSH host and port (e.g., `yourserver.example.com`, port `22` or custom)
- PostgreSQL credentials (check your provider's panel)
- Assigned ports for web services (check provider documentation)

---

## Deployment Architecture

### Docker Compose Services

```
docker-compose.yml
├── backend (photo-map-backend:latest)
│   ├── Port: 8080 (internal)
│   ├── Volume: photo-map-uploads (persistence)
│   └── Env: .env (PostgreSQL, JWT, Admin)
│
└── frontend (photo-map-frontend:latest)
    ├── Port: <your-assigned-port> (external - provider proxy)
    ├── Nginx + Angular SPA
    └── Proxy: /api → backend:8080
```

### SSL Architecture (Provider Proxy)

```
Internet (HTTPS)
    ↓
Provider Proxy (SSL termination - wildcard domain)
    ↓ HTTP
Frontend Container (nginx:80)
    ↓ HTTP (internal Docker network)
Backend Container (Spring Boot:8080)
    ↓
PostgreSQL (shared service or dedicated)
```

**Important:**
- Backend serves **HTTP** (port 8080 internal)
- Frontend nginx listens on **assigned port** (external, e.g., 30288 or your provider's port)
- Provider proxy adds SSL and redirects to `https://<your-domain>/`
- Users connect via HTTPS, containers see HTTP

### Volumes

```
photo-map-uploads/
├── input/      # Drop zone (web uploads)
├── original/   # Full resolution
├── medium/     # 300px thumbnails
└── failed/     # Processing errors
```

**Persistence:** Volume `/var/lib/docker/volumes/photo-map-uploads` survives container restarts

---

## Preparing .env

### Step 1: Copy template

```bash
cp deployment/.env.production.example deployment/.env
```

### Step 2: Fill in PostgreSQL credentials

Login to Mikrus panel: https://mikr.us/panel/?a=postgres

Copy:
- Database name: `db_xxxxx`
- Username: `userxxxxx`
- Password: `********`

Paste into `deployment/.env`:

```env
# Spring Boot datasource configuration (REQUIRED)
DB_HOST=psql01.mikr.us
DB_PORT=5432
DB_NAME=db_xxxxx
DB_USERNAME=userxxxxx
DB_PASSWORD=********

# Legacy JDBC URL format (for reference only)
DATABASE_URL=jdbc:postgresql://psql01.mikr.us:5432/db_xxxxx
DATABASE_USERNAME=userxxxxx
DATABASE_PASSWORD=********
```

**Important:** Spring Boot uses `DB_*` variables (not `DATABASE_URL`). Both versions are in `.env` for compatibility.

### Step 3: Generate JWT secret

```bash
openssl rand -base64 32
```

Paste the result into `deployment/.env`:

```env
JWT_SECRET=xK8vN2pQr5tYw9zA1bCdE3fGhI4jKlM6nOpRqS7uVxY=
```

### Step 4: Set frontend port

Check assigned ports in Mikrus panel (format: 201xx, 301xx).

```env
FRONTEND_PORT=30288
```

### Step 5: Set admin credentials

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
```

**Important:** Password must have minimum 8 characters (frontend validation).

---

## Build Images Locally

### Option A: Automatic script (recommended)

```bash
./deployment/scripts/build-images.sh
```

**Script performs:**
1. Build backend JAR: `./mvnw clean package -DskipTests`
2. Build frontend: `ng build --configuration production`
3. Build Docker image backend: `docker build -t photo-map-backend:latest backend/`
4. Build Docker image frontend: `docker build -t photo-map-frontend:latest frontend/`

### Option B: Manual build (step by step)

#### 1. Build backend JAR

```bash
./mvnw clean package -DskipTests
```

#### 2. Build backend Docker image

```bash
cd backend
docker build -t photo-map-backend:latest .
cd ..
```

#### 3. Build frontend Angular

```bash
cd frontend
ng build --configuration production
cd ..
```

#### 4. Build frontend Docker image

```bash
cd frontend
docker build -t photo-map-frontend:latest .
cd ..
```

#### 5. Verify images

```bash
docker images | grep photo-map
```

**Expected output:**
```
photo-map-backend   latest   abc123   2 minutes ago   300MB
photo-map-frontend  latest   def456   1 minute ago    50MB
```

---

## Deploy to Mikrus VPS

### Automated Deployment (Recommended)

**If you have a deployment helper script configured (e.g., `deployment/scripts/deploy-<yourhost>.sh`):**

```bash
# 1. Build Docker images locally
./deployment/scripts/build-images.sh

# 2. Deploy to your VPS
./deployment/scripts/deploy-<yourhost>.sh
```

**For initial setup with data reset:**
```bash
./deployment/scripts/deploy-<yourhost>.sh --init
```

**What `--init` flag does:**
- ⚠️ **DANGER**: Deletes ALL data (users, photos, ratings, files)
- Resets database schema
- Recreates upload directories
- Admin user will be created on backend startup from remote `.env`
- **Use ONLY for:** initial production setup, development environment reset

**Deployment script handles:**
- ✅ SSH connection to VPS
- ✅ Docker image transfer (save/load)
- ✅ Docker Compose configuration
- ✅ Container start/restart
- ✅ Health checks

**After deployment completes:**
- Application will be available at your configured URL
- Check deployment script output for exact URL

---

### Manual Deployment (Alternative)

**Use manual steps if you don't have a deployment helper script.**

#### Step 1: Install Docker on VPS (one-time)

```bash
# SSH to VPS
ssh root@<your-vps-host> -p <your-ssh-port>
# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version
```

#### Step 2: Transfer files to VPS

```bash
# Transfer docker-compose.yml + .env
scp -P <ssh-port> deployment/docker-compose.yml root@<your-vps-host>:/opt/photo-map/
scp -P <ssh-port> deployment/.env root@<your-vps-host>:/opt/photo-map/

# Verify
ssh root@<your-vps-host> -p <ssh-port> "ls -la /opt/photo-map/"
```

#### Step 3: Transfer Docker images

**Option A: Save/Load (recommended for first deployment)**

```bash
# Save images locally
docker save photo-map-backend:latest | gzip > photo-map-backend.tar.gz
docker save photo-map-frontend:latest | gzip > photo-map-frontend.tar.gz

# Transfer to VPS
scp -P <ssh-port> photo-map-backend.tar.gz root@<your-vps-host>:/opt/photo-map/
scp -P <ssh-port> photo-map-frontend.tar.gz root@<your-vps-host>:/opt/photo-map/

# SSH to VPS and load images
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map
docker load < photo-map-backend.tar.gz
docker load < photo-map-frontend.tar.gz

# Verify
docker images | grep photo-map

# Cleanup
rm photo-map-*.tar.gz
```

**Option B: Docker Registry (optional, for subsequent updates)**

You can use Docker Hub or GitHub Container Registry for simpler updates.

#### Step 4: Start Docker Compose

```bash
# SSH to VPS (if not already connected)
ssh root@<your-vps-host> -p <ssh-port>

# Navigate to deployment directory
cd /opt/photo-map

# Start containers (detached mode)
docker compose up -d

# Check status
docker compose ps

# Expected output:
# NAME                  STATUS          PORTS
# photo-map-backend     Up 10 seconds   0.0.0.0:8080->8080/tcp
# photo-map-frontend    Up 10 seconds   0.0.0.0:<your-port>->80/tcp
```

#### Step 5: Verify logs

```bash
# Backend logs
docker compose logs backend -f

# Expected output:
# Started PhotoMapApplication in X seconds
# Flyway migration completed successfully

# Frontend logs
docker compose logs frontend -f

# Ctrl+C to exit

# All logs
docker compose logs -f
```

---

## Deployment Verification

### 1. Backend Health Check

```bash
# SSH to VPS
ssh root@<your-vps-host> -p <ssh-port>

# Health check (internal)
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}
```

### 2. Frontend Availability

```bash
# Test HTTPS access (replace with your actual domain)
curl https://<your-domain>/

# Expected: Angular index.html
```

### 3. API Connectivity (End-to-End)

```bash
# Test login endpoint (replace with your domain and actual password)
curl -X POST https://<your-domain>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Expected: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 4. Upload Photos (Web Interface)

1. Open browser: `https://<your-domain>/` (replace with your actual domain)
2. Log in (admin credentials from remote `.env`)
3. Navigate to `/gallery`
4. Click "Upload Photos"
5. Select a JPG/PNG photo with GPS EXIF
6. Verify it appears in gallery and on map

### 5. Docker Status

```bash
# Check running containers
docker compose ps

# Check resource usage
docker stats

# Check volumes
docker volume ls | grep photo-map
```

---

## Updates and Maintenance

### Update Backend (after code changes)

```bash
# 1. Build JAR + Docker image locally
./mvnw clean package -DskipTests
docker build -t photo-map-backend:latest backend/

# 2. Save image
docker save photo-map-backend:latest | gzip > photo-map-backend.tar.gz

# 3. Transfer to VPS
scp -P <ssh-port> photo-map-backend.tar.gz root@<your-vps-host>:/opt/photo-map/

# 4. SSH to VPS and update
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map
docker load < photo-map-backend.tar.gz
docker compose up -d backend

# 5. Verify
docker compose logs backend -f
```

### Update Frontend (after UI changes)

```bash
# 1. Build Angular + Docker image locally
ng build --configuration production
docker build -t photo-map-frontend:latest frontend/

# 2. Save image
docker save photo-map-frontend:latest | gzip > photo-map-frontend.tar.gz

# 3. Transfer to VPS
scp -P <ssh-port> photo-map-frontend.tar.gz root@<your-vps-host>:/opt/photo-map/

# 4. SSH to VPS and update
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map
docker load < photo-map-frontend.tar.gz
docker compose up -d frontend

# 5. Verify
curl https://<your-domain>/
```

### Restart All Containers

```bash
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map
docker compose restart
```

**Important:** `docker compose restart` does **NOT** load new variables from `.env`. If you changed `.env`, use:

```bash
docker compose down && docker compose up -d
```

### Update Environment Variables (.env)

After changing environment variables in `deployment/.env`:

```bash
# 1. Transfer updated .env to VPS
scp -P <ssh-port> deployment/.env root@<your-vps-host>:/opt/photo-map/

# 2. Recreate containers (restart is not enough!)
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map
docker compose down
docker compose up -d

# 3. Verify new env variables
docker exec photo-map-backend env | grep YOUR_VARIABLE
```

### Stop All Containers

```bash
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map
docker compose down
```

### Clean Rebuild (reset volumes)

```bash
ssh root@<your-vps-host> -p <ssh-port>
cd /opt/photo-map

# Stop and remove containers + volumes
docker compose down -v

# Start fresh
docker compose up -d
```

### Initial Setup / Full Reset with --init Flag

⚠️ **DANGER ZONE** - Reset ALL data on production server

**Use ONLY for:**
- Initial production setup
- Development environment reset
- Testing scenarios

**What `--init` does:**
1. Resets database (TRUNCATE users, photos, ratings)
2. Deletes all physical files from uploads/
3. Resets settings to defaults
4. Deploys application
5. Admin user recreated automatically from remote `.env`

**Usage:**

```bash
# If you have a deployment helper script:
./deployment/scripts/deploy-<yourhost>.sh --init

# Generic syntax (using deploy.sh directly):
./deployment/scripts/deploy.sh <srv_host> <ssh_port> --init
```

**Safety features:**
- ✅ Requires interactive confirmation
- ✅ **Production**: Must type EXACT hostname
- ✅ Shows clear warning before execution
- ✅ Cannot be bypassed with flags

**Example workflow:**

```bash
# 1. Build images locally
./deployment/scripts/build-images.sh

# 2. Deploy with data reset (first deployment or reset scenario)
./deployment/scripts/deploy.sh <your-vps-host> <ssh-port> --init

# Output:
# ⚠️  WARNING: This will DELETE ALL DATA on <your-vps-host>
# To confirm, type the EXACT server hostname: <your-vps-host>
# > <your-vps-host>
#
# ✓ Confirmation accepted. Proceeding with data reset...
# Step INIT: Resetting data on remote server...
# ✓ Remote data reset completed
# Step 1: Checking Docker images...
# ...

# 3. Verify deployment
curl https://<your-domain>/
```

**Help:**

```bash
# Show help for deployment script
./deployment/scripts/deploy.sh --help

# Or for your custom helper:
./deployment/scripts/deploy-<yourhost>.sh --help
```

---

## SSL Configuration (Automatic)

**Status:** ✅ Automatic - Most VPS providers (including Mikrus) offer SSL for shared domains

### Shared domain setup

- **Domain format:** `<server>-<port>.<provider-domain>` (e.g., `srv01-30100.example.com`)
- **Automatic SSL:** Provider offers SSL certificate for wildcard domains
- **Configuration:** Zero - SSL works automatically
- **Access:** `https://<your-subdomain>.<provider-domain>/` (replace with your actual domain)

**Ports configuration:**
- Check your provider's documentation for assigned ports
- Shared domains usually require specific port ranges (not default port 80)
- Set `FRONTEND_PORT` in `.env` to your assigned port

### Verify SSL

```bash
# Test HTTPS access (replace with your actual domain)
curl https://<your-domain>/

# Test SSL certificate (replace with your actual domain)
openssl s_client -connect <your-domain>:443 -servername <your-domain> < /dev/null | grep subject

# Expected: subject=CN=*.<provider-domain>
```

---

## Troubleshooting

### Problem 1: Backend won't start (container exits)

**Symptom:**
```bash
docker compose ps
# photo-map-backend   Exited (1)
```

**Diagnostic:**
```bash
# Check logs
docker compose logs backend

# Common errors:
# - "Connection refused" → PostgreSQL credentials wrong
# - "Port 8080 already in use" → kill existing process
```

**Solutions:**

**A. PostgreSQL connection error**
```bash
# Verify .env credentials
cat /opt/photo-map/.env | grep DATABASE

# Test PostgreSQL connection manually
psql -h psql01.mikr.us -U YOUR_USER -d YOUR_DB -p 5432
```

**B. Port conflict**
```bash
# Check what uses port 8080
lsof -i :8080

# Kill process or change BACKEND_PORT in .env
```

### Problem 2: Frontend 502 Bad Gateway

**Symptom:**
```bash
curl https://<your-domain>/
# 502 Bad Gateway
```

**Diagnostic:**
```bash
# Check if backend is running
docker compose ps backend
# Expected: Up

# Test backend health directly
curl http://localhost:8080/actuator/health
```

**Solutions:**

**A. Backend not running**
```bash
docker compose up -d backend
docker compose logs backend -f
```

**B. Network issue**
```bash
# Check Docker network
docker network ls | grep photo-map

# Recreate network
docker compose down
docker compose up -d
```

### Problem 3: Uploads not working

**Symptom:**
- Upload returns 202 Accepted
- After 10-15 seconds photo doesn't appear in gallery

**Diagnostic:**
```bash
# Check backend logs
docker compose logs backend | grep -i upload

# Check volume
docker volume inspect photo-map-uploads
```

**Solutions:**

**A. Volume permission issue**
```bash
# Enter backend container
docker compose exec backend bash

# Check uploads directory
ls -la /app/uploads/
```

### Problem 4: Out of memory

**Symptom:**
```bash
docker compose logs backend
# OutOfMemoryError: Java heap space
```

**Solutions:**

**A. Increase heap size (backend Dockerfile)**
```dockerfile
ENTRYPOINT ["java", "-Xms256m", "-Xmx2048m", "-jar", "app.jar"]
```

Rebuild image and redeploy.

---

## Useful Docker Commands

```bash
# Status of all containers
docker compose ps

# Logs of all services
docker compose logs -f

# Backend logs
docker compose logs backend -f

# Resource usage
docker stats

# Enter backend container
docker compose exec backend bash

# Restart service
docker compose restart backend

# Remove all containers + volumes
docker compose down -v

# List volumes
docker volume ls

# Inspect volume
docker volume inspect photo-map-uploads
```

---

## FAQ

### Q: Can I use native deployment instead of Docker?

**A:** Yes, but Docker Compose is simpler and recommended for Mikrus (4GB RAM sufficient).

### Q: How much space do containers take?

**A:**
- Backend image: ~300 MB (openjdk:17-jre-slim + JAR)
- Frontend image: ~50 MB (nginx:alpine + Angular build)
- Uploads volume: depends on number of photos (~5-8 MB/photo)

### Q: How to increase upload limit?

**A:** Nginx already has `client_max_body_size 50M`. If you need more:
1. Edit `frontend/nginx.conf`
2. Rebuild frontend image
3. Redeploy

---

## Useful Links

### Mikrus Wiki
- Shared domain (SSL): https://wiki.mikr.us/wspoldzielona_domena
- IPv6: https://wiki.mikr.us/o_co_chodzi_z_ipv6

### Project Documentation
- `.ai/tech-stack.md` - Deployment Stack specification
- `.ai/features/feature-deployment-mikrus.md` - Feature spec
- `PROGRESS_TRACKER.md` - Phase 6 tasks

### External Resources
- Docker Docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Nginx: https://nginx.org/en/docs/

---

**Last Updated:** 2025-11-10

**Source:** `deployment/README.md`
