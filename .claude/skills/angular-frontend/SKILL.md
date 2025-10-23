---
name: Angular Frontend Development
description: Build and implement Angular 18 standalone components, TypeScript services with Signals and RxJS, routing with guards, and Tailwind CSS styling for Photo Map MVP. Use when creating, developing, or implementing TypeScript components, services, guards, forms, HTTP calls, map integration (Leaflet.js), or responsive UI layouts with Tailwind utilities. File types: .ts, .html, .css, .scss
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Angular Frontend Development - Photo Map MVP

## Project Context

**Photo Map MVP** - Single Page Application (SPA) dla zarządzania zdjęciami z geolokalizacją.

**Frontend Stack:**
- **Angular:** 18.2.0+ (standalone components, NO NgModules!)
- **TypeScript:** 5.5.2+ (strict mode)
- **Styling:** Tailwind CSS 3.4.17 (NOT v4 - Angular 18 incompatibility!)
- **Map:** Leaflet.js 1.9.4 + marker clustering
- **State:** RxJS 7.8.0 (BehaviorSubject pattern, no NgRx)
- **Build:** Angular CLI 18.2.0 (esbuild)

**Core Features:**
1. **Authentication:** Login/Register z JWT storage, route guards
2. **Gallery:** Responsive grid z lazy loading, rating, filtering
3. **Map View:** Leaflet integration z GPS markers, popups, clustering
4. **Admin Panel:** User management (ADMIN role only)

**Key Constraints:**
- **Standalone components ONLY** - NO NgModules anywhere!
- **Tailwind 3.x** - NOT 4.x (incompatibility)
- **inject() function** - NOT constructor injection (modern Angular 18)
- **Signals** - Reactive state (Angular 16+)
- **BehaviorSubject** - Service state management (no NgRx)

---

## Component Architecture

### Standalone Components

**ALL components MUST be standalone:**

```typescript
@Component({
  selector: 'app-photo-gallery',
  standalone: true,          // REQUIRED!
  imports: [
    CommonModule,            // For built-in directives
    RouterLink,              // For navigation
    PhotoCardComponent       // Child components
  ],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.css'
})
export class PhotoGalleryComponent { }
```

**Rules:**
- ✅ Always `standalone: true`
- ✅ Explicitly import dependencies in `imports` array
- ✅ Use `CommonModule` for `*ngIf`, `*ngFor`, `@if`, `@for`
- ✅ Import child components directly
- ❌ NO `@NgModule` anywhere!

### Component Types

**Smart Components (Container):**
- Inject services
- Manage state, fetch data
- Handle business logic
- Pass data to dumb components

**Example: PhotoGalleryComponent (Smart)**
```typescript
export class PhotoGalleryComponent implements OnInit {
  private photoService = inject(PhotoService);

  photos$ = this.photoService.photos$; // Observable

  ngOnInit(): void {
    this.photoService.loadPhotos();
  }

  onRatingChange(photoId: number, rating: number): void {
    this.photoService.updateRating(photoId, rating);
  }
}
```

**Dumb Components (Presentational):**
- Receive data via `@Input()`
- Emit events via `@Output()`
- No service injection (except utility)
- Pure presentation

**Example: PhotoCardComponent (Dumb)**
```typescript
export class PhotoCardComponent {
  @Input() photo!: Photo;
  @Output() ratingChange = new EventEmitter<number>();

  onRate(rating: number): void {
    this.ratingChange.emit(rating);
  }
}
```

### Dependency Injection

**Use inject() function (modern Angular 18):**

```typescript
export class PhotoGalleryComponent {
  private photoService = inject(PhotoService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
}
```

**Rules:**
- ✅ Use `inject()` at class property level
- ✅ Make services private (encapsulation)
- ❌ DON'T use constructor injection (old style):

```typescript
// ❌ OLD - Don't do this
constructor(
  private photoService: PhotoService,
  private router: Router
) { }
```

---

## State Management

### BehaviorSubject Pattern

**Services with RxJS (NO NgRx):**

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);

  // Private BehaviorSubject (internal state)
  private photosSubject = new BehaviorSubject<Photo[]>([]);

  // Public Observable (expose to components)
  photos$ = this.photosSubject.asObservable();

  // Public methods to update state
  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe({
      next: (photos) => this.photosSubject.next(photos),
      error: (error) => console.error('Failed to load photos', error)
    });
  }

  // Synchronous getter for current value
  get currentPhotos(): Photo[] {
    return this.photosSubject.value;
  }
}
```

**Rules:**
- ✅ Always `providedIn: 'root'` (singleton)
- ✅ Keep BehaviorSubject PRIVATE
- ✅ Expose Observable (public)
- ✅ Provide methods to update state
- ❌ DON'T expose BehaviorSubject directly

### Component Consumption

**Use async pipe (automatic subscription cleanup):**

```typescript
// Component
export class PhotoGalleryComponent {
  photos$ = inject(PhotoService).photos$;
}
```

```html
<!-- Template -->
<div *ngFor="let photo of photos$ | async">
  {{ photo.fileName }}
</div>
```

---

## Routing

### Route Configuration

**File:** `app.routes.ts`

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'gallery',
    component: PhotoGalleryComponent,
    canActivate: [authGuard] // Protected
  },
  {
    path: 'map',
    component: MapViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard, adminGuard] // Role-based
  },
  { path: '**', redirectTo: '/gallery' }
];
```

