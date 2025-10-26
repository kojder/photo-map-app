# Przykład Prostej Funkcji - Photo Description Field

## User Story

**ID:** US-PHOTO-005
**Tytuł:** Dodanie pola opisu do zdjęcia
**Opis:** Jako użytkownik mogę dodać opis tekstowy do zdjęcia aby zachować notatki i kontekst.

**Kryteria Akceptacji:**
- User może dodać opis (max 500 znaków)
- Opis jest opcjonalny (nullable)
- Opis jest widoczny w PhotoCard (gallery)
- Opis jest widoczny w map popups
- User może edytować i usuwać opis

## Complexity Assessment

### Database Changes
- ADD COLUMN `description` VARCHAR(500) (nullable)
- No indexes needed (simple text field)

### API Endpoints
- **No new endpoints** - modify existing PUT `/api/photos/{id}`
- Add `description` field to `PhotoDTO`

### Frontend Changes
- Add textarea w PhotoCard component
- Update PhotoService (description field in DTO)
- Display description w gallery i map

### Complexity Level
**Simple** - 1-2 chunks, 1-2h

**Reasoning:**
- ❌ No new endpoints (modify existing)
- ❌ No new tables
- ✅ ADD COLUMN (trivial migration)
- ✅ Frontend-only textarea (no complex UI)
- ✅ 2-3 pliki do zmiany

## Feature Breakdown

### Chunk 1: Backend Implementation (40 min)

**Implementacja:**

```sql
-- V005__add_description_to_photos.sql
ALTER TABLE photos ADD COLUMN description VARCHAR(500);
```

```java
// PhotoDTO.java
public record PhotoDTO(
    Long id,
    String fileName,
    Long fileSize,
    String thumbnailUrl,
    Double latitude,
    Double longitude,
    LocalDateTime dateTaken,
    Integer rating,
    String description, // NEW FIELD
    LocalDateTime uploadedAt
) {}

// PhotoMapper.java
public static PhotoDTO toDTO(Photo photo) {
    return new PhotoDTO(
        photo.getId(),
        photo.getFileName(),
        photo.getFileSize(),
        "/api/photos/" + photo.getId() + "/thumbnail",
        photo.getLatitude(),
        photo.getLongitude(),
        photo.getDateTaken(),
        photo.getRating(),
        photo.getDescription(), // NEW FIELD
        photo.getUploadedAt()
    );
}

// Photo.java (entity)
@Entity
@Table(name = "photos")
public class Photo {
    // ... existing fields ...

    @Column(length = 500)
    private String description;

    // getter/setter
}

// PhotoController.java - NO CHANGES NEEDED!
// PUT /api/photos/{id} already accepts PhotoDTO with all fields
```

**Test:**
```bash
curl -X PUT http://localhost:8080/api/photos/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "IMG_1234.jpg",
    "rating": 5,
    "description": "Beautiful sunset at the beach"
  }'

# Verify
curl http://localhost:8080/api/photos/1 \
  -H "Authorization: Bearer <token>"
```

**Commit:**
```
feat(photo): add description field to photos

- Add description column to photos table (VARCHAR 500, nullable)
- Add description field to PhotoDTO
- Update PhotoMapper to include description
- No changes to controller (existing PUT endpoint handles it)
```

---

### Chunk 2: Frontend Implementation (50 min)

**Implementacja:**

```typescript
// photo.interface.ts
export interface Photo {
  id: number;
  fileName: string;
  fileSize: number;
  thumbnailUrl: string;
  latitude?: number;
  longitude?: number;
  dateTaken?: string;
  rating?: number;
  description?: string; // NEW FIELD
  uploadedAt: string;
}

// photo-card.component.ts
@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [CommonModule, RatingComponent],
  template: `
    <div class="photo-card" data-testid="photo-card-{{photo.id}}">
      <img [src]="photo.thumbnailUrl" [alt]="photo.fileName" />

      <div class="photo-details">
        <h3>{{ photo.fileName }}</h3>

        <!-- Rating -->
        <app-rating
          [photoId]="photo.id"
          [currentRating]="photo.rating"
          (ratingChange)="onRatingChange($event)"
        />

        <!-- Description (NEW) -->
        <textarea
          [(ngModel)]="photo.description"
          (blur)="onDescriptionChange()"
          placeholder="Add description..."
          maxlength="500"
          rows="2"
          class="w-full p-2 border rounded"
          data-testid="photo-description-input"
        ></textarea>

        <p class="text-sm text-gray-500">
          {{ photo.dateTaken | date }}
        </p>
      </div>
    </div>
  `
})
export class PhotoCardComponent {
  @Input() photo!: Photo;

  constructor(private photoService: PhotoService) {}

  onDescriptionChange(): void {
    // Debounced update (save on blur)
    this.photoService.updatePhoto(this.photo.id, {
      description: this.photo.description
    }).subscribe();
  }

  onRatingChange(rating: number): void {
    this.photoService.updateRating(this.photo.id, rating).subscribe();
  }
}

// photo.service.ts - ADD METHOD
updatePhoto(photoId: number, updates: Partial<Photo>): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/photos/${photoId}`, updates)
    .pipe(
      tap(() => {
        // Update local state
        const photos = this.photosSubject.value;
        const updated = photos.map(p =>
          p.id === photoId ? { ...p, ...updates } : p
        );
        this.photosSubject.next(updated);
      })
    );
}

