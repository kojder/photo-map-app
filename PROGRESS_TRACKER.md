# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** ✅ Core MVP Complete
**Last Updated:** 2025-11-09

---

## 🔄 Current Status

### ✅ Last Completed (2025-11-10)

**Rebuild & Init Scripts - Environment Reset Automation:**
- Created: `scripts/reset-data.sh` - helper do czyszczenia danych (z --dry-run)
- Created: `scripts/rebuild.sh` - rebuild aplikacji z opcjonalnym --init
- Created: `backend/src/main/resources/db/reset-data.sql` - SQL reset script
- Modified: `deployment/scripts/deploy.sh` - dodano --init support dla remote
- Modified: `deployment/scripts/deploy-marcin288.sh` - dodano --init flag
- Modified: `scripts/start-dev.sh` - auto-start PostgreSQL jeśli nie działa
- Documentation: Updated `scripts/README.md` i `deployment/README.md`
- Safety: Interactive confirmation (dev: "yes", prod: hostname), --dry-run option
- Commits: 2 commits (3a1e3ef, fc0b28f) - ready to push

### 🎯 Currently Working On

**Fix AdminComponent Tests - API Mock Errors**

**Priority:** High (GitHub Actions failing)
**Time:** 1-2h
**Status:** 🔴 In Progress

**Problem:**
```
ERROR: 'Failed to update user role:', Error: API error
Error: API error
    at errorFactory (src/app/components/admin/admin.component.spec.ts:128:66)
    at AdminComponent.onSaveRoleChange (src/app/components/admin/admin.component.ts:108:56)
```

**Root Cause:**
- Testy mają błędne mockowanie API dla aktualizacji roli użytkownika
- Mock zwraca `throwError('API error')` zamiast poprawnej odpowiedzi 200 OK
- Ścieżka API lub response w mocku nie zgadzają się z wywołaniem w komponencie

**Scope:**
1. Sprawdzić `admin.component.spec.ts` - mockowanie HttpTestingController
2. Zweryfikować ścieżkę API w mocku vs. rzeczywiste wywołanie w komponencie
3. Poprawić mock, aby zwracał 200 OK dla poprawnych scenariuszy
4. `throwError()` używać tylko w testach obsługi błędów
5. Uruchomić testy lokalnie: `npm test -- --watch=false --browsers=ChromeHeadless`
6. Zweryfikować GitHub Actions po pushu

**Files:**
- `frontend/src/app/components/admin/admin.component.spec.ts`
- `frontend/src/app/components/admin/admin.component.ts`

### 🎯 Next Action

**Test Rebuild & Init Scripts Locally**

**Priority:** High (validate before production use)
**Time:** 1-2h
**Status:** 🔜 Planned

**Description:**
Po naprawie testów AdminComponent - przetestować nowe skrypty rebuild/init lokalnie przed pushem do remote.

**Testing Checklist:**

1. **Test `reset-data.sh --dry-run`**
   - Sprawdzić output (podgląd bez usuwania)
   - Zweryfikować że nie usuwa danych w trybie dry-run

2. **Test `reset-data.sh` (with confirmation)**
   - Wpisać "yes" dla potwierdzenia
   - Sprawdzić czy truncate tables działa
   - Sprawdzić czy pliki z uploads/ są usunięte
   - Restart backend → admin user created

3. **Test `rebuild.sh` (bez --init)**
   - Normalny rebuild (zachowuje dane)
   - Backend + frontend rebuild działa
   - Restart serwisów OK

4. **Test `rebuild.sh --skip-tests`**
   - Szybki rebuild bez testów
   - Backend + frontend rebuild działa

5. **Test `rebuild.sh --init`** (⚠️ usuwa dane)
   - Wpisać "yes" dla potwierdzenia
   - Sprawdzić reset danych
   - Sprawdzić rebuild + restart
   - Admin user created z .env

6. **Test `start-dev.sh` (auto-start PostgreSQL)**
   - Zatrzymać PostgreSQL: `docker-compose down`
   - Uruchomić: `./scripts/start-dev.sh`
   - Sprawdzić czy PostgreSQL uruchomiony automatycznie

**After Testing:**
- Push 2 commits do remote (3a1e3ef, fc0b28f)
- Update PROGRESS_TRACKER.md status

**Previous Scope (for reference):**

