# RxJS Patterns

RxJS patterns for Photo Map MVP: BehaviorSubject, operators, async pipe, error handling, and subscription management.

## BehaviorSubject Pattern

### Complete Implementation

```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  // Private BehaviorSubject (internal state)
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Public Observables (expose to components)
  readonly photos$ = this.photosSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  // Load photos with loading/error state
  loadPhotos(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http.get<Photo[]>('/api/photos').subscribe({
      next: (photos) => {
        this.photosSubject.next(photos);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        this.errorSubject.next('Failed to load photos');
        this.loadingSubject.next(false);
        console.error('Load photos error:', error);
      }
    });
  }

  // Add photo (optimistic update)
  addPhoto(photo: Photo): void {
    const current = this.photosSubject.value;
    this.photosSubject.next([...current, photo]);
  }

  // Remove photo
  removePhoto(photoId: number): void {
    const current = this.photosSubject.value;
    this.photosSubject.next(current.filter(p => p.id !== photoId));
  }

  // Update photo
  updatePhoto(photoId: number, updates: Partial<Photo>): void {
    const current = this.photosSubject.value;
    this.photosSubject.next(
      current.map(p => p.id === photoId ? { ...p, ...updates } : p)
    );
  }

  // Synchronous getters
  get currentPhotos(): Photo[] {
    return this.photosSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
```

## RxJS Operators

### Common Operators

```typescript
import { map, filter, switchMap, debounceTime, tap, catchError, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';

export class PhotoSearchComponent {
  private readonly photoService = inject(PhotoService);

  searchTerm$ = new BehaviorSubject<string>('');

  // Debounced search with operators
  searchResults$ = this.searchTerm$.pipe(
    debounceTime(300),              // Wait 300ms after user stops typing
    distinctUntilChanged(),          // Only emit if value changed
    filter(term => term.length >= 3), // Only search if 3+ characters
    tap(() => this.loading.set(true)), // Set loading state
    switchMap(term =>                // Cancel previous request
      this.photoService.searchPhotos(term).pipe(
        catchError(error => {
          console.error('Search error:', error);
          return of([]); // Return empty array on error
        })
      )
    ),
    tap(() => this.loading.set(false)) // Clear loading state
  );
}
```

### Operator Descriptions

**Transformation:**
- `map(fn)` - Transform each value
- `switchMap(fn)` - Map to Observable, cancel previous
- `mergeMap(fn)` - Map to Observable, don't cancel (concurrent)

**Filtering:**
- `filter(predicate)` - Only emit values matching predicate
- `distinctUntilChanged()` - Skip duplicate consecutive values
- `take(n)` - Take first n values, then complete
- `takeUntil(notifier$)` - Take until notifier emits

**Timing:**
- `debounceTime(ms)` - Wait ms after last emission
- `throttleTime(ms)` - Emit first, then ignore for ms
- `delay(ms)` - Delay emissions by ms

**Side Effects:**
- `tap(fn)` - Perform side effects (logging, state updates)
- `finalize(fn)` - Execute when Observable completes/errors

**Error Handling:**
- `catchError(fn)` - Catch errors, return fallback Observable
- `retry(count)` - Retry on error
- `retryWhen(fn)` - Custom retry logic

## Async Pipe in Templates

### Basic Usage

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

<!-- Or with modern @for -->
@for (photo of photos$ | async; track photo.id) {
  <app-photo-card [photo]="photo" />
}
```

### Multiple Async Pipes (Same Observable)

```html
<!-- ❌ BAD: Multiple subscriptions -->
<div>Total: {{ (photos$ | async)?.length }}</div>
<div *ngFor="let photo of photos$ | async">...</div>

