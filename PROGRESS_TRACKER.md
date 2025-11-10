# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** ✅ Core MVP Complete
**Last Updated:** 2025-11-10

---

## 🔄 Current Status

### ✅ Last Completed (2025-11-10)

**Remove Sensitive Data from GitHub Wiki:**
- Removed production URLs (photos.tojest.dev → your-domain.com) from 5 Wiki pages:
  - 01-Home.md - Quick Links section
  - 02-User-Guide.md - Registration and Admin Panel examples (2 locations)
  - 05-Architecture.md - CORS configuration
  - 09-Deployment.md - Deployment verification
- Verified JWT tokens in examples are truncated placeholders (ending with `...`)
- Updated local source files in `wiki/pages/` directory
- Pushed changes to GitHub Wiki repository
- Status: ✅ Wiki now uses generic examples only

### 🎯 Currently Working On

None - ready for next task

### 🎯 Next Action

**Remove Sensitive Data from Scripts & Clean Git History**

**Priority:** Medium (security cleanup)
**Time:** 2-3h
**Status:** 🔜 Planned (after final production deployment)

**Issue:** Scripts and deployment files may contain production URLs, server paths, or other sensitive data.

**Phase 1: Remove Sensitive Data from Scripts**

**Tasks:**
1. Audit all scripts in `scripts/` directory:
   - Check for production URLs (photos.tojest.dev, srv07-30288.wykr.es)
   - Check for hardcoded server paths
   - Check for sensitive configuration values
   - Replace with environment variables or generic examples

2. Audit deployment configuration:
   - `deployment/` directory files
   - Docker Compose configurations
   - Nginx configurations
   - Check for production-specific values

3. Update files to use:
   - Environment variables from `.env`
   - Generic placeholders (your-domain.com, your-server.com)
   - Configuration templates with `.example` suffix

**Phase 2: Clean Git History (Remove Sensitive Data Permanently)**

**Method:** BFG Repo-Cleaner (faster than git filter-branch)

**Steps:**
```bash
# 1. Backup current state
git clone --mirror https://github.com/kojder/photo-map-app.git
git clone --mirror https://github.com/kojder/photo-map-app.wiki.git

# 2. Create replacements.txt file
photos.tojest.dev=your-domain.com
srv07-30288.wykr.es=your-server.com
[other sensitive data patterns]

# 3. Run BFG Repo-Cleaner
bfg --replace-text replacements.txt photo-map-app.git
bfg --replace-text replacements.txt photo-map-app.wiki.git

# 4. Clean and force push
cd photo-map-app.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

cd ../photo-map-app.wiki.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# 5. Fresh clone for local work
cd ~/projects
rm -rf photo-map-app
git clone git@github.com:kojder/photo-map-app.git
```

**Consequences:**
- ⚠️ Rewrites entire Git history (all commit SHAs change)
- ⚠️ Requires fresh clone after force push
- ⚠️ Links to old commits in GitHub issues/PRs will break
- ✅ Sensitive data permanently removed from history
- ✅ Safe for solo project (no collaborators affected)

**Success Criteria:**
- [ ] No production URLs in scripts or deployment files
- [ ] All sensitive config uses environment variables
- [ ] Git history cleaned with BFG Repo-Cleaner
- [ ] Fresh clone verified to work correctly
- [ ] No sensitive data in `git log -p` output

**Note:** Execute after final production deployment to minimize disruption.

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
