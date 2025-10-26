# Common Anti-Patterns - Quick Scan List

Quick reference for common mistakes in Photo Map MVP code review.

---

## Backend Anti-Patterns (Spring Boot + Java)

### Security Issues (CRITICAL!)

❌ **No user scoping on queries**
```java
// BAD: Any user can access any photo
photoRepository.findById(photoId)

// GOOD: User can only access their own photos
photoRepository.findByIdAndUserId(photoId, userId)
```

❌ **Entities exposed to API**
```java
// BAD: Entity exposed
public List<Photo> getPhotos() {
    return photoRepository.findAll();
}

// GOOD: DTOs used
public List<PhotoDto> getPhotos(Long userId) {
    return photoRepository.findAllByUserId(userId)
        .stream().map(PhotoMapper::toDto).toList();
}
```

❌ **No @AuthenticationPrincipal in controller**
```java
// BAD: No user authentication
@GetMapping("/{id}")
public PhotoDto getPhoto(@PathVariable Long id) { ... }

// GOOD: Extract userId from authenticated user
@GetMapping("/{id}")
public PhotoDto getPhoto(@PathVariable Long id, @AuthenticationPrincipal User user) {
    return photoService.getPhoto(id, user.getId());
}
```

### Architecture Issues

❌ **Business logic in controller**
```java
// BAD: EXIF extraction in controller
@PostMapping
public Photo upload(MultipartFile file) {
    ExifData exif = extractExif(file); // WRONG!
}

// GOOD: Business logic in service
@PostMapping
public PhotoDto upload(MultipartFile file, @AuthenticationPrincipal User user) {
    return photoService.uploadPhoto(file, user.getId());
}
```

❌ **No @Transactional on service methods**
```java
// BAD: No transaction management
public Photo updatePhoto(Long id, PhotoUpdateRequest request) { ... }

// GOOD: @Transactional on write methods
@Transactional
public PhotoDto updatePhoto(Long id, PhotoUpdateRequest request, Long userId) { ... }

// GOOD: @Transactional(readOnly = true) on read methods
@Transactional(readOnly = true)
public PhotoDto getPhoto(Long id, Long userId) { ... }
```

❌ **Repository logic outside repositories**
```java
// BAD: Custom query in service
List<Photo> photos = entityManager.createQuery("SELECT p FROM Photo p WHERE p.userId = :userId")
    .setParameter("userId", userId)
    .getResultList();

// GOOD: Query in repository
interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findAllByUserId(Long userId);
}
```

### Testing Issues

❌ **No tests for service logic**
```
Missing: PhotoServiceTest.java
```

❌ **Tests without user scoping verification**
```java
// BAD: Test doesn't verify userId filtering
@Test
void getPhoto_returnsPhoto() {
    when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));
    // No userId verification!
}

// GOOD: Test verifies user scoping
@Test
void getPhoto_withValidIdAndUserId_returnsPhoto() {
    when(photoRepository.findByIdAndUserId(1L, 100L))
        .thenReturn(Optional.of(photo));
    photoService.getPhoto(1L, 100L);
    verify(photoRepository).findByIdAndUserId(1L, 100L);
}
```

### Code Quality Issues

❌ **Non-English identifiers**
```java
// BAD: Polish variable names
private String nazwaPliku;
public void zapiszZdjecie() { ... }

// GOOD: English names
private String fileName;
public void savePhoto() { ... }
```

❌ **Missing `final` keyword**
```java
// BAD: No final
public PhotoDto getPhoto(Long photoId, Long userId) { ... }

// GOOD: Use final
public PhotoDto getPhoto(final Long photoId, final Long userId) { ... }
```

---

## Frontend Anti-Patterns (Angular 18 + TypeScript)

### Architecture Issues (CRITICAL!)

❌ **NgModule usage (Angular 18 violation!)**
```typescript
// BAD: Using NgModule
@NgModule({
  declarations: [PhotoGalleryComponent],
  imports: [CommonModule]
})
export class PhotoGalleryModule { }

// GOOD: Standalone component
@Component({
  standalone: true,
  imports: [CommonModule]
})
export class PhotoGalleryComponent { }
```

❌ **Constructor injection instead of inject()**
```typescript
// BAD: Constructor injection (old style)
constructor(private photoService: PhotoService) {}

// GOOD: inject() function (Angular 18)
private readonly photoService = inject(PhotoService);
```

❌ **Old structural directives**
```typescript
// BAD: Old directives
<div *ngIf="isLoading">Loading...</div>
<div *ngFor="let photo of photos">{{ photo.fileName }}</div>

// GOOD: Angular 18 control flow
@if (isLoading()) {
  <div>Loading...</div>
}
@for (photo of photos(); track photo.id) {
  <div>{{ photo.fileName }}</div>
}
```

### State Management Issues

❌ **Exposed BehaviorSubject**
```typescript
// BAD: Mutable state exposed
public photosSubject = new BehaviorSubject<Photo[]>([]);

// GOOD: Private BehaviorSubject, public Observable
private readonly photosSubject = new BehaviorSubject<Photo[]>([]);
readonly photos$ = this.photosSubject.asObservable();
```

❌ **Subscriptions without cleanup**
```typescript
// BAD: Memory leak
ngOnInit() {
  this.photoService.photos$.subscribe(photos => {
    this.photos = photos;
  }); // No unsubscribe!
}

// GOOD: Async pipe (automatic cleanup)
readonly photos$ = this.photoService.photos$;
// Template: @for (photo of photos$ | async; track photo.id)

// OR: takeUntilDestroyed
ngOnInit() {
  this.photoService.photos$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(photos => this.photos.set(photos));
}
```

