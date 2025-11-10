# Development Scripts

> 📖 **Full documentation:** [Wiki - Scripts Reference](https://github.com/kojder/photo-map-app/wiki/Scripts-Reference)
>
> This file is a **quick reference** for development scripts.

Scripts for managing Photo Map MVP development environment.

## 🚀 Quick Start

### 1. Start Application
```bash
# Single command - PostgreSQL starts automatically if not running:
./scripts/start-dev.sh

# Alternatively with explicit --with-db flag (same behavior):
./scripts/start-dev.sh --with-db
```

**IMPORTANT:**
- ✅ **PostgreSQL starts automatically** if not running (docker-compose up -d)
- ✅ Flag `--with-db` is optional - automatic detection works without it
- `./scripts/stop-dev.sh` **does NOT stop PostgreSQL** - keeps running in background
- PostgreSQL stops only after `docker-compose down` or system restart

### 2. Stop Application (backend + frontend)
```bash
./scripts/stop-dev.sh
# PostgreSQL keeps running - this is normal!
```

### 3. Complete Shutdown (rarely needed)
```bash
./scripts/stop-dev.sh --with-db
# Stops backend + frontend + PostgreSQL
```

---

## 📜 Available Scripts

### `start-dev.sh`

Starts backend (Spring Boot) and frontend (Angular) in background.

**Basic usage:**
```bash
./scripts/start-dev.sh
```

**With PostgreSQL:**
```bash
./scripts/start-dev.sh --with-db
```

**Features:**
- ✅ Checks if processes are already running (avoids duplicates)
- ✅ Saves process PIDs to `scripts/.pid/`
- ✅ Waits for startup and verifies ports (no sudo - uses ss/lsof/nc fallback)
- ✅ Automatic health checks for backend and frontend
- ✅ Logs output to files: `scripts/.pid/backend.log`, `scripts/.pid/frontend.log`
- ✅ **Automatically starts PostgreSQL** if not running (docker-compose)
- ✅ Debug mode for diagnostics

**Requirements:**
- Docker + Docker Compose (for PostgreSQL - automatically started)
- Maven wrapper in `backend/mvnw`
- npm/Node.js for frontend

---

### `stop-dev.sh`

Stops backend and frontend with graceful shutdown.

**Basic usage:**
```bash
./scripts/stop-dev.sh
```

**With PostgreSQL:**
```bash
./scripts/stop-dev.sh --with-db
```

**Features:**
- ✅ Graceful shutdown (SIGTERM → timeout → SIGKILL)
- ✅ Finds processes by PID or port (no sudo - uses ss/lsof/netstat fallback)
- ✅ Timeout 30s for shutdown
- ✅ Automatic PID file cleanup
- ✅ Optionally stops PostgreSQL (docker-compose down)
- ✅ Debug mode for diagnostics

---

### `run-all-tests.sh`

Runs all tests: frontend unit, backend, and E2E.

**Basic usage:**
```bash
./scripts/run-all-tests.sh
```

**Features:**
- ✅ Automatically checks and starts test PostgreSQL (port 5433)
- ✅ Runs sequentially:
  - Frontend Unit Tests (Karma): `npm run test:coverage`
  - Backend Tests (Maven): `./mvnw test`
  - E2E Tests (Playwright): `npm run test:e2e`
- ✅ Stops at first failure
- ✅ Displays detailed summary with results
- ✅ Shows paths to coverage reports
- ✅ Exit code 0 (success) or 1 (failure)

**Output:**
```
============================================
  TEST RESULTS SUMMARY
============================================
Frontend Unit Tests (Karma):    ✅ PASSED
Backend Tests (Maven):           ✅ PASSED
E2E Tests (Playwright):          ✅ PASSED
============================================
✓ All tests PASSED - OK to commit!

Coverage reports:
- frontend/coverage/frontend/index.html
- backend/target/site/jacoco/index.html
- frontend/playwright-report/index.html
```

**Requirements:**
- Docker (for test PostgreSQL)
- Maven wrapper in `backend/mvnw`
- npm/Node.js for frontend

**Use cases:**
- Before commit (manually or via pre-commit hook)
- After major code changes
- Verification before pull request
- CI/CD pipeline

---

### `install-hooks.sh`

Installs git pre-push hook that automatically runs all tests before each push to remote.

**Basic usage (one-time installation):**
```bash
./scripts/install-hooks.sh
```

**Features:**
- ✅ Copies pre-push hook to `.git/hooks/`
- ✅ Sets executable permissions
- ✅ Displays usage instructions

**Pre-push hook behavior:**
- Hook calls `./scripts/run-all-tests.sh` automatically
- If tests FAIL → push **aborted**
- If tests PASS → push proceeds

**Why pre-push instead of pre-commit?**
- ✅ Commit is fast (local operation, multiple commits)
- ✅ Push verified by tests (before sending to remote)
- ✅ Less frustration - tests only once before push

**Bypass hook (emergency situations only):**
```bash
git push --no-verify
```

**Example workflow:**
```bash
# 1. Install hook (once)
./scripts/install-hooks.sh

# 2. Normal commit (no tests - fast)
git add .
git commit -m "feat: add feature"

# 3. Push (hook runs tests)
git push
  ↓
🧪 Hook runs tests automatically
  ↓
✅ All OK → Push completed
❌ Fail → Push aborted

# 4. If fail - fix code and try again
```

---

### `reset-data.sh`

⚠️ **DANGER ZONE** - Resets ALL data in database and files to initial state.

**Basic usage:**
```bash
./scripts/reset-data.sh
```

**Dry-run (preview without deletion):**
```bash
./scripts/reset-data.sh --dry-run
```

**What it does:**
- ❌ **DELETES ALL DATA:**
  - All users (including admin)
  - All photos and ratings
  - All files from `backend/uploads/`
  - Resets settings to defaults
- ✅ Preserves directory structure
- ✅ Admin will be recreated on backend restart (from `.env`)

**Requirements:**
- PostgreSQL must be running
- `.env` file with database credentials
- `backend/src/main/resources/db/reset-data.sql` must exist

**Safety features:**
- ✅ Requires interactive confirmation (type "yes")
- ✅ Shows how many files will be deleted
- ✅ `--dry-run` option for preview without changes

**Usage example:**
```bash
# Preview what will be deleted
./scripts/reset-data.sh --dry-run

# Reset data (with confirmation)
./scripts/reset-data.sh
# Type: yes

# Restart backend (will create admin)
./scripts/stop-dev.sh && ./scripts/start-dev.sh
```

**Use cases:**
- 🔧 Development environment reset
- 🧪 Preparing clean data for tests
- 🚀 Initial production setup

---

### `rebuild.sh`

Rebuilds application (frontend + backend) with different levels of build cleanliness.

**⚡ QUICK rebuild (default):**
```bash
./scripts/rebuild.sh
```
- Backend: compilation only (`mvnw compile`)
- Frontend: restart without reinstalling `node_modules`
- Tests: skipped
- ⏱️ Time: ~30-60 seconds

**Use case:** Quickly see changes in components during development

---

**🧹 CLEAN rebuild:**
```bash
./scripts/rebuild.sh --clean
```
- Backend: clean build (`mvnw clean compile`)
- Frontend: `rm -rf node_modules && npm install`
- Tests: skipped (unless `--full`)
- ⏱️ Time: ~5-10 minutes

**Use case:** Build problems, need clean environment

---

**🔬 FULL rebuild (with tests):**
```bash
./scripts/rebuild.sh --full
```
- Backend: full build (`mvnw clean package`) + tests
- Frontend: clean install + tests
- Tests: always run
- ⏱️ Time: ~10-15 minutes

**Use case:** Before push, ensure everything works

---

**Options:**
- `--clean` - clean build (rm node_modules, mvnw clean)
- `--full` - full build with tests (forces tests)
- `--skip-tests` - skip tests (for `--clean`, default for quick)
- `--help` - help

**Combinations:**
```bash
./scripts/rebuild.sh                        # Quick rebuild (default)
./scripts/rebuild.sh --clean                # Clean without tests
./scripts/rebuild.sh --clean --skip-tests   # Clean without tests (identical)
./scripts/rebuild.sh --full                 # Full with tests (forces --skip-tests=false)
```

**What it does:**
1. Stops backend + frontend
2. Rebuilds according to level (quick/clean/full)
3. Restarts both services

**⚠️ IMPORTANT CHANGES:**
- ❌ **Flag `--init` REMOVED** - use `./scripts/reset-data.sh` instead
- ✅ Default rebuild is now **QUICK** (~1 min instead of 10-15 min)
- ✅ Tests are skipped by default (use `--full` for tests)

**Example workflow:**
```bash
# 1. Quick rebuild - component change (~1 min)
./scripts/rebuild.sh

# 2. Clean rebuild - build problem (~5-10 min)
./scripts/rebuild.sh --clean

# 3. Full rebuild - before push (~10-15 min)
./scripts/rebuild.sh --full
```

**Use cases:**
- 🔄 Quick rebuild: see changes immediately
- 🧹 Clean rebuild: dependency problems
- 🔬 Full rebuild: before push (verification)
- ⚡ Time saved: ~10-14 min on each rebuild!

---

## 📂 Structure

```
scripts/
├── start-dev.sh           # Start application
├── stop-dev.sh            # Stop application
├── reset-data.sh          # ⚠️  Reset ALL data (DANGER ZONE)
├── rebuild.sh             # Rebuild application + optional --init
├── run-all-tests.sh       # Run all tests
├── install-hooks.sh       # Install git pre-push hook
├── README.md              # This documentation
├── git-hooks/             # Git hooks templates
│   └── pre-push           # Pre-push hook (copied to .git/hooks/)
└── .pid/                  # PID files and logs (gitignored)
    ├── backend.pid
    ├── frontend.pid
    ├── backend.log
    └── frontend.log
```

---

## 🔍 Status Check

### Processes
```bash
# Backend
lsof -i:8080

# Frontend
lsof -i:4200

# PostgreSQL
lsof -i:5432
```

### Real-time logs
```bash
# Backend
tail -f scripts/.pid/backend.log

# Frontend
tail -f scripts/.pid/frontend.log
```

### Health checks
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend (status code)
curl -I http://localhost:4200
```

**Note:** Script `start-dev.sh` automatically verifies health endpoints after startup and shows status ✅ or ⚠️.

---

## 🐛 Troubleshooting

### Problem: "Port 8080 already in use"
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9
```

### Problem: "PostgreSQL not running"
```bash
# Start manually
docker-compose up -d

# Check status
docker-compose ps
```

### Problem: "Backend not starting"
```bash
# Check logs
cat scripts/.pid/backend.log

# Or run manually in terminal
cd backend
./mvnw spring-boot:run
```

### Problem: "Frontend not starting"
```bash
# Check logs
cat scripts/.pid/frontend.log

# Rebuild node_modules
cd frontend
rm -rf node_modules
npm install
```

---

## 🐞 Debug Mode

Both scripts support debug mode that shows detailed information about port and PID detection process.

**Enable debug mode:**
```bash
# Start with debug
DEBUG=true ./scripts/start-dev.sh

# Stop with debug
DEBUG=true ./scripts/stop-dev.sh
```

**What debug mode shows:**
- Port detection methods (ss → lsof → nc)
- PID detection methods (ss → lsof → netstat)
- Health check endpoints
- Detailed process information

**Example output:**
```
[DEBUG] Checking port 5432...
[DEBUG] Using ss for port 5432
[DEBUG] Port 5432 is in use (detected by ss)
[DEBUG] Checking backend health endpoint...
[DEBUG] Backend health: UP
```

**Useful when:**
- Scripts don't detect processes correctly
- Problems with port detection
- Diagnosing startup problems

---

## 💡 Tips

**Recommended workflow:**
1. **Start application (always same command):**
   ```bash
   ./scripts/start-dev.sh
   ```
   PostgreSQL will start automatically if not running!

2. **Restart backend/frontend (quick):**
   ```bash
   ./scripts/stop-dev.sh      # Stops only backend + frontend
   ./scripts/start-dev.sh     # PostgreSQL still running (detected automatically)
   ```

3. **Complete shutdown (end of day):**
   ```bash
   ./scripts/stop-dev.sh --with-db
   # Or manually:
   docker-compose down
   ```

**PostgreSQL in background:**
- ✅ **Automatically started** when not running (detection on every start-dev.sh)
- `start-dev.sh --with-db` - optional flag (automatic detection works without it)
- `stop-dev.sh` **does NOT stop** PostgreSQL - stays in background
- `stop-dev.sh --with-db` stops PostgreSQL (docker-compose down)
- PostgreSQL is lightweight - can stay running all day

**Multiple runs:**
- Script `start-dev.sh` detects already running processes
- Can be run again without stopping (safe)

**Logs:**
- Backend/Frontend log to `scripts/.pid/*.log`
- Logs are overwritten on each start
- Use `tail -f` for real-time monitoring
