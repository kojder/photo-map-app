# GitHub Wiki Documentation - Implementation Plan

**Created:** 2025-11-10
**Status:** 🔄 In Progress
**Estimated Time:** 2-3h

---

## 📁 Folder Structure

```
wiki/
├── PLAN.md                          # This file - complete implementation plan
├── UPLOAD_INSTRUCTIONS.md           # Step-by-step guide for uploading to GitHub Wiki
├── PROGRESS.md                      # Track progress with checkboxes
├── pages/                           # 11 Wiki pages (Markdown files)
│   ├── 01-Home.md
│   ├── 02-User-Guide.md
│   ├── 03-Quick-Start.md
│   ├── 04-Development-Setup.md
│   ├── 05-Architecture.md
│   ├── 06-API-Documentation.md
│   ├── 07-Testing-Quality.md
│   ├── 08-Scripts-Reference.md
│   ├── 09-Deployment.md
│   ├── 10-AI-Development-Methodology.md
│   └── 11-Contributing.md
└── modified-files/                  # Modified local README files
    ├── README.md                    # New main README (~180 lines)
    ├── deployment-README.md         # Modified deployment/README.md (with Wiki link)
    └── scripts-README.md            # Modified scripts/README.md (with Wiki link)
```

---

## 🎯 Wiki Structure (11 Pages)

### 🏠 Navigation & Overview

**1. Home** (`01-Home.md`)
- Welcome message + project overview
- Status badges (CI, SonarCloud)
- Quick Navigation Table (3 sections: Users, Developers, AI Development)
- Getting Started Path
- Quick Links (repository, production, dashboards)
- Project Status

### 👤 For End Users

**2. User Guide** (`02-User-Guide.md`)
- **Section A:** Registration & Login (email to admin, on-screen message)
- **Section B:** Using the Application (Gallery, Map, Filters, Rating - 2 permissions, Upload)
- **Section C:** Admin Panel (User management, permissions, orphaned photos)

### 💻 For Developers

**3. Quick Start** (`03-Quick-Start.md`)
- Prerequisites checklist (15-second scan)
- 5-step setup
- First login verification
- Troubleshooting quick tips

**4. Development Setup** (`04-Development-Setup.md`)
- Detailed prerequisites
- First-time setup (step-by-step)
- Environment configuration (.env explained)
- Project structure (full directory tree)
- Daily workflow (scripts)
- Code conventions (language policy)

**5. Architecture & Design** (`05-Architecture.md`)
- Tech stack breakdown
- Frontend architecture (Angular 18, Signals, BehaviorSubject)
- Backend architecture (Spring Boot 3, JWT, JPA)
- Database schema
- Photo processing pipeline
- Design decisions (.ai/, .decisions/)

