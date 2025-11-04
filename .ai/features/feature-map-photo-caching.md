# Feature: Photo Map Coordinate Caching

**Status:** Planned
**Created:** 2025-10-30
**Priority:** Medium
**Estimated Time:** ~2h

---

## 🎯 Feature Goal

Add in-memory cache to PhotoService with 60s TTL to eliminate unnecessary HTTP requests when changing filters on the map and improve UX with instant marker updates.

---

## 🔍 Problem

### Current Situation

**MapComponent:**
- ❌ Fetches all photos on every filter change (`GET /api/photos?size=10000&hasGps=true`)
- ❌ Fetches all thumbnails from scratch on each `loadPhotos()`
- ❌ Doesn't use `PhotoService.photos$` (uses local signal)
- ✅ Uses Leaflet + MarkerCluster (working OK)

**PhotoService:**
- ✅ BehaviorSubject pattern already implemented
- ✅ `refreshPhoto()` already filter-aware
- ❌ No HTTP request caching
- ❌ Each `getAllPhotos()` call = new API call

### Root Cause

No caching in PhotoService + MapComponent doesn't use `photos$` Observable.

### Impact

- Hundreds of unnecessary HTTP requests on each filter change
- Loading spinner for several seconds (fetching thumbnails)
- Poor UX, unnecessary server load
- Frontend sends `size=10000` with every request

### Example Scenario

1. User opens map → 1x `GET /api/photos` + 200x `GET /api/photos/{id}/thumbnail`
2. User changes dateFrom filter → again 1x `GET /api/photos` + 200x thumbnails
3. User changes minRating → again 1x `GET /api/photos` + 200x thumbnails
4. **Result:** 3x API call + 600x thumbnail requests (most are the same data!)

---

## 💡 Proposed Solution

### Caching Strategy

**1. In-memory Cache in PhotoService**

```typescript
interface CacheEntry {
  data: Photo[];
  timestamp: number;
}

class PhotoService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 60000; // 60 seconds

  private generateCacheKey(filters?: PhotoFilters): string {
    return JSON.stringify(filters || {});
  }

  getAllPhotos(filters?: PhotoFilters): Observable<PageResponse<Photo>> {
    const cacheKey = this.generateCacheKey(filters);
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      // Cache hit - return from cache
      this.photosSubject.next(cached);
      return of({ content: cached, page: {...} });
    }

    // Cache miss - fetch from API
    return this.http.get<PageResponse<Photo>>(...).pipe(
      tap(response => {
        this.setCacheData(cacheKey, response.content);
        this.photosSubject.next(response.content);
      })
    );
  }
}
```

**2. Cache Invalidation Strategy**

| Event | Action | Reason |
|-------|--------|--------|
| `uploadPhoto()` | `invalidateCache()` | New photo may have GPS → map must show it |
| `deletePhoto()` | `invalidateCache()` | Photo deleted → map cannot show it |
| `ratePhoto()` | NO invalidate | Rating doesn't affect GPS coords (only update BehaviorSubject) |
| `clearRating()` | NO invalidate | Same as above |
| TTL expired (60s) | Auto-clear | Automatic cache expiration |

**3. MapComponent Refactor**

- Subscribe to `photoService.photos$` instead of local signal
- In `loadThumbnails()`: skip if `thumbnailUrls.has(photo.id)`
- Remove `this.photos.set()` from `loadPhotos()` (already in PhotoService)

---

## 📝 Implementation Plan

### Step 1: Add Cache Layer to PhotoService

**File:** `frontend/src/app/services/photo.service.ts`

**Changes:**
1. Add interface `CacheEntry { data: Photo[], timestamp: number }`
2. Add private fields:
   - `cache = new Map<string, CacheEntry>()`
   - `CACHE_TTL = 60000` (60 seconds)
3. Add methods:
   - `generateCacheKey(filters?: PhotoFilters): string` - JSON.stringify(filters)
   - `getCachedData(cacheKey: string): Photo[] | null` - check TTL
   - `setCacheData(cacheKey: string, data: Photo[]): void`
   - `invalidateCache(): void` - cache.clear()
4. Modify `getAllPhotos()`:
   - Before HTTP call → check cache (getCachedData)
   - Cache hit + fresh → return from cache (of() + update BehaviorSubject)
   - Cache miss/expired → fetch from API + setCacheData

### Step 2: Cache Invalidation Logic

**File:** `frontend/src/app/services/photo.service.ts`

- In `uploadPhoto()` after success: `this.invalidateCache()`
- In `deletePhoto()` after success: `this.invalidateCache()`
- In `ratePhoto()` and `clearRating()`: **NO** invalidate (only refreshPhoto())

### Step 3: Refactor MapComponent → Use photos$

**File:** `frontend/src/app/components/map/map.component.ts`

- Add subscription `photoService.photos$` in `ngOnInit()`:
  ```typescript
  this.photoService.photos$.subscribe(photos => {
    this.photos.set(photos);
    this.updateMarkers();
  });
  ```
