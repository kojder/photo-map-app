# SOLID Principles

SOLID principles for Angular development: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.

## 1. Single Responsibility Principle (SRP)

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

## 2. Open/Closed Principle (OCP)

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

## 3. Liskov Substitution Principle (LSP)

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

## 4. Interface Segregation Principle (ISP)

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

## 5. Dependency Inversion Principle (DIP)

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

## Summary

| Principle | Key Question | Photo Map Example |
|-----------|--------------|-------------------|
| **SRP** | Does this class have one reason to change? | PhotoService (HTTP) vs FilterService (filtering) vs AnalyticsService (tracking) |
| **OCP** | Can I add new behavior without modifying existing code? | ExportStrategy pattern - add new export formats without changing ExportService |
| **LSP** | Can I replace this with its subtype without breaking? | PhotoLoader interface - StandardPhotoLoader and SecurePhotoLoader behave consistently |
| **ISP** | Does this client depend on methods it doesn't use? | PhotoReader vs PhotoWriter - components only depend on what they need |
| **DIP** | Do I depend on abstractions or concretions? | PhotoRepository abstraction - easy to swap HttpPhotoRepository with MockPhotoRepository |

## When to Apply SOLID in Photo Map MVP

**Always apply:**
- ✅ SRP - Separate services (PhotoService, FilterService, AuthService)
- ✅ ISP - Focused interfaces (when needed)
- ✅ DIP - Inject services via inject() (NOT new Service())

**Apply when needed:**
- ⚠️ OCP - Strategy pattern (only if multiple variants expected, e.g., export formats)
- ⚠️ LSP - Interface-based design (only when substitutability matters)

**For MVP:**
- Keep it simple - don't over-engineer
- Apply SRP always (separate concerns)
- Use DIP via Angular DI (built-in)
- Apply OCP/LSP/ISP only when complexity justifies it