<!-- ✅ GOOD: Single subscription with @if -->
@if (photos$ | async; as photos) {
  <div>Total: {{ photos.length }}</div>
  <div *ngFor="let photo of photos">...</div>
}
```

### Loading State with Async Pipe

```typescript
// Component
export class PhotoGalleryComponent {
  photos$ = inject(PhotoService).photos$;
  loading$ = inject(PhotoService).loading$;
  error$ = inject(PhotoService).error$;
}
```

```html
<!-- Template -->
@if (loading$ | async) {
  <div>Loading...</div>
} @else if (error$ | async; as error) {
  <div class="error">{{ error }}</div>
} @else if (photos$ | async; as photos) {
  @for (photo of photos; track photo.id) {
    <app-photo-card [photo]="photo" />
  }
}
```

## Error Handling

### Service-Level Error Handling

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  uploadPhoto(file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Photo>('/api/photos/upload', formData).pipe(
      catchError(error => {
        console.error('Upload failed:', error);

        // Transform error to user-friendly message
        let message = 'Upload failed';
        if (error.status === 413) {
          message = 'File too large';
        } else if (error.status === 415) {
          message = 'Invalid file type';
        }

        return throwError(() => new Error(message));
      }),
      retry(2) // Retry 2 times before failing
    );
  }
}
```

### Component-Level Error Handling

```typescript
export class PhotoUploadComponent {
  private readonly photoService = inject(PhotoService);

  errorMessage = signal<string | null>(null);
  uploading = signal(false);

  uploadPhoto(file: File): void {
    this.uploading.set(true);
    this.errorMessage.set(null);

    this.photoService.uploadPhoto(file).subscribe({
      next: (photo) => {
        console.log('Upload success:', photo);
        this.uploading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.uploading.set(false);
      }
    });
  }
}
```

## Subscription Management

### Automatic Cleanup with Async Pipe

```typescript
// ✅ GOOD: Async pipe automatically unsubscribes
export class PhotoGalleryComponent {
  photos$ = inject(PhotoService).photos$;
}
```

```html
<div *ngFor="let photo of photos$ | async">...</div>
```

### Manual Subscription (when necessary)

```typescript
import { Subscription } from 'rxjs';

export class PhotoGalleryComponent implements OnInit, OnDestroy {
  private readonly photoService = inject(PhotoService);
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.photoService.photos$.subscribe(photos => {
      // Handle photos manually
      console.log('Photos updated:', photos.length);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe(); // MUST unsubscribe!
  }
}
```

### Multiple Subscriptions (SubSink Pattern)

```typescript
import { SubSink } from 'subsink'; // npm install subsink

export class PhotoGalleryComponent implements OnInit, OnDestroy {
  private readonly subs = new SubSink();

  ngOnInit(): void {
    this.subs.sink = this.photoService.photos$.subscribe(...);
    this.subs.sink = this.filterService.filters$.subscribe(...);
    this.subs.sink = this.authService.user$.subscribe(...);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe(); // Unsubscribe all at once
  }
}
```

## Advanced Patterns

### Combining Multiple Observables

```typescript
import { combineLatest, forkJoin } from 'rxjs';

// combineLatest - emit when ANY observable emits
const combined$ = combineLatest([
  this.photoService.photos$,
  this.filterService.filters$
]).pipe(
  map(([photos, filters]) => {
    return photos.filter(p => p.rating >= (filters.minRating ?? 0));
  })
);

// forkJoin - wait for ALL observables to complete
const all$ = forkJoin({
  photos: this.photoService.getPhotos(),
  users: this.userService.getUsers(),
  settings: this.settingsService.getSettings()
}).subscribe(({ photos, users, settings }) => {
  // All loaded
});
```

### Subject Types Comparison

| Type | Initial Value | Replay | Use Case |
|------|---------------|--------|----------|
| **Subject** | No | No | Events, multicasting |
| **BehaviorSubject** | Yes (required) | Last value | State management |
| **ReplaySubject** | No | N last values | History tracking |
| **AsyncSubject** | No | Last value on complete | Single async result |

**Photo Map MVP uses:**
- ✅ **BehaviorSubject** - for all state management (photos, filters, auth)
- ❌ Subject, ReplaySubject, AsyncSubject - not needed for MVP
