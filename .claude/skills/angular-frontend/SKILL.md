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

## TypeScript Best Practices

### Use `const` and `readonly` Wherever Possible

**Benefits:**
- **Immutability** - prevents accidental reassignment
- **Thread safety** - immutable objects are safe in async operations
- **Readability** - clear intent that value won't change
- **Type narrowing** - TypeScript can infer more precise types

**Where to use:**

1. **Local variables** - default to `const`
```typescript
// ✅ GOOD: Use const for variables that won't be reassigned
export class PhotoGalleryComponent {
  loadPhotos(): void {
    const userId = this.authService.currentUserId;
    const filters = { rating: 5, dateFrom: new Date() };

    this.photoService.getPhotos(userId, filters).subscribe(photos => {
      const sortedPhotos = photos.sort((a, b) => b.rating - a.rating);
      this.photos.set(sortedPhotos);
    });
  }
}

// ❌ BAD: Using let when const is sufficient
loadPhotos(): void {
  let userId = this.authService.currentUserId; // Should be const!
  let filters = { rating: 5 }; // Should be const!
}
```

2. **Class properties (injected services)** - use `readonly`
```typescript
// ✅ GOOD: Readonly services
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
}

// ❌ BAD: Non-readonly services (allows reassignment)
export class PhotoGalleryComponent {
  private photoService = inject(PhotoService); // Can be reassigned!
}
```

3. **Signals and state** - readonly for public API
```typescript
// ✅ GOOD: Readonly signals (encapsulation)
export class PhotoService {
  private readonly photosSignal = signal<Photo[]>([]);
  readonly photos = this.photosSignal.asReadonly(); // Public readonly

  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photosSignal.set(photos); // Only service can update
    });
  }
}
```

4. **Interface properties** - readonly for immutable data
```typescript
// ✅ GOOD: Immutable Photo interface
export interface Photo {
  readonly id: number;
  readonly fileName: string;
  readonly thumbnailUrl: string;
  readonly latitude?: number;
  readonly longitude?: number;
  rating: number; // Mutable - can be updated
}
```

**When NOT to use `const`/`readonly`:**
- Loop variables that change (`for (let i = 0; i < n; i++)`)
- State that needs reassignment (counters, flags)
- Function parameters (already immutable by default)

### Type Safety

**Always use explicit types for public API:**

```typescript
// ✅ GOOD: Explicit return types
export class PhotoService {
  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos');
  }

  uploadPhoto(file: File): Observable<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PhotoUploadResponse>('/api/photos/upload', formData);
  }
}

// ❌ BAD: Implicit return types (unclear API)
getPhotos() { // What does this return?
  return this.http.get('/api/photos');
}
```

**Use strict null checks:**

```typescript
// ✅ GOOD: Handle null/undefined explicitly
export class PhotoDetailComponent {
  photo: Photo | null = null;

  loadPhoto(id: number): void {
    this.photoService.getPhoto(id).subscribe(photo => {
      this.photo = photo;
    });
  }

  get photoTitle(): string {
    return this.photo?.fileName ?? 'Unknown Photo';
  }
}
```

---

## SOLID Principles

### 1. Single Responsibility Principle (SRP)

**Each class/component should have ONE reason to change.**

