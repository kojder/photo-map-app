# Feature: Deployment on Mikrus VPS (Docker Compose)

**Status:** 🚧 In Progress (Phase 6)
**Created:** 2025-10-27
**Priority:** High (MVP blocker)
**Strategy:** Docker Compose (containers), Manual (scripts)

---

## 🎯 Goal

Deploy Photo Map application on Mikrus VPS using:
- **Backend:** Spring Boot JAR in Docker container (photo-map-backend:latest)
- **Frontend:** Angular + nginx in Docker container (photo-map-frontend:latest)
- **Database:** Shared PostgreSQL (psql01.mikr.us) from Mikrus panel
- **Deployment:** Docker Compose + manual scripts (build-images.sh, deploy.sh)

---

## 📋 Requirements

### Mikrus VPS Requirements
- **Docker & Docker Compose** - installation via apt (already available)
- **Shared PostgreSQL** - credentials from panel: https://mikr.us/panel/?a=postgres
- **SSH access** - for deployment scripts
- **Ports:** 30288 (frontend external), internal networking for backend

### Resource Constraints (Mikrus)
- **RAM:** 4 GB (srv07 - marcin288) - Docker overhead ~100-200 MB
- **JVM heap:** -Xms256m -Xmx768m (in Dockerfile)
- **PostgreSQL:** Shared service (10-20 connections limit)
- **Disk:** ~250 GB limit (Docker images + volumes)

---

## 🏗️ Deployment Architecture (Docker Compose)

### Docker Containers

#### Backend Container (photo-map-backend)
```dockerfile
FROM openjdk:17-jre-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx768m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**Features:**
- Base image: openjdk:17-jre-slim (~200 MB)
- Port: 8080 (internal networking only)
- Volume: photo-map-uploads (mounted at /app/uploads/)
- Logs: docker logs photo-map-backend

#### Frontend Container (photo-map-frontend)
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build --configuration production

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/photo-map/browser /usr/share/nginx/html
EXPOSE 80
```

**nginx.conf:**
- SPA routing: try_files $uri $uri/ /index.html
- Reverse proxy: /api → http://backend:8080
- Static files: /usr/share/nginx/html

**Features:**
- Multi-stage build (node:18-alpine → nginx:alpine)
- Port: 80 (internal), 30288 (external on Mikrus)
- Reverse proxy to backend:8080 (internal Docker network)
- Logs: docker logs photo-map-frontend

### Docker Compose Setup
```yaml
version: '3.8'
services:
  backend:
    image: photo-map-backend:latest
    container_name: photo-map-backend
    env_file: .env
    volumes:
      - photo-map-uploads:/app/uploads
    restart: unless-stopped

  frontend:
    image: photo-map-frontend:latest
    container_name: photo-map-frontend
    ports:
      - "30288:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  photo-map-uploads:
```

### Volume Structure
```
photo-map-uploads/
├── input/      # Drop zone (web + batch)
├── original/   # Processed originals (full size)
├── medium/     # 300px thumbnails (gallery + map)
└── failed/     # Failed processing + logs
```

### Networking
- **Internal:** backend ↔ frontend (Docker network)
- **External:** frontend:30288 → Mikrus proxy → photos.tojest.dev
- **SSL:** Automatic via Mikrus proxy (*.wykr.es)
- **PostgreSQL:** backend → psql01.mikr.us:5432 (external service)

---

## 🔧 Deployment Strategy

### Strategy: Docker Compose + Manual Scripts

**Why Docker Compose?**
1. **Mikrus compatibility:** srv07 (marcin288) has 4GB RAM - Docker is OK
2. **Simpler management:** docker-compose up/down, zero conflicts with n8n
3. **Easy rollback:** keep old images, docker-compose up with previous tag
4. **Environment isolation:** containers have own networks, zero port collisions
5. **Similar workflow to n8n:** user already knows Docker Compose from n8n

**Why Manual Scripts?**
1. **MVP scope:** Full control, simpler testing
2. **No CI/CD complexity:** Scripts instead of GitHub Actions automation
3. **Iteration:** Quick deploy during development
4. **Post-MVP:** Can add CD later (GitHub Actions SSH deploy)

### Deployment Workflow

**First installation:**
```bash
# 1. Build Docker images locally
./deployment/scripts/build-images.sh

# 2. Configure .env (credentials PostgreSQL from panel)
# Edit: deployment/.env.production
# Values: DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, JWT_SECRET

# 3. Deploy to VPS (transfer images + start containers)
./deployment/scripts/deploy.sh
```

**Subsequent deployments (updates):**
```bash
# 1. Rebuild images (after code changes)
./deployment/scripts/build-images.sh

# 2. Deploy updated images
./deployment/scripts/deploy.sh
```

**Quick verification:**
```bash
# Check containers status
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'cd /opt/photo-map && docker compose ps'

# Check logs
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-backend --tail 50'
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-frontend --tail 50'
```

