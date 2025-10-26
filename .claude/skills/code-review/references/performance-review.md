# Performance Review - Photo Map MVP

Performance checks for Photo Map MVP. Focus on MVP-appropriate optimizations only.

**Important:** NO premature optimization! Only implement proven performance patterns.

---

## Backend Performance

### Database Optimization

**Indexes:**

```sql
-- User ID index (CRITICAL for user scoping!)
CREATE INDEX idx_photos_user_id ON photos(user_id);

-- Rating index (for filtering)
CREATE INDEX idx_photos_rating ON photos(rating);

-- Created timestamp index (for sorting)
CREATE INDEX idx_photos_created_at ON photos(created_at);

-- Composite index for common queries
CREATE INDEX idx_photos_user_rating ON photos(user_id, rating);
```

**Check:**
- ✅ Index on `user_id` (all queries filter by user)
- ✅ Index on `rating` (filtering by rating)
- ✅ Index on `created_at` (sorting by date)
- ✅ Composite indexes for common query patterns
- ❌ NO over-indexing (every index has cost on writes)

### Transaction Management

**Read Operations:**

```java
@Service
@RequiredArgsConstructor
public class PhotoService {
    @Transactional(readOnly = true)
    public List<PhotoDto> getAllPhotos(final Long userId) {
        final List<Photo> photos = photoRepository.findAllByUserId(userId);
        return photos.stream()
            .map(PhotoMapper::toDto)
            .toList();
    }
}
```

**Check:**
- ✅ `@Transactional(readOnly = true)` on all read operations
- ✅ `@Transactional` (default) on write operations
- ✅ Transactions kept short (no long-running operations)

### Lazy Loading

**Entity Relationships:**

```java
@Entity
@Table(name = "photos")
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Lazy loading!
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ...
}
```

**Check:**
- ✅ `FetchType.LAZY` for relationships (default for @ManyToOne, @OneToOne)
- ✅ `FetchType.LAZY` for collections (@OneToMany, @ManyToMany)
- ✅ Avoid N+1 query problem (use JOIN FETCH if needed)

### File Upload Optimization

**Async Processing:**

```java
@Service
@RequiredArgsConstructor
public class PhotoProcessingService {
    private final ThumbnailService thumbnailService;
    private final ExifService exifService;

    @Async
    public void processPhoto(final Photo photo, final byte[] fileData) {
        // Generate thumbnail asynchronously
        final byte[] thumbnail = thumbnailService.generateThumbnail(fileData);
        photo.setThumbnailUrl(/* save thumbnail */);

        // Extract EXIF asynchronously
        final ExifData exif = exifService.extractExif(fileData);
        photo.setLatitude(exif.getLatitude());
        photo.setLongitude(exif.getLongitude());

        photoRepository.save(photo);
    }
}
```

**Check:**
- ✅ Thumbnail generation happens asynchronously
- ✅ EXIF extraction happens asynchronously
- ✅ Synchronous API response (quick 201 Created)
- ✅ Background processing for heavy operations

### What NOT to Do (MVP Scope)

**Avoid:**
- ❌ Redis caching (overkill for MVP)
- ❌ Message queues (Kafka, RabbitMQ - too complex)
- ❌ Database sharding (premature optimization)
- ❌ CDN for static files (MVP scope)
- ❌ Elasticsearch for search (premature)

**MVP-appropriate:**
- ✅ Simple in-memory caching (if needed)
- ✅ Database indexes
- ✅ `@Transactional(readOnly = true)`
- ✅ Lazy loading

---

## Frontend Performance

### Image Loading

**Lazy Loading:**

```html
<!-- ✅ GOOD: Lazy loading images -->
<img
  [src]="photo.thumbnailUrl"
  [alt]="photo.fileName"
  loading="lazy"
  class="w-full h-64 object-cover"
/>
```

**Check:**
- ✅ `loading="lazy"` on images
- ✅ Thumbnail URLs used (not full-size images)
- ✅ Images loaded only when visible

### Subscription Management

**Async Pipe:**

```typescript
// ✅ GOOD: Async pipe (automatic unsubscribe)
@Component({
  template: `
    @for (photo of photos$ | async; track photo.id) {
      <app-photo-card [photo]="photo" />
    }
  `
})
export class PhotoGalleryComponent {
  readonly photos$ = this.photoService.photos$;
}
```

**Manual Subscriptions (if needed):**

```typescript
// ✅ GOOD: takeUntilDestroyed for cleanup
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly photos = signal<Photo[]>([]);

  ngOnInit() {
    this.photoService.photos$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(photos => {
      this.photos.set(photos);
    });
  }
}
```

