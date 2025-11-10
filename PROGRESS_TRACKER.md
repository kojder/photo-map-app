# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** ✅ Core MVP Complete
**Last Updated:** 2025-11-09

---

## 🔄 Current Status

### ✅ Last Completed (2025-11-09)

**User Deactivation & Orphaned Photos Cleanup:**
- Database: V6 migration (CASCADE DELETE → SET NULL for photos.user_id)
- Backend: UserService.deactivateUser(), getInactiveUsers()
- Backend: AdminController - 3 new endpoints (inactive users, orphaned photos, bulk delete)
- Frontend: Fixed registration admin email endpoint + deletion confirmation message
- Frontend: Fixed MapComponent Cognitive Complexity (17 → <15, extracted helper methods)
- Tests: 151 backend tests passing, 304 frontend tests passing
- Coverage: UserService 100%, AdminController 92% (both >90%)
- DTOs: BulkDeleteResponse, OrphanedPhotoDTO, UserSummaryDTO
- Documentation: `.ai/features/feature-user-deactivation-cleanup.md`

### 🎯 Currently Working On

**Priorytet 1: Naprawić problem z klastrowaniem na mapie**
- Po refactoringu MapComponent marker z 74 zdjęciami wymaga wielokrotnego kliknięcia przed powiększeniem
- Wcześniej zoom działał płynnie po pierwszym kliknięciu
- Prawdopodobnie problem w metodzie updateMarkers() lub event handlerach
- Lokalizacja: frontend/src/app/components/map/map.component.ts

**Priorytet 2: Commit User Deactivation & Orphaned Photos Cleanup**
- Po naprawie mapy: zacommitować zmiany z pokryciem testów >90%
- Backend: UserService 100%, AdminController 92%
- Frontend: wszystkie 304 testy przechodzą
- Staged: V6 migration, DTOs, testy, dokumentacja

### 🎯 Next Action

**Rebuild & Init Scripts - Environment Reset Automation**

**Priority:** High (DevOps automation)
**Time:** 3-4h
**Status:** 🔜 Planned

**Description:**
Create scripts for rebuilding application with optional complete data reset (`--init` flag).

**Scope:**

1. **New Script: `scripts/rebuild.sh`**
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
