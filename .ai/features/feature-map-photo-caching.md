# Feature: Cache'owanie Współrzędnych Zdjęć na Mapie

**Status:** Planowane
**Data utworzenia:** 2025-10-30
**Priorytet:** Średni
**Szacowany czas:** ~2h

---

## 🎯 Cel Feature'u

Dodać in-memory cache w PhotoService z TTL 60s, aby wyeliminować niepotrzebne HTTP requesty przy zmianie filtrów na mapie i poprawić UX poprzez instant aktualizację markerów.

---

## 🔍 Problem

### Obecna Sytuacja

**MapComponent:**
- ❌ Pobiera wszystkie photos przy każdej zmianie filtra (`GET /api/photos?size=10000&hasGps=true`)
- ❌ Pobiera wszystkie thumbnails od zera przy każdym `loadPhotos()`
- ❌ Nie korzysta z `PhotoService.photos$` (używa lokalny signal)
- ✅ Używa Leaflet + MarkerCluster (działają OK)

**PhotoService:**
- ✅ BehaviorSubject pattern już zaimplementowany
- ✅ `refreshPhoto()` już świadomy filtrów
- ❌ Brak cache'owania HTTP requestów
- ❌ Każde wywołanie `getAllPhotos()` = nowy API call

### Root Cause

Brak cache'owania w PhotoService + MapComponent nie używa `photos$` Observable.

### Impact

- Setki niepotrzebnych HTTP requestów przy każdej zmianie filtra
- Loading spinner na kilka sekund (pobieranie thumbnails)
- Złe UX, niepotrzebne obciążenie serwera
- Frontend wysyła `size=10000` przy każdym request

### Przykładowy Scenariusz

1. Użytkownik otwiera mapę → 1x `GET /api/photos` + 200x `GET /api/photos/{id}/thumbnail`
2. Użytkownik zmienia filtr dateFrom → ponownie 1x `GET /api/photos` + 200x thumbnails
3. Użytkownik zmienia minRating → ponownie 1x `GET /api/photos` + 200x thumbnails
4. **Rezultat:** 3x API call + 600x thumbnail requests (większość to te same dane!)

---

## 💡 Proponowane Rozwiązanie

### Strategia Cache'owania

**1. In-memory Cache w PhotoService**

