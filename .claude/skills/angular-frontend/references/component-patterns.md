# Component Patterns

Component architecture patterns for Photo Map MVP: Smart vs Dumb components, lifecycle hooks, communication patterns.

## Smart vs Dumb Components

### Smart Components (Container)

**Characteristics:**
- Inject services via `inject()`
- Manage state (local or shared)
- Handle business logic
- Fetch data from services
- Pass data to dumb components

**Example: PhotoGalleryComponent**

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoCardComponent } from '../photo-card/photo-card.component';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [CommonModule, PhotoCardComponent],
  templateUrl: './photo-gallery.component.html'
})
export class PhotoGalleryComponent implements OnInit {
  private readonly photoService = inject(PhotoService);
  private readonly photoViewerService = inject(PhotoViewerService);
  private readonly filterService = inject(FilterService);

  // Component state
  photos = signal<Photo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPhotos();
    this.subscribeToFilters();
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.filterService.currentFilters;

    this.photoService.getPhotos(filters).subscribe({
      next: (photos) => {
        this.photos.set(photos);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load photos');
        this.loading.set(false);
      }
    });
  }

  private subscribeToFilters(): void {
    this.filterService.filters$.subscribe(() => {
      this.loadPhotos();
    });
  }

  // Business logic handlers
  onPhotoClick(photoId: number): void {
    this.photoViewerService.openViewer(this.photos(), photoId, '/gallery');
  }

  onRatingChange(photoId: number, rating: number): void {
    this.photoService.ratePhoto(photoId, rating).subscribe({
      next: () => this.loadPhotos(),
      error: (err) => console.error('Failed to rate photo', err)
    });
  }

  onDeletePhoto(photoId: number): void {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    this.photoService.deletePhoto(photoId).subscribe({
      next: () => this.loadPhotos(),
      error: (err) => console.error('Failed to delete photo', err)
    });
  }
}
```

### Dumb Components (Presentational)

**Characteristics:**
- NO service injection (except utility services like Router)
- Receive data via `@Input()`
- Emit events via `@Output()`
- Pure presentation logic
- Reusable across app

**Example: PhotoCardComponent**

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-card.component.html'
})
export class PhotoCardComponent {
  @Input() photo!: Photo;

  @Output() photoClick = new EventEmitter<number>();
  @Output() ratingChange = new EventEmitter<{ photoId: number, rating: number }>();
  @Output() deletePhoto = new EventEmitter<number>();

  onClick(): void {
    this.photoClick.emit(this.photo.id);
  }

  onRate(rating: number): void {
    this.ratingChange.emit({ photoId: this.photo.id, rating });
  }

  onDelete(): void {
    this.deletePhoto.emit(this.photo.id);
  }
}
```

**Template:**

```html
<div
  class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
  data-testid="photo-card"
  (click)="onClick()"
>
  <img
    [src]="photo.thumbnailUrl"
    [alt]="photo.fileName"
    class="w-full h-48 object-cover"
  >

  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ photo.fileName }}</h3>
    <p class="text-sm text-gray-600 mb-2">{{ photo.takenAt | date:'short' }}</p>
    <p class="text-xs text-gray-500">⭐ Rating: {{ photo.rating }}/10</p>

    <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
      <button
        data-testid="photo-card-rate-button"
        (click)="onRate(8); $event.stopPropagation()"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        Rate
      </button>

      <button
        data-testid="photo-card-delete-button"
        (click)="onDelete(); $event.stopPropagation()"
        class="text-sm text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    </div>
  </div>
</div>
```

## Component Communication

### Parent → Child (@Input)

```typescript
// Parent component
@Component({
  template: `
    <app-photo-card [photo]="selectedPhoto()" />
  `
})
export class ParentComponent {
  selectedPhoto = signal<Photo | null>(null);
}

// Child component
@Component({
  selector: 'app-photo-card'
})
export class PhotoCardComponent {
  @Input() photo!: Photo;
}
```

### Child → Parent (@Output)

```typescript
// Child component
@Component({
  selector: 'app-photo-card'
})
export class PhotoCardComponent {
  @Output() photoClick = new EventEmitter<number>();

  onClick(): void {
    this.photoClick.emit(this.photo.id);
  }
}

// Parent component
@Component({
  template: `
    <app-photo-card
      [photo]="photo"
      (photoClick)="onPhotoClick($event)"
    />
  `
})
export class ParentComponent {
  onPhotoClick(photoId: number): void {
    console.log('Photo clicked:', photoId);
  }
}
```

