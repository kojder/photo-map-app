# Temporal & Spatial Filters Feature

**Status:** 📋 Planned (Optional Post-MVP)
**Estimated Time:** 5-7h
**Created:** 2025-10-26
**Dependencies:** MVP Core (Phases 1-4)

---

## 🎯 Feature Overview

### Description

Advanced filters allowing photo search by:
1. **Temporal Filter:** "Same month in different years" (e.g., July 2020, 2022, 2024)
2. **Spatial Filter:** "Same location in different years" (e.g., Szklarska Poręba, 10 km radius, years 2020, 2022)

### Use Case Examples

**Temporal Filter:**
> User opens gallery, clicks "Smart Filters" → "Same Month" → selects "July" + years [2020, 2022, 2024] → sees all photos from July in those years.

**Spatial Filter:**
> User opens map in Szklarska Poręba area, clicks "Find Similar Location" → radius 10 km → years [2 years ago, 4 years ago] → sees all photos from that area in selected years.

### User Stories

- **US-FILTER-001:** As a user I can select month and multiple years to see photos from that month in selected years
- **US-FILTER-002:** As a user I can select GPS location + radius + years to see photos from that area in selected years
- **US-FILTER-003:** As a user I can easily toggle years (checkboxes) without manual typing
- **US-FILTER-004:** As a user I can auto-fill GPS from current map center (spatial filter)
- **US-FILTER-005:** As a user I can combine temporal/spatial filters with other filters (rating, date range)

---

## 📋 Implementation Phases

### Phase 2.1: Backend - Temporal & Spatial Queries (2-3h)

**Status:** 📋 Planned

#### Database Changes

**No schema changes** - using existing columns:
- `photos.taken_at` (TIMESTAMP) - for temporal queries
- `photos.gps_latitude`, `photos.gps_longitude` (DECIMAL) - for spatial queries

#### REST API Endpoints

##### GET /api/photos/temporal-filter

**Description:** Filter photos by month and years

**Query Parameters:**
- `month` - Integer (1-12)
- `years` - Array of integers (e.g., `years=2020&years=2022&years=2024`)
- `page`, `size`, `sort` (standard pagination)

**Response:** `PageResponse<Photo>`

**SQL Logic:**
```sql
SELECT * FROM photos
WHERE EXTRACT(MONTH FROM taken_at) = ?
AND EXTRACT(YEAR FROM taken_at) IN (?, ?, ?)
AND user_id = ?
ORDER BY taken_at DESC
```

**Security:** Authenticated user (only own photos)

---

##### GET /api/photos/spatial-filter

**Description:** Filter photos by GPS location (radius) and years

**Query Parameters:**
- `latitude` - Decimal (latitude of center)
- `longitude` - Decimal (longitude of center)
- `radiusKm` - Integer (radius in kilometers, 1-100)
- `years` - Array of integers
- `page`, `size`, `sort` (standard pagination)

**Response:** `PageResponse<Photo>`

**SQL Logic - Haversine Formula:**
```sql
SELECT *,
  (6371 * acos(
    cos(radians(?)) * cos(radians(gps_latitude)) *
    cos(radians(gps_longitude) - radians(?)) +
    sin(radians(?)) * sin(radians(gps_latitude))
  )) AS distance_km
FROM photos
WHERE gps_latitude IS NOT NULL
AND gps_longitude IS NOT NULL
AND EXTRACT(YEAR FROM taken_at) IN (?, ?, ?)
AND user_id = ?
HAVING distance_km <= ?
ORDER BY distance_km ASC
```

**Security:** Authenticated user (only own photos)

---

#### Service Layer

**PhotoService - new methods:**

**Temporal Query:**
```java
public Page<Photo> findByMonthAndYears(
    final int month,
    final List<Integer> years,
    final Long userId,
    final Pageable pageable
) {
    // JPA Specification: EXTRACT(MONTH) AND YEAR IN (...)
    return photoRepository.findAll(
        PhotoSpecification.hasMonth(month)
            .and(PhotoSpecification.hasYearsIn(years))
            .and(PhotoSpecification.belongsToUser(userId)),
        pageable
    );
}
```

