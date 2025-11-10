# Photo Map - Deployment Guide (Docker Compose)

**Strategy:** Docker Compose (backend + nginx/frontend)
**Target:** Mikrus VPS (4GB RAM, Shared PostgreSQL)
**Last Updated:** 2025-10-27

---

## 📋 Spis treści

1. [Wymagania wstępne](#wymagania-wstępne)
2. [Architektura deployment](#architektura-deployment)
3. [Przygotowanie .env](#przygotowanie-env)
4. [Build images lokalnie](#build-images-lokalnie)
5. [Deploy na Mikrus VPS](#deploy-na-mikrus-vps)
6. [Weryfikacja deployment](#weryfikacja-deployment)
7. [Updates i maintenance](#updates-i-maintenance)
8. [SSL Configuration (Automatyczne)](#ssl-configuration-automatyczne)
9. [Troubleshooting](#troubleshooting)

---

## Wymagania wstępne

### Na lokalnej maszynie (development):
- ✅ Docker 20+ (do budowania images)
- ✅ Docker Compose 2+ (opcjonalne - tylko do testów lokalnych)
- ✅ SSH client (do połączenia z Mikrus VPS)
- ✅ Java 17 JDK + Maven (do build backend JAR)
- ✅ Node.js 18+ + Angular CLI (do build frontend)

### Na Mikrus VPS:
- ✅ Docker + Docker Compose - instalacja przez skrypt
- ✅ SSH access - dostęp root
- ✅ PostgreSQL - Shared service (psql01.mikr.us)
- ✅ 4GB RAM - wystarczające dla Docker

### Wymagane informacje z panelu Mikrus:
- SSH host i port: `srvXX.mikr.us`, port `10XXX` (10000 + numer maszyny)
- PostgreSQL credentials: https://mikr.us/panel/?a=postgres
- Przydzielone porty: sprawdź w panelu (format: 201xx, 301xx)

---

## Architektura deployment

### Docker Compose Services

```
docker-compose.yml
├── backend (photo-map-backend:latest)
│   ├── Port: 8080 (internal)
│   ├── Volume: photo-map-uploads (persistence)
│   └── Env: .env (PostgreSQL, JWT, Admin)
│
└── frontend (photo-map-frontend:latest)
    ├── Port: 30288 (external - Mikrus proxy)
    ├── Nginx + Angular SPA
    └── Proxy: /api → backend:8080
```

### Architektura SSL (Mikrus Proxy)

```
Internet (HTTPS)
    ↓
Mikrus Proxy (SSL termination - *.wykr.es)
    ↓ HTTP
Frontend Container (nginx:80)
    ↓ HTTP (internal Docker network)
Backend Container (Spring Boot:8080)
    ↓
PostgreSQL (psql01.mikr.us - shared service)
```

**Ważne:**
- Backend serwuje **HTTP** (port 8080 internal)
- Frontend nginx nasłuchuje na **port 30288** (external)
- Mikrus proxy dodaje SSL i przekierowuje do `https://srv07-30288.wykr.es/`
- Użytkownicy łączą się przez HTTPS, kontenery widzą HTTP

### Volumes

```
photo-map-uploads/
├── input/      # Drop zone (web uploads)
├── original/   # Pełne rozdzielczości
├── medium/     # 300px thumbnails
└── failed/     # Błędy przetwarzania
```

**Persistence:** Volume `/var/lib/docker/volumes/photo-map-uploads` przetrwa restart kontenerów

---

## Przygotowanie .env

### Krok 1: Skopiuj template

```bash
cp deployment/.env.production.example deployment/.env
```

### Krok 2: Uzupełnij PostgreSQL credentials

Login do panelu Mikrus: https://mikr.us/panel/?a=postgres

Skopiuj:
- Database name: `db_xxxxx`
- Username: `userxxxxx`
- Password: `********`

Wklej do `deployment/.env`:

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

**Ważne:** Spring Boot używa `DB_*` zmiennych (nie `DATABASE_URL`). Obie wersje są w `.env` dla kompatybilności.

### Krok 3: Wygeneruj JWT secret

```bash
openssl rand -base64 32
```

Wklej wynik do `deployment/.env`:

```env
JWT_SECRET=xK8vN2pQr5tYw9zA1bCdE3fGhI4jKlM6nOpRqS7uVxY=
```

### Krok 4: Ustaw port frontendu

Sprawdź przydzielone porty w panelu Mikrus (format: 201xx, 301xx).

```env
FRONTEND_PORT=30288
```

### Krok 5: Ustaw admin credentials

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
```

**Ważne:** Hasło musi mieć minimum 8 znaków (walidacja frontendu).

---

## Build images lokalnie

### Opcja A: Skrypt automatyczny (zalecane)

```bash
./deployment/scripts/build-images.sh
```

**Skrypt wykonuje:**
1. Build backend JAR: `./mvnw clean package -DskipTests`
2. Build frontend: `ng build --configuration production`
3. Build Docker image backend: `docker build -t photo-map-backend:latest backend/`
4. Build Docker image frontend: `docker build -t photo-map-frontend:latest frontend/`

### Opcja B: Manual build (krok po kroku)

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

#### 5. Weryfikacja images

```bash
docker images | grep photo-map
```

**Expected output:**
```
photo-map-backend   latest   abc123   2 minutes ago   300MB
photo-map-frontend  latest   def456   1 minute ago    50MB
```

---

## Deploy na Mikrus VPS

### Krok 1: Instalacja Docker na VPS (jednorazowo)

```bash
# SSH to VPS
ssh root@srvXX.mikr.us -p 10XXX

# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version
```

### Krok 2: Transfer files na VPS

```bash
# Transfer docker-compose.yml + .env
scp -P 10XXX deployment/docker-compose.yml root@srvXX.mikr.us:/opt/photo-map/
scp -P 10XXX deployment/.env root@srvXX.mikr.us:/opt/photo-map/

# Verify
ssh root@srvXX.mikr.us -p 10XXX "ls -la /opt/photo-map/"
```

### Krok 3: Transfer Docker images

**Opcja A: Save/Load (zalecane dla pierwszego deployment)**

```bash
# Save images locally
docker save photo-map-backend:latest | gzip > photo-map-backend.tar.gz
docker save photo-map-frontend:latest | gzip > photo-map-frontend.tar.gz

# Transfer to VPS
scp -P 10XXX photo-map-backend.tar.gz root@srvXX.mikr.us:/opt/photo-map/
scp -P 10XXX photo-map-frontend.tar.gz root@srvXX.mikr.us:/opt/photo-map/

# SSH to VPS and load images
ssh root@srvXX.mikr.us -p 10XXX
cd /opt/photo-map
docker load < photo-map-backend.tar.gz
docker load < photo-map-frontend.tar.gz

# Verify
docker images | grep photo-map

# Cleanup
rm photo-map-*.tar.gz
```

**Opcja B: Docker Registry (opcjonalne, dla kolejnych updates)**

Możesz użyć Docker Hub lub GitHub Container Registry dla prostszych updates.

### Krok 4: Start Docker Compose

```bash
# SSH to VPS (jeśli nie jesteś już połączony)
ssh root@srvXX.mikr.us -p 10XXX

# Navigate to deployment directory
cd /opt/photo-map

# Start containers (detached mode)
docker compose up -d

# Check status
docker compose ps

# Expected output:
# NAME                  STATUS          PORTS
# photo-map-backend     Up 10 seconds   0.0.0.0:8080->8080/tcp
# photo-map-frontend    Up 10 seconds   0.0.0.0:30288->80/tcp
```

### Krok 5: Weryfikacja logów

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

## Weryfikacja deployment

### 1. Backend Health Check

```bash
# SSH to VPS
ssh root@srvXX.mikr.us -p 10XXX

# Health check (internal)
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}
```

### 2. Frontend Availability (przez Mikrus proxy)

```bash
# Test HTTPS access (zastąp srvXX i PORT własnymi wartościami)
curl https://srv07-30288.wykr.es/

# Expected: Angular index.html
```

### 3. API Connectivity (End-to-End)

```bash
# Test login endpoint
curl -X POST https://srv07-30288.wykr.es/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Expected: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 4. Upload Photos (Web Interface)

1. Otwórz przeglądarkę: `https://srv07-30288.wykr.es/`
2. Zaloguj się (admin credentials z .env)
3. Przejdź do `/gallery`
4. Kliknij "Upload Photos"
5. Wybierz zdjęcie JPG/PNG z GPS EXIF
6. Sprawdź czy pojawia się w gallery + na mapie

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

## Updates i maintenance

### Update Backend (po zmianach w kodzie)

```bash
# 1. Build JAR + Docker image lokalnie
./mvnw clean package -DskipTests
docker build -t photo-map-backend:latest backend/

# 2. Save image
docker save photo-map-backend:latest | gzip > photo-map-backend.tar.gz

# 3. Transfer to VPS
scp -P 10XXX photo-map-backend.tar.gz root@srvXX.mikr.us:/opt/photo-map/

# 4. SSH to VPS and update
ssh root@srvXX.mikr.us -p 10XXX
cd /opt/photo-map
docker load < photo-map-backend.tar.gz
docker compose up -d backend

# 5. Verify
docker compose logs backend -f
```

### Update Frontend (po zmianach w UI)

```bash
# 1. Build Angular + Docker image lokalnie
ng build --configuration production
docker build -t photo-map-frontend:latest frontend/

# 2. Save image
docker save photo-map-frontend:latest | gzip > photo-map-frontend.tar.gz

# 3. Transfer to VPS
scp -P 10XXX photo-map-frontend.tar.gz root@srvXX.mikr.us:/opt/photo-map/

# 4. SSH to VPS and update
ssh root@srvXX.mikr.us -p 10XXX
cd /opt/photo-map
docker load < photo-map-frontend.tar.gz
docker compose up -d frontend

# 5. Verify
curl https://srv07-30288.wykr.es/
```

### Restart All Containers

```bash
ssh root@srvXX.mikr.us -p 10XXX
cd /opt/photo-map
docker compose restart
```

**Ważne:** `docker compose restart` **NIE** wczytuje nowych zmiennych z `.env`. Jeśli zmieniłeś `.env`, użyj:

```bash
docker compose down && docker compose up -d
```

### Update Environment Variables (.env)

Po zmianie zmiennych środowiskowych w `deployment/.env`:

```bash
# 1. Transfer updated .env to VPS
scp -P 10XXX deployment/.env root@srvXX.mikr.us:/opt/photo-map/

# 2. Recreate containers (restart nie wystarczy!)
ssh root@srvXX.mikr.us -p 10XXX
cd /opt/photo-map
docker compose down
docker compose up -d

# 3. Verify new env variables
docker exec photo-map-backend env | grep YOUR_VARIABLE
```

### Stop All Containers

```bash
ssh root@srvXX.mikr.us -p 10XXX
cd /opt/photo-map
docker compose down
```

### Clean Rebuild (reset volumes)

```bash
ssh root@srvXX.mikr.us -p 10XXX
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
5. Admin user re-created automatically from remote `.env`

**Usage:**

```bash
# Deploy with full data reset (requires confirmation)
./deployment/scripts/deploy-marcin288.sh --init

# Generic syntax (for other VPS hosts)
./deployment/scripts/deploy.sh [srv_host] [ssh_port] --init
```

**Safety features:**
- ✅ Requires interactive confirmation
- ✅ **Production**: Must type EXACT hostname (e.g., `marcin288.mikrus.xyz`)
- ✅ Shows clear warning before execution
- ✅ Cannot be bypassed with flags

**Example workflow:**

```bash
# 1. Build images locally
./deployment/scripts/build-images.sh

# 2. Deploy with data reset (first deployment or reset scenario)
./deployment/scripts/deploy-marcin288.sh --init

# Output:
# ⚠️  WARNING: This will DELETE ALL DATA on marcin288.mikrus.xyz
# To confirm, type the EXACT server hostname: marcin288.mikrus.xyz
# > marcin288.mikrus.xyz
#
# ✓ Confirmation accepted. Proceeding with data reset...
# Step INIT: Resetting data on remote server...
# ✓ Remote data reset completed
# Step 1: Checking Docker images...
# ...

# 3. Verify deployment
curl https://photos.tojest.dev/
```

**Help:**

```bash
# Show help for deploy-marcin288.sh
./deployment/scripts/deploy-marcin288.sh --help
```

---

## SSL Configuration (Automatyczne)

**Status:** ✅ Automatyczne - Mikrus zapewnia SSL dla współdzielonych domen

### Współdzielona domena (*.wykr.es)

- **Format domeny:** `srvXX-PORT.wykr.es` (np. `srv07-30288.wykr.es`)
- **Automatyczny SSL:** Mikrus zapewnia certyfikat SSL dla `*.wykr.es`
- **Konfiguracja:** Zero - SSL działa automatycznie
- **Dostęp:** `https://srvXX-PORT.wykr.es/`
- **Dokumentacja:** https://wiki.mikr.us/wspoldzielona_domena

**Porty dla współdzielonej domeny:**
- Mikrus przydziela 2 porty na serwer (format: 201xx, 301xx)
- Sprawdź porty w panelu Mikrus
- Domyślny port 80 NIE działa z współdzieloną domeną
- Ustaw `FRONTEND_PORT` w `.env` (np. 30288)

### Weryfikacja SSL

```bash
# Test HTTPS access
curl https://srv07-30288.wykr.es/

# Test SSL certificate
openssl s_client -connect srv07-30288.wykr.es:443 -servername srv07-30288.wykr.es < /dev/null | grep subject

# Expected: subject=CN=*.wykr.es
```

---

## Troubleshooting

### Problem 1: Backend nie startuje (container exits)

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
curl https://srv07-30288.wykr.es/
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

### Problem 3: Uploads nie działają

**Symptom:**
- Upload returns 202 Accepted
- Po 10-15 sekundach zdjęcie nie pojawia się w gallery

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

Rebuild image i redeploy.

---

## Przydatne komendy Docker

```bash
# Status wszystkich kontenerów
docker compose ps

# Logi wszystkich serwisów
docker compose logs -f

# Logi backend
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

### Q: Czy mogę użyć native deployment zamiast Docker?

**A:** Tak, ale Docker Compose jest prostszy i zalecany dla Mikrus (4GB RAM wystarczające).

### Q: Ile miejsca zajmują kontenery?

**A:**
- Backend image: ~300 MB (openjdk:17-jre-slim + JAR)
- Frontend image: ~50 MB (nginx:alpine + Angular build)
- Uploads volume: zależy od liczby zdjęć (~5-8 MB/photo)

### Q: Jak zwiększyć upload limit?

**A:** Nginx już ma `client_max_body_size 50M`. Jeśli potrzebujesz więcej:
1. Edytuj `frontend/nginx.conf`
2. Rebuild frontend image
3. Redeploy

---

## Przydatne linki

### Mikrus Wiki
- Współdzielona domena (SSL): https://wiki.mikr.us/wspoldzielona_domena
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

**Last Updated:** 2025-10-27
**Version:** 2.0 (Docker Compose)
**Status:** ✅ Ready for deployment