**Register in `app.config.ts`:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

### Functional Guards

**Authentication Guard:**
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

**Admin Guard:**
```typescript
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const user = authService.currentUser;
  if (user?.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/gallery']);
};
```

**Rules:**
- ✅ Use functional guards (modern Angular 18)
- ✅ Return `true`, `false`, or `UrlTree`
- ✅ Use `inject()` inside guard
- ❌ DON'T use class-based guards

---

## HTTP Client

### HTTP Interceptor (JWT)

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clonedRequest);
  }

  return next(req);
};
```

**Register in `app.config.ts`:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

### HTTP Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/photos';

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.apiUrl);
  }

  uploadPhoto(file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Photo>(`${this.apiUrl}/upload`, formData);
  }

  updateRating(photoId: number, rating: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${photoId}/rating`, { rating });
  }

  deletePhoto(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`);
  }
}
```

---

## Forms

### Reactive Forms (Complex Forms)

```typescript
export class RegisterComponent {
  private fb = inject(FormBuilder);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      // Handle registration
    }
  }
}
```

**Template:**
```html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
  <input formControlName="email" type="email">
  <div *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
    Email is required
  </div>
  <button type="submit" [disabled]="registerForm.invalid">Register</button>
</form>
```

**Import Required:**
```typescript
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule]
})
```

---

## Tailwind CSS Integration

### Utility-First Approach

**Button Variants:**
```html
<!-- Primary Button -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
  Primary
</button>

<!-- Secondary Button -->
<button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
  Secondary
</button>

<!-- Danger Button -->
<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
  Delete
</button>
```

### Responsive Grid (Photo Gallery)

```html
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
    <img src="photo.jpg" class="w-full h-48 object-cover">
    <div class="p-4">
      <h3 class="text-lg font-semibold">Photo Title</h3>
      <p class="text-sm text-gray-600">Details</p>
    </div>
  </div>
</div>
```

### Photo Card Pattern

```html
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
  <!-- Image -->
  <div class="relative">
    <img [src]="photo.thumbnailUrl" class="w-full h-48 object-cover">
    <!-- Rating Badge -->
    <div class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
      ⭐ {{ photo.rating }}/10
    </div>
  </div>

  <!-- Content -->
  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ photo.fileName }}</h3>
    <p class="text-sm text-gray-600 mb-2">📅 {{ photo.takenAt | date:'short' }}</p>
    <p class="text-xs text-gray-500">📍 GPS: {{ photo.latitude }}, {{ photo.longitude }}</p>
  </div>
</div>
```

---

## Leaflet.js Integration

### Map Component

```typescript
import * as L from 'leaflet';

export class MapViewComponent implements OnInit {
  private map!: L.Map;
  private photoService = inject(PhotoService);

  ngOnInit(): void {
    this.initializeMap();
    this.loadPhotoMarkers();
  }

  private initializeMap(): void {
    this.map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadPhotoMarkers(): void {
    this.photoService.photos$.subscribe(photos => {
      photos.forEach(photo => {
        if (photo.latitude && photo.longitude) {
          const marker = L.marker([photo.latitude, photo.longitude])
            .bindPopup(`<b>${photo.fileName}</b><br>Rating: ${photo.rating}/10`)
            .addTo(this.map);
        }
      });
    });
  }
}
```

---

## Testing (Jasmine + Karma)

### Component Testing

```typescript
describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;

  beforeEach(async () => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['loadPhotos']);

    await TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent], // Standalone!
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
  });

  it('should load photos on init', () => {
    component.ngOnInit();
    expect(photoService.loadPhotos).toHaveBeenCalled();
  });
});
```

---

## Examples

Complete examples in `examples/` directory:

1. **photo-gallery.component.ts** - Smart component z Signals
2. **photo-card.component.ts** - Dumb component
3. **photo.service.ts** - BehaviorSubject pattern
4. **auth.service.ts** - JWT + interceptor
5. **auth.guard.ts** - Functional guard
6. **photo.interface.ts** - TypeScript interfaces

## Styling Examples

In `styling/` directory:

1. **button-variants.html** - Button patterns
2. **card-patterns.html** - Photo card layouts
3. **form-inputs.html** - Form styling
4. **modal-pattern.html** - Modal dialog

---

## Related Documentation

- `.ai/prd.md` - Product requirements
- `.ai/tech-stack.md` - Technology specs
- `.ai/ui-plan.md` - Frontend architecture
- `.cursor/rules/tailwind-helper.mdc` - Tailwind guidelines

---

## Key Reminders

**Standalone Components:**
- ✅ ALWAYS `standalone: true`
- ✅ NO `@NgModule` anywhere!
- ✅ Import dependencies explicitly

**Dependency Injection:**
- ✅ Use `inject()` function
- ❌ NO constructor injection

**State Management:**
- ✅ BehaviorSubject (private) → Observable (public)
- ✅ Async pipe for subscription management
- ❌ NO NgRx for MVP

**Tailwind:**
- ✅ Version 3.4.17 (NOT 4!)
- ✅ Utility-first approach
- ✅ Mobile-first responsive

**Security:**
- ✅ JWT in localStorage
- ✅ Auth interceptor adds token
- ✅ Guards protect routes
- ✅ Handle 401 → redirect to login