### Sibling Components (via Service)

```typescript
// Shared service
@Injectable({ providedIn: 'root' })
export class PhotoSelectionService {
  private readonly selectedPhotoSubject = new BehaviorSubject<number | null>(null);
  readonly selectedPhoto$ = this.selectedPhotoSubject.asObservable();

  selectPhoto(photoId: number): void {
    this.selectedPhotoSubject.next(photoId);
  }
}

// Component A (emits)
export class PhotoGalleryComponent {
  private readonly selectionService = inject(PhotoSelectionService);

  onPhotoClick(photoId: number): void {
    this.selectionService.selectPhoto(photoId);
  }
}

// Component B (listens)
export class PhotoDetailComponent {
  private readonly selectionService = inject(PhotoSelectionService);

  selectedPhoto$ = this.selectionService.selectedPhoto$;
}
```

## Lifecycle Hooks

### ngOnInit

**Purpose:** Initialize component, load data

```typescript
export class PhotoGalleryComponent implements OnInit {
  ngOnInit(): void {
    this.loadPhotos();
    this.subscribeToFilters();
  }
}
```

### ngAfterViewInit

**Purpose:** Access ViewChild, DOM manipulation (e.g., Leaflet map)

```typescript
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  ngAfterViewInit(): void {
    // DOM is ready
    this.initializeMap();
  }

  private initializeMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView([52, 21], 6);
  }
}
```

### ngOnChanges

**Purpose:** React to @Input() changes

```typescript
export class PhotoCardComponent implements OnChanges {
  @Input() photo!: Photo;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['photo']) {
      console.log('Photo changed:', changes['photo'].currentValue);
      this.updateDisplay();
    }
  }

  private updateDisplay(): void {
    // Update component based on new photo
  }
}
```

### ngOnDestroy

**Purpose:** Cleanup subscriptions, timers, DOM listeners

```typescript
export class PhotoGalleryComponent implements OnDestroy {
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.photoService.photos$.subscribe(...);
  }

  ngOnDestroy(): void {
    // MUST unsubscribe to prevent memory leaks
    this.subscription?.unsubscribe();
  }
}
```

## ViewChild and ContentChild

### ViewChild (access child element/component)

```typescript
export class PhotoGalleryComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }
}
```

```html
<input #fileInput type="file" hidden (change)="onFileSelected($event)">
<button (click)="openFilePicker()">Upload</button>
```

### ContentChild (access projected content)

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @ContentChild('cardHeader') header!: ElementRef;

  ngAfterContentInit(): void {
    console.log('Header:', this.header.nativeElement);
  }
}
```

## Test IDs Convention

**Format:** `data-testid="component-element-action"`

**Rules:**
- ✅ kebab-case (NOT camelCase)
- ✅ Descriptive names
- ✅ All interactive elements

**Examples:**

```html
<!-- Gallery -->
<button data-testid="gallery-upload-button">Upload</button>
<div data-testid="gallery-photo-card">...</div>

<!-- Photo Card -->
<button data-testid="photo-card-rate-button">Rate</button>
<button data-testid="photo-card-clear-rating-button">Clear Rating</button>
<button data-testid="photo-card-delete-button">Delete</button>

<!-- Login -->
<input data-testid="login-email-input" type="email">
<input data-testid="login-password-input" type="password">
<button data-testid="login-submit-button">Login</button>

<!-- Upload Dialog -->
<div data-testid="upload-dialog">...</div>
<div data-testid="upload-dropzone">...</div>
<button data-testid="upload-cancel-button">Cancel</button>
<button data-testid="upload-submit-button">Upload</button>
```

## Component Best Practices

**Do:**
- ✅ Keep components focused (SRP)
- ✅ Use Smart/Dumb pattern
- ✅ inject() for services (NOT constructor)
- ✅ readonly for injected services
- ✅ Signals for local state
- ✅ Test IDs on all interactive elements
- ✅ Unsubscribe in ngOnDestroy (or use async pipe)

**Don't:**
- ❌ Don't inject services in dumb components
- ❌ Don't mix presentation and business logic
- ❌ Don't forget to unsubscribe
- ❌ Don't use constructor injection
- ❌ Don't skip test IDs
