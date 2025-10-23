# CLAUDE.md - Photo Map MVP Instructions

This file provides guidance to Claude Code for implementing the Photo Map MVP project.

## 🎯 Project Overview

**Photo Map MVP** - Full-stack application for managing photos with geolocation.

**Stack:**
- Frontend: Angular 18 (standalone), TypeScript 5, Tailwind CSS 3, Leaflet.js
- Backend: Spring Boot 3, Java 17, PostgreSQL 15, Spring Security (JWT)
- Deployment: Nginx, Systemd, Mikrus VPS

**Status:** Fresh start - implementation from scratch

## 📚 Documentation - When to Read What

### 🤖 Core Context (.ai/) - Always Read

**Folder:** `.ai/` - **Implementation specs for Claude Code**

```
.ai/prd.md          # MVP requirements
.ai/tech-stack.md   # Technology specs
.ai/db-plan.md      # Database schema
.ai/api-plan.md     # REST API specification
.ai/ui-plan.md      # Frontend architecture
```

**Complete implementation specs (logic-focused, no code examples)**

**When to read:**
- ✅ **Always at start** - read prd.md + tech-stack.md
- ✅ **Before Backend Setup** - read db-plan.md (tables, relations, indexes)
- ✅ **Before Backend API** - read api-plan.md (endpoints, DTOs, security)
- ✅ **Before Frontend** - read ui-plan.md (components, services, routing)

### 🔍 Decision Context (.decisions/) - Read On-Demand

**Folder:** `.decisions/` - **Decision rationale for humans + optional reference**

```
.decisions/prd-context.md       # Business context
.decisions/tech-decisions.md    # Technology rationale
```

**Decision context (not loaded by default)**

**When to read:**
- ✅ Considering alternative library/approach (check if it was already evaluated)
- ✅ Adding new dependency (check `.decisions/tech-decisions.md`)
- ✅ User asks "why X?" (business/tech rationale)
- ✅ Doubts about architectural decision (e.g., "Should we add Redis?")
- ❌ **DON'T read by default** for standard implementation

**Example workflow:**
```
Task: "Add caching for photo list"

1. Check .ai/tech-stack.md
   → "Caching: in-memory (60s TTL) for photo lists"

2. Implement according to spec

3. If question: "Maybe Redis instead of in-memory?"
   → Check .decisions/tech-decisions.md
   → Redis in EXCLUDED: "overkill for MVP, in-memory enough"

4. Stick to spec from .ai/
```

### 📋 Other Core Context Files

```
CLAUDE.md                      # This file - workflow instructions
PROGRESS_TRACKER.md            # Progress tracker (6 phases)
README.md                      # Project overview (for humans)
```

---

## 🤖 AI Model Strategy - Claude Sonnet 4.5

### Model Knowledge Scope

**Implementation based on Claude Sonnet 4.5 knowledge base:**
- **Knowledge cutoff:** January 2025
- **Stack in scope:**
  - ✅ Angular 18 (released 2024)
  - ✅ Spring Boot 3 (released 2023)
  - ✅ PostgreSQL 15 (released 2022)
  - ✅ Tailwind CSS 3.4 (Angular 18 incompatible with Tailwind 4 - important!)
  - ✅ Leaflet.js 1.9 (stable)
  - ✅ Java 17 LTS
  - ✅ JWT authentication patterns
  - ✅ RxJS 7, BehaviorSubject patterns

### When to Use MCP Context7

**MCP Context7** - tool for retrieving up-to-date library documentation

**Use when:**
- ✅ New API (e.g., Angular 19+ features, Spring Boot 3.3+)
- ✅ Doubts about syntax/patterns (e.g., Leaflet plugin API)
- ✅ Library-specific details (e.g., JWT lib configuration, EXIF metadata-extractor)
- ✅ Breaking changes in dependencies

**DON'T use when:**
- ❌ Core patterns known to Sonnet 4.5 (standalone components, Spring Data JPA)
- ❌ Standard implementations (REST endpoints, JWT flow)
- ❌ Simple configurations (Tailwind setup, TypeScript strict)

### Workflow: Core Knowledge → MCP On-Demand

1. **Implement using core knowledge of Sonnet 4.5**
   - Majority of MVP is within model scope
   - `.ai/tech-stack.md` contains all specs

2. **On doubts → MCP Context7**
   ```
   mcp__context7__resolve-library-id(libraryName: "leaflet-markercluster")
   → mcp__context7__get-library-docs(...)
   ```

3. **Stick to proven patterns** from project skills
   - Angular patterns in skills
   - Spring Boot patterns in skills
   - Tailwind patterns in skills

### Important Constraints

⚠️ **Tailwind 3.x (not 4.x)**
- Reason: Angular 18 incompatibility with Tailwind 4
- Source: `.ai/tech-stack.md` + `.decisions/tech-decisions.md`
- **Action:** Use Tailwind 3.4.17

⚠️ **Standalone Components (no NgModules)**
- Angular 18 pattern
- No `@NgModule` - only standalone components
- Check `.ai/ui-plan.md` for details

⚠️ **BehaviorSubject Pattern (no NgRx)**
- Simple state management
- `BehaviorSubject` (private) → `Observable` (public)
- Check `.ai/tech-stack.md` for pattern

## 🚀 Implementation Workflow

### Step 1: Read Core Context

Before starting implementation **ALWAYS**:

1. Read `.ai/prd.md` - WHAT we're building (MVP requirements)
2. Read `.ai/tech-stack.md` - HOW to implement (tech specs)
3. Read `PROGRESS_TRACKER.md` - STATUS and roadmap (6 main phases)
4. Read relevant `.ai/` plan for current phase:
   - Backend Setup → read `.ai/db-plan.md`
   - Backend API → read `.ai/api-plan.md`
   - Frontend → read `.ai/ui-plan.md`

**Time:** ~10-15 minutes | **Result:** Full understanding of MVP context

**Optional:** If you need business context or decision rationale → read `.decisions/`

### Step 2: Implement According to Current Phase

**Always implement according to:**
- Current phase in `PROGRESS_TRACKER.md`, OR
- Specific user instruction

**After completing work:**
- ✅ Wait for user verification before continuing to next phase
- ✅ Update PROGRESS_TRACKER.md - mark completed tasks

**Implementation pattern:**
- Follow git workflow guidelines (see Git Workflow section)
- Show progress to user regularly

## 🎨 Project Conventions

### Language and Communication

- **Communication with user**: Polish
- **Code**: English (all identifiers, class names, method names, variables)
- **Git commits**: Conventional Commits format (Polish or English)

### Code Quality

- **Self-documenting code** - clear names > comments
- **Minimize comments** - only for complex business logic
- **TypeScript strict mode** - all types explicit

### Git Workflow

**Commit Strategy:**
- **Small, focused changes** - each commit should represent one logical change
- **Test immediately** - verify changes work before committing
- **Commit frequently** - regular commits make it easy to track progress and revert if needed
- **Clear messages** - use Conventional Commits format

**Conventional Commits Format:**
```
<type>[optional scope]: <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
- `feat(auth): implement JWT token validation`
- `fix(photo): resolve EXIF extraction error`
- `docs: update PROGRESS_TRACKER.md after Phase 1`

**CRITICAL RULES:**
- ✅ **EVERY commit MUST be confirmed by user** - never commit without asking
- ✅ **EVERY push MUST be confirmed by user** - NEVER auto-push (critical!)
- ❌ NO promotional messages ("Generated with Claude Code")
- ✅ Professional commits focused on changes only

## 🛠️ Tech Stack Guidelines

### Angular 18 (Frontend)

- **Standalone components** - no NgModules
- **Routing** - `app.routes.ts` with flat Routes array
- **State management** - Signals + BehaviorSubject (see below)
- **Reactive approach** - `async` pipe in templates
- **Test IDs** - all interactive elements have `data-testid="component-element"` (e.g., `data-testid="gallery-photo-card"`)

**State Management Strategy:**
- **Signals** - for component-local state (counters, UI flags, computed values)
- **BehaviorSubject** - for shared state in Services (cross-component communication, e.g., PhotoService, FilterService)
- Pattern: `BehaviorSubject` (private) → `Observable` (public) → Component subscribes
- NO NgRx for MVP (too complex)

Details: See `.ai/ui-plan.md` and `.ai/tech-stack.md`

### Spring Boot 3 (Backend)

- **REST API** - `@RestController` with DTOs
- **Security** - JWT tokens with Spring Security
- **JPA** - Entity relationships with proper cascading
- **Photo processing** - metadata-extractor for EXIF, Thumbnailator for thumbnails

Details: See `.ai/api-plan.md` and `.ai/tech-stack.md`

### Tailwind CSS 3 (Styling)

- **Utility-first** - use utility classes in templates
- **Component styles** - only for complex patterns
- **Responsive** - mobile-first approach

Details: See `.ai/tech-stack.md`

## 📋 Implementation Checklist

**Before starting phase:**
- [ ] Read core docs (PRD, tech-stack, PROGRESS_TRACKER)
- [ ] Know which phase I'm implementing (check PROGRESS_TRACKER.md)
- [ ] Know which `.ai/` plan to use (db-plan? api-plan? ui-plan?)
- [ ] Understand acceptance criteria for phase

**During implementation:**
- [ ] Follow git workflow guidelines (see Git Workflow section)
- [ ] Compliance with specs in `.ai/` files
- [ ] TypeScript strict mode
- [ ] Self-documenting code

**After completing phase:**
- [ ] All tests passing
- [ ] Update PROGRESS_TRACKER.md - mark completed tasks
- [ ] Wait for user verification before next phase

## ⚠️ Common Pitfalls

1. **Don't skip core docs** - read PRD and tech-stack before code
2. **Don't implement too much** - small focused changes, frequent commits
3. **Don't skip testing** - test each change immediately
4. **Don't use NgModules** - Angular 18 = standalone components
5. **Don't auto-push** - always ask for confirmation

## 📊 Progress and Status

Project status tracked in: `PROGRESS_TRACKER.md`

**6 main phases:**
1. Backend - Setup and Auth
2. Backend - Photo handling
3. Frontend - Setup and Auth
4. Frontend - Gallery and Map
5. Admin Panel
6. Deployment

Each phase has checkboxes with tasks and clear acceptance criteria.

## 📖 Additional Resources

- Angular 18: https://angular.dev/
- Spring Boot 3: https://spring.io/projects/spring-boot
- Tailwind CSS 3: https://tailwindcss.com/docs
- Leaflet.js: https://leafletjs.com/
- PostgreSQL: https://www.postgresql.org/docs/

---

**Core Context:** Well-defined implementation specs in `.ai/`
**Workflow:** Read core → Implement according to phase → Test & commit → Wait for verification