**Spatial Query:**
```java
public Page<Photo> findByLocationAndYears(
    final double latitude,
    final double longitude,
    final int radiusKm,
    final List<Integer> years,
    final Long userId,
    final Pageable pageable
) {
    // Native query with Haversine formula
    return photoRepository.findByLocationAndYears(
        latitude, longitude, radiusKm, years, userId, pageable
    );
}
```

---

#### Repository Layer

**PhotoRepository - new methods:**

```java
@Query(value = """
    SELECT p.*,
      (6371 * acos(
        cos(radians(:latitude)) * cos(radians(p.gps_latitude)) *
        cos(radians(p.gps_longitude) - radians(:longitude)) +
        sin(radians(:latitude)) * sin(radians(p.gps_latitude))
      )) AS distance_km
    FROM photos p
    WHERE p.gps_latitude IS NOT NULL
      AND p.gps_longitude IS NOT NULL
      AND EXTRACT(YEAR FROM p.taken_at) IN (:years)
      AND p.user_id = :userId
    HAVING distance_km <= :radiusKm
    ORDER BY distance_km ASC
    """,
    nativeQuery = true)
Page<Photo> findByLocationAndYears(
    @Param("latitude") double latitude,
    @Param("longitude") double longitude,
    @Param("radiusKm") int radiusKm,
    @Param("years") List<Integer> years,
    @Param("userId") Long userId,
    Pageable pageable
);
```

---

#### PhotoSpecification - new specifications

```java
public static Specification<Photo> hasMonth(final int month) {
    return (root, query, cb) ->
        cb.equal(cb.function("EXTRACT", Integer.class,
            cb.literal("MONTH"), root.get("takenAt")), month);
}

public static Specification<Photo> hasYearsIn(final List<Integer> years) {
    return (root, query, cb) -> {
        Expression<Integer> year = cb.function("EXTRACT", Integer.class,
            cb.literal("YEAR"), root.get("takenAt"));
        return year.in(years);
    };
}
```

---

#### Testing

- Unit tests: PhotoSpecification (hasMonth, hasYearsIn)
- Integration tests: PhotoRepository.findByLocationAndYears() with H2 database
- Unit tests: PhotoService (temporal + spatial methods)
- Integration tests: REST endpoints (with real queries)

---

### Phase 2.2: Frontend - Smart Filters UI (3-4h)

**Status:** 📋 Planned

#### New Components

##### SmartFiltersComponent

**Location:** `src/app/components/smart-filters/`

**Features:**
- Modal dialog or side panel (left/right slide-in)
- Tabs: "Same Month" | "Same Location"
- Clear filters button

**State:**
- `activeTab: signal<'temporal' | 'spatial'>`
- `selectedMonth: signal<number | null>` (1-12)
- `selectedYears: signal<Set<number>>` (multi-select)
- `centerLat: signal<number | null>`
- `centerLon: signal<number | null>`
- `radiusKm: signal<number>` (default: 10)

**Methods:**
- `onApplyTemporal()` - Call PhotoService.getTemporalFiltered()
- `onApplySpatial()` - Call PhotoService.getSpatialFiltered()
- `onClearFilters()` - Reset all filters
- `autoFillLocation()` - Get center from MapComponent

**Template:**

**Tab 1: Same Month, Different Years**
```html
<div class="temporal-filter">
  <label>Select Month:</label>
  <select [(ngModel)]="selectedMonth">
    <option value="1">January</option>
    <option value="2">February</option>
    <!-- ... all months ... -->
    <option value="12">December</option>
  </select>

  <label>Select Years:</label>
  <div class="years-grid grid grid-cols-3 gap-2">
    <label *ngFor="let year of availableYears()">
      <input type="checkbox" [checked]="selectedYears().has(year)"
             (change)="toggleYear(year)">
      {{ year }}
    </label>
  </div>

  <button (click)="onApplyTemporal()">Apply Filter</button>
</div>
```

