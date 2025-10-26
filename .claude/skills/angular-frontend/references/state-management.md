# State Management Strategy

State management for Photo Map MVP: Signals for component-local state, BehaviorSubject for shared service state. NO NgRx for MVP.

## Decision Tree: Signals vs BehaviorSubject

### When to Use Signals

**Use Signals for:**
- ✅ Component-local state (counters, UI flags, filters)
- ✅ Computed values (derived state)
- ✅ Simple synchronous state
- ✅ Fine-grained reactivity within component

**Examples:**
- `loading = signal(false)` - loading state
- `selectedRating = signal(0)` - filter value
- `filteredPhotos = computed(...)` - derived state

### When to Use BehaviorSubject

**Use BehaviorSubject for:**
- ✅ Service state (cross-component communication)
- ✅ Async operations (HTTP, timers)
- ✅ Complex RxJS pipelines (debounce, switchMap, etc.)
- ✅ Observable-based APIs

**Examples:**
- `PhotoService.photos$` - shared photo list
- `FilterService.filters$` - shared filter state
- `AuthService.currentUser$` - authentication state

## Signals Pattern (Component-Local)

### Signal Basics

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

### Template Usage

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

**Rules:**
- ✅ Call signals as functions: `photos()`, not `photos`
- ✅ Use `set()` to replace value
- ✅ Use `update()` to modify based on current value
- ✅ Computed signals auto-update when dependencies change

## BehaviorSubject Pattern (Service State)

### Service with BehaviorSubject

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  // Private BehaviorSubject (internal state)
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);

  // Public Observable (expose to components)
  readonly photos$ = this.photosSubject.asObservable();

  // Public methods to update state
  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe({
      next: (photos) => this.photosSubject.next(photos),
      error: (error) => console.error('Failed to load photos', error)
    });
  }

  addPhoto(photo: Photo): void {
    const currentPhotos = this.photosSubject.value;
    this.photosSubject.next([...currentPhotos, photo]);
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
  private readonly photoService = inject(PhotoService);

  photos$ = this.photoService.photos$;

  ngOnInit(): void {
    this.photoService.loadPhotos();
  }
}
```

```html
<!-- Template -->
<div *ngFor="let photo of photos$ | async">
  {{ photo.fileName }}
</div>
```

**Rules:**
- ✅ Use `async` pipe for automatic subscription management
- ✅ NO manual subscribe/unsubscribe (unless necessary)
- ✅ `async` pipe automatically unsubscribes on component destroy

## Hybrid Pattern (Best of Both)

**Combine BehaviorSubject + Signals:**

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

**Template:**
```html
<div>
  @for (photo of photos(); track photo.id) {
    <app-photo-card [photo]="photo" />
  }
</div>
```

**Benefits:**
- ✅ Signals in template (no async pipe)
- ✅ BehaviorSubject for async operations
- ✅ Automatic subscription management
- ✅ Fine-grained reactivity

## State Management Examples

### Filter Service (BehaviorSubject)

```typescript
@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly filtersSubject = new BehaviorSubject<FilterState>({
    dateFrom: null,
    dateTo: null,
    minRating: null,
    hasGps: false
  });

  readonly filters$ = this.filtersSubject.asObservable();

  applyFilters(filters: Partial<FilterState>): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({ ...current, ...filters });
  }

  clearFilters(): void {
    this.filtersSubject.next({
      dateFrom: null,
      dateTo: null,
      minRating: null,
      hasGps: false
    });
  }

  get currentFilters(): FilterState {
    return this.filtersSubject.value;
  }
}
```

### Component with Both (Hybrid)

```typescript
export class PhotoGalleryComponent implements OnInit {
  private readonly photoService = inject(PhotoService);
  private readonly filterService = inject(FilterService);

  // Signal for component-local state
  loading = signal(false);
  selectedPhotoId = signal<number | null>(null);

  // BehaviorSubject for shared state
  photos$ = this.photoService.photos$;
  filters$ = this.filterService.filters$;

  // Computed signal (derived from observable + signal)
  filteredPhotos = computed(() => {
    // Mix signals and observables if needed
    const selectedId = this.selectedPhotoId();
    // ... filtering logic
  });

  ngOnInit(): void {
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.photoService.loadPhotos();

    this.photos$.subscribe(() => {
      this.loading.set(false);
    });
  }
}
```

## Summary

| Feature | Signals | BehaviorSubject |
|---------|---------|-----------------|
| **Scope** | Component-local | Cross-component (services) |
| **Reactivity** | Fine-grained | Observable-based |
| **Async** | Synchronous | Async operations |
| **RxJS** | No operators | Full RxJS pipeline |
| **Template** | Direct call `photos()` | Async pipe `photos$ \| async` |
| **Use Case** | UI state, counters, filters | HTTP data, shared state |

**Key Decision:**
- Component-local state → **Signals**
- Service state (shared) → **BehaviorSubject**
- Hybrid (both) → **toSignal()** bridge
