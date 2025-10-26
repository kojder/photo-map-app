# TypeScript Quality Standards

TypeScript best practices for Photo Map MVP: readonly/const, strict mode, utility types, and modern TS 5 features.

## Use const and readonly Wherever Possible

**Benefits:**
- **Immutability** - prevents accidental reassignment
- **Thread safety** - immutable objects are safe in async operations
- **Readability** - clear intent that value won't change
- **Type narrowing** - TypeScript can infer more precise types

### Local Variables - Use const

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

### Class Properties - Use readonly

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

### Signals and State - readonly for Public API

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

### Interface Properties - readonly for Immutable Data

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

### When NOT to Use const/readonly

- Loop variables that change (`for (let i = 0; i < n; i++)`)
- State that needs reassignment (counters, flags)
- Function parameters (already immutable by default)

## Type Safety

### Always Use Explicit Types for Public API

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

### Use Strict Null Checks

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

## Utility Types

### Built-in Utility Types

```typescript
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

## TypeScript 5 Modern Features

### 1. Type Narrowing with satisfies

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

## Strict Mode Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Rules:**
- ✅ Enable all strict flags
- ✅ No implicit any
- ✅ Strict null checks
- ✅ Explicit types for public API (methods, properties)
- ✅ readonly for immutable data
- ✅ const for variables that won't be reassigned
