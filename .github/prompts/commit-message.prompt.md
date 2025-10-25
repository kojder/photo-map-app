---
description: "Generate conventional commit message from staged changes"
mode: ask
---

# Generate Commit Message

Generate a commit message following Conventional Commits format based on staged changes.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code change that neither fixes bug nor adds feature
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Build process, auxiliary tools, dependencies

## Scopes (Project-specific)

**Backend:**
- `auth` - Authentication/authorization
- `photos` - Photo management
- `rating` - Rating system
- `admin` - Admin features
- `security` - Security-related
- `backend` - General backend

**Frontend:**
- `gallery` - Gallery component
- `map` - Map component
- `upload` - Upload functionality
- `filters` - Filtering system
- `frontend` - General frontend

**Other:**
- `docs` - Documentation
- `scripts` - Dev scripts
- `ci` - CI/CD

## Examples

```
feat(auth): implement JWT token validation
fix(photos): resolve EXIF extraction error for PNG files
docs: update PROGRESS_TRACKER after Phase 3 completion
refactor(gallery): migrate from signals to BehaviorSubject pattern
test(photos): add unit tests for PhotoService
chore(deps): upgrade Angular to 18.2.0
```

## Instructions

1. Analyze staged changes (`git diff --cached`)
2. Identify:
   - Primary type of change (feat/fix/refactor/etc.)
   - Affected scope (component/module)
   - Main purpose of changes
3. Generate commit message:
   - Type + scope (if applicable)
   - Concise description (imperative mood, no period)
   - Body (if complex change needs explanation)
4. Keep description under 72 characters
5. Polish or English OK for commit message

## Usage

After staging changes:
```
/commit-message
```

## Reference

Based on project commits:
- `feat(frontend): implement Phase 4 - gallery, map, and photo management`
- `fix(photos): zachowanie proporcji zdjęć w thumbnailach i galerii`
- `refactor(photos): remove ownership restrictions and fix rating scale to 1-5`
