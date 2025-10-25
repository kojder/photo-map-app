---
description: "Angular 18 frontend development guidelines for Photo Map MVP"
applyTo: "frontend/**/*.ts,frontend/**/*.html,frontend/**/*.css,frontend/**/*.json,frontend/tailwind.config.js"
---

# Angular 18 Frontend Development Guidelines

## Stack

- Angular 18.2.0 (standalone components), TypeScript 5.5.2 (strict mode)
- Tailwind CSS 3.4.17 (NOT v4 - Angular 18 incompatible!)
- Leaflet.js 1.9.4 + leaflet.markercluster 1.5.3
- RxJS 7.8.0 (BehaviorSubject pattern, NO NgRx)

## CRITICAL: Angular 18 Patterns

### Standalone Components ONLY

```typescript
// ✅ GOOD
@Component({
  selector: 'app-example',
  standalone: true,           // REQUIRED!
  imports: [CommonModule, RouterLink, ChildComponent],
  templateUrl: './example.component.html'
})
export class ExampleComponent { }

// ❌ BAD - NO NgModules!
@NgModule({ ... })
```

**Rules:**
- Always `standalone: true`
- Import all dependencies in `imports` array (CommonModule, RouterLink, child components)
- **NEVER create or use `@NgModule`**

### Dependency Injection - inject() Function

```typescript
// ✅ GOOD - Use inject()
export class ExampleComponent {
  private photoService = inject(PhotoService);
  private router = inject(Router);
}

// ❌ BAD - No constructor injection
constructor(private photoService: PhotoService) { }
```

## State Management

### BehaviorSubject Pattern (NO NgRx)

**For shared state in services:**

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);
  
  // Private BehaviorSubject
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  
  // Public Observable
  public photos$ = this.photosSubject.asObservable();
  
  // Update state
  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photosSubject.next(photos);
    });
  }
}
```

**Rules:**
- BehaviorSubject = private, Observable = public (`.asObservable()`)
- Components consume with `async` pipe in templates
- Use for: PhotoService, FilterService, AuthService

### Signals for Component-Local State

```typescript
export class GalleryComponent {
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showDialog = signal(false);
  
  // Computed values
  photoCount = computed(() => this.photos().length);
}
```

**Rules:**
- Use signals for: loading flags, UI state, error messages
- Use `computed()` for derived values
- **Don't mix** - signals for local, BehaviorSubject for shared

## Routing

### Functional Guards

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login']);
};

// app.routes.ts
export const routes: Routes = [
  { path: 'gallery', component: GalleryComponent, canActivate: [authGuard] },
  { path: 'map', component: MapComponent, canActivate: [authGuard] }
];
```

**Rules:**
- Functional guards (`CanActivateFn`), not class-based
- Use `inject()` inside guard functions
- Return `true` or `UrlTree` for redirects

## HTTP Client

### Functional Interceptor (JWT)

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token && !req.url.includes('/api/auth/')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next(req);
};

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

**Rules:**
- Use `HttpInterceptorFn`, not class-based
- Store JWT in `localStorage` (key: `token`)
- Auto-add to all requests except `/api/auth/*`

## Templates & Reactive Patterns

### Async Pipe with Control Flow

```typescript
// ✅ GOOD - Angular 18 control flow
@if (photos$ | async; as photos) {
  @if (photos.length === 0) {
    <p>No photos</p>
  } @else {
    @for (photo of photos; track photo.id) {
      <app-photo-card [photo]="photo" />
    }
  }
}

// ❌ BAD - Old *ngIf syntax (still works but use new)
<div *ngIf="photos$ | async as photos">
  <div *ngFor="let photo of photos; trackBy: trackById">
```

**Rules:**
- Use `async` pipe for Observables (auto-unsubscribe)
- Prefer `@if/@for` over `*ngIf/*ngFor` (Angular 18 syntax)
- Always use `track` in `@for` (performance)

### Test IDs for E2E

```html
<button 
  data-testid="gallery-upload-button"
  (click)="onUploadClick()">
  Upload
</button>
```

Add `data-testid` to all interactive elements for E2E testing.

## Styling with Tailwind CSS 3

### Utility-First Approach

```html
<!-- ✅ GOOD -->
<div class="flex justify-center items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Submit
  </button>
</div>

<!-- ❌ BAD - Custom CSS for simple layouts -->
<div class="custom-container">
  <button class="custom-button">Submit</button>
</div>
```

