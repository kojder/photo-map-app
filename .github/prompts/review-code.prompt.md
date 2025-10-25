---
description: "Perform security and code quality review of selected code"
mode: ask
---

# Code Review

Perform comprehensive code review focusing on security, quality, and best practices.

## Review Checklist

### Security

- [ ] **User scoping** - All queries filtered by userId (photos, ratings)
- [ ] **Input validation** - `@Valid` annotations, Bean Validation
- [ ] **SQL injection** - No raw SQL, use parameterized queries
- [ ] **XSS protection** - Proper escaping in templates
- [ ] **Authentication** - JWT validation, proper error handling
- [ ] **Authorization** - Role checks (`@PreAuthorize` for admin)
- [ ] **Sensitive data** - No passwords/secrets in logs/responses
- [ ] **CORS** - Proper configuration (dev proxy, prod restrictions)

### Backend Quality (Spring Boot)

- [ ] **DTOs used** - Never expose entities in REST responses
- [ ] **@Transactional** - On service methods, not controllers
- [ ] **Constructor injection** - `final` fields + `@RequiredArgsConstructor`
- [ ] **Immutability** - `final` on parameters and local variables
- [ ] **Records for DTOs** - Use Java 17 records
- [ ] **Exception handling** - Proper `@RestControllerAdvice` usage
- [ ] **HTTP status codes** - Correct (200/201/204/400/401/404)
- [ ] **Validation messages** - i18n codes from `ValidationMessages.properties`
- [ ] **Tests** - Unit tests >70% coverage

### Frontend Quality (Angular)

- [ ] **Standalone components** - NO `@NgModule`
- [ ] **inject() function** - NOT constructor injection
- [ ] **State management** - BehaviorSubject for shared, signals for local
- [ ] **Async pipe** - Used in templates (auto-unsubscribe)
- [ ] **Memory leaks** - No manual subscribes without cleanup
- [ ] **Type safety** - No `any`, strict TypeScript
- [ ] **Tailwind 3.4.17** - NOT v4 (incompatibility)
- [ ] **Test IDs** - `data-testid` on interactive elements
- [ ] **Error handling** - Proper error states, user feedback
- [ ] **Tests** - Unit tests >70% coverage

### Performance

- [ ] **Database queries** - Proper indexes, no N+1 queries
- [ ] **Async processing** - Heavy tasks (EXIF, thumbnails) async
- [ ] **Pagination** - Large lists paginated
- [ ] **Caching** - Where appropriate (API responses)
- [ ] **Bundle size** - Frontend lazy loading if needed

### Code Style

- [ ] **English** - All code in English (commits can be Polish)
- [ ] **Naming** - Clear, descriptive names
- [ ] **Comments** - Only for complex business logic
- [ ] **Formatting** - Consistent indentation, spacing
- [ ] **Dead code** - Removed unused imports/variables

## Review Format

For each issue found, provide:

1. **Severity:** 🔴 Critical | 🟡 Warning | 🔵 Info
2. **Category:** Security | Quality | Performance | Style
3. **Location:** File and line number
4. **Issue:** What's wrong
5. **Fix:** How to fix it (with code example if applicable)

## Example Output

```markdown
## Code Review Results

### 🔴 Critical Issues

**Security - User Scoping Missing**
File: `PhotoService.java:45`
Issue: `photoRepository.findById(id)` allows any user to access any photo
Fix:
\`\`\`java
// Change to:
photoRepository.findByIdAndUserId(id, userId)
\`\`\`

### 🟡 Warnings

**Quality - DTO Missing**
File: `PhotoController.java:23`
Issue: Returning `Photo` entity directly instead of DTO
Fix: Create `PhotoDto` and use `PhotoDto.fromEntity(photo)`

### 🔵 Info

**Style - Missing final keyword**
File: `PhotoService.java:15`
Suggestion: Add `final` to method parameter for immutability
```

## Usage

Select code to review, then run:
```
/review-code
```

Focus on:
- New features (security, quality)
- Bug fixes (root cause addressed?)
- Refactoring (patterns followed?)