```typescript
// ❌ BAD: Component does too many things (violates SRP)
@Component({
  selector: 'app-photo-gallery'
})
export class PhotoGalleryComponent {
  photos: Photo[] = [];

  loadPhotos(): void {
    // HTTP call
    fetch('/api/photos')
      .then(res => res.json())
      .then(data => this.photos = data);

    // Filtering logic
    this.photos = this.photos.filter(p => p.rating >= 5);

    // Sorting logic
    this.photos.sort((a, b) => b.takenAt - a.takenAt);

    // Analytics
    console.log(`Loaded ${this.photos.length} photos`);
  }
}

// ✅ GOOD: Separate concerns into services
// PhotoService - handles HTTP
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos');
  }
}

// FilterService - handles filtering logic
@Injectable({ providedIn: 'root' })
export class FilterService {
  filterByRating(photos: Photo[], minRating: number): Photo[] {
    return photos.filter(p => p.rating >= minRating);
  }

  sortByDate(photos: Photo[]): Photo[] {
    return [...photos].sort((a, b) =>
      new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    );
  }
}

// AnalyticsService - handles analytics
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  trackPhotoLoad(count: number): void {
    console.log(`Loaded ${count} photos`);
  }
}

// Component - orchestrates only
@Component({
  selector: 'app-photo-gallery'
})
export class PhotoGalleryComponent implements OnInit {
  private readonly photoService = inject(PhotoService);
  private readonly filterService = inject(FilterService);
  private readonly analyticsService = inject(AnalyticsService);

  photos = signal<Photo[]>([]);

  ngOnInit(): void {
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.photoService.getPhotos().subscribe(photos => {
      const filtered = this.filterService.filterByRating(photos, 5);
      const sorted = this.filterService.sortByDate(filtered);
      this.photos.set(sorted);
      this.analyticsService.trackPhotoLoad(sorted.length);
    });
  }
}
```

### 2. Open/Closed Principle (OCP)

**Open for extension, closed for modification.**

```typescript
// ❌ BAD: Must modify service to add new export format
export class ExportService {
  export(photos: Photo[], format: string): void {
    if (format === 'json') {
      this.exportJson(photos);
    } else if (format === 'csv') {
      this.exportCsv(photos);
    } else if (format === 'xml') {
      this.exportXml(photos);
    }
  }
}

// ✅ GOOD: Strategy pattern - add formats without modifying service
export interface ExportStrategy {
  export(photos: Photo[]): string;
}

export class JsonExportStrategy implements ExportStrategy {
  export(photos: Photo[]): string {
    return JSON.stringify(photos, null, 2);
  }
}

export class CsvExportStrategy implements ExportStrategy {
  export(photos: Photo[]): string {
    const headers = 'id,fileName,rating\n';
    const rows = photos.map(p => `${p.id},${p.fileName},${p.rating}`).join('\n');
    return headers + rows;
  }
}

export class XmlExportStrategy implements ExportStrategy {
  export(photos: Photo[]): string {
    return `<photos>${photos.map(p => `<photo id="${p.id}">${p.fileName}</photo>`).join('')}</photos>`;
  }
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private strategies = new Map<string, ExportStrategy>([
    ['json', new JsonExportStrategy()],
    ['csv', new CsvExportStrategy()],
    ['xml', new XmlExportStrategy()]
  ]);

  export(photos: Photo[], format: string): string {
    const strategy = this.strategies.get(format);
    if (!strategy) {
      throw new Error(`Unknown format: ${format}`);
    }
    return strategy.export(photos);
  }

  // Add new format without modifying existing code
  registerStrategy(format: string, strategy: ExportStrategy): void {
    this.strategies.set(format, strategy);
  }
}
```

### 3. Liskov Substitution Principle (LSP)

**Subtypes must be substitutable for their base types.**

```typescript
// ❌ BAD: Subclass changes behavior unexpectedly
export abstract class BasePhotoComponent {
  abstract loadPhoto(id: number): void;
}

export class StandardPhotoComponent extends BasePhotoComponent {
  loadPhoto(id: number): void {
    this.photoService.getPhoto(id).subscribe(/* ... */);
  }
}

export class SecurePhotoComponent extends BasePhotoComponent {
  loadPhoto(id: number): void {
    // Surprise! Now throws error if not authenticated (violates LSP)
    if (!this.authService.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    this.photoService.getPhoto(id).subscribe(/* ... */);
  }
}

// ✅ GOOD: Consistent behavior, use composition
export interface PhotoLoader {
  loadPhoto(id: number): Observable<Photo>;
}

@Injectable()
export class StandardPhotoLoader implements PhotoLoader {
  private readonly photoService = inject(PhotoService);

  loadPhoto(id: number): Observable<Photo> {
    return this.photoService.getPhoto(id);
  }
}

@Injectable()
export class SecurePhotoLoader implements PhotoLoader {
  private readonly photoService = inject(PhotoService);
  private readonly authService = inject(AuthService);

  loadPhoto(id: number): Observable<Photo> {
    // Consistent behavior - returns Observable, not throwing
    return this.authService.isAuthenticated
      ? this.photoService.getPhoto(id)
      : throwError(() => new Error('Not authenticated'));
  }
}

// Component uses interface (works with any implementation)
export class PhotoDetailComponent {
  @Input() loader!: PhotoLoader; // Inject strategy

  loadPhoto(id: number): void {
    this.loader.loadPhoto(id).subscribe(/* ... */);
  }
}
```

