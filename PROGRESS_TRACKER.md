# 🎯 Photo Map MVP - Progress Tracker

**Created:** 2025-10-19
**Status:** ✅ Core MVP Complete
**Last Updated:** 2025-11-09

---

## 🔄 Current Status

### ✅ Last Completed (2025-11-10)

**Polish Content Cleanup - Language Policy Enforcement:**
- Translated: 4 development scripts to English (`start-dev.sh`, `stop-dev.sh`, `start-ngrok.sh`, `stop-ngrok.sh`)
- Fixed: 2 scripts with minor Polish content (`run-all-tests.sh`, `build-images.sh`)
- Translated: `deployment/README.md` (222 changes - all Polish headers, instructions, and content)
- Verified: 6 scripts already in English (no changes needed)
- Updated: PROGRESS_TRACKER.md with complete checklist and status
- Final verification: grep confirmed zero Polish content in scripts and main documentation
- Commits: Ready to commit and amend to 98da1de

### 🎯 Currently Working On

None - ready for next task

### 🎯 Next Action

**README.md Restructuring & GitHub Wiki Documentation**

**Priority:** Medium (project organization & documentation)
**Time:** 2-3h
**Status:** 🔜 Planned

**Problem:**
Current README.md mixes project overview with detailed technical documentation. Need to:
- Keep README.md focused on project introduction and quick start
- Move detailed documentation to GitHub Wiki for better organization and searchability

**Goals:**
1. **Restructure README.md:**
   - Project overview and description
   - Key features and tech stack summary
   - Quick start guide (minimal setup steps)
   - Links to detailed documentation in Wiki

2. **Create GitHub Wiki** (https://github.com/kojder/photo-map-app/wiki):
   - Home page with navigation
   - Development setup (detailed)
   - Deployment guide
   - Architecture overview
   - API documentation
   - Contributing guidelines
   - Troubleshooting

**Benefits:**
- ✅ Clean, concise README for first-time visitors
- ✅ Organized, searchable documentation in Wiki
- ✅ Easier maintenance (Wiki has version control)
- ✅ Better user experience for contributors

**Note:** For details on completed rebuild/init scripts, see commits 3a1e3ef and fc0b28f, or check `scripts/README.md`.

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