**Rules:**
- Use Tailwind utilities first
- Component CSS only for complex/reusable patterns
- Mobile-first responsive: `sm:`, `md:`, `lg:` prefixes

### CRITICAL: Tailwind 3.4.17 Only

```json
// package.json
{
  "devDependencies": {
    "tailwindcss": "^3.4.17"  // NOT 4.x - incompatible with Angular 18!
  }
}
```

**DO NOT upgrade to Tailwind 4** - breaks Angular 18 build.

## Forms & Validation

### Reactive Forms

```typescript
export class LoginComponent {
  private fb = inject(FormBuilder);
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  
  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      // ... submit
    }
  }
}
```

**Rules:**
- Use `FormBuilder` with `inject()`
- Validate with built-in `Validators`
- Check `form.valid` before submit

## Leaflet Maps

### Map Component Pattern

```typescript
export class MapComponent implements OnInit, OnDestroy {
  private map: L.Map | null = null;
  private markerClusterGroup = L.markerClusterGroup();
  
  ngOnInit(): void {
    this.map = L.map('map').setView([52.2297, 21.0122], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    this.map.addLayer(this.markerClusterGroup);
  }
  
  ngOnDestroy(): void {
    this.map?.remove();
  }
}
```

**Rules:**
- Initialize map in `ngOnInit()`
- Clean up in `ngOnDestroy()` (call `map.remove()`)
- Use `leaflet.markercluster` for many markers
- Import Leaflet CSS in `angular.json` styles array

## Testing

### Unit Tests (Jasmine + Karma)

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
    const mockPhotos = [{ id: 1, filename: 'test.jpg' }];
    
    service.getAllPhotos().subscribe(photos => {
      expect(photos.content).toEqual(mockPhotos);
    });
    
    const req = httpMock.expectOne('/api/photos');
    expect(req.request.method).toBe('GET');
    req.flush({ content: mockPhotos });
  });
});
```

**Requirements:**
- Coverage >70% for new code
- Use `HttpClientTestingModule` for HTTP tests
- Command: `ng test`

## Common Pitfalls

### ❌ DON'T

```typescript
// DON'T use NgModules
@NgModule({ ... })

// DON'T use constructor injection
constructor(private service: Service) { }

// DON'T upgrade to Tailwind 4
"tailwindcss": "^4.0.0"

// DON'T subscribe without async pipe (memory leak)
this.photoService.photos$.subscribe(photos => {
  this.photos = photos; // No cleanup!
});

// DON'T mix state patterns
private photosSubject = new BehaviorSubject(); // shared state
photos = signal([]); // also shared state - PICK ONE!
```

### ✅ DO

```typescript
// DO use standalone components
standalone: true

// DO use inject()
private service = inject(Service);

// DO use Tailwind 3.4.17
"tailwindcss": "^3.4.17"

// DO use async pipe
@if (photos$ | async; as photos) { ... }

// DO separate concerns
// Service: BehaviorSubject for shared state
// Component: signals for local UI state
```

## Project Structure

```
app/
├── components/       # UI components (standalone)
│   ├── gallery/
│   ├── map/
│   ├── photo-card/
│   └── navbar/
├── guards/           # Functional guards (authGuard, adminGuard)
├── interceptors/     # HTTP interceptors (authInterceptor)
├── models/           # TypeScript interfaces (Photo, User)
└── services/         # Business logic + state (PhotoService, AuthService)
```

## Key Files

- `app.routes.ts` - Flat Routes array with functional guards
- `app.config.ts` - ApplicationConfig with providers
- `services/photo.service.ts` - BehaviorSubject pattern example
- `guards/auth.guard.ts` - Functional guard example
- `proxy.conf.json` - Backend proxy (avoid CORS in dev)

## Quick Commands

```bash
ng serve                    # Dev server (http://localhost:4200)
ng test                     # Run unit tests
ng build                    # Production build
ng generate component name  # Generate standalone component
```

## Backend Integration

- Backend proxied via `proxy.conf.json` (all `/api/*` → `http://localhost:8080`)
- JWT stored in `localStorage` (key: `token`)
- Auto-added to requests via `authInterceptor`
- CORS avoided in development