**Tab 2: Same Location, Different Years**
```html
<div class="spatial-filter">
  <label>Center Location:</label>
  <div class="flex gap-2">
    <input type="number" [(ngModel)]="centerLat" placeholder="Latitude">
    <input type="number" [(ngModel)]="centerLon" placeholder="Longitude">
    <button (click)="autoFillLocation()">Use Map Center</button>
  </div>

  <label>Radius (km):</label>
  <input type="range" min="1" max="100" [(ngModel)]="radiusKm">
  <span>{{ radiusKm }} km</span>

  <label>Select Years:</label>
  <div class="years-grid grid grid-cols-3 gap-2">
    <!-- same as temporal -->
  </div>

  <button (click)="onApplySpatial()">Apply Filter</button>
</div>
```

**Test IDs:**
- `smart-filters-modal`
- `temporal-filter-month`
- `temporal-filter-years`
- `spatial-filter-lat`
- `spatial-filter-lon`
- `spatial-filter-radius`
- `smart-filters-apply`

---

#### Changes to Existing Components

##### GalleryComponent

**Changes:**
- Add "Smart Filters" button (next to Upload button)
- Open SmartFiltersComponent on click
- Handle filter application (reload photos with new filters)

**Template:**
```html
<button (click)="openSmartFilters()"
        data-testid="gallery-smart-filters-btn">
  Smart Filters
</button>
```

---

##### MapComponent

**Changes:**
- Add "Find Similar Location" button (floating, bottom-right)
- Open SmartFiltersComponent (spatial tab) with auto-filled center
- Handle filter application (reload markers with new filters)

**Methods:**
- `getMapCenter(): { lat: number, lon: number }` - Get current map center from Leaflet
- `openSpatialFilter()` - Open SmartFilters with spatial tab + auto-filled location

---

#### Services

##### PhotoService - Smart Filter Methods

**New methods:**
```typescript
getTemporalFiltered(
  month: number,
  years: number[],
  page: number = 0,
  size: number = 20
): Observable<PageResponse<Photo>> {
  const params = {
    month: month.toString(),
    years: years.join(','), // or multiple params
    page: page.toString(),
    size: size.toString()
  };
  return this.http.get<PageResponse<Photo>>(
    '/api/photos/temporal-filter',
    { params }
  );
}

getSpatialFiltered(
  latitude: number,
  longitude: number,
  radiusKm: number,
  years: number[],
  page: number = 0,
  size: number = 20
): Observable<PageResponse<Photo>> {
  const params = {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radiusKm: radiusKm.toString(),
    years: years.join(','),
    page: page.toString(),
    size: size.toString()
  };
  return this.http.get<PageResponse<Photo>>(
    '/api/photos/spatial-filter',
    { params }
  );
}
```

---

##### FilterService - Smart Filters State

**New state:**
```typescript
private smartFilters$ = new BehaviorSubject<SmartFilters>({
  type: null, // 'temporal' | 'spatial' | null
  month: null,
  years: [],
  latitude: null,
  longitude: null,
  radiusKm: 10
});

public currentSmartFilters$ = this.smartFilters$.asObservable();
```

**New methods:**
```typescript
applyTemporalFilter(month: number, years: number[]): void {
  this.smartFilters$.next({
    type: 'temporal',
    month,
    years,
    latitude: null,
    longitude: null,
    radiusKm: 10
  });
}

applySpatialFilter(
  latitude: number,
  longitude: number,
  radiusKm: number,
  years: number[]
): void {
  this.smartFilters$.next({
    type: 'spatial',
    month: null,
    years,
    latitude,
    longitude,
    radiusKm
  });
}

clearSmartFilters(): void {
  this.smartFilters$.next({
    type: null,
    month: null,
    years: [],
    latitude: null,
    longitude: null,
    radiusKm: 10
  });
}
```

---

#### UX Flow Examples

##### Temporal Filter Flow

