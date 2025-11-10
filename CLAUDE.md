# CLAUDE.md - Photo Map MVP Instructions

This file provides guidance to Claude Code for implementing the Photo Map MVP project.

## 🎯 Project Overview

**Photo Map MVP** - Full-stack application for managing photos with geolocation.

**Stack:**
- Frontend: Angular 18 (standalone), TypeScript 5, Tailwind CSS 3, Leaflet.js
- Backend: Spring Boot 3, Java 17, PostgreSQL 15, Spring Security (JWT)
- Deployment: Nginx, Systemd, Mikrus VPS

**Status:** Core MVP Complete

## 🔐 CRITICAL: Credentials & Environment Variables

**⚠️ ALWAYS read credentials from `.env` file - NEVER hardcode or guess passwords!**

**DO:**
- ✅ **ALWAYS** read `.env` file before using credentials
- ✅ Use `ADMIN_PASSWORD` value from `.env`
- ✅ Verify current values before login tests, curl commands, or documentation examples

**DON'T:**
- ❌ **NEVER** hardcode passwords (e.g., `admin123`, `password`)
- ❌ **NEVER** guess password values from memory
- ❌ **NEVER** commit real passwords to Git

**Where to find credentials:**
```bash
# Read admin password
grep ADMIN_PASSWORD /home/andrew/projects/photo-map-app/.env

# E2E tests
grep E2E_ADMIN_PASSWORD /home/andrew/projects/photo-map-app/frontend/.env.test
```

## 📚 Documentation Structure

### Core Context (.ai/) - Always Read

**Implementation specs:**
```
.ai/prd.md          # MVP requirements
.ai/tech-stack.md   # Technology specs
.ai/db-plan.md      # Database schema
.ai/api-plan.md     # REST API specification
.ai/ui-plan.md      # Frontend architecture
```

**When to read:**
- ✅ **Always at start** - read prd.md + tech-stack.md
- ✅ **Before Backend Setup** - read db-plan.md
- ✅ **Before Backend API** - read api-plan.md
- ✅ **Before Frontend** - read ui-plan.md

### Decision Context (.decisions/) - Read On-Demand

**Only when:**
- Considering alternative library/approach
- User asks "why X?" (business/tech rationale)
- Doubts about architectural decision

### Other Files

```
CLAUDE.md           # This file - workflow instructions
PROGRESS_TRACKER.md # Progress tracker (6 phases)
README.md           # Project overview
```

### Context Recovery After /compact or /clean

**First action:**
1. Read `PROGRESS_TRACKER.md` → check **Current Status** section
2. Identify: Last Completed, Currently Working On, Next Action
3. Read relevant `.ai/` file for current phase
4. Continue from **Next Action** steps

## 🚀 Implementation Workflow

### Development Environment

**Start/Stop scripts:**
```bash
./scripts/start-dev.sh          # Start backend + frontend
./scripts/stop-dev.sh --with-db # Stop all including PostgreSQL
```

**Recommended workflow:**
1. Start PostgreSQL once: `docker-compose up -d`
2. Use `start-dev.sh` / `stop-dev.sh` multiple times during session
3. PostgreSQL can stay running (low resource usage)

### Implementation Steps

**Before starting:**
1. Read `.ai/prd.md` - WHAT we're building
2. Read `.ai/tech-stack.md` - HOW to implement
3. Read `PROGRESS_TRACKER.md` - Current status
4. Read relevant `.ai/` plan for current phase

**After completing work:**
- ✅ Wait for user verification before next phase
- ✅ Update PROGRESS_TRACKER.md

## 🎨 Project Conventions

### Language Standards

- **Communication with user**: Polish
- **Code**: English (all identifiers, class names, methods, variables)
- **Documentation**: English (all .md files, README, comments)
- **Scripts**: English (bash scripts, comments, help messages)
- **Git commits**: Conventional Commits format (English)

### Code Quality

- **Self-documenting code** - clear names > comments
- **Minimize comments** - only for complex business logic
- **TypeScript strict mode** - all types explicit

### Testing Standards

**Unit Tests:**
- **When:** Before every commit (TDD-like approach)
- **Coverage:** >70% for new code
- **Framework:** JUnit 5 + Mockito (backend), Jasmine + Karma (frontend)

**Integration Tests:**
- **When:** At end of each phase
- **Framework:** @SpringBootTest + MockMvc (backend), Playwright (frontend E2E)

**Frontend Testing:**
- Use `chrome-devtools` MCP for manual testing and debugging

**Commit Checklist:**
```
- [ ] Code implementation ready
- [ ] Verification passing (curl/Postman or manual test)
- [ ] Unit tests written (coverage >70%)
- [ ] All tests passing (./mvnw test or ng test)
- [ ] Commit message (Conventional Commits)
```

### Pre-push Test Hook

**Before every push:**
- ✅ Hook automatically runs all tests
- ✅ DO NOT push if tests fail - fix errors first
- ✅ Can run `./scripts/run-all-tests.sh` manually before push
- ❌ **DO NOT use `--no-verify`** without explicit user consent
- ⚠️ **CRITICAL: ONLY user performs manual push - Claude Code NEVER executes push**