```typescript
interface CacheEntry {
  data: Photo[];
  timestamp: number;
}

class PhotoService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 60000; // 60 sekund

  private generateCacheKey(filters?: PhotoFilters): string {
    return JSON.stringify(filters || {});
  }

  getAllPhotos(filters?: PhotoFilters): Observable<PageResponse<Photo>> {
    const cacheKey = this.generateCacheKey(filters);
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      // Cache hit - zwróć z cache
      this.photosSubject.next(cached);
      return of({ content: cached, page: {...} });
    }

    // Cache miss - fetch z API
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
| `uploadPhoto()` | `invalidateCache()` | Nowe zdjęcie może mieć GPS → mapa musi pokazać |
| `deletePhoto()` | `invalidateCache()` | Zdjęcie usunięte → mapa nie może pokazywać |
| `ratePhoto()` | NIE invalidate | Rating nie wpływa na GPS coords (tylko update BehaviorSubject) |
| `clearRating()` | NIE invalidate | j.w. |
| TTL expired (60s) | Auto-clear | Automatyczne wygaśnięcie cache |

**3. MapComponent Refactor**

- Subskrybuj `photoService.photos$` zamiast lokalnego signal
- W `loadThumbnails()`: skip jeśli `thumbnailUrls.has(photo.id)`
- Usuń `this.photos.set()` z `loadPhotos()` (już jest w PhotoService)

---

## 📝 Plan Implementacji

### Krok 1: Dodaj Cache Layer do PhotoService

**Plik:** `frontend/src/app/services/photo.service.ts`

**Zmiany:**
1. Dodaj interface `CacheEntry { data: Photo[], timestamp: number }`
2. Dodaj pola prywatne:
   - `cache = new Map<string, CacheEntry>()`
   - `CACHE_TTL = 60000` (60 sekund)
3. Dodaj metody:
   - `generateCacheKey(filters?: PhotoFilters): string` - JSON.stringify(filters)
   - `getCachedData(cacheKey: string): Photo[] | null` - sprawdź TTL
   - `setCacheData(cacheKey: string, data: Photo[]): void`
   - `invalidateCache(): void` - cache.clear()
4. Zmodyfikuj `getAllPhotos()`:
   - Przed HTTP call → sprawdź cache (getCachedData)
   - Cache hit + fresh → zwróć z cache (of() + update BehaviorSubject)
   - Cache miss/expired → fetch z API + setCacheData

### Krok 2: Cache Invalidation Logic

**Plik:** `frontend/src/app/services/photo.service.ts`

- W `uploadPhoto()` po sukcesie: `this.invalidateCache()`
- W `deletePhoto()` po sukcesie: `this.invalidateCache()`
- W `ratePhoto()` i `clearRating()`: **NIE** invalidate (tylko refreshPhoto())

### Krok 3: Refactor MapComponent → Użyj photos$

**Plik:** `frontend/src/app/components/map/map.component.ts`

- Dodaj subskrypcję `photoService.photos$` w `ngOnInit()`:
  ```typescript
  this.photoService.photos$.subscribe(photos => {
    this.photos.set(photos);
    this.updateMarkers();
  });
  ```
- W `loadPhotos()`:
  - Usuń `this.photos.set(response.content)` (już w PhotoService)
  - Zostaw tylko wywołanie `photoService.getAllPhotos(filters).subscribe()`

### Krok 4: Optymalizuj Thumbnail Loading

**Plik:** `frontend/src/app/components/map/map.component.ts`

- W `loadThumbnails()`:
  - Dodaj check przed fetch: `if (this.thumbnailUrls.has(photo.id)) return;`
  - Fetch tylko jeśli brak w cache

### Krok 5: Manual Testing

**Scenariusze testowe:**

1. **Test 1: Cache działa**
   - Otwórz mapę → obserwuj Network tab (wszystkie photos pobrane)
   - Zmień filtr (dateFrom) → obserwuj Network tab (**zero nowych requestów dla /api/photos**)
   - Sprawdź czy markery się aktualizują

2. **Test 2: Cache invalidation po upload**
   - Dodaj nowe zdjęcie z GPS
   - Wróć do mapy → nowe zdjęcie powinno się pojawić (cache cleared)

3. **Test 3: Cache invalidation po delete**
   - Usuń zdjęcie z mapy
   - Reload mapy → zdjęcie powinno zniknąć (cache cleared)

4. **Test 4: Thumbnails cache**
   - Otwórz mapę → sprawdź Network tab (thumbnails pobrane)
   - Zmień filtr → sprawdź Network tab (zero thumbnail requests dla już załadowanych zdjęć)

5. **Test 5: TTL expiration**
   - Otwórz mapę → poczekaj 61 sekund → zmień filtr
   - Obserwuj Network tab → powinien być nowy HTTP request dla /api/photos (cache expired)

---

## 📦 Pliki do Modyfikacji

**Pliki które będą edytowane:**
1. `/home/andrew/projects/photo-map-app/frontend/src/app/services/photo.service.ts` - cache layer + invalidation
2. `/home/andrew/projects/photo-map-app/frontend/src/app/components/map/map.component.ts` - refactor do photos$ + thumbnail optimization

---

## ✅ Oczekiwane Rezultaty

**Po implementacji:**
- ✅ Zmiana filtra na mapie = **zero HTTP requestów** dla /api/photos (jeśli cache fresh)
- ✅ Thumbnails pobierane tylko raz (jeśli photo już w cache)
- ✅ Loading spinner tylko przy pierwszym wejściu na mapę
- ✅ **Instant** aktualizacja markerów przy zmianie filtrów
- ✅ Mniejsze obciążenie backendu

**Zgodność z architekturą:**
- ✅ BehaviorSubject pattern (zgodnie z `.ai/tech-stack.md`)
- ✅ TTL 60s (zgodnie z `.ai/tech-stack.md` → "Caching: in-memory (60s TTL) for photo lists")
- ✅ Brak zmian w backend API (tylko frontend optimization)
- ✅ Standalone components pattern (Angular 18)

---

## 📊 Metryki Sukcesu

| Metryka | Przed | Po | Oczekiwana Poprawa |
|---------|-------|----|--------------------|
| HTTP requests przy zmianie filtra | ~201 (1 photos + 200 thumbnails) | ~0-10 (tylko nowe thumbnails) | **>95% redukcja** |
| Czas aktualizacji markerów | 2-5s (loading spinner) | <100ms (instant) | **>95% redukcja** |
| Cache hit ratio | 0% (brak cache) | >80% (przy typowym użyciu) | **N/A** |
| Backend load | 100% | <20% | **80% redukcja** |

---

## 🚨 Ryzyka i Mitigation

| Ryzyko | Prawdopodobieństwo | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Cache nie wygasa (memory leak) | Niskie | Średni | TTL 60s + invalidation po upload/delete |
| Stale dane po upload (user nie widzi nowego zdjęcia) | Średnie | Wysoki | ✅ `invalidateCache()` po upload |
| Race condition (multiple simultaneous filters) | Niskie | Niski | BehaviorSubject pattern gwarantuje ostatnią wartość |
| Cache key collision (różne filtry → ten sam key) | Bardzo niskie | Wysoki | JSON.stringify(filters) zapewnia unique keys |

---

## 🔮 Przyszłe Usprawnienia (Post-MVP)

**Możliwe rozszerzenia (NIE w tym feature):**

1. **Persistent cache (LocalStorage/IndexedDB)**
   - Cache przetrwa reload strony
   - Instant first load
   - Trade-off: Synchronizacja między tabs

2. **Dedykowany endpoint dla mapy:**
   - `GET /api/photos/map-markers` zwraca tylko `{ id, lat, lng }`
   - Redukcja payload (~90% mniej danych)
   - Backend optimization

3. **Thumbnail cache w PhotoService:**
   - Centralizacja thumbnail cache (zamiast w MapComponent)
   - Shared cache między GalleryComponent i MapComponent
   - ObjectURL lifecycle management

4. **Smart cache invalidation:**
   - Invalidate tylko dla konkretnego cache key (zamiast clear all)
   - Selective update (tylko nowe photos)
   - Background refresh (fetch nowe dane w tle, update cache bez loading spinner)

---

## 📚 Referencje

- **Tech Stack:** `.ai/tech-stack.md` → "Caching: in-memory (60s TTL) for photo lists"
- **API Spec:** `.ai/api-plan.md` → `GET /api/photos` endpoint
- **UI Architecture:** `.ai/ui-plan.md` → PhotoService BehaviorSubject pattern
- **Obecna implementacja:**
  - `frontend/src/app/services/photo.service.ts` - PhotoService
  - `frontend/src/app/components/map/map.component.ts` - MapComponent

---

**Autor:** Claude Code (Plan Agent)
**Data analizy:** 2025-10-30
**Wersja dokumentu:** 1.0