---

## 📦 Shared PostgreSQL (Mikrus)

### Connection Details (from panel)

Panel URL: https://mikr.us/panel/?a=postgres

**Credentials format:**
```env
DATABASE_URL=jdbc:postgresql://psql01.mikr.us:5432/db_xxxxx
DATABASE_USERNAME=userxxxxx
DATABASE_PASSWORD=xxxxxxxx
POSTGRES_DB=db_xxxxx
POSTGRES_PORT=5432
```

**Spring Boot application.properties:**
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

**Flyway migrations:**
- Automatic on application startup
- Migrations from `src/main/resources/db/migration/`
- Shared DB supports Flyway (verified with n8n deployment)

---

## 🔑 Environment Variables (.env.production)

**Required variables (Docker style):**
```env
# PostgreSQL (Shared Service - from Mikrus panel)
DATABASE_URL=jdbc:postgresql://psql01.mikr.us:5432/YOUR_DB
DATABASE_USERNAME=YOUR_USER
DATABASE_PASSWORD=YOUR_PASSWORD

# JWT
JWT_SECRET=<generate: openssl rand -base64 32>
JWT_EXPIRATION=86400000

# Application
SPRING_PROFILES_ACTIVE=production
SERVER_PORT=8080

# Upload Paths (Docker volume paths)
UPLOAD_INPUT_DIR=/app/uploads/input
UPLOAD_ORIGINAL_DIR=/app/uploads/original
UPLOAD_MEDIUM_DIR=/app/uploads/medium
UPLOAD_FAILED_DIR=/app/uploads/failed

# Admin
ADMIN_EMAIL=admin@example.com

# JVM Options (optional, override Dockerfile defaults)
JAVA_OPTS=-Xms256m -Xmx768m
```

**Note:** Upload paths use `/app/uploads/` (container path) mounted to `photo-map-uploads` Docker volume.

---

## 🚀 Deployment Scripts

### build-images.sh (Build Docker Images Locally)
```bash
#!/bin/bash
# Build backend JAR
cd backend
./mvnw clean package -DskipTests
cd ..

# Build Docker images
docker build -t photo-map-backend:latest backend/
docker build -t photo-map-frontend:latest frontend/

# Save images to tar files
docker save photo-map-backend:latest -o photo-map-backend.tar
docker save photo-map-frontend:latest -o photo-map-frontend.tar

echo "Images built and saved to .tar files"
```

### deploy.sh (Deploy to VPS)
```bash
#!/bin/bash
# Configuration (example - use marcin288 specific values)
MIKRUS_HOST="marcin288.mikrus.xyz"
MIKRUS_USER="root"
DEPLOY_DIR="~/photo-map"

# 1. Transfer images
scp photo-map-backend.tar photo-map-frontend.tar $MIKRUS_USER@$MIKRUS_HOST:$DEPLOY_DIR/

# 2. Transfer docker-compose.yml and .env
scp deployment/docker-compose.yml $MIKRUS_USER@$MIKRUS_HOST:$DEPLOY_DIR/
scp deployment/.env.production $MIKRUS_USER@$MIKRUS_HOST:$DEPLOY_DIR/.env

# 3. Load images and start containers
ssh $MIKRUS_USER@$MIKRUS_HOST << 'EOF'
  cd ~/photo-map
  docker load -i photo-map-backend.tar
  docker load -i photo-map-frontend.tar
  docker-compose down
  docker-compose up -d
  docker-compose ps
  docker logs photo-map-backend --tail 20
EOF

echo "Deployment complete!"
echo "Check status: ssh $MIKRUS_USER@$MIKRUS_HOST 'cd ~/photo-map && docker-compose ps'"
```

---

## 🧪 Testing & Verification

### Health Checks
1. **Backend health:** `docker logs photo-map-backend | grep "Started PhotoMapApplication"`
   - Expected: "Started PhotoMapApplication in X seconds"
2. **Frontend availability:** `curl https://photos.tojest.dev/`
   - Expected: Angular index.html
3. **API connectivity:** `curl https://photos.tojest.dev/api/photos` (with JWT)
   - Expected: 200 OK, photo list
4. **PostgreSQL:** Check backend logs for connection
   - `docker logs photo-map-backend | grep -i postgres`

### Docker Container Health
```bash
# Check containers status
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'cd /opt/photo-map && docker compose ps'
# Expected: both containers "Up"

# Check backend logs
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-backend --tail 50'

# Check frontend logs
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-frontend --tail 50'
```

### Auto-Restart Test
```bash
# Stop backend container
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker stop photo-map-backend'

# Wait 10 seconds
sleep 15

# Check if restarted (restart: unless-stopped policy)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker ps | grep photo-map-backend'
# Expected: container running
```

