---
name: Code Review for Photo Map MVP
description: Review, analyze, and inspect code for Photo Map MVP project following Spring Boot, Angular 18, and shared project conventions. Check security, performance, naming, testing, and MVP scope compliance. Use when reviewing pull requests, conducting code audits, analyzing code quality, inspecting Java or TypeScript files, or ensuring quality before commits. File types: .java, .ts, .html, .xml, .properties, .css, .scss
allowed-tools: Read, Grep, Glob
---

# Code Review - Photo Map MVP

**Note:** This is a READ-ONLY Skill (no Write/Edit/Bash).

## Review Philosophy

**MVP-First Mindset:**
- ✅ Simple, working solution over complex, perfect solution
- ✅ Security-first (user scoping, input validation, JWT)
- ✅ Code readability (self-documenting, English names)
- ❌ NO over-engineering
- ❌ NO features beyond MVP requirements

---

## Backend Review Checklist

### Security (CRITICAL!)

**User Scoping:**
```java
// ❌ BAD: No user scoping - security vulnerability!
public Photo getPhoto(Long photoId) {
    return photoRepository.findById(photoId).orElseThrow();
}

// ✅ GOOD: User scoping enforced
public Photo getPhoto(Long photoId, Long userId) {
    return photoRepository.findByIdAndUserId(photoId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
}
```

**Check:**
- ✅ ALL photo queries include userId filtering
- ✅ JWT validation on protected endpoints
- ✅ BCrypt password hashing
- ✅ Input validation (`@Valid` on DTOs)
- ✅ Error messages don't expose internals

### Architecture

**Layered Separation:**
- ✅ Controllers only handle HTTP (no business logic)
- ✅ Services contain business logic
- ✅ Repositories only data access
- ✅ DTOs used for API (entities NEVER exposed)
- ✅ `@Transactional` on service methods
- ✅ `@Transactional(readOnly = true)` on queries

### Testing

**Coverage:**
- ✅ Service methods tested (business logic)
- ✅ Custom repository queries tested
- ✅ Security configuration tested
- ✅ DTO validation tested

---

## Frontend Review Checklist

### Architecture (CRITICAL!)

**Standalone Components:**
```typescript
// ❌ BAD: Using NgModule
@NgModule({
  declarations: [PhotoGalleryComponent],
  imports: [CommonModule]
})
export class PhotoGalleryModule { }

// ✅ GOOD: Standalone component
@Component({
  standalone: true,
  imports: [CommonModule]
})
export class PhotoGalleryComponent { }
```

**Dependency Injection:**
```typescript
// ❌ BAD: Constructor injection (old style)
constructor(private photoService: PhotoService) {}

// ✅ GOOD: inject() function (modern Angular 18)
private photoService = inject(PhotoService);
```

**State Management:**
```typescript
// ❌ BAD: Exposing BehaviorSubject
public photosSubject = new BehaviorSubject<Photo[]>([]);

// ✅ GOOD: Private BehaviorSubject, public Observable
private photosSubject = new BehaviorSubject<Photo[]>([]);
public photos$ = this.photosSubject.asObservable();
```

### Check:
- ✅ NO `@NgModule` anywhere (standalone only!)
- ✅ `inject()` function used (not constructor)
- ✅ BehaviorSubject kept private
- ✅ Async pipe over manual subscriptions
- ✅ Guards protect routes (authGuard, adminGuard)
- ✅ Tailwind utilities (not custom CSS)
- ✅ JWT stored in localStorage
- ✅ Auth interceptor adds token to requests

### Testing

**Coverage:**
- ✅ Component logic tested
- ✅ Service methods tested (HTTP mocked)
- ✅ Guards tested
- ✅ Standalone imports in TestBed

---

## Security Review

### Authentication & Authorization

**Backend:**
- ✅ JWT token validation on all protected endpoints
- ✅ Role-based access (`@PreAuthorize`, `/api/admin/**`)
- ✅ Password hashing with BCrypt
- ✅ User data isolation (userId in queries)

**Frontend:**
- ✅ JWT stored securely (localStorage or httpOnly cookie)
- ✅ Token added via interceptor
- ✅ Route guards protect pages
- ✅ 401 errors → redirect to login
- ✅ Token cleared on logout

### Input Validation

**Backend:**
- ✅ File upload validation (size, type, empty check)
- ✅ `@Valid` on request DTOs
- ✅ File names sanitized (prevent directory traversal)