// map.component.ts - UPDATE POPUP
createPopupContent(photo: Photo): string {
  const ratingStars = photo.rating
    ? '★'.repeat(photo.rating) + '☆'.repeat(5 - photo.rating)
    : 'No rating';

  const description = photo.description || 'No description';

  return `
    <div data-testid="map-popup-${photo.id}">
      <img src="${photo.thumbnailUrl}" alt="${photo.fileName}" />
      <p><strong>${photo.fileName}</strong></p>
      <p>${ratingStars}</p>
      <p>${description}</p>
      <p>${photo.dateTaken}</p>
    </div>
  `;
}
```

**Test:**
1. Otworzyć gallery w browser
2. Kliknąć w textarea → dodać tekst "Beautiful sunset"
3. Blur (kliknąć poza textarea) → description saved
4. Reload page → description persisted
5. Otworzyć map → kliknąć marker → popup shows description

**Commit:**
```
feat(ui): add description field to photo cards and map

- Add description textarea to PhotoCard component
- Add updatePhoto() method to PhotoService
- Update description on blur (debounced save)
- Display description in map popups
- Add description field to Photo interface
```

**CHECKPOINT** → Feature complete!

---

## Summary

### Metrics
- **Total chunks:** 2
- **Total time:** ~1h 30min
- **Complexity:** Simple (1-2 chunks prediction ✅, actual: 2)
- **Files changed:** 6
  - Backend: 3 (migration, DTO, entity)
  - Frontend: 3 (interface, component, service)

### What Went Well ✅
- **Very small chunks** - 40 min + 50 min
- **No new endpoints** - reused existing PUT /api/photos/{id}
- **Trivial migration** - ADD COLUMN (nullable)
- **Immediate value** - user can annotate photos
- **Fast implementation** - under 2 hours total

### Acceptance Criteria Check
- ✅ User może dodać opis (max 500 znaków)
- ✅ Opis jest opcjonalny (nullable)
- ✅ Opis jest widoczny w PhotoCard (gallery)
- ✅ Opis jest widoczny w map popups
- ✅ User może edytować i usuwać opis

**Feature complete!** 🎉

---

## Why This Is a SIMPLE Feature

### ✅ Minimal Database Changes
- ADD COLUMN (nullable) - no data migration needed
- No new tables, no foreign keys, no indexes
- Flyway migration is trivial (1 line SQL)

### ✅ No New Endpoints
- Reused existing PUT `/api/photos/{id}` endpoint
- Just added field to DTO (no controller changes)
- No new business logic needed

### ✅ Simple Frontend
- Textarea input (standard HTML element)
- No complex UI patterns
- Debounced save on blur (simple logic)

### ✅ No External Dependencies
- No new libraries
- Uses existing stack (Spring Boot, Angular, PostgreSQL)

### ✅ Fast Implementation
- 1-2 chunks (under 2 hours)
- Checkpoints not really needed (too small)
- Could be done in single chunk if comfortable

---

## When to Choose Simple Features

### Scenarios for Simple Features

1. **Add Optional Field** - description, notes, tags (text array)
2. **Display Existing Data** - EXIF metadata (camera model, ISO)
3. **Simple Sorting** - sort by file size, date, name
4. **Simple Filtering** - filter by file type (JPEG/PNG)
5. **UI Tweaks** - change thumbnail size, grid columns

### Benefits
- ✅ Fast to implement (1-2h)
- ✅ Low risk (trivial changes)
- ✅ Immediate value (users get feature today)
- ✅ Easy to test (manual test sufficient)
- ✅ Easy to rollback (if something goes wrong)

---

## Comparison: Simple vs Medium vs Complex

| Feature | Simple (Description) | Medium (Rating) | Complex (ML Categorization) |
|---------|----------------------|-----------------|------------------------------|
| **Chunks** | 2 chunks (1.5h) | 6 chunks (4h) | 20+ chunks (20-40h) |
| **DB Changes** | ADD COLUMN | ADD COLUMN + INDEX | CREATE TABLE + relations |
| **Endpoints** | 0 (modify existing) | 1 (new PUT) | 3+ (new endpoints) |
| **Frontend** | 1 component change | 3 components (rating, filter, map) | 5+ components |
| **Dependencies** | None | None | ML libraries, Python |
| **Constraints** | Compatible | Compatible | Incompatible (Mikrus VPS) |
| **Value** | Nice to have | Core functionality | Nice to have |
| **Decision** | ✅ Quick win | ✅ Implement | ❌ Reject |

---

## Tips dla Simple Features

### 🎯 Rozpoznaj Simple Feature
- **Pytanie:** Czy to ADD COLUMN + modify existing endpoint?
- **Pytanie:** Czy frontend to standardowy HTML element (input/textarea/select)?
- **Pytanie:** Czy można zrobić w <2h?

Jeśli TAK na wszystkie → to Simple feature!

### ⚡ Fast Track
- **Skip detailed planning** - Simple features nie wymagają 6-krokowego planningu
- **Single chunk możliwy** - jeśli komfortowo można zrobić w 1 chunk
- **Manual test sufficient** - nie musi być unit tests od razu (można dodać później)

### 💡 When to Use
- **Quick wins** - user prosi o simple thing, możesz dostarczyć w <2h
- **MVP polish** - dodać nice-to-have fields po core functionality
- **User feedback** - user testuje MVP i prosi o małe zmiany

---

## Related Examples

- `good-feature-breakdown.md` - przykład Medium complexity (rating system)
- `complex-feature-example.md` - przykład Complex feature (batch upload)
- `feature-verification-example.md` - jak weryfikować czy feature jest Simple