### Upload Test
1. **Web upload:** Upload photo through /gallery
2. **Batch upload:**
   ```bash
   # Copy to Docker volume via container
   ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker cp photo.jpg photo-map-backend:/app/uploads/input/'
   ```
3. **Verify processing:** Check volume
   ```bash
   ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker exec photo-map-backend ls -la /app/uploads/original/'
   ```
4. **Check database:** `SELECT * FROM photos WHERE fileName = 'photo.jpg'`

---

## 📊 Monitoring & Logs

### Docker Logs
```bash
# Real-time backend logs
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-backend -f'

# Last 100 lines (backend)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-backend --tail 100'

# Frontend logs (nginx access + error)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-frontend --tail 100'

# Errors only (backend)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker logs photo-map-backend 2>&1 | grep -i error'
```

### Container Stats
```bash
# Resource usage
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker stats --no-stream photo-map-backend photo-map-frontend'

# Disk usage
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker system df'

# Volume inspection
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker volume inspect photo-map-uploads'
```

### PostgreSQL Connection
```bash
# Check from backend container
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz 'docker exec photo-map-backend psql -h psql01.mikr.us -U YOUR_USER -d YOUR_DB -p 5432'
# Enter password from panel
```

---

## 🔒 Security Considerations

### Docker Containers
- ✅ Non-root user in containers (best practice - future enhancement)
- ✅ Internal networking: backend not exposed on external port
- ✅ Volume isolation: photo-map-uploads isolated from host filesystem
- ✅ Environment variables: .env file with chmod 600 on VPS

### Nginx (frontend container)
- ✅ Reverse proxy: /api → backend:8080 (internal Docker network)
- ✅ Upload size limit: `client_max_body_size 50M;` in nginx.conf
- ✅ Directory listing disabled: `autoindex off;`
- ✅ SSL: Automatic via Mikrus proxy for *.wykr.es

### PostgreSQL
- ✅ Shared service managed by Mikrus (automatic backups)
- ✅ Credentials in .env (not in Git, not in images)
- ✅ Connection via private network (psql01.mikr.us internal)

---

## 🚧 Known Limitations (MVP)

1. **No CDN** - Static files served from Mikrus (Poland latency)
2. **Single instance** - No load balancing (OK for MVP)
3. **Manual deployment** - No CI/CD automation (add later)
4. **Shared PostgreSQL limits** - 10-20 connections (Mikrus policy)
5. **Shared domain** - Mikrus `*.wykr.es` format: `srv07-30288.wykr.es`
6. **Port requirement** - Frontend exposed on 30288 (assigned by Mikrus)
7. **Custom subdomain** - photos.tojest.dev → port 30288 (configured in panel)
8. **Docker overhead** - ~100-200 MB RAM for Docker daemon + containers

**SSL:** ✅ Automatically provided by Mikrus for `*.wykr.es` domains (proxy SSL termination)

---

## 🔮 Post-MVP Enhancements

### SSL for Custom Domain (Priority: Low)
- **Required:** Own domain (e.g., `example.com`)
- Mikrus reverse proxy config for custom domain
- Let's Encrypt via Mikrus panel (automatic)
- **MVP:** Shared domain `*.wykr.es` has SSL automatically (zero configuration)

### CI/CD Automation (Priority: Medium)
- GitHub Actions workflow: build images → test → SSH deploy
- SSH key in GitHub Secrets
- Auto-deploy on merge to master
- Rollback: keep previous images, docker-compose up with old tag

### Docker Registry (Priority: Medium)
- Push images to Docker Hub or GitHub Container Registry
- Deploy via docker-compose pull (instead of SCP tar files)
- Faster deployment (no tar transfer)
- Version tagging: backend:v1.0.0, backend:v1.0.1

### Monitoring (Priority: Medium)
- Spring Boot Actuator metrics exposed from backend
- Prometheus + Grafana containers (lightweight setup)
- Docker stats monitoring (cAdvisor)
- Alerting: email on container down

---

## 📚 References

### Mikrus Wiki
- Reverse Proxy: https://wiki.mikr.us/reverse_proxy_na_nginx
- Background Processes: https://wiki.mikr.us/program_przestaje_dzialac_gdy_zamykam_ssh
- File Transfer: https://wiki.mikr.us/jak_wysylac_pliki_na_mikrusa
- PostgreSQL (Django): https://wiki.mikr.us/django_postgresql
- SSH Keys: https://wiki.mikr.us/uzywaj_kluczy_ssh

### Project Documentation
- `.ai/tech-stack.md` - Deployment Stack specification
- `.decisions/tech-decisions.md` - Deployment decisions rationale
- `PROGRESS_TRACKER.md` - Phase 6 tasks

---

**Document Purpose:** Feature specification for deployment on Mikrus VPS
**Related:** Phase 6 in PROGRESS_TRACKER.md
**Strategy:** Docker Compose (containers) + Manual (scripts)
**Last Updated:** 2025-10-27
