# Frontend Review Checklist - Angular 18 + TypeScript

Detailed checklist for reviewing Angular 18 frontend code in Photo Map MVP.

---

## Architecture (CRITICAL!)

### Standalone Components

**NO `@NgModule` anywhere! Angular 18 = standalone components only.**

```typescript
// ❌ BAD: Using NgModule (Angular 18 violation!)
@NgModule({
  declarations: [PhotoGalleryComponent],
  imports: [CommonModule]
})
export class PhotoGalleryModule { }

// ✅ GOOD: Standalone component
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-photo-gallery',
  templateUrl: './photo-gallery.component.html'
})
export class PhotoGalleryComponent { }
```

**Check:**
- ✅ `standalone: true` in ALL components
- ✅ Explicit `imports` array in component metadata
- ✅ NO `@NgModule` files anywhere
- ✅ Route configuration uses flat `Routes` array

### Dependency Injection

**Use `inject()` function (modern Angular 18), NOT constructor injection:**

```typescript
// ❌ BAD: Constructor injection (old style)
constructor(private photoService: PhotoService) {}

// ✅ GOOD: inject() function (Angular 18)
private readonly photoService = inject(PhotoService);
```

**Check:**
- ✅ `inject()` function used for all services
- ✅ Services marked `readonly`
- ✅ NO constructor injection

### State Management

**BehaviorSubject Pattern:**

```typescript
// ❌ BAD: Exposing BehaviorSubject
public photosSubject = new BehaviorSubject<Photo[]>([]);

// ✅ GOOD: Private BehaviorSubject, public Observable
private readonly photosSubject = new BehaviorSubject<Photo[]>([]);
public readonly photos$ = this.photosSubject.asObservable();
```

**Signals Pattern:**

```typescript
// ✅ GOOD: Signals for component-local state
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);

  // Signals for local UI state
  readonly selectedRating = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  // Computed values
  readonly filteredPhotos = computed(() => {
    const rating = this.selectedRating();
    return this.photos().filter(p => p.rating >= rating);
  });
}
```

**Check:**
- ✅ BehaviorSubject kept private
- ✅ Observable exposed publicly
- ✅ Signals used for component-local state
- ✅ `computed()` for derived values
- ✅ NO exposed BehaviorSubject

---

## Component Patterns

### Smart vs Dumb Components

**Smart (Container) Components:**
- ✅ Inject services
- ✅ Manage state (Signals + BehaviorSubject subscriptions)
- ✅ Business logic
- ✅ Fetch data from services

```typescript
// ✅ Smart component
@Component({
  standalone: true,
  imports: [CommonModule, PhotoCardComponent],
  selector: 'app-photo-gallery',
  template: `
    @for (photo of photos(); track photo.id) {
      <app-photo-card [photo]="photo" (rate)="onRate($event)" />
    }
  `
})
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  readonly photos = signal<Photo[]>([]);

  ngOnInit() {
    this.photoService.getPhotos().subscribe(photos => {
      this.photos.set(photos);
    });
  }

  onRate(event: { photoId: number, rating: number }) {
    this.photoService.ratePhoto(event.photoId, event.rating).subscribe();
  }
}
```

**Dumb (Presentational) Components:**
- ✅ NO service injection
- ✅ `@Input()` for data
- ✅ `@Output()` for events
- ✅ Pure presentation

```typescript
// ✅ Dumb component
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-photo-card',
  template: `
    <img [src]="photo().url" [alt]="photo().fileName" />
    <button (click)="onRate()">Rate</button>
  `
})
export class PhotoCardComponent {
  readonly photo = input.required<Photo>();
  readonly rate = output<{ photoId: number, rating: number }>();

  onRate() {
    this.rate.emit({ photoId: this.photo().id, rating: 5 });
  }
}
```

### Template Syntax

**Use Angular 18 control flow (NOT structural directives!):**

```typescript
// ❌ BAD: Old structural directives
*ngIf="isLoading"
*ngFor="let photo of photos"

// ✅ GOOD: Angular 18 control flow
@if (isLoading()) {
  <p>Loading...</p>
}
@for (photo of photos(); track photo.id) {
  <app-photo-card [photo]="photo" />
}
```

**Check:**
- ✅ `@if`, `@for`, `@switch` used
- ✅ NO `*ngIf`, `*ngFor`, `*ngSwitch`
- ✅ `track` in `@for` loops
- ✅ `data-testid` on interactive elements

---

## Routing & Guards

### Functional Guards

**Use `CanActivateFn` (NOT class-based guards!):**

```typescript
// ✅ GOOD: Functional guard with inject()
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

**Check:**
- ✅ `CanActivateFn` type used
- ✅ `inject()` for dependencies
- ✅ Returns `boolean | UrlTree`
- ✅ NO class-based guards

### Route Configuration

```typescript
// ✅ GOOD: Flat Routes array
export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'gallery', component: PhotoGalleryComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] }
];
```

**Check:**
- ✅ Flat `Routes` array
- ✅ Guards applied with `canActivate`
- ✅ NO lazy loading with `loadChildren` (MVP scope)

---

## Services

### HTTP Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);

  readonly photos$ = this.photosSubject.asObservable();

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos').pipe(
      tap(photos => this.photosSubject.next(photos)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP error:', error);
    return throwError(() => new Error('Something went wrong'));
  }
}
```