- In `loadPhotos()`:
  - Remove `this.photos.set(response.content)` (already in PhotoService)
  - Keep only `photoService.getAllPhotos(filters).subscribe()` call

### Step 4: Optimize Thumbnail Loading

**File:** `frontend/src/app/components/map/map.component.ts`

- In `loadThumbnails()`:
  - Add check before fetch: `if (this.thumbnailUrls.has(photo.id)) return;`
  - Fetch only if missing from cache

### Step 5: Manual Testing

**Test Scenarios:**

1. **Test 1: Cache works**
   - Open map → observe Network tab (all photos fetched)
   - Change filter (dateFrom) → observe Network tab (**zero new requests for /api/photos**)
   - Check if markers update

2. **Test 2: Cache invalidation after upload**
   - Add new photo with GPS
   - Return to map → new photo should appear (cache cleared)

3. **Test 3: Cache invalidation after delete**
   - Delete photo from map
   - Reload map → photo should be gone (cache cleared)

4. **Test 4: Thumbnails cache**
   - Open map → check Network tab (thumbnails fetched)
   - Change filter → check Network tab (zero thumbnail requests for already loaded photos)

5. **Test 5: TTL expiration**
   - Open map → wait 61 seconds → change filter
   - Observe Network tab → should be new HTTP request for /api/photos (cache expired)

---

## 📦 Files to Modify

**Files to edit:**
1. `/home/andrew/projects/photo-map-app/frontend/src/app/services/photo.service.ts` - cache layer + invalidation
2. `/home/andrew/projects/photo-map-app/frontend/src/app/components/map/map.component.ts` - refactor to photos$ + thumbnail optimization

---

## ✅ Expected Results

**After implementation:**
- ✅ Filter change on map = **zero HTTP requests** for /api/photos (if cache fresh)
- ✅ Thumbnails fetched only once (if photo already in cache)
- ✅ Loading spinner only on first map entry
- ✅ **Instant** marker updates when changing filters
- ✅ Reduced backend load

**Architecture Compliance:**
- ✅ BehaviorSubject pattern (per `.ai/tech-stack.md`)
- ✅ TTL 60s (per `.ai/tech-stack.md` → "Caching: in-memory (60s TTL) for photo lists")
- ✅ No backend API changes (frontend optimization only)
- ✅ Standalone components pattern (Angular 18)

---

## 📊 Success Metrics

| Metric | Before | After | Expected Improvement |
|---------|-------|----|--------------------|
| HTTP requests on filter change | ~201 (1 photos + 200 thumbnails) | ~0-10 (only new thumbnails) | **>95% reduction** |
| Marker update time | 2-5s (loading spinner) | <100ms (instant) | **>95% reduction** |
| Cache hit ratio | 0% (no cache) | >80% (typical usage) | **N/A** |
| Backend load | 100% | <20% | **80% reduction** |

---

## 🚨 Risks and Mitigation

| Risk | Probability | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Cache doesn't expire (memory leak) | Low | Medium | TTL 60s + invalidation after upload/delete |
| Stale data after upload (user doesn't see new photo) | Medium | High | ✅ `invalidateCache()` after upload |
| Race condition (multiple simultaneous filters) | Low | Low | BehaviorSubject pattern guarantees last value |
| Cache key collision (different filters → same key) | Very Low | High | JSON.stringify(filters) ensures unique keys |

---

## 🔮 Future Improvements (Post-MVP)

**Possible extensions (NOT in this feature):**

1. **Persistent cache (LocalStorage/IndexedDB)**
   - Cache survives page reload
   - Instant first load
   - Trade-off: Synchronization between tabs

2. **Dedicated endpoint for map:**
   - `GET /api/photos/map-markers` returns only `{ id, lat, lng }`
   - Payload reduction (~90% less data)
   - Backend optimization

3. **Thumbnail cache in PhotoService:**
   - Centralize thumbnail cache (instead of MapComponent)
   - Shared cache between GalleryComponent and MapComponent
   - ObjectURL lifecycle management

4. **Smart cache invalidation:**
   - Invalidate only specific cache key (instead of clear all)
   - Selective update (only new photos)
   - Background refresh (fetch new data in background, update cache without loading spinner)

---

## 📚 References

- **Tech Stack:** `.ai/tech-stack.md` → "Caching: in-memory (60s TTL) for photo lists"
- **API Spec:** `.ai/api-plan.md` → `GET /api/photos` endpoint
- **UI Architecture:** `.ai/ui-plan.md` → PhotoService BehaviorSubject pattern
- **Current implementation:**
  - `frontend/src/app/services/photo.service.ts` - PhotoService
  - `frontend/src/app/components/map/map.component.ts` - MapComponent

---

**Author:** Claude Code (Plan Agent)
**Analysis Date:** 2025-10-30
**Document Version:** 1.0
