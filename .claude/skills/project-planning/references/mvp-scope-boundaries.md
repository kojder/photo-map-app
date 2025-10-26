# Granice Scope MVP - Photo Map

## Co JEST w Scope MVP

### Core Features
1. **Autentykacja** - JWT-based login/registration
2. **Photo Management** - Upload z EXIF, thumbnails, CRUD
3. **Gallery View** - Responsive grid, rating, filtering
4. **Map View** - Leaflet.js, GPS markers, clustering
5. **Admin Panel** - User management (ADMIN role)

### Funkcjonalności Szczegółowe

**Upload i Przetwarzanie:**
- Upload pojedynczych plików (JPEG, PNG) przez interfejs web
- Batch upload - możliwość wrzucenia wielu zdjęć do folderu `input/` (scp/ftp)
- Asynchroniczne przetwarzanie (upload i przetwarzanie oddzielone)
- Automatyczna ekstrakcja EXIF (GPS, data, rozmiar)
- Automatyczne generowanie miniatur (3 rozmiary: 150px, 400px, 800px)
- Walidacja formatu i rozmiaru (max 10MB)
- Error handling - błędne zdjęcia w `failed/` + error log

**Wizualizacja:**
- Responsywna siatka zdjęć (1-5 kolumn, mobile-first)
- Lazy loading dla wydajności
- Interaktywna mapa (Leaflet.js + OpenStreetMap)
- Markery GPS z clustering
- Popupy z miniaturą, nazwą, datą, oceną

**Interakcja:**
- System ocen 1-5 gwiazdek
- Filtrowanie po ocenie (min-max)
- Filtrowanie po dacie (zakres dat)
- Combined filters (rating AND date)
- Sortowanie (data, nazwa, ocena)

**Administracja:**
- Lista użytkowników (widoczna tylko dla ADMIN)
- Możliwość zmiany roli użytkownika (USER ↔ ADMIN)

## Co NIE JEST w Scope MVP

### ❌ Advanced Features
- Edycja zdjęć (crop, filters, rotation)
- Batch operations (bulk delete, move)
- Photo sharing (public links, social media)
- Comments lub annotations
- Face recognition lub tagging
- Albums/collections
- Export data (ZIP download)
- HEIC/HEIF support (tylko JPEG, PNG w MVP)

### ❌ Performance Features
- Service Workers lub PWA
- Offline mode
- CDN integration
- Image optimization pipeline (progressive JPEG, WebP)
- Background job queues (Celery, Sidekiq)
- Parallel processing

### ❌ Social Features
- Follow other users
- Like/comment on photos
- Activity feed
- Sharing photos between users

## Zasady Weryfikacji Pomysłu

### Czy pomysł pasuje do MVP?

**Pytania kontrolne:**
1. Czy funkcja jest wymieniona w Core Features powyżej?
2. Czy funkcja jest konieczna do podstawowego działania aplikacji?
3. Czy funkcja jest prosta i szybka do zaimplementowania?
4. Czy funkcja nie wymaga zaawansowanych narzędzi (background jobs, ML, CDN)?

**Decyzja:**
- ✅ **TAK (4/4)** → Implementuj
- ⚠️ **CZĘŚCIOWO (2-3/4)** → Uproszczona wersja możliwa (consulta z użytkownikiem)
- ❌ **NIE (0-1/4)** → Odrzuć (out of scope MVP)

## Przykłady Decyzji

### ✅ W Scope MVP
- "Dodaj pole description do zdjęcia" → Simple, CRUD extension
- "Wyświetl liczbę zdjęć użytkownika w admin" → Simple query
- "Dodaj sortowanie po file size" → Simple sorting option

### ⚠️ Granicznie (wymaga uproszczenia)
- "Dodaj eksport zdjęć do ZIP" → Możliwe synchroniczne (small batch), ale bez async processing
- "Dodaj preview zdjęcia przed uploadem" → Możliwe client-side, ale nie server-side processing

### ❌ Poza Scope MVP
- "Dodaj komentarze do zdjęć" → Social feature (out of scope)
- "Dodaj ML-powered auto-tagging" → Advanced feature (out of scope)
- "Dodaj konwersję HEIC → JPEG" → Format conversion (explicit out of scope)
- "Dodaj offline mode z Service Workers" → Performance feature (out of scope)

## Related Documentation

- `.ai/prd.md` - pełna specyfikacja MVP requirements
- `.ai/tech-stack.md` - tech constraints (Mikrus VPS limitations)
- `PROGRESS_TRACKER.md` - current implementation status
