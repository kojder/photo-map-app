# Przykład Dobrego Rozbicia Funkcji - Photo Rating System

## User Story

**ID:** US-RAT-001
**Tytuł:** System ocen zdjęć
**Opis:** Jako użytkownik mogę ocenić swoje zdjęcia (1-5 gwiazdek) aby organizować ulubione.

**Kryteria Akceptacji:**
- User może kliknąć gwiazdki aby ustawić ocenę 1-5
- Rating jest zapisywany i persystuje po page reload
- Rating jest widoczny w galerii (PhotoCard)
- Rating jest widoczny w map popups
- User może zmienić ocenę (kliknąć inną liczbę gwiazdek)
- User może wyczyścić ocenę (kliknąć tę samą gwiazdkę ponownie)
- User scoping enforced (tylko własne zdjęcia)

## Complexity Assessment

### Database Changes
- ADD COLUMN `rating` INT (nullable, constraint: 1-5)
- CREATE INDEX `idx_photos_user_rating` ON photos(user_id, rating)

### API Endpoints
- PUT `/api/photos/{id}/rating` (update rating)

### Frontend Changes
- RatingComponent (clickable stars)
- Integration w PhotoCard (gallery)
- Integration w MapComponent (popups)
- Update PhotoService (updateRating method)

### Complexity Level
**Medium** - 3-5 chunks, 3-6h

**Reasoning:**
- 1 new endpoint (PUT)
- Simple DB change (ADD COLUMN)
- Frontend + Backend integration
- State management (BehaviorSubject update)
- 3-5 plików do zmiany

## Feature Breakdown

### Phase 1: Core Functionality (Chunks 1-3)

#### Chunk 1: Backend Endpoint (45 min)

**Implementacja:**
```java
// 1. Flyway migration
-- V003__add_rating_to_photos.sql
ALTER TABLE photos ADD COLUMN rating INT;
ALTER TABLE photos ADD CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5);
CREATE INDEX idx_photos_user_rating ON photos(user_id, rating);

// 2. DTO
public record RatingUpdateRequest(
    @Min(1) @Max(5) Integer rating
) {}

// 3. Controller
@PutMapping("/{id}/rating")
public ResponseEntity<Void> updateRating(
    @PathVariable Long id,
    @RequestBody @Valid RatingUpdateRequest request,
    @AuthenticationPrincipal UserDetails userDetails
) {
    photoService.updateRating(id, request.rating(), userDetails.getUsername());
    return ResponseEntity.noContent().build();
}

// 4. Service
public void updateRating(Long photoId, Integer rating, String username) {
    Photo photo = photoRepository.findById(photoId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

    if (!photo.getUser().getEmail().equals(username)) {
        throw new AccessDeniedException("Not authorized");
    }

    photo.setRating(rating);
    photoRepository.save(photo);
}
```

**Test:**
```bash
curl -X PUT http://localhost:8080/api/photos/1/rating \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

**Commit:**
```
feat(api): add photo rating endpoint

- Add rating column to photos table (nullable, constraint 1-5)
- Add PUT /api/photos/{id}/rating endpoint
- Add RatingUpdateRequest DTO with validation
- Enforce user scoping (can only rate own photos)
- Add unit tests for PhotoService.updateRating()
```

---

#### Chunk 2: Frontend Service (40 min)

**Implementacja:**
```typescript
// photo.service.ts
export class PhotoService {
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  public photos$ = this.photosSubject.asObservable();

