# Contributing Guide

> Complete guide for contributing to Photo Map MVP - code conventions, git workflow, testing policy, and pull request process.

---

## 📖 Table of Contents

- [Getting Started](#getting-started)
- [Code Conventions](#code-conventions)
- [Git Workflow](#git-workflow)
- [Testing Policy](#testing-policy)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- ✅ Read [Development Setup](Development-Setup) guide
- ✅ Read [Architecture](Architecture) overview
- ✅ Familiarized yourself with [Testing & Quality](Testing-Quality) standards
- ✅ Set up your local development environment
- ✅ Installed pre-push hook: `./scripts/install-hooks.sh`

### First Contribution

1. **Choose an issue:**
   - Check GitHub Issues for open tasks
   - Look for issues labeled `good first issue` or `help wanted`
   - Comment on the issue to indicate you're working on it

2. **Set up environment:**
   - Clone repository
   - Install dependencies
   - Run tests to verify setup
   - Start development environment

3. **Understand the context:**
   - Read `.ai/prd.md` for project requirements
   - Read `.ai/tech-stack.md` for technology specifications
   - Check `.decisions/` for architectural decisions
   - Review related code in the codebase

4. **Implement:**
   - Follow code conventions (see below)
   - Write tests (>70% coverage)
   - Update documentation if needed
   - Test locally before committing

5. **Submit PR:**
   - Follow PR template
   - Ensure all tests pass
   - Wait for code review

---

## 📝 Code Conventions

### Language Policy

**IMPORTANT: All code and documentation must follow this strict language policy:**

**Code:**
- ✅ **English only** - all identifiers, class names, method names, variables
- ✅ **English only** - function parameters and return values
- ✅ **English only** - constants and enums
- ✅ **English only** - all code identifiers

**Documentation:**
- ✅ **English only** - all .md files (README, documentation)
- ✅ **English only** - inline comments in code
- ✅ **English only** - JavaDoc and TSDoc comments
- ✅ **English only** - bash script comments, help messages, log messages

**Git Commits:**
- ✅ **English only** - Conventional Commits format
- ✅ **English only** - commit message body and footer

**Communication:**
- ✅ **Polish** - user-facing responses in Pull Request discussions (if applicable to the user)

**Never mix Polish and English in code or documentation!**

### Code Quality

**Self-Documenting Code:**
- Clear, descriptive names > comments
- Minimize comments (only for complex business logic)
- Code should be understandable through naming alone

**Examples:**

✅ **Good:**
```java
public List<Photo> findPhotosWithGpsCoordinates() {
    return photoRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull();
}
```

❌ **Bad:**
```java
// Finds photos with GPS
public List<Photo> findPhotos() {
    return photoRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull();
}
```

### TypeScript / Frontend

**Strict Mode:**
- All types explicit (no `any` unless absolutely necessary)
- Strict null checks enabled
- Strict property initialization

**Component Structure:**
```typescript
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, PhotoCardComponent],
  template: `...`
})
export class GalleryComponent implements OnInit {
  private photoService = inject(PhotoService);
  photos$ = this.photoService.photos$;

  ngOnInit(): void {
    this.photoService.loadPhotos();
  }
}
```

**Service Pattern (BehaviorSubject):**
```typescript
export class PhotoService {
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  public photos$ = this.photosSubject.asObservable();

  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photosSubject.next(photos);
    });
  }
}
```

### Java / Backend

**Code Style:**
- Use Lombok annotations for boilerplate reduction
- Proper exception handling (never swallow exceptions)
- Input validation with Bean Validation (`@NotBlank`, `@Email`, etc.)
- Security-first approach (prevent SQL injection, XSS)

**Controller Pattern:**
```java
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {
    private final PhotoService photoService;

    @GetMapping
    public ResponseEntity<PageResponse<PhotoResponse>> listPhotos(
            @RequestParam(required = false) LocalDate startDate,
            Pageable pageable) {
        Page<PhotoResponse> photos = photoService.findAll(startDate, pageable);
        return ResponseEntity.ok(new PageResponse<>(photos));
    }
}
```

**Service Pattern:**
```java
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final PhotoProcessingService processingService;

    @Transactional
    public PhotoResponse uploadPhoto(MultipartFile file) {
        // Business logic here
        Photo photo = processingService.processPhoto(file);
        return photoRepository.save(photo).toResponse();
    }
}
```

---

## 🌿 Git Workflow

### Conventional Commits

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only changes
- `style` - Code formatting (no logic change)
- `refactor` - Code refactoring (no bug fix or feature)
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tools

**Examples:**
```bash
feat(auth): implement JWT token validation
fix(photo): resolve EXIF extraction error
docs: update PROGRESS_TRACKER.md after Phase 1
refactor(gallery): extract filter logic to service
test(admin): add unit tests for user management
perf(map): optimize marker clustering performance
```

### Commit Strategy

**Small, Focused Commits:**
- Each commit represents one logical change
- Easy to review and revert if needed
- Clear commit message describes the change

**Example Workflow:**
```bash
# 1. Make changes
# Edit files...

# 2. Stage changes
git add backend/src/main/java/com/photomap/service/AuthService.java

# 3. Commit with descriptive message
git commit -m "feat(auth): add JWT token generation logic"

# 4. Continue with next change
# Edit more files...

# 5. Commit next logical change
git add backend/src/test/java/com/photomap/service/AuthServiceTest.java
git commit -m "test(auth): add unit tests for AuthService"

# 6. Push (pre-push hook will run all tests)
git push
```

### Commit Review Workflow

**Before Every Commit:**

1. Review your changes:
   ```bash
   git status
   git diff --cached
   ```

2. Ensure tests pass:
   ```bash
   ./scripts/run-all-tests.sh
   ```

3. Stage changes:
   ```bash
   git add <files>
   ```

4. Commit with clear message:
   ```bash
   git commit -m "type(scope): description"
   ```

**NEVER:**
- ❌ Commit without testing
- ❌ Commit commented-out code
- ❌ Commit debugging console.log() or System.out.println()
- ❌ Commit hardcoded passwords or secrets
- ❌ Use promotional messages ("Generated with Claude Code")

### Pre-Push Hook

**Automatic test execution before every push:**

**Install (one-time):**
```bash
./scripts/install-hooks.sh
```

**How it works:**
1. Every `git push` triggers the hook
2. Hook runs `./scripts/run-all-tests.sh` (frontend unit + backend + E2E)
3. If tests fail → push is **blocked**
4. If tests pass → push proceeds

**Bypass (emergency only):**
```bash
git push --no-verify
```

⚠️ **Never bypass for main/master!**

---

## 🧪 Testing Policy

### Unit Tests

**When:** Before every commit (TDD-like approach)

**Coverage:** >70% for new code

**Framework:**
- Frontend: Karma + Jasmine
- Backend: JUnit 5 + Mockito + Spring Boot Test

**Pattern:**
1. Implement feature
2. Verify with curl/Postman (backend) or manual test (frontend)
3. Write unit tests (>70% coverage)
4. Run tests: `./mvnw test` (backend) or `npm test` (frontend)
5. All tests passing → commit

### Integration Tests

**When:** At the end of each phase

**Framework:**
- Backend: `@SpringBootTest` + MockMvc
- Frontend: Playwright (E2E tests)

**Example:** End of Phase 1 → test all `/api/auth/*` endpoints with real DB

### Test Examples

**Frontend (Jasmine):**
```typescript
describe('PhotoService', () => {
  let service: PhotoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhotoService]
    });
    service = TestBed.inject(PhotoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load photos', () => {
    service.loadPhotos();
    const req = httpMock.expectOne('/api/photos');
    expect(req.request.method).toBe('GET');
  });
});
```

**Backend (JUnit 5):**
```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void testLoginSuccess() {
        // Given
        User user = new User();
        when(userRepository.findByEmail("user@example.com"))
            .thenReturn(Optional.of(user));

        // When
        AuthResponse response = authService.login("user@example.com", "password");

        // Then
        assertNotNull(response.getToken());
    }
}
```

---

## 🔀 Pull Request Process

### Before Creating PR

**Checklist:**
- [ ] Code implementation complete
- [ ] All tests passing (`./scripts/run-all-tests.sh`)
- [ ] Code coverage >70% for new code
- [ ] Code reviewed locally (`git diff`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits
- [ ] Branch up-to-date with master

### Creating Pull Request

**Title Format:**
```
type(scope): brief description
```

**Example:**
```
feat(auth): implement JWT token validation
```

**Description Template:**
```markdown
## Summary
Brief description of changes (1-2 sentences)

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if UI changes)
![Screenshot](url)

## Related Issues
Closes #123
```

### PR Review Process

1. **Automated Checks:**
   - GitHub Actions CI/CD runs
   - SonarCloud analysis runs
   - All tests must pass
   - Quality gate must pass

2. **Code Review:**
   - At least one reviewer approval required
   - Address all comments
   - Re-request review after changes

3. **Merge:**
   - Squash and merge (recommended)
   - Merge commit message follows Conventional Commits
   - Delete branch after merge

### Addressing Review Comments

**Good Practice:**
```markdown
> Reviewer: This function is too complex, consider extracting logic.

Thanks for the feedback! Extracted the logic into a separate method `processPhoto()`.
See commit abc123.
```

**Bad Practice:**
```markdown
> Reviewer: This function is too complex.

Fixed.
```

---

## ✅ Code Review Checklist

### Before Requesting Review

**Code Quality:**
- [ ] Code follows project conventions
- [ ] All identifiers in English
- [ ] Documentation in English
- [ ] No commented-out code
- [ ] No debugging statements (console.log, System.out.println)
- [ ] No hardcoded secrets or passwords

**Functionality:**
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Input validation added

**Testing:**
- [ ] Unit tests written (>70% coverage)
- [ ] All tests passing locally
- [ ] Integration tests if needed
- [ ] Manual testing performed

**Documentation:**
- [ ] README updated (if needed)
- [ ] API documentation updated (if new endpoints)
- [ ] Inline comments for complex logic

### As a Reviewer

**Code Quality:**
- [ ] Code follows conventions
- [ ] Naming clear and descriptive
- [ ] No duplication
- [ ] Proper abstraction level

**Security:**
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Authentication/authorization correct

**Performance:**
- [ ] No N+1 queries
- [ ] Efficient algorithms
- [ ] Proper indexing (if DB changes)
- [ ] No unnecessary loops

**Testing:**
- [ ] Tests cover new code
- [ ] Tests are meaningful (not just coverage)
- [ ] Edge cases tested
- [ ] Error cases tested

---

## 📚 Additional Resources

**Core Documentation:**
- [Development Setup](Development-Setup) - Environment setup
- [Architecture](Architecture) - System architecture
- [Testing & Quality](Testing-Quality) - Testing strategy
- [API Documentation](API-Documentation) - REST API reference

**Specifications:**
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - Technology specifications
- `.ai/db-plan.md` - Database schema
- `.ai/api-plan.md` - REST API specification
- `.ai/ui-plan.md` - Frontend architecture

**Decisions:**
- `.decisions/prd-context.md` - Business context
- `.decisions/tech-decisions.md` - Technology rationale

**External Resources:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Style Guide](https://angular.dev/style-guide)
- [Spring Boot Best Practices](https://spring.io/guides)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)

---

## 💡 Tips for Contributors

**Communication:**
- Ask questions in GitHub Issues or Pull Requests
- Be respectful and constructive in reviews
- Provide context in comments

**Code Quality:**
- Read existing code to understand patterns
- Follow established conventions
- When in doubt, ask before implementing

**Testing:**
- Write tests before fixing bugs (TDD)
- Test edge cases, not just happy path
- Run full test suite before pushing

**Documentation:**
- Update docs alongside code changes
- Use clear, concise language
- Include examples where helpful

---

**Last Updated:** 2025-11-10

**Sources:**
- `CLAUDE.md` (Code conventions, Git workflow, Testing policy)
- `.ai/tech-stack.md` (Technology patterns)
- `.github/workflows/README.md` (CI/CD process)