### 4. Interface Segregation Principle (ISP)

**No client should depend on methods it doesn't use.**

```typescript
// ❌ BAD: Bloated interface forces implementations to provide unused methods
export interface PhotoManager {
  getPhotos(): Observable<Photo[]>;
  uploadPhoto(file: File): Observable<Photo>;
  deletePhoto(id: number): Observable<void>;
  updateRating(id: number, rating: number): Observable<void>;
  sharePhoto(id: number, email: string): Observable<void>;
  exportPhotos(format: string): Observable<Blob>;
}

// Gallery component only needs read operations, but must inject full PhotoManager
export class PhotoGalleryComponent {
  constructor(private photoManager: PhotoManager) { }
}

// ✅ GOOD: Split into focused interfaces
export interface PhotoReader {
  getPhotos(): Observable<Photo[]>;
  getPhoto(id: number): Observable<Photo>;
}

export interface PhotoWriter {
  uploadPhoto(file: File): Observable<Photo>;
  deletePhoto(id: number): Observable<void>;
  updateRating(id: number, rating: number): Observable<void>;
}

export interface PhotoSharer {
  sharePhoto(id: number, email: string): Observable<void>;
}

export interface PhotoExporter {
  exportPhotos(format: string): Observable<Blob>;
}

// Components depend only on what they need
export class PhotoGalleryComponent {
  private readonly photoReader = inject(PhotoReader);
  // Only needs read operations
}

export class PhotoUploadComponent {
  private readonly photoWriter = inject(PhotoWriter);
  // Only needs write operations
}

export class PhotoShareComponent {
  private readonly photoSharer = inject(PhotoSharer);
  // Only needs sharing
}

// Service implements all interfaces
@Injectable({ providedIn: 'root' })
export class PhotoService implements PhotoReader, PhotoWriter, PhotoSharer, PhotoExporter {
  // Implementation...
}
```

### 5. Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions.**

```typescript
// ❌ BAD: Component depends on concrete HttpClient
export class PhotoGalleryComponent {
  private readonly http = inject(HttpClient);

  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photos.set(photos);
    });
  }
}

// ✅ GOOD: Component depends on abstraction
export abstract class PhotoRepository {
  abstract getPhotos(): Observable<Photo[]>;
  abstract getPhoto(id: number): Observable<Photo>;
}

@Injectable({ providedIn: 'root' })
export class HttpPhotoRepository implements PhotoRepository {
  private readonly http = inject(HttpClient);

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos');
  }

  getPhoto(id: number): Observable<Photo> {
    return this.http.get<Photo>(`/api/photos/${id}`);
  }
}

// Can easily swap implementations
@Injectable({ providedIn: 'root' })
export class MockPhotoRepository implements PhotoRepository {
  getPhotos(): Observable<Photo[]> {
    return of([
      { id: 1, fileName: 'mock.jpg', rating: 8 }
    ]);
  }

  getPhoto(id: number): Observable<Photo> {
    return of({ id, fileName: 'mock.jpg', rating: 8 });
  }
}

// Component depends on abstraction
export class PhotoGalleryComponent {
  private readonly photoRepo = inject(PhotoRepository); // Abstraction!

  loadPhotos(): void {
    this.photoRepo.getPhotos().subscribe(photos => {
      this.photos.set(photos);
    });
  }
}

// Provide implementation in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PhotoRepository, useClass: HttpPhotoRepository }
    // Or for testing: { provide: PhotoRepository, useClass: MockPhotoRepository }
  ]
};
```