  updateRating(photoId: number, rating: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/photos/${photoId}/rating`, { rating })
      .pipe(
        tap(() => {
          // Update local state
          const photos = this.photosSubject.value;
          const updated = photos.map(p =>
            p.id === photoId ? { ...p, rating } : p
          );
          this.photosSubject.next(updated);
        })
      );
  }
}
```

**Test:**
```typescript
// Manual test w component
updateRating(photoId: number, rating: number) {
  this.photoService.updateRating(photoId, rating).subscribe({
    next: () => console.log('Rating updated:', photoId, rating),
    error: (err) => console.error('Error:', err)
  });
}
```

**Commit:**
```
feat(service): add rating update method to PhotoService

- Add updateRating() method with RxJS Observable
- Update local state (BehaviorSubject) after successful update
- Handle errors gracefully
```

---

#### Chunk 3: Rating Component (50 min)

**Implementacja:**
```typescript
// rating.component.ts
@Component({
  selector: 'app-rating',
  standalone: true,
  template: `
    <div class="flex gap-1" data-testid="rating-component">
      @for (star of [1,2,3,4,5]; track star) {
        <button
          (click)="onStarClick(star)"
          class="text-2xl transition-colors"
          [class.text-yellow-400]="star <= (currentRating || 0)"
          [class.text-gray-300]="star > (currentRating || 0)"
          data-testid="rating-star-{{star}}"
        >
          ★
        </button>
      }
    </div>
  `
})
export class RatingComponent {
  @Input() photoId!: number;
  @Input() currentRating?: number;
  @Output() ratingChange = new EventEmitter<number>();

  onStarClick(star: number): void {
    // Toggle: click same star → clear rating
    const newRating = star === this.currentRating ? 0 : star;
    this.ratingChange.emit(newRating);
  }
}

// photo-card.component.ts - integration
<app-rating
  [photoId]="photo.id"
  [currentRating]="photo.rating"
  (ratingChange)="onRatingChange($event)"
  data-testid="photo-card-rating"
/>

onRatingChange(rating: number): void {
  this.photoService.updateRating(this.photo.id, rating).subscribe();
}
```

**Test:**
- Otworzyć gallery w browser
- Kliknąć gwiazdki → rating updated
- Reload page → rating persisted

**Commit:**
```
feat(ui): add rating stars component to photo cards

- Create RatingComponent with clickable stars (1-5)
- Integrate in PhotoCard component
- Add toggle behavior (click same star → clear rating)
- Update styling (yellow stars for rated, gray for unrated)
```

**CHECKPOINT** → Pokazać użytkownikowi działający rating w gallery

---

### Phase 2: Integration & Filtering (Chunks 4-5)

#### Chunk 4: Map Integration (30 min)

**Implementacja:**
```typescript
// map.component.ts
createPopupContent(photo: Photo): string {
  const ratingStars = photo.rating
    ? '★'.repeat(photo.rating) + '☆'.repeat(5 - photo.rating)
    : 'No rating';

  return `
    <div data-testid="map-popup-${photo.id}">
      <img src="${photo.thumbnailUrl}" />
      <p>${photo.fileName}</p>
      <p>${ratingStars}</p>
      <p>${photo.dateTaken}</p>
    </div>
  `;
}
```

**Test:**
- Otworzyć map view
- Kliknąć marker → popup shows rating

**Commit:**
```
feat(map): display rating in map popups

- Add rating stars to popup content
- Show "No rating" if photo not rated
```

---

#### Chunk 5: Filter Integration (45 min)

**Implementacja:**
```typescript
// filter.service.ts
export class FilterService {
  private filterSubject = new BehaviorSubject<PhotoFilter>({
    minRating: null,
    maxRating: null,
    dateFrom: null,
    dateTo: null
  });
  public filter$ = this.filterSubject.asObservable();

  updateRatingFilter(min: number | null, max: number | null): void {
    const current = this.filterSubject.value;
    this.filterSubject.next({ ...current, minRating: min, maxRating: max });
  }
}

// filter.component.ts
<div class="flex gap-4" data-testid="rating-filter">
  <label>
    Min Rating:
    <select [(ngModel)]="minRating" (change)="onFilterChange()">
      <option [value]="null">Any</option>
      <option [value]="1">1★</option>
      <option [value]="2">2★</option>
      <option [value]="3">3★</option>
      <option [value]="4">4★</option>
      <option [value]="5">5★</option>
    </select>
  </label>
  <label>
    Max Rating:
    <select [(ngModel)]="maxRating" (change)="onFilterChange()">
      <option [value]="null">Any</option>
      <option [value]="1">1★</option>
      <option [value]="2">2★</option>
      <option [value]="3">3★</option>
      <option [value]="4">4★</option>
      <option [value]="5">5★</option>
    </select>
  </label>
</div>

onFilterChange(): void {
  this.filterService.updateRatingFilter(this.minRating, this.maxRating);
}

// gallery.component.ts - apply filter
combineLatest([
  this.photoService.photos$,
  this.filterService.filter$
]).pipe(
  map(([photos, filter]) => this.applyFilters(photos, filter))
).subscribe(filtered => this.filteredPhotos = filtered);
```

**Test:**
- Ustawić min rating = 4 → tylko 4-5★ photos
- Ustawić max rating = 2 → tylko 1-2★ photos

**Commit:**
```
feat(filter): add rating range filter

- Add min/max rating filter in FilterService
- Add rating filter controls in FilterComponent
- Apply filter in gallery view
- Combine with existing date filter (AND logic)
```

**CHECKPOINT** → Rating feature complete z filtrowaniem

---

### Phase 3: Tests (Chunk 6)

#### Chunk 6: Unit & Integration Tests (50 min)

**Backend Tests:**
```java
// PhotoServiceTest.java
@Test
void updateRating_validRating_updatesPhoto() {
    // Given
    Photo photo = createTestPhoto();
    when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

    // When
    photoService.updateRating(1L, 5, "test@example.com");

    // Then
    assertEquals(5, photo.getRating());
    verify(photoRepository).save(photo);
}

@Test
void updateRating_otherUserPhoto_throwsAccessDeniedException() {
    // Given
    Photo photo = createTestPhoto();
    photo.getUser().setEmail("other@example.com");
    when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

    // When & Then
    assertThrows(AccessDeniedException.class, () ->
        photoService.updateRating(1L, 5, "test@example.com")
    );
}

// PhotoControllerIntegrationTest.java
@Test
@WithMockUser(username = "test@example.com")
void updateRating_validRequest_returns204() throws Exception {
    mockMvc.perform(put("/api/photos/1/rating")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"rating\": 5}"))
        .andExpect(status().isNoContent());
}

@Test
@WithMockUser(username = "test@example.com")
void updateRating_invalidRating_returns400() throws Exception {
    mockMvc.perform(put("/api/photos/1/rating")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"rating\": 10}"))
        .andExpect(status().isBadRequest());
}
```

**Frontend Tests:**
```typescript
// rating.component.spec.ts
it('should emit rating on star click', () => {
  let emittedRating: number | undefined;
  component.ratingChange.subscribe(r => emittedRating = r);

  component.onStarClick(5);

  expect(emittedRating).toBe(5);
});

it('should toggle rating when clicking same star', () => {
  component.currentRating = 3;
  let emittedRating: number | undefined;
  component.ratingChange.subscribe(r => emittedRating = r);

  component.onStarClick(3);

  expect(emittedRating).toBe(0); // Cleared
});

// photo.service.spec.ts
it('should update rating and refresh state', () => {
  const mockPhoto = { id: 1, rating: null } as Photo;
  service['photosSubject'].next([mockPhoto]);

  service.updateRating(1, 5).subscribe();

  expect(service['photosSubject'].value[0].rating).toBe(5);
});
```

**Test Execution:**
```bash
# Backend
./mvnw test

# Frontend
ng test

# Wszystkie passing ✅
```

**Commit:**
```
test(rating): add unit and integration tests

Backend:
- PhotoServiceTest: valid rating, user scoping, invalid rating
- PhotoControllerIntegrationTest: 204 success, 400 validation, 403 forbidden

Frontend:
- RatingComponent: star click, toggle behavior
- PhotoService: state update, error handling
```

**CHECKPOINT** → Rating feature complete z pełnymi testami

---

## Summary

### Metrics
- **Total chunks:** 6
- **Total time:** ~4h 20min
- **Complexity:** Medium (3-5 chunks prediction ✅, actual: 6)
- **Files changed:** 12
  - Backend: 4 (migration, controller, service, tests)
  - Frontend: 8 (component, service, filter, tests)

### What Went Well ✅
- **Checkpoints** - regularne checkpoints (po chunks 3, 5, 6)
- **Small chunks** - każdy chunk 30-50 min (testable, committable)
- **User scoping** - enforced od początku (backend validation)
- **Tests** - unit + integration (coverage >70%)
- **State management** - BehaviorSubject pattern czysto zaimplementowany

### Lessons Learned
- Chunk 3 był longest (50 min) - można było rozdzielić na "create component" + "integrate in PhotoCard"
- Filter integration (Chunk 5) był bardziej complex niż expected - dobrze że był oddzielny chunk
- Tests (Chunk 6) można było zacząć wcześniej (TDD approach)

### Acceptance Criteria Check
- ✅ User może kliknąć gwiazdki aby ustawić ocenę 1-5
- ✅ Rating jest zapisywany i persystuje po page reload
- ✅ Rating jest widoczny w galerii (PhotoCard)
- ✅ Rating jest widoczny w map popups
- ✅ User może zmienić ocenę
- ✅ User może wyczyścić ocenę
- ✅ User scoping enforced

**Feature complete!** 🎉

---

## Why This Is a GOOD Feature Breakdown

### ✅ Clear Structure
- Podzielony na phases (Core → Integration → Tests)
- Każdy chunk ma jasny cel
- Regularne checkpoints (co 3 chunks)

### ✅ Small Chunks
- Każdy chunk 30-50 min
- Testable natychmiast (curl/browser)
- Committable z sensownym message

### ✅ Complete Implementation
- Backend + Frontend
- Tests (unit + integration)
- Error handling (validation, user scoping)
- State management (BehaviorSubject)

### ✅ Realistic Estimates
- Predicted: 3-5 chunks (Medium complexity)
- Actual: 6 chunks
- Good estimate! (within range)

### ✅ Follows Best Practices
- Small chunks with checkpoints
- Conventional Commits format
- User scoping enforced
- Self-documenting code
- Test coverage >70%

---

## Related Examples

- `simple-feature-example.md` - przykład prostszej funkcji (photo description)
- `complex-feature-example.md` - przykład bardziej złożonej funkcji (batch upload)
- `feature-verification-example.md` - jak weryfikować pomysł przed implementacją