1. **Script: `scripts/rebuild.sh`** (✅ COMPLETED)
   - Rebuild both frontend and backend (clean + build + restart)
   - Flag `--init`: Reset all data to initial state
   - Interactive confirmation for `--init` (type "yes" to confirm)
   - What `--init` does:
     - Stop backend + frontend
     - Clean build (mvnw clean package, npm clean install)
     - Truncate tables: users, photos, ratings
     - Reset settings to defaults
     - Delete physical files: `backend/uploads/*`, `backend/uploads/thumbnails/*`
     - Re-create directory structure
     - Re-create default admin user from `.env` (ADMIN_EMAIL, ADMIN_PASSWORD)
     - Restart services
   - Help message with **⚠️ clear warning**: "Deletes ALL data - use only in DEV or initial production setup"

2. **New Script: `backend/src/main/resources/db/reset-data.sql`**
   - SQL script for database reset
   - TRUNCATE users, photos, ratings CASCADE
   - Reset settings to default (admin_contact_email)
   - Re-insert admin user (parameterized)

3. **Modify: `deployment/scripts/deploy.sh`**
   - Add `--init` flag support (optional parameter)
   - Interactive confirmation with environment check:
     - Dev: type "yes" to confirm
     - Production: type exact server hostname to confirm (e.g., "marcin288.mikrus.xyz")
   - What `--init` does on remote:
     - Execute reset-data.sql via psql on remote DB
     - Delete remote uploads: `ssh ... "rm -rf /opt/photomap/uploads/*"`
     - Re-create admin user from remote .env
   - Pass `--init` flag through deployment pipeline

4. **Modify: `deployment/scripts/deploy-marcin288.sh`**
   - Accept `--init` flag and pass to deploy.sh
   - Add help/usage with **⚠️ WARNING**:
     ```
     --init    ⚠️  DANGER: Deletes ALL data (users, photos, ratings, files)
               Use ONLY for:
               - Initial production setup
               - Development environment reset
               Requires manual confirmation (type server hostname)
     ```

5. **New Helper: `scripts/reset-data.sh`** (called by rebuild.sh)
   - Execute SQL reset script
   - Delete physical files from uploads/
   - Re-create directory structure
   - Call backend initialization (admin user creation)
   - Can be used standalone for quick dev reset

**Safety Features:**
- ✅ Interactive confirmation required (cannot be bypassed)
- ✅ Different confirmation for dev vs production:
  - Dev: type "yes"
  - Prod: type exact hostname (e.g., "marcin288.mikrus.xyz")
- ✅ Clear warnings in help messages (--help flag)
- ✅ Environment detection (check if remote or local)
- ✅ Dry-run option (`--dry-run` shows what would be deleted)
- ✅ No silent execution - all operations logged

**Files to Create:**
- `scripts/rebuild.sh` - main rebuild + optional reset
- `scripts/reset-data.sh` - data cleanup helper
- `backend/src/main/resources/db/reset-data.sql` - SQL reset script

**Files to Modify:**
- `deployment/scripts/deploy.sh` - add --init support
- `deployment/scripts/deploy-marcin288.sh` - add --init flag
- `scripts/README.md` - document new scripts

**Testing Checklist:**
- [ ] Test `rebuild.sh` without --init (normal rebuild)
- [ ] Test `rebuild.sh --init` with "yes" confirmation
- [ ] Test `rebuild.sh --init` with "no" - should abort safely
- [ ] Verify all data deleted: users, photos, ratings, files
- [ ] Verify admin user recreated correctly
- [ ] Test `deploy-marcin288.sh --init` (dry-run first)
- [ ] Verify production confirmation requires hostname
- [ ] Test abort on wrong hostname

**Documentation Updates:**
- Update `scripts/README.md` with:
  - `rebuild.sh` usage and examples
  - `--init` flag explanation with warnings
  - Safety confirmation process
- Update deployment docs (`deployment/README.md`) with:
  - `--init` flag for initial production setup
  - Warning about data loss
  - Confirmation process

**Implementation Order:**
1. Create `reset-data.sql` (SQL script)
2. Create `reset-data.sh` (helper script)
3. Create `rebuild.sh` with --init support
4. Test locally on dev environment
5. Modify `deploy.sh` with --init support
6. Modify `deploy-marcin288.sh` with --init flag
7. Update documentation
8. Test on staging/production (with extreme caution)

---

## 📊 Project Status

**Overall Progress:** 6/6 phases (100% core MVP) + Photo Viewer + E2E Tests + GitHub Actions