---

## TypeScript 5 Modern Features

### 1. Type Narrowing with `satisfies`

```typescript
// ✅ MODERN: satisfies operator (TypeScript 4.9+)
export const photoConfig = {
  maxFileSize: 50 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
  thumbnailSize: 150
} satisfies Record<string, number | string[]>; // Validates type without losing specificity

// Type is inferred precisely: { maxFileSize: number, allowedTypes: string[], ... }
// NOT Record<string, number | string[]>
```

### 2. Const Type Parameters

```typescript
// ✅ MODERN: Const type parameters (TypeScript 5.0+)
function createAction<const T extends string>(type: T) {
  return { type } as const;
}

const action = createAction('LOAD_PHOTOS');
// Type: { readonly type: "LOAD_PHOTOS" }
// NOT { readonly type: string }
```

### 3. Template Literal Types

```typescript
// ✅ MODERN: Template literal types
type PhotoEventType = 'photo:uploaded' | 'photo:deleted' | 'photo:rated';
type PhotoEventHandler<T extends PhotoEventType> =
  (event: { type: T, data: PhotoEventData }) => void;

// Usage
const handler: PhotoEventHandler<'photo:uploaded'> = (event) => {
  // event.type is exactly 'photo:uploaded', not string
};
```

### 4. Utility Types

```typescript
// ✅ Built-in utility types
export interface Photo {
  id: number;
  fileName: string;
  rating: number;
  latitude?: number;
  longitude?: number;
}

// Partial - all properties optional
type PhotoUpdate = Partial<Photo>; // { id?: number, fileName?: string, ... }

// Required - all properties required
type PhotoRequired = Required<Photo>; // { latitude: number, longitude: number }

// Pick - select specific properties
type PhotoPreview = Pick<Photo, 'id' | 'fileName' | 'rating'>;

// Omit - exclude properties
type PhotoWithoutId = Omit<Photo, 'id'>;

// Readonly - immutable
type ImmutablePhoto = Readonly<Photo>;
```

---

## Angular Signals (Modern Reactive State)

### Signal Basics

**Signals provide fine-grained reactivity (Angular 16+).**

```typescript
import { signal, computed, effect } from '@angular/core';

export class PhotoGalleryComponent {
  // Writable signal
  photos = signal<Photo[]>([]);
  selectedRating = signal<number>(0);

  // Computed signal (auto-updates when dependencies change)
  filteredPhotos = computed(() => {
    const rating = this.selectedRating();
    return this.photos().filter(p => p.rating >= rating);
  });

  // Effect (side effects when signals change)
  constructor() {
    effect(() => {
      console.log(`Filtered photos count: ${this.filteredPhotos().length}`);
    });
  }

  // Update signals
  loadPhotos(): void {
    this.photoService.getPhotos().subscribe(photos => {
      this.photos.set(photos); // Replace entire value
    });
  }

  addPhoto(photo: Photo): void {
    this.photos.update(current => [...current, photo]); // Update based on current
  }

  updateRating(newRating: number): void {
    this.selectedRating.set(newRating);
    // filteredPhotos computed automatically re-runs
  }
}
```

**Template usage:**
```html
<div>
  <h2>Photos ({{ filteredPhotos().length }})</h2>

  <select [(ngModel)]="selectedRating">
    <option [value]="0">All</option>
    <option [value]="5">5+ stars</option>
  </select>

  <div class="grid">
    @for (photo of filteredPhotos(); track photo.id) {
      <app-photo-card [photo]="photo" />
    }
  </div>
</div>
```

### Signals vs BehaviorSubject

**When to use Signals:**
- ✅ Component-local state (counters, UI flags, filters)
- ✅ Computed values (derived state)
- ✅ Simple synchronous state