**Check:**
- ✅ `@Injectable({ providedIn: 'root' })`
- ✅ `inject()` for HttpClient
- ✅ BehaviorSubject + Observable pattern
- ✅ All HTTP methods return `Observable<T>`
- ✅ Error handling with `catchError`

---

## RxJS Patterns

### Async Pipe

**Always prefer async pipe over manual subscriptions:**

```typescript
// ❌ BAD: Manual subscription
ngOnInit() {
  this.photoService.photos$.subscribe(photos => {
    this.photos = photos;
  });
}

// ✅ GOOD: Async pipe in template
// Component:
readonly photos$ = this.photoService.photos$;

// Template:
@for (photo of photos$ | async; track photo.id) {
  <app-photo-card [photo]="photo" />
}
```

### Avoid Nested Subscriptions

**Use RxJS operators instead:**

```typescript
// ❌ BAD: Nested subscriptions
this.http.get<User>('/user').subscribe(user => {
  this.http.get<Photo[]>(`/photos/${user.id}`).subscribe(photos => {
    this.photos = photos;
  });
});

// ✅ GOOD: Use switchMap
this.http.get<User>('/user').pipe(
  switchMap(user => this.http.get<Photo[]>(`/photos/${user.id}`))
).subscribe(photos => {
  this.photos = photos;
});
```

---

## Styling (Tailwind CSS 3.4.17)

**Check:**
- ✅ Utility-first approach
- ✅ Tailwind 3.4.17 (NOT 4.x - incompatibility!)
- ✅ Responsive classes (`sm:`, `md:`, `lg:`)
- ✅ Component styles ONLY for complex patterns

```html
<!-- ✅ GOOD: Tailwind utilities -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
  <img class="w-full h-64 object-cover rounded-lg shadow-md" />
</div>
```

---

## Testing

### Component Tests

```typescript
describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;

  beforeEach(() => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['getPhotos']);

    TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent], // Standalone import!
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
  });

  it('should load photos on init', () => {
    const mockPhotos = [{ id: 1, fileName: 'test.jpg' }];
    photoService.getPhotos.and.returnValue(of(mockPhotos));

    component.ngOnInit();

    expect(component.photos()).toEqual(mockPhotos);
  });
});
```

**Check:**
- ✅ Standalone components imported in TestBed
- ✅ Services mocked with Jasmine
- ✅ Component logic tested
- ✅ `data-testid` used for element selection

### Service Tests

```typescript
describe('PhotoService', () => {
  let service: PhotoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PhotoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch photos', () => {
    const mockPhotos = [{ id: 1, fileName: 'test.jpg' }];

    service.getPhotos().subscribe(photos => {
      expect(photos).toEqual(mockPhotos);
    });

    const req = httpMock.expectOne('/api/photos');
    expect(req.request.method).toBe('GET');
    req.flush(mockPhotos);
  });
});
```

**Check:**
- ✅ HttpClientTestingModule for HTTP mocking
- ✅ All service methods tested
- ✅ Error cases tested

---

## Common Frontend Anti-Patterns

### ❌ NgModules

```typescript
// BAD: Angular 18 violation!
@NgModule({ ... })
```

### ❌ Constructor Injection

```typescript
// BAD: Old style
constructor(private photoService: PhotoService) {}
```

### ❌ Exposed BehaviorSubject

```typescript
// BAD: Mutable state exposed
public photosSubject = new BehaviorSubject<Photo[]>([]);
```

### ❌ Manual Subscriptions without Cleanup

```typescript
// BAD: Memory leak
ngOnInit() {
  this.photoService.photos$.subscribe(photos => {
    this.photos = photos;
  }); // No unsubscribe!
}

// GOOD: Use async pipe or takeUntilDestroyed()
```

---

## Review Checklist

Before approval:

**Architecture:**
- [ ] NO `@NgModule` anywhere
- [ ] `standalone: true` on all components
- [ ] `inject()` function used
- [ ] BehaviorSubject kept private
- [ ] Signals used for local state

**Component Patterns:**
- [ ] Smart vs Dumb separation clear
- [ ] `@if`, `@for`, `@switch` (NOT *ngIf, *ngFor)
- [ ] `track` in `@for` loops
- [ ] `data-testid` on interactive elements

**Routing:**
- [ ] Functional guards (`CanActivateFn`)
- [ ] Flat Routes array
- [ ] Guards protect routes correctly

**RxJS:**
- [ ] Async pipe used where possible
- [ ] NO nested subscriptions
- [ ] Proper error handling

**Testing:**
- [ ] Component logic tested
- [ ] Services tested (HTTP mocked)
- [ ] Guards tested
- [ ] Standalone imports in TestBed

**Code Quality:**
- [ ] TypeScript strict mode
- [ ] Explicit return types
- [ ] `readonly` for services
- [ ] English naming conventions
