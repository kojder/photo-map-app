# README.md Restructuring & GitHub Wiki Setup - Continuation Prompt

## Context

Photo Map MVP project has comprehensive documentation in README.md, but it mixes:
- Quick start information (for new users)
- Detailed technical documentation (for developers)
- Deployment guides
- Architecture details

This makes README.md too long and harder to navigate. We need to split documentation into:
1. **README.md** - concise project introduction and quick start
2. **GitHub Wiki** - detailed technical documentation

## Current State

- ✅ MVP completed (6 phases)
- ✅ Language policy enforced (all scripts/docs in English)
- ✅ Deployment scripts with --init flag (environment reset automation)
- ✅ E2E tests + GitHub Actions CI/CD
- 📝 README.md needs restructuring
- 📝 GitHub Wiki needs creation

**GitHub Repository:** https://github.com/kojder/photo-map-app
**Wiki URL:** https://github.com/kojder/photo-map-app/wiki

## Task: README.md Restructuring & GitHub Wiki Documentation

**Priority:** Medium (project organization & documentation)
**Time:** 2-3h

### Goals

1. **Restructure README.md** (keep concise, ~150-200 lines):
   - Project title and description
   - Key features (bullet list)
   - Tech stack summary (Angular 18, Spring Boot 3, PostgreSQL 15)
   - Screenshots/demo (if available)
   - Quick start (3-5 steps to run locally)
   - Links to detailed documentation in Wiki
   - Contributing section
   - License

2. **Create GitHub Wiki** with pages:
   - **Home** - Navigation hub to all pages
   - **Development Setup** - Detailed local environment setup
   - **Deployment Guide** - How to deploy to Mikrus VPS
   - **Architecture Overview** - Tech stack, design decisions
   - **API Documentation** - REST endpoints, authentication
   - **Testing** - Unit tests, E2E tests, running tests
   - **Scripts Reference** - All development scripts (start-dev.sh, rebuild.sh, etc.)
   - **Troubleshooting** - Common issues and solutions
   - **Contributing** - How to contribute, code style, PR process

### Current README.md Structure (to review)

Check current README.md at `/home/andrew/projects/photo-map-app/README.md`

### Available Documentation to Migrate to Wiki

- `deployment/README.md` - Detailed deployment guide (already in English)
- `scripts/README.md` - Scripts documentation (already in English)
- `.ai/tech-stack.md` - Tech stack specification
- `.ai/api-plan.md` - API specification
- `.ai/db-plan.md` - Database schema
- `PROGRESS_TRACKER.md` - Project progress (can reference in Wiki)

### Implementation Steps

1. **Analyze Current README.md:**
   - Read current README.md
   - Identify sections to keep vs migrate to Wiki
   - Create list of what stays in README

2. **Create New README.md Structure:**
   - Write new concise README.md
   - Focus on first-time visitors
   - Add clear links to Wiki pages

3. **Create GitHub Wiki Pages:**
   - Use GitHub's Wiki interface or API
   - Create pages listed above
   - Migrate content from existing documentation
   - Add navigation between pages

4. **Content Migration:**
   - Move detailed deployment guide from `deployment/README.md` to Wiki "Deployment Guide" page
   - Move scripts documentation from `scripts/README.md` to Wiki "Scripts Reference" page
   - Extract architecture details from `.ai/` files to Wiki "Architecture Overview"
   - Add troubleshooting section based on deployment/README.md troubleshooting

5. **Verification:**
   - Check all links work
   - Verify Wiki is accessible
   - Ensure README.md is concise (<200 lines)
   - Update PROGRESS_TRACKER.md when done

### Example README.md Structure (Target)

```markdown
# Photo Map MVP

> Personal photo management application with geolocation and map visualization

[Brief 2-3 sentence description]

## ✨ Features

- 📸 Photo upload with EXIF metadata extraction
- 🗺️ Interactive map with photo markers (Leaflet.js)
- ⭐ Photo rating system
- 🔐 JWT authentication
- 👤 User management (admin panel)
- 📱 Responsive design (mobile-friendly)

## 🛠️ Tech Stack

- **Frontend:** Angular 18 (standalone), TypeScript 5, Tailwind CSS 3
- **Backend:** Spring Boot 3, Java 17
- **Database:** PostgreSQL 15
- **Deployment:** Docker Compose, Nginx, Mikrus VPS

## 🚀 Quick Start

[3-5 steps to run locally]

## 📚 Documentation

For detailed documentation, see our [GitHub Wiki](https://github.com/kojder/photo-map-app/wiki):

- [Development Setup](https://github.com/kojder/photo-map-app/wiki/Development-Setup)
- [Deployment Guide](https://github.com/kojder/photo-map-app/wiki/Deployment-Guide)
- [Architecture Overview](https://github.com/kojder/photo-map-app/wiki/Architecture)
- [API Documentation](https://github.com/kojder/photo-map-app/wiki/API-Documentation)
- [Scripts Reference](https://github.com/kojder/photo-map-app/wiki/Scripts-Reference)
- [Troubleshooting](https://github.com/kojder/photo-map-app/wiki/Troubleshooting)

## 🤝 Contributing

[Brief contributing section or link to Wiki contributing page]

## 📄 License

[License information]
```

### Important Notes

1. **GitHub Wiki Creation:**
   - Wiki is automatically available at: https://github.com/kojder/photo-map-app/wiki
   - Can be edited via GitHub web interface or cloned as git repository
   - Wiki has its own version control
   - Markdown format

2. **Content Style:**
   - Use clear headers and navigation
   - Add table of contents for long pages
   - Include code examples where appropriate
   - Use screenshots/diagrams if helpful
   - Keep language consistent (English only)

3. **Links:**
   - Use relative links within Wiki pages
   - Use absolute URLs for links from README to Wiki
   - Test all links after creation

4. **Maintenance:**
   - Update PROGRESS_TRACKER.md after completion
   - Mark task as completed in "Last Completed" section
   - Update "Currently Working On" to "None - ready for next task"

## Files to Modify

- `/home/andrew/projects/photo-map-app/README.md` - restructure (keep concise)
- `/home/andrew/projects/photo-map-app/PROGRESS_TRACKER.md` - update after completion

## Files to Reference (for Wiki content)

- `deployment/README.md` - deployment guide content
- `scripts/README.md` - scripts documentation
- `.ai/tech-stack.md` - architecture details
- `.ai/api-plan.md` - API specification
- `.ai/db-plan.md` - database schema

## Success Criteria

- ✅ README.md is concise (<200 lines)
- ✅ README.md has clear project overview and quick start
- ✅ GitHub Wiki created with 8+ pages
- ✅ All detailed documentation migrated to Wiki
- ✅ Navigation between Wiki pages works
- ✅ Links from README to Wiki work
- ✅ PROGRESS_TRACKER.md updated
- ✅ No broken links

## Next Steps After Completion

After completing this task, update PROGRESS_TRACKER.md:
- Move this task from "Next Action" to "Last Completed"
- Set "Currently Working On" to "None - ready for next task"

Then consider next priorities from "Planned Next (Post-MVP)" section.

---

**Date Created:** 2025-11-10
**Status:** 🔜 Planned
**Estimated Time:** 2-3h