**When to use BehaviorSubject:**
- ✅ Service state (cross-component communication)
- ✅ Async operations (HTTP, timers)
- ✅ Complex RxJS pipelines

**Hybrid pattern (best of both):**
```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  // Private BehaviorSubject for async operations
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);

  // Public Signal for components
  readonly photos = toSignal(this.photosSubject.asObservable(), { initialValue: [] });

  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photosSubject.next(photos);
    });
  }
}

// Component usage (no async pipe needed!)
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);

  // Direct access to signal
  photos = this.photoService.photos;
}
```

---

## Design Patterns

### 1. Facade Pattern (Simplify Complex APIs)

```typescript
// ✅ Facade: PhotoFacadeService simplifies interaction with multiple services
@Injectable({ providedIn: 'root' })
export class PhotoFacadeService {
  private readonly photoService = inject(PhotoService);
  private readonly filterService = inject(FilterService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notificationService = inject(NotificationService);

  // Simple API for components
  loadFilteredPhotos(minRating: number): Observable<Photo[]> {
    return this.photoService.getPhotos().pipe(
      map(photos => this.filterService.filterByRating(photos, minRating)),
      tap(photos => this.analyticsService.trackPhotoLoad(photos.length)),
      tap(() => this.notificationService.showSuccess('Photos loaded'))
    );
  }

  uploadPhotoWithFeedback(file: File): Observable<Photo> {
    return this.photoService.uploadPhoto(file).pipe(
      tap(() => this.notificationService.showSuccess('Photo uploaded')),
      tap(photo => this.analyticsService.trackPhotoUpload(photo.id)),
      catchError(error => {
        this.notificationService.showError('Upload failed');
        return throwError(() => error);
      })
    );
  }
}

// Component uses simple facade API
export class PhotoGalleryComponent {
  private readonly photoFacade = inject(PhotoFacadeService);

  loadPhotos(): void {
    this.photoFacade.loadFilteredPhotos(5).subscribe(photos => {
      this.photos.set(photos);
    });
  }
}
```

### 2. Observer Pattern (RxJS Subjects)

**Already covered in BehaviorSubject section - core Angular pattern!**

### 3. Singleton Pattern (Angular Services)

**All services with `providedIn: 'root'` are singletons by default.**

```typescript
// ✅ Singleton service
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Single instance shared across entire app
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

## Frontend Verification

Po zaimplementowaniu większych feature'ów lub przy naprawie błędów UI rozważ użycie **frontend-verification** skill dla automatycznej weryfikacji:

**Kiedy używać:**
- ✅ Po ukończeniu implementacji taska (np. Gallery Component, Login Form)
- ✅ Przy wątpliwościach czy feature działa poprawnie
- ✅ Przy naprawie błędów wizualnych (iteracyjnie: sprawdź → napraw → sprawdź)
- ✅ Na wyraźne żądanie użytkownika

**Co weryfikuje:**
- Console errors & warnings (błędy JavaScript/TypeScript)
- Network requests & API calls (status codes, payloads, headers)
- Visual rendering (snapshots, screenshots, responsive layout)
- Interactive flows (login, upload, navigation)

**Przykład użycia:**
```
Po zaimplementowaniu LoginComponent:
1. Weryfikacja konsoli → brak błędów ✅
2. Test API call → POST /api/auth/login → 200 OK ✅
3. Visual check → formularz poprawnie wyrenderowany ✅
4. Redirect → po loginie przekierowanie do /gallery ✅
```

**Helper scripts** (zarządzanie dev servers):
- `.claude/skills/frontend-verification/scripts/check-servers.sh` - sprawdź status
- `.claude/skills/frontend-verification/scripts/start-dev-servers.sh` - uruchom backend + frontend
- `.claude/skills/frontend-verification/scripts/stop-dev-servers.sh` - zatrzymaj serwery

Zobacz: `.claude/skills/frontend-verification/SKILL.md` dla pełnej dokumentacji.

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