**Frontend:**
- ✅ Form validators (email, minLength, required)
- ✅ Validation errors displayed to user
- ✅ Client-side validation (+ backend validation!)

---

## Performance Review

### Backend

**Check:**
- ✅ Database indexes on `user_id`, `created_at`, `rating`
- ✅ `@Transactional(readOnly = true)` on queries
- ✅ Lazy fetch relationships (`FetchType.LAZY`)
- ✅ Thumbnail generation (not loading originals)
- ❌ NO premature optimization (Redis, queues)

### Frontend

**Check:**
- ✅ Lazy loading images in gallery
- ✅ Async pipe (automatic subscription cleanup)
- ✅ Thumbnail URLs from backend (not originals)
- ✅ TrackBy for *ngFor lists
- ❌ NO premature optimization (Virtual Scroll, Service Workers)

---

## Naming Conventions

### General Rules

**Check:**
- ✅ All code identifiers in English
- ✅ Self-documenting names (clear intent)
- ✅ Method names: `getX()`, `findX()`, `createX()`, `updateX()`, `deleteX()`
- ✅ Boolean methods: `isX()`, `hasX()`, `canX()`
- ✅ No Polish variable/method names

### File Naming

**Backend:**
- ✅ Controllers: `PhotoController.java`
- ✅ Services: `PhotoService.java`
- ✅ Repositories: `PhotoRepository.java`
- ✅ DTOs: `PhotoDto.java`, `UserRegistrationRequest.java`

**Frontend:**
- ✅ Components: `photo-gallery.component.ts`
- ✅ Services: `photo.service.ts`
- ✅ Guards: `auth.guard.ts`
- ✅ Interfaces: `photo.interface.ts`

---

## Common Anti-Patterns

### Backend

**❌ Business Logic in Controller:**
```java
// BAD
@PostMapping
public ResponseEntity<Photo> upload(MultipartFile file) {
    // Extracting EXIF in controller - WRONG!
    ExifData exif = extractExif(file);
    // ...
}
```

**❌ Exposing Entities:**
```java
// BAD
@GetMapping
public List<Photo> getPhotos() {
    return photoRepository.findAll(); // Entity exposed!
}
```

**❌ No User Scoping:**
```java
// BAD - Security vulnerability!
public void deletePhoto(Long photoId) {
    photoRepository.deleteById(photoId);
}
```

### Frontend

**❌ NgModules (Forbidden!):**
```typescript
// BAD - Angular 18 standalone project!
@NgModule({ ... })
```

**❌ Nested Subscriptions:**
```typescript
// BAD
this.http.get<User>('/user').subscribe(user => {
  this.http.get<Photo[]>(`/photos/${user.id}`).subscribe(photos => {
    // ...
  });
});

// GOOD - Use switchMap
this.http.get<User>('/user').pipe(
  switchMap(user => this.http.get<Photo[]>(`/photos/${user.id}`))
).subscribe(photos => {
  // ...
});
```

**❌ Exposed BehaviorSubject:**
```typescript
// BAD
public photosSubject = new BehaviorSubject<Photo[]>([]);
```

---

## Git Commits Review

**Check:**
- ✅ Conventional Commits format: `type(scope): description`
- ✅ Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- ✅ NO promotional messages ("Generated with Claude Code")
- ✅ Clear, focused commits (single change)
- ✅ Imperative mood ("add" not "added")

**Examples:**
```
✅ feat(auth): add JWT token validation
✅ fix(upload): handle photos without GPS data
❌ feat: add stuff to the code
❌ Update code - Generated with Claude Code
```

---

## Review Checklist Summary

**Before Approval:**

**Security:**
- [ ] User scoping on all photo queries
- [ ] JWT validation working
- [ ] Input validation present
- [ ] No entities exposed to API

**Architecture:**
- [ ] Backend: Controllers → Services → Repositories
- [ ] Frontend: Standalone components, inject(), BehaviorSubject pattern
- [ ] NO NgModules in Angular code
- [ ] DTOs used for all API responses

**Testing:**
- [ ] Service logic tested
- [ ] Component logic tested
- [ ] Custom queries tested
- [ ] Guards tested

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

## Related Documentation

- `.ai/prd.md` - MVP scope and requirements
- `.cursor/rules/spring-boot.mdc` - Backend guidelines
- `.cursor/rules/angular.mdc` - Frontend guidelines
- `.cursor/rules/shared.mdc` - Project conventions
