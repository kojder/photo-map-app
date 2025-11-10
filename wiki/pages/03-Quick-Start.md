# Quick Start

> Get Photo Map MVP running in 5 minutes - minimal setup guide for developers.

---

## ✅ Prerequisites Checklist

**Before you start, ensure you have:**

- [ ] **Node.js 18+** (LTS) - [Download](https://nodejs.org/)
- [ ] **Java 17** (JDK) - [Download](https://adoptium.net/)
- [ ] **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/) or use Docker
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **Maven 3.8+** (usually comes with IDE) - [Download](https://maven.apache.org/)
- [ ] **npm 9+** or yarn (usually comes with Node.js)

**Optional:**
- IDE: VS Code (frontend), IntelliJ IDEA (backend)
- Docker & Docker Compose (for PostgreSQL)

**Quick Version Check:**
```bash
node --version    # Should be 18+
java --version    # Should be 17+
psql --version    # Should be 15+
git --version     # Any version
mvn --version     # Should be 3.8+
```

---

## 🚀 5-Step Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd photo-map-app
```

**What happens:**
- Clones the entire project to your local machine
- Project structure: `backend/`, `frontend/`, `scripts/`, `deployment/`

---

### Step 2: Setup Database

**Option A: Docker Compose (Recommended)**

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Verify PostgreSQL is running
docker-compose ps
```

**Database will be available at:**
- Host: `localhost`
- Port: `5432`
- Database: `photomap`
- User: `photomap_user`
- Password: `photomap_pass`

**Option B: Local PostgreSQL**

```bash
# Create database and user
psql -U postgres
CREATE DATABASE photomap;
CREATE USER photomap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE photomap TO photomap_user;
\q
```

---

### Step 3: Backend Setup

```bash
cd backend

# Copy environment configuration
cp .env.example .env

# Edit .env file with your credentials
nano .env  # or use any editor
```

**Required .env variables:**
```bash
DB_URL=jdbc:postgresql://localhost:5432/photomap
DB_USERNAME=photomap_user
DB_PASSWORD=photomap_pass
JWT_SECRET=<generate-with-openssl>
STORAGE_PATH=./uploads
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

**Install dependencies and run:**
```bash
# Install dependencies
./mvnw clean install

# Run backend
./mvnw spring-boot:run
```

**Backend will start on:** http://localhost:8080

**Verify backend:**
- Open http://localhost:8080/swagger-ui/index.html
- You should see Swagger API documentation

---

### Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
ng serve
```

**Frontend will start on:** http://localhost:4200

**Verify frontend:**
- Open http://localhost:4200
- You should see the login page

---

### Step 5: First Login

**Use default admin credentials:**
- **Email:** `admin@example.com`
- **Password:** Check `.env` file for `ADMIN_PASSWORD` value

**After login:**
1. You'll be redirected to the Gallery page
2. Gallery will be empty (no photos yet)
3. Click **Upload** button to upload your first photo
4. Try uploading a photo with GPS metadata (e.g., from smartphone)
5. Check the Map view to see your photo location

**Success! You're ready to develop.**

---

## 🔧 Alternative: Using Development Scripts

**Faster startup for daily development:**

```bash
# Start backend + frontend (PostgreSQL must be running)
./scripts/start-dev.sh

# Start backend + frontend + PostgreSQL
./scripts/start-dev.sh --with-db

# Stop backend + frontend
./scripts/stop-dev.sh

# Stop everything including PostgreSQL
./scripts/stop-dev.sh --with-db
```

**Features:**
- Automatic process detection (checks if already running)
- PID tracking (`scripts/.pid/`)
- Graceful shutdown with timeout
- Log files (`scripts/.pid/backend.log`, `frontend.log`)

For more details, see [Scripts Reference](Scripts-Reference).

---

## ✅ Verification Checklist

**After completing all steps, verify:**

- [ ] Backend is running: http://localhost:8080/swagger-ui/index.html
- [ ] Frontend is running: http://localhost:4200
- [ ] Database is accessible: `psql -U photomap_user -d photomap -h localhost`
- [ ] You can log in with admin credentials
- [ ] Gallery page loads (even if empty)
- [ ] Map page loads (even if empty)

**If all checks pass, you're ready to develop!**

---

## 🆘 Quick Troubleshooting

### Backend won't start

**Check these common issues:**

1. **Port 8080 already in use:**
   ```bash
   # Find process using port 8080
   lsof -i :8080

   # Kill the process (replace PID)
   kill -9 <PID>
   ```

2. **Database connection failed:**
   - Check if PostgreSQL is running: `docker-compose ps` or `psql -U postgres`
   - Verify `.env` file credentials match database configuration
   - Check database URL: `DB_URL=jdbc:postgresql://localhost:5432/photomap`

3. **Flyway migration failed:**
   - Database might have old schema
   - Drop database and recreate: `DROP DATABASE photomap; CREATE DATABASE photomap;`
   - Restart backend: `./mvnw spring-boot:run`

### Frontend won't start

**Check these common issues:**

1. **Port 4200 already in use:**
   ```bash
   # Find process using port 4200
   lsof -i :4200

   # Kill the process (replace PID)
   kill -9 <PID>
   ```

2. **npm install failed:**
   - Delete `node_modules/` and `package-lock.json`
   - Run `npm install` again
   - Check Node.js version: `node --version` (should be 18+)

3. **Angular CLI not found:**
   ```bash
   # Install Angular CLI globally
   npm install -g @angular/cli
   ```

### Login failed

**Check these issues:**

1. **"Invalid credentials":**
   - Verify admin email: `admin@example.com`
   - Check password in `.env` file: `ADMIN_PASSWORD=...`
   - Password is case-sensitive

2. **"Account not activated":**
   - Admin account is created automatically on first startup
   - Check backend logs for errors
   - Restart backend: `./mvnw spring-boot:run`

3. **"Network error":**
   - Verify backend is running: http://localhost:8080/swagger-ui/index.html
   - Check browser console for CORS errors
   - Ensure frontend proxy is configured correctly

### Database issues

**PostgreSQL connection problems:**

1. **Docker Compose:**
   ```bash
   # Check if container is running
   docker-compose ps

   # Restart PostgreSQL
   docker-compose restart

   # View PostgreSQL logs
   docker-compose logs postgres
   ```

2. **Local PostgreSQL:**
   ```bash
   # Check PostgreSQL status
   systemctl status postgresql  # Linux
   brew services list           # macOS

   # Start PostgreSQL
   systemctl start postgresql   # Linux
   brew services start postgresql  # macOS
   ```

---

## 📚 Next Steps

**After successful setup:**

1. **[Development Setup](Development-Setup)** - Detailed environment configuration, project structure
2. **[Architecture](Architecture)** - Understand tech stack and design decisions
3. **[API Documentation](API-Documentation)** - Explore REST API with Swagger UI
4. **[Testing & Quality](Testing-Quality)** - Learn testing strategy and run tests
5. **[Scripts Reference](Scripts-Reference)** - Development scripts documentation

**Ready to contribute?**
- Read [Contributing](Contributing) guidelines
- Check [Architecture](Architecture) for design patterns
- Explore `.ai/` directory for implementation specs

---

## 💡 Tips

**Development Workflow:**
- Use `./scripts/start-dev.sh` for daily startup
- Use `./scripts/stop-dev.sh` when done
- PostgreSQL can stay running (low resource usage)

**Hot Reload:**
- Backend: Automatic reload with Spring Boot DevTools
- Frontend: Automatic reload with `ng serve`

**API Testing:**
- Use Swagger UI: http://localhost:8080/swagger-ui/index.html
- Use curl for quick tests (see [API Documentation](API-Documentation))

**Debugging:**
- Backend: Attach debugger to port 5005 (if configured)
- Frontend: Chrome DevTools (F12)

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (Getting Started section)
- `scripts/README.md` (Development scripts)