**Workflow:**
1. Implement feature/fix
2. Stage: `git add .`
3. Commit: `git commit -m "..."` (fast, no tests)
4. (Optional) Run `./scripts/run-all-tests.sh` manually
5. Fix any test errors
6. Push: `git push` (hook runs automatically)
7. If fail → go back to step 5

## Git Workflow

### Commit Strategy

- **Small, focused changes** - one logical change per commit
- **Test immediately** - verify before committing
- **Commit frequently** - easy tracking and reverting
- **Clear messages** - Conventional Commits format

**Format:**
```
<type>[optional scope]: <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
- `feat(auth): implement JWT token validation`
- `fix(photo): resolve EXIF extraction error`
- `docs: update PROGRESS_TRACKER.md after Phase 1`

### CRITICAL RULES

**Commit Review Process:**
1. Make changes to files
2. Stage: `git add <files>`
3. Show summary: `git status` + `git diff --cached --stat`
4. **ASK USER: "Should I commit these changes?"**
5. ⚠️ **STOP HERE** - Wait for explicit user response
6. After user confirms YES → create commit
7. If NO → make corrections, return to step 3

**ABSOLUTE PROHIBITIONS:**
- ❌ **NEVER execute `git commit` in same response where you ask for confirmation**
- ❌ **NEVER execute `git push` without explicit user confirmation** - ALWAYS ask first
- ❌ **NEVER assume user's answer** - always wait for explicit "yes"/"tak"/"commit"/"push"
- ❌ **NEVER bundle question + commit in one response**
- ❌ **NEVER bundle question + push in one response**
- ❌ **NEVER auto-push** even if user says "finish everything"
- ❌ **NO promotional messages** ("Generated with Claude Code")

## 🛠️ Tech Stack Guidelines

### Angular 18 (Frontend)

- **Standalone components** - no NgModules
- **Routing** - `app.routes.ts` with flat Routes array
- **State management:**
  - **Signals** - component-local state (UI flags, counters)
  - **BehaviorSubject** - shared state in Services (PhotoService, FilterService)
  - Pattern: `BehaviorSubject` (private) → `Observable` (public)
  - NO NgRx for MVP
- **Reactive approach** - `async` pipe in templates
- **Test IDs** - all interactive elements: `data-testid="component-element"`

Details: `.ai/ui-plan.md` and `.ai/tech-stack.md`

### Spring Boot 3 (Backend)

- **REST API** - `@RestController` with DTOs
- **Security** - JWT tokens with Spring Security
- **JPA** - Entity relationships with proper cascading
- **Photo processing** - metadata-extractor (EXIF), Thumbnailator (thumbnails)

Details: `.ai/api-plan.md` and `.ai/tech-stack.md`

### Tailwind CSS 3

- **Utility-first** - utility classes in templates
- **Component styles** - only for complex patterns
- **Responsive** - mobile-first approach
- ⚠️ **Use Tailwind 3.x** (Angular 18 incompatible with Tailwind 4)

Details: `.ai/tech-stack.md`

### i18n Policy

- **Validation messages:** Use codes from `ValidationMessages.properties`
  - Format: `{validation.field.rule}` (e.g., `{validation.email.required}`)
  - Languages: English (required), Polish (optional)
- **API error messages:** Hardcoded OK for MVP

## 📋 Implementation Checklist

**Before starting phase:**
- [ ] Development environment ready
- [ ] Read core docs (PRD, tech-stack, PROGRESS_TRACKER)
- [ ] Know current phase and acceptance criteria

**During implementation:**
- [ ] Follow git workflow guidelines
- [ ] Compliance with `.ai/` specs
- [ ] Self-documenting code

**After phase:**
- [ ] All tests passing
- [ ] Update PROGRESS_TRACKER.md
- [ ] Wait for user verification

## ⚠️ Common Pitfalls

1. **Don't skip core docs** - read PRD and tech-stack first
2. **Don't implement too much** - small focused changes, frequent commits
3. **Don't skip testing** - test each change immediately
4. **Don't use NgModules** - Angular 18 = standalone components only
5. **Don't auto-push** - always ask for confirmation

## 📊 Progress Tracking

Project status: `PROGRESS_TRACKER.md`

**6 main phases:**
1. Backend - Setup and Auth
2. Backend - Photo handling
3. Frontend - Setup and Auth
4. Frontend - Gallery and Map
5. Admin Panel
6. Deployment

## 📖 Additional Resources

- Angular 18: https://angular.dev/
- Spring Boot 3: https://spring.io/projects/spring-boot
- Tailwind CSS 3: https://tailwindcss.com/docs
- Leaflet.js: https://leafletjs.com/
- PostgreSQL: https://www.postgresql.org/docs/

---

**Core Context:** Well-defined implementation specs in `.ai/`
**Workflow:** Read core → Implement according to phase → Test & commit → Wait for verification
