# Git Standards - Photo Map MVP

Git commit and PR review standards for Photo Map MVP.

---

## Conventional Commits

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add JWT token validation` |
| `fix` | Bug fix | `fix(upload): handle photos without GPS data` |
| `docs` | Documentation only | `docs: update PROGRESS_TRACKER.md` |
| `style` | Code style changes (formatting, no logic) | `style: format PhotoService code` |
| `refactor` | Code refactoring (no feature/bug) | `refactor(service): simplify photo mapper` |
| `perf` | Performance improvement | `perf(db): add index on user_id column` |
| `test` | Adding/updating tests | `test(auth): add JWT validation tests` |
| `chore` | Build, config, dependencies | `chore: update Spring Boot to 3.2.11` |

### Commit Examples

**✅ GOOD:**
```
feat(auth): implement JWT token validation

Add JwtTokenProvider and JwtAuthenticationFilter
for stateless authentication with JWT.

Includes:
- Token generation with expiration
- Token validation with signature check
- Spring Security configuration
```

```
fix(upload): resolve EXIF extraction for HEIC files

metadata-extractor library doesn't support HEIC.
Add fallback for files without EXIF data.

Fixes #42
```

```
docs: update PROGRESS_TRACKER after Phase 1 completion

Mark Phase 1 (Backend Setup & Auth) as completed.
Update Current Status to Phase 2.1.
```

**❌ BAD:**
```
Update code

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
feat: add stuff to the code
```

```
Fixed bug
```

### Commit Message Rules

**Check:**
- ✅ Type from allowed list (`feat`, `fix`, `docs`, etc.)
- ✅ Scope in parentheses (optional but recommended)
- ✅ Description starts with lowercase
- ✅ Imperative mood ("add" not "added")
- ✅ NO promotional messages ("Generated with Claude Code")
- ✅ Clear, focused commit (single change)
- ✅ Body explains WHY (optional)
- ✅ Footer references issues (optional)

---

## Commit Workflow

### Small, Focused Commits

**Good commit size:**
- ✅ One logical change per commit
- ✅ All tests passing after commit
- ✅ Code compiles after commit
- ✅ Commit message explains change

**Example workflow:**
```bash
# 1. Implement feature
# Edit PhotoService.java

# 2. Write tests
# Edit PhotoServiceTest.java

# 3. Verify tests pass
./mvnw test

# 4. Stage changes
git add src/main/java/com/photomap/service/PhotoService.java
git add src/test/java/com/photomap/service/PhotoServiceTest.java

# 5. Review changes
git status
git diff --cached --stat

# 6. Commit with Conventional Commits message
git commit -m "feat(photo): add rating filter method

Add filterPhotosByRating() method in PhotoService
to support filtering photos by minimum rating.

Includes service method and unit tests."
```

### Commit Checklist

Before committing:
- [ ] Code implementation ready
- [ ] Tests written (>70% coverage)
- [ ] All tests passing
- [ ] Code review (git diff --cached)
- [ ] Commit message follows Conventional Commits

---

## Pull Request Review

### PR Title

**Format:** Same as commit message (Conventional Commits)

**Examples:**
- ✅ `feat(auth): implement JWT authentication flow`
- ✅ `fix(gallery): resolve photo ordering issue`
- ❌ `Update code`
- ❌ `Phase 1 complete`

### PR Description

**Template:**
```markdown
## Summary
- Bullet point summary of changes
- What was added/fixed/changed
- Why this change was needed

## Test Plan
- [ ] Unit tests passing (>70% coverage)
- [ ] Integration tests passing (if applicable)
- [ ] Manual testing completed
- [ ] Verified with curl/Postman (backend)
- [ ] Verified in browser (frontend)

## Checklist
- [ ] Security review (user scoping, JWT, validation)
- [ ] Architecture review (layered separation, DTOs)
- [ ] Code quality (English naming, self-documenting)
- [ ] MVP scope compliance (no over-engineering)
```

### PR Review Checklist

**Before approval:**

**Security:**
- [ ] User scoping on all photo queries
- [ ] JWT validation working
- [ ] Input validation present
- [ ] No entities exposed

**Architecture:**
- [ ] Backend: Controllers → Services → Repositories
- [ ] Frontend: Standalone components, inject(), BehaviorSubject
- [ ] NO NgModules in Angular code
- [ ] DTOs used for all API responses

**Testing:**
- [ ] Service logic tested (>70%)
- [ ] Component logic tested
- [ ] All tests passing

**Code Quality:**
- [ ] English naming conventions
- [ ] Self-documenting code
- [ ] Minimal comments
- [ ] No over-engineering

**MVP Scope:**
- [ ] Only features from `.ai/prd.md`
- [ ] No premature optimization
- [ ] Simple solutions

---

## Branch Strategy

**Main branch:**
- `master` - production-ready code

**Feature branches:**
- `feature/auth-jwt` - JWT authentication
- `feature/photo-upload` - Photo upload feature
- `feature/gallery-view` - Gallery component

**Bugfix branches:**
- `fix/exif-parsing` - EXIF parsing bug
- `fix/rating-validation` - Rating validation issue

**Branch naming:**
- ✅ `feature/<short-description>` or `feat/<short-description>`
- ✅ `fix/<short-description>`
- ✅ `docs/<short-description>`
- ❌ NO `user/feature-name` (not needed for solo project)

---

## Commit Anti-Patterns

### ❌ Promotional Messages

```
feat(auth): implement JWT authentication

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Problem:** Promotional content not needed in commit history.

**Fix:** Remove promotional lines.

### ❌ Vague Commit Messages

```
Update code
Fix stuff
WIP
```

**Problem:** No information about what changed or why.

**Fix:** Use Conventional Commits with clear description.

### ❌ Large, Unfocused Commits

```
feat: implement entire authentication system

Added:
- JWT token generation
- User registration
- Login endpoint
- Password hashing
- Security configuration
- 15 other changes...
```

**Problem:** Too many changes in one commit, hard to review/revert.

**Fix:** Break into smaller, focused commits:
- `feat(auth): add user registration endpoint`
- `feat(auth): implement JWT token generation`
- `feat(auth): configure Spring Security`

### ❌ Broken Commits

```
feat(photo): add photo upload feature

(Tests failing, code doesn't compile)
```

**Problem:** Commit breaks build, tests fail.

**Fix:** Only commit when all tests pass.

---

## Git Review Checklist

**Before approval:**

**Commit Messages:**
- [ ] Conventional Commits format
- [ ] Type from allowed list
- [ ] Clear, focused description
- [ ] Imperative mood
- [ ] NO promotional messages

**Commit Size:**
- [ ] One logical change per commit
- [ ] Tests passing after commit
- [ ] Code compiles after commit

**Branch Strategy:**
- [ ] Feature branches used
- [ ] Branch name descriptive
- [ ] NO commits directly to master

**PR:**
- [ ] PR title follows Conventional Commits
- [ ] PR description complete
- [ ] Test plan included
- [ ] All checks passing