1. User opens `/gallery`
2. Clicks "Smart Filters" button
3. SmartFiltersComponent modal opens (Tab: "Same Month")
4. User selects month: "July"
5. User checks years: 2020, 2022, 2024
6. Clicks "Apply Filter"
7. System calls `/api/photos/temporal-filter?month=7&years=2020,2022,2024`
8. Gallery reloads with filtered photos (all photos from July in selected years)
9. User can easily toggle years on/off (immediate re-filter)

##### Spatial Filter Flow

1. User opens `/map`
2. Navigates to Szklarska Poręba area
3. Clicks "Find Similar Location" button (floating, bottom-right)
4. SmartFiltersComponent opens (Tab: "Same Location")
5. GPS fields auto-fill from map center (lat: 50.8223, lon: 15.5175)
6. User adjusts radius slider: 10 km
7. User checks years: 2 years ago, 4 years ago (calculated: 2023, 2021)
8. Clicks "Apply Filter"
9. System calls `/api/photos/spatial-filter?latitude=50.8223&longitude=15.5175&radiusKm=10&years=2023,2021`
10. Map reloads with filtered markers (photos within 10 km in selected years)

---

#### Helper: Available Years Generation

**Logic:**
- Generate list of years: current year - 10 to current year
- Example: 2025 → [2015, 2016, ..., 2025]
- Display as checkboxes for easy multi-select

**Implementation:**
```typescript
availableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(i);
  }
  return years;
}
```

---

#### Testing

- Unit tests: SmartFiltersComponent (toggle years, apply filters)
- Unit tests: FilterService (smart filters state)
- Integration tests: PhotoService (temporal + spatial methods)
- E2E tests: Temporal filter flow (select month → years → apply → verify results)
- E2E tests: Spatial filter flow (map → auto-fill → radius → apply → verify markers)

---

## ✅ Acceptance Criteria

### Must Have

- ✅ Temporal filter: select month + multiple years → correct results
- ✅ Spatial filter: GPS + radius + years → photos within radius
- ✅ Auto-fill GPS from map center works
- ✅ Years multi-select (checkboxes) works smoothly
- ✅ Apply button triggers re-filter (gallery and map)
- ✅ Clear filters button resets to default state

### Performance

- ✅ Temporal query <500ms (1000 photos)
- ✅ Spatial query <1s (Haversine on 1000 photos)
- ✅ Indexes on taken_at, gps_latitude, gps_longitude optimize queries

### Usability

- ✅ Month dropdown is intuitive (January - December)
- ✅ Years checkboxes are easy to toggle (grid layout)
- ✅ Radius slider is smooth (1-100 km)
- ✅ Auto-fill button works with one click

---

## 📊 Time Estimate

**Phase 2.1 (Backend):** 2-3 hours
- REST endpoints: 30 min
- Service layer: 1h
- Repository (Haversine query): 1h
- Testing: 30 min

**Phase 2.2 (Frontend):** 3-4 hours
- SmartFiltersComponent: 2h
- Integration with Gallery/Map: 1h
- FilterService updates: 30 min
- Testing: 30 min

**Total:** 5-7 hours

---

## 📖 Related Documentation

- `.ai/prd.md` - MVP requirements
- `.ai/db-plan.md` - Current database schema
- `.ai/api-plan.md` - Current API specification
- `.ai/ui-plan.md` - Current UI architecture
- `PROGRESS_TRACKER.md` - Project status

---

## 💡 Implementation Notes

**Why Temporal First:**
- Simpler implementation (no Haversine formula)
- Zero database migrations needed
- Faster to implement and test
- Can be used immediately after implementation
- Useful for testing Public Sharing feature (filter → select → share)

**Spatial Filter Considerations:**
- Haversine formula calculates distance on sphere
- Radius accuracy: ±0.5% (good enough for MVP)
- Performance: Index on (gps_latitude, gps_longitude) helps
- Alternative: PostGIS extension (overkill for MVP)

---

**Feature Status:** 📋 Planned (Optional Post-MVP)
**Last Updated:** 2025-10-26
**Dependencies:** MVP Core (Phases 1-4)
**Recommended Order:** Implement this feature BEFORE Public Sharing (simpler, faster ROI)