**6. API Documentation** (`06-API-Documentation.md`)
- Swagger UI
- Authentication endpoints (/api/auth/*)
- Photo endpoints (/api/photos/*)
- Admin endpoints (/api/admin/*)
- DTOs and validation
- Error responses
- Authentication flow (JWT)

**7. Testing & Quality** (`07-Testing-Quality.md`)
- **Section A:** Local Testing (unit, E2E, run-all-tests.sh)
- **Section B:** CI/CD Pipeline (GitHub Actions, SonarCloud - 2 projects)
- **Section C:** Writing Tests (patterns, coverage >70%)

**8. Scripts Reference** (`08-Scripts-Reference.md`)
- start-dev.sh, stop-dev.sh
- run-all-tests.sh
- rebuild.sh (quick/clean/full)
- reset-data.sh
- install-hooks.sh
- Troubleshooting

**9. Deployment** (`09-Deployment.md`)
- Docker Compose setup
- Mikrus VPS deployment
- Build images
- Deploy process
- SSL configuration (*.wykr.es)
- Updates and maintenance
- Troubleshooting

### 🤖 For AI-Assisted Development

**10. AI Development Methodology** (`10-AI-Development-Methodology.md`)
- **Section A:** Overview (why AI-assisted, tools used)
- **Section B:** Claude Code (.claude/ directory, CLAUDE.md, skills)
- **Section C:** GitHub Copilot (.github/ instructions, prompts)
- **Section D:** Gemini CLI (large context analysis)
- **Section E:** Prompt Engineering (.ai/, .decisions/, feature specs)

**11. Contributing** (`11-Contributing.md`)
- Code conventions (language policy)
- Git workflow (Conventional Commits)
- Testing policy (TDD-like, >70% coverage)
- PR process
- Code review checklist

---

## 📝 Local README Changes

### 1. README.md (main) - 612 → ~180 lines

**Structure:**
- Title + Badges
- Overview (2-3 sentences)
- Features (6-8 bullet points)
- Tech Stack (summary table)
- Quick Start (5 steps)
- **Documentation** (links to 11 Wiki pages)
- Links (SonarCloud, GitHub Actions, Production)
- Contributing (brief + link to Wiki)
- License

### 2. deployment/README.md - Add Wiki link at top

```markdown
> 📖 **Full documentation:** [Wiki - Deployment Guide](https://github.com/kojder/photo-map-app/wiki/Deployment)
>
> This file is a **quick reference** for deployment commands.
```

### 3. scripts/README.md - Add Wiki link at top

```markdown
> 📖 **Full documentation:** [Wiki - Scripts Reference](https://github.com/kojder/photo-map-app/wiki/Scripts-Reference)
>
> This file is a **quick reference** for development scripts.
```

---

## 🔄 Implementation Steps

See `wiki/PROGRESS.md` for detailed checklist with checkboxes.

**Phase 1: Preparation**
- [ ] Create wiki/ folder structure
- [ ] Read missing .github/ files for content
- [ ] Create PLAN.md, PROGRESS.md, UPLOAD_INSTRUCTIONS.md

**Phase 2: Content Creation**
- [ ] Write all 11 Wiki pages (wiki/pages/)
- [ ] Create modified README.md (main)
- [ ] Create modified deployment/README.md
- [ ] Create modified scripts/README.md

**Phase 3: Documentation Update**
- [ ] Update PROGRESS_TRACKER.md
- [ ] Update CLAUDE.md (add wiki/ folder reference)
- [ ] Final review

**Phase 4: User Action Required**
- [ ] User uploads Wiki pages to GitHub
- [ ] User replaces local README files
- [ ] User commits changes

---

## 📚 Content Sources

### Already Read:
- ✅ README.md (main)
- ✅ deployment/README.md
- ✅ scripts/README.md
- ✅ PROGRESS_TRACKER.md
- ✅ CLAUDE.md
- ✅ .github/README_WIKI_RESTRUCTURE_PROMPT.md

### To Read:
- [ ] .github/workflows/README.md
- [ ] .github/copilot-instructions.md
- [ ] .github/backend.instructions.md
- [ ] .github/frontend.instructions.md
- [ ] .github/CONTINUATION_PROMPT.md
- [ ] .github/NEW_SESSION_PROMPT.md

### Referenced (no need to read fully):
- .ai/prd.md, tech-stack.md, db-plan.md, api-plan.md, ui-plan.md
- .ai/features/* (11 feature files)
- .decisions/prd-context.md, tech-decisions.md

---

## 🎯 Success Criteria

- [ ] All 11 Wiki pages created (wiki/pages/)
- [ ] README.md (main) reduced to ~180 lines
- [ ] deployment/README.md and scripts/README.md have Wiki links
- [ ] UPLOAD_INSTRUCTIONS.md created (step-by-step guide)
- [ ] PROGRESS_TRACKER.md updated
- [ ] CLAUDE.md updated (wiki/ folder reference)
- [ ] No broken internal links
- [ ] All content in English (except user communication in Polish)

---

## ⚠️ Context Management

**Current token usage:** ~88k / 200k

**If context approaches 180k:**
1. Save progress to wiki/PROGRESS.md (update all checkboxes)
2. Update PROGRESS_TRACKER.md (mark partially completed)
3. Request user to run `/clear`
4. Create continuation prompt in wiki/CONTINUATION_PROMPT.md

**Continuation prompt location:** `wiki/CONTINUATION_PROMPT.md`

---

## 🔗 Links for PROGRESS_TRACKER.md

**Add to "Next Action" section:**

```markdown
### 📚 README.md Restructuring & GitHub Wiki Documentation

**Status:** 🔄 In Progress
**Priority:** Medium
**Time:** 2-3h

**Working files:** `wiki/` directory
- `wiki/PLAN.md` - Complete implementation plan
- `wiki/PROGRESS.md` - Progress tracker with checkboxes
- `wiki/UPLOAD_INSTRUCTIONS.md` - Step-by-step upload guide
- `wiki/pages/` - 11 Wiki pages (Markdown files)
- `wiki/modified-files/` - Modified README files

**Next steps:** See `wiki/PROGRESS.md` for detailed checklist
```

---

## 🔗 Links for CLAUDE.md

**Add to "Documentation" section:**

```markdown
### GitHub Wiki (Documentation for Users & Developers)

**Location:** https://github.com/kojder/photo-map-app/wiki

**Working files:** `wiki/` directory (local preparation before upload)
- `wiki/PLAN.md` - Implementation plan and structure
- `wiki/PROGRESS.md` - Progress tracker
- `wiki/UPLOAD_INSTRUCTIONS.md` - How to upload to GitHub Wiki
- `wiki/pages/` - 11 Wiki pages ready for upload
- `wiki/modified-files/` - Modified local README files

**Wiki Structure:** 11 pages
- Home (navigation hub)
- User Guide (for end users)
- Quick Start, Development Setup, Architecture, API Docs (for developers)
- Testing & Quality, Scripts Reference, Deployment (for devops)
- AI Development Methodology, Contributing (for contributors)
```

---

**Next:** See `wiki/PROGRESS.md` for step-by-step progress tracking.