**Check:**
- ✅ Async pipe used where possible
- ✅ `takeUntilDestroyed()` for manual subscriptions
- ✅ NO subscriptions without cleanup

### List Rendering

**TrackBy Function:**

```typescript
@Component({
  template: `
    @for (photo of photos(); track photo.id) {
      <app-photo-card [photo]="photo" />
    }
  `
})
export class PhotoGalleryComponent {
  readonly photos = signal<Photo[]>([]);
}
```

**Check:**
- ✅ `track` in `@for` loops (Angular 18 control flow)
- ✅ Track by unique ID (not index)
- ✅ Prevents unnecessary re-renders

### Change Detection

**OnPush Strategy:**

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class PhotoCardComponent {
  readonly photo = input.required<Photo>();
}
```

**Check:**
- ✅ OnPush for dumb components
- ✅ Signals trigger change detection automatically
- ✅ Immutable data patterns

### What NOT to Do (MVP Scope)

**Avoid:**
- ❌ Virtual scrolling (premature optimization)
- ❌ Service Workers (PWA features - post-MVP)
- ❌ Web Workers (CPU-intensive tasks - not needed)
- ❌ Code splitting (lazy loading routes - post-MVP)
- ❌ SSR (Server-Side Rendering - overkill for MVP)

**MVP-appropriate:**
- ✅ Lazy loading images
- ✅ Async pipe
- ✅ TrackBy in lists
- ✅ OnPush change detection (where appropriate)

---

## Leaflet Map Performance

### Marker Clustering

**Enable Clustering:**

```typescript
import * as L from 'leaflet';
import 'leaflet.markercluster';

export class MapComponent {
  private map!: L.Map;
  private markerClusterGroup!: L.MarkerClusterGroup;

  ngOnInit() {
    this.map = L.map('map').setView([52.0, 19.0], 6);

    // Enable marker clustering
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true
    });

    this.map.addLayer(this.markerClusterGroup);
  }

  addMarkers(photos: Photo[]) {
    this.markerClusterGroup.clearLayers();

    photos.forEach(photo => {
      if (photo.latitude && photo.longitude) {
        const marker = L.marker([photo.latitude, photo.longitude]);
        marker.bindPopup(`<img src="${photo.thumbnailUrl}" />`);
        this.markerClusterGroup.addLayer(marker);
      }
    });
  }
}
```

**Check:**
- ✅ Marker clustering enabled
- ✅ `maxClusterRadius` configured
- ✅ Popups use thumbnail URLs (not full-size)
- ✅ Markers cleared before adding new ones

---

## HTTP & API Performance

### HTTP Caching

**HTTP Client:**

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  getPhotos(): Observable<Photo[]> {
    // Simple HTTP GET - browser caching handles this
    return this.http.get<Photo[]>('/api/photos').pipe(
      catchError(this.handleError)
    );
  }
}
```

**Backend Cache Headers:**

```java
@GetMapping
public ResponseEntity<List<PhotoDto>> getAllPhotos(@AuthenticationPrincipal final User user) {
    final List<PhotoDto> photos = photoService.getAllPhotos(user.getId());

    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS)) // 60s cache
        .body(photos);
}
```

**Check:**
- ✅ Cache-Control headers set (60s for photo list)
- ✅ Browser caching leveraged
- ✅ NO custom cache implementation for MVP

---

## Performance Review Checklist

**Backend:**
- [ ] Database indexes on `user_id`, `rating`, `created_at`
- [ ] `@Transactional(readOnly = true)` on queries
- [ ] `FetchType.LAZY` for relationships
- [ ] Async processing for heavy operations (thumbnails, EXIF)
- [ ] NO premature optimization (Redis, queues)

**Frontend:**
- [ ] Lazy loading images (`loading="lazy"`)
- [ ] Thumbnail URLs used (not originals)
- [ ] Async pipe or `takeUntilDestroyed()`
- [ ] `track` in `@for` loops
- [ ] OnPush change detection (where appropriate)
- [ ] NO premature optimization (Virtual Scroll, Service Workers)

**Leaflet:**
- [ ] Marker clustering enabled
- [ ] Popups use thumbnails

**HTTP:**
- [ ] Cache-Control headers set
- [ ] Browser caching leveraged

---

## When to Optimize Further

**Only optimize if:**
- ✅ Performance problem confirmed (measurements, user reports)
- ✅ Bottleneck identified (profiling, monitoring)
- ✅ MVP scope validated (not adding features under "optimization" guise)

**Optimization post-MVP:**
- Redis caching (if needed)
- Virtual scrolling (if gallery has 1000+ photos)
- Code splitting (if bundle size > 1MB)
- CDN for static files (if traffic high)
