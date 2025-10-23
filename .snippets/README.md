# Code Snippets Index

Context7 snippets saved for future reference during Photo Map MVP implementation.

## Purpose

When using MCP Context7 to retrieve library documentation and >50% of content is unused immediately, save snippets here for later phases. This provides:
- ✅ Quick reference without re-querying Context7
- ✅ Backup for VM loss scenarios
- ✅ Documentation of implementation patterns

**Note:** These snippets are public documentation from Context7 - safe to commit to repository.

---

## Index

### Spring Boot (Backend)

| File | Description | Phase | Added |
|------|-------------|-------|-------|
| `spring-security-jwt-config.md` | Spring Security 6 JWT configuration patterns | Phase 1.3 | TBD |
| `spring-boot-file-upload.md` | Multipart file upload with validation | Phase 3.1 | TBD |
| `flyway-migrations-postgresql.md` | Flyway migration best practices + PostgreSQL patterns | Phase 1.2 | TBD |

### Angular (Frontend)

| File | Description | Phase | Added |
|------|-------------|-------|-------|
| `angular-signals-patterns.md` | Angular 18 Signals + BehaviorSubject state management | Phase 2+4 | TBD |
| `angular-standalone-routing.md` | Standalone components routing + guards | Phase 2 | TBD |

### Libraries

| File | Description | Phase | Added |
|------|-------------|-------|-------|
| `leaflet-marker-clustering.md` | Leaflet.js marker clustering API | Phase 4.3 | TBD |
| `thumbnailator-image-processing.md` | Thumbnailator library patterns | Phase 3.3 | TBD |

---

## Usage Workflow

1. **During Context7 retrieval:**
   - Use 10-20% of content immediately
   - Save remaining 80-90% as snippet file

2. **Naming convention:**
   - Format: `technology-feature-scope.md`
   - Examples: `spring-security-jwt-config.md`, `leaflet-marker-clustering.md`

3. **Add to this index:**
   - Update relevant table (Spring Boot, Angular, Libraries)
   - Include: filename, description, phase, date added

4. **Later reference:**
   - Check this index for relevant snippet
   - Read snippet file when implementing feature
   - Implement according to documented patterns

---

## Snippet File Template

```markdown
# [Technology] - [Feature]

**Source:** Context7 - [library-name] ([date])
**Used in:** Phase X.Y - [Task Name]
**Relevant for:** [Classes/Components/Files]

## [Section 1]
[snippets from Context7...]

## [Section 2]
[snippets from Context7...]
```

---

**Last Updated:** 2025-10-23
**Total Snippets:** 0