❌ **Nested subscriptions**
```typescript
// BAD: Nested subscriptions (callback hell)
this.http.get<User>('/user').subscribe(user => {
  this.http.get<Photo[]>(`/photos/${user.id}`).subscribe(photos => {
    // ...
  });
});

// GOOD: Use switchMap
this.http.get<User>('/user').pipe(
  switchMap(user => this.http.get<Photo[]>(`/photos/${user.id}`))
).subscribe(photos => { ... });
```

### Component Issues

❌ **Smart component without services**
```typescript
// BAD: No service injection in container component
@Component({ ... })
export class PhotoGalleryComponent {
  photos: Photo[] = []; // Hardcoded data?
}

// GOOD: Inject service, fetch data
@Component({ ... })
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  readonly photos = signal<Photo[]>([]);

  ngOnInit() {
    this.photoService.getPhotos().subscribe(photos => {
      this.photos.set(photos);
    });
  }
}
```

❌ **Dumb component with service injection**
```typescript
// BAD: Presentational component shouldn't inject services
@Component({ ... })
export class PhotoCardComponent {
  private readonly photoService = inject(PhotoService); // WRONG!
}

// GOOD: @Input/@Output only
@Component({ ... })
export class PhotoCardComponent {
  readonly photo = input.required<Photo>();
  readonly rate = output<number>();
}
```

❌ **Missing track in @for**
```typescript
// BAD: No track (performance issue)
@for (photo of photos(); track $index) {
  <div>{{ photo.fileName }}</div>
}

// GOOD: Track by unique ID
@for (photo of photos(); track photo.id) {
  <div>{{ photo.fileName }}</div>
}
```

### Routing Issues

❌ **Class-based guards**
```typescript
// BAD: Class-based guard (old style)
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  canActivate(): boolean { ... }
}

// GOOD: Functional guard (Angular 18)
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
```

### Testing Issues

❌ **Missing data-testid attributes**
```html
<!-- BAD: No test ID -->
<button (click)="onRate()">Rate</button>

<!-- GOOD: Test ID in kebab-case -->
<button (click)="onRate()" data-testid="rate-button">Rate</button>
```

❌ **No TestBed for standalone components**
```typescript
// BAD: Missing standalone import
TestBed.configureTestingModule({
  declarations: [PhotoGalleryComponent] // WRONG for standalone!
});

// GOOD: Import standalone component
TestBed.configureTestingModule({
  imports: [PhotoGalleryComponent]
});
```

### Code Quality Issues

❌ **Non-readonly services**
```typescript
// BAD: Mutable service
private photoService = inject(PhotoService);

// GOOD: Readonly
private readonly photoService = inject(PhotoService);
```

❌ **No explicit return types**
```typescript
// BAD: No return type
getPhotos() {
  return this.http.get('/api/photos');
}

// GOOD: Explicit return type
getPhotos(): Observable<Photo[]> {
  return this.http.get<Photo[]>('/api/photos');
}
```

---

## Git Anti-Patterns

❌ **Promotional commit messages**
```
feat(auth): implement JWT authentication

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

❌ **Vague commit messages**
```
Update code
Fix stuff
WIP
```

❌ **Wrong commit type**
```
feature: add JWT authentication  # WRONG: "feature" not a valid type

feat: add JWT authentication  # CORRECT: "feat"
```

---

## Performance Anti-Patterns

### Backend

❌ **No database indexes**
```sql
-- Missing indexes on frequently queried columns
-- user_id, rating, created_at
```

❌ **FetchType.EAGER on relationships**
```java
// BAD: Eager loading
@ManyToOne(fetch = FetchType.EAGER)
private User user;

// GOOD: Lazy loading
@ManyToOne(fetch = FetchType.LAZY)
private User user;
```

### Frontend

❌ **No lazy loading for images**
```html
<!-- BAD: All images load immediately -->
<img [src]="photo.url" />

<!-- GOOD: Lazy loading -->
<img [src]="photo.thumbnailUrl" loading="lazy" />
```

❌ **Using full-size images instead of thumbnails**
```typescript
// BAD: Loading 5MB originals
<img [src]="photo.url" />

// GOOD: Loading 50KB thumbnails
<img [src]="photo.thumbnailUrl" />
```

---

## Quick Grep Patterns for Review

**Backend Security Issues:**
```bash
grep -r "findById\(" src/main/java/  # Check for user scoping
grep -r "return new Photo\(" src/main/java/  # Check for entity exposure
grep -r "@RestController" -A 20 src/main/java/ | grep "private"  # Business logic in controller
```

**Frontend Architecture Issues:**
```bash
grep -r "@NgModule" src/app/  # Angular 18 violation
grep -r "constructor.*inject\(" src/app/  # Should use inject() function
grep -r "public.*BehaviorSubject" src/app/  # Exposed state
grep -r "\*ngIf\|\*ngFor" src/app/  # Old control flow
```

**Testing Issues:**
```bash
find src/test -name "*Test.java" | wc -l  # Test count
grep -r "data-testid" src/app/  # Test IDs present
```

---

## Review Priority

**1. Security (CRITICAL!):**
- [ ] User scoping on all photo queries
- [ ] @AuthenticationPrincipal in controllers
- [ ] No entities exposed

**2. Architecture (CRITICAL!):**
- [ ] NO NgModules in Angular
- [ ] inject() function used
- [ ] Controllers → Services → Repositories

**3. State Management:**
- [ ] Private BehaviorSubject
- [ ] Async pipe or takeUntilDestroyed

**4. Testing:**
- [ ] Service tests present
- [ ] User scoping verified in tests

**5. Code Quality:**
- [ ] English naming
- [ ] Self-documenting code
- [ ] Conventional Commits