| Phase | Status | Description |
|------|--------|-------------|
| 1. Backend - Setup & Auth | ✅ | Spring Boot, PostgreSQL, JWT, Admin API |
| 2. Frontend - Setup & Auth | ✅ | Angular, Login/Register, Guards |
| 3. Backend - Photo Handling | ✅ | Upload, EXIF, thumbnails, Photo API, Rating |
| 4. Frontend - Gallery & Map | ✅ | Gallery grid, Leaflet Map, Rating, Upload, Filters |
| 📸 Photo Viewer Feature | ✅ | Fullscreen viewer, keyboard nav, mobile touch |
| 🤖 GitHub Copilot Setup | ✅ | Instructions, prompts, VS Code integration |
| 5. Admin Panel | ✅ | User Management, Photo Management, Permissions |
| 6. Deployment (Mikrus VPS) | ✅ | Docker Compose, PostgreSQL, Nginx, SSL |
| 🧪 E2E Tests (Playwright) | ✅ | 16 tests, GitHub Actions CI |
| 🔧 GitHub Actions CI/CD | ✅ | SonarCloud, test automation, quality gates |
| 📚 Swagger/OpenAPI | ✅ | API documentation, JWT auth |
| 📝 Documentation | ✅ | .ai/ specs, README, CLAUDE.md |

**Legend:** 🔜 Pending | ⏳ In Progress | ✅ Completed

**Production URL:** https://photos.tojest.dev/

---

## 🔮 Planned Next (Post-MVP)

### Email System
**Status:** 🔜 Post-MVP
**Time:** 12-16h
**Description:** Email verification, password reset, notifications
**Details:** `.ai/features/feature-email-system.md`

### User Deactivation & Orphaned Photos Cleanup
**Status:** 🔜 Post-MVP
**Time:** 6-8h
**Description:** Soft delete users (anonymization), manage orphaned photos, bulk delete with admin panel
**Features:**
- User anonymization instead of hard delete (email, isActive flag, password reset)
- DB migration: Change CASCADE DELETE to SET NULL for photos.user_id
- Admin endpoints: list inactive users, orphaned photos, bulk delete
- Frontend: Admin panel for managing inactive users and orphaned photos
**Details:** `.ai/features/feature-user-deactivation-cleanup.md`

### Public Photo Sharing
**Status:** 🔜 Post-MVP
**Time:** 7-9h
**Description:** Share photos in groups without login (UUID links)
**Details:** `.ai/features/feature-public-sharing.md`

### Temporal & Spatial Filters
**Status:** 🔜 Post-MVP
**Time:** 5-7h
**Description:** "Same month in other years", "Same location"
**Details:** `.ai/features/feature-temporal-spatial-filters.md`

### Gallery Photo Card Optimization
**Status:** 🔜 Post-MVP
**Time:** 4-6h
**Description:** Focus on photos - overlay controls, rating menu, selection mode
**Features:**
- Main view: photo only (no white background with filename/buttons)
- Rating: small stars overlay on photo (click → menu: change rating, delete)
- Checkbox: small field for group actions
- Bulk actions (rating, delete): future implementation

### NAS Batch Processing
**Status:** 🔜 Post-MVP
**Time:** 7-11 days
**Description:** Process photos from NAS (thumbnails only locally, originals on NAS)
**Details:** `.ai/features/feature-nas-batch-processing.md`

### Group & Permissions System
**Status:** 🔜 Post-MVP (Phase 2)
**Time:** 2-3 weeks
**Description:** Photo sharing between users in groups with access control
**Details:** `.ai/prd.md` section 8.1

---

## 🚀 Workflow Reminder

### Before starting implementation:

1. **Read core docs** (15-20 min):
   - `.ai/prd.md` - MVP requirements
   - `.ai/tech-stack.md` - Technology decisions
   - This file - PROGRESS_TRACKER.md

2. **Read phase-specific plan**:
   - Database schema → `.ai/db-plan.md`
   - REST API → `.ai/api-plan.md`
   - UI components → `.ai/ui-plan.md`

3. **Implement** - Follow workflow guidelines from CLAUDE.md

---

## 📖 Helpful Links

### Core Documentation:
- `README.md` - Project overview
- `CLAUDE.md` - Workflow instructions
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - Technology decisions

### Implementation Plans:
- `.ai/db-plan.md` - Database schema
- `.ai/api-plan.md` - REST API specification
- `.ai/ui-plan.md` - UI components architecture

### Features Documentation:
- `.ai/features/` - Detailed feature specifications

---
