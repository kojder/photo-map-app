# Ocena Złożoności Funkcji - Photo Map MVP

## Poziomy Złożoności

### Simple (Prosty) - 1-2 chunks (1-2h)

**Kryteria:**
- ❌ Brak zmian w bazie danych
- ❌ Brak nowych REST endpoints
- ✅ Modyfikacja istniejącego endpointa/komponentu
- ✅ Dodanie pola do istniejącej tabeli (optional field, nullable)
- ✅ Frontend-only lub Backend-only
- ✅ Brak nowych serwisów/repozytoriów

**Charakterystyka:**
- 1-2 pliki do edycji
- Zmiana w jednej warstwie (controller/service/component)
- Brak migracji bazy (lub trivial migration)
- Testy: 1-2 test cases

**Przykłady z Photo Map:**
- Dodać pole `description` do `Photo` entity (nullable)
- Dodać sortowanie po `fileSize` w gallery
- Zmienić rozmiar thumbnail z 150px na 200px
- Dodać licznik zdjęć w admin panel
- Zmienić domyślny zoom mapy

### Medium (Średni) - 3-5 chunks (3-6h)

**Kryteria:**
- ✅ 1-2 nowe REST endpoints
- ✅ Prosta migracja bazy (ADD COLUMN, CREATE INDEX)
- ✅ Frontend + Backend integration
- ✅ Nowy serwis lub repozytorium
- ⚠️ Zmiany w 3-6 plikach
- ⚠️ State management changes (BehaviorSubject)

**Charakterystyka:**
- Backend: 1-2 endpoints, DTO, service method, repository query
- Frontend: 1-2 komponenty, service method, integration
- Migracja: ADD COLUMN, CREATE INDEX (non-breaking)
- Testy: 3-5 test cases (unit + integration)

**Przykłady z Photo Map:**
- System ocen zdjęć (1-5 gwiazdek)
- Filtrowanie po dacie (date range picker)
- Eksport listy zdjęć do CSV
- Dodanie pola `camera model` z EXIF
- Search photos by file name

### Complex (Złożony) - 6+ chunks (6-12h)

**Kryteria:**
- ✅ 3+ nowe REST endpoints
- ✅ Złożona migracja bazy (nowa tabela, foreign keys, relacje)
- ✅ Asynchroniczne przetwarzanie
- ✅ Integration z zewnętrznym API/library
- ⚠️ Zmiany w 7+ plikach
- ⚠️ Nowe kluczowe serwisy
- ⚠️ Możliwe refactoring istniejącego kodu

**Charakterystyka:**
- Backend: 3+ endpoints, multiple DTOs, service layer refactoring
- Frontend: 2+ komponenty, complex state management, routing changes
- Migracja: CREATE TABLE, relacje, indexes, data migration
- Testy: 6+ test cases (unit + integration + E2E considerations)
- Możliwe performance concerns

**Przykłady z Photo Map:**
- Batch upload z asynchronicznym przetwarzaniem (Spring Integration)
- System komentarzy (nowa tabela `comments`, relacje, CRUD)
- Albums/collections (nowa tabela `albums`, many-to-many)
- Photo editing (crop, rotate) - wymaga image processing library
- Public photo sharing (permissions, public URLs, security)

## Decision Tree - Jak Ocenić Złożoność?

### Krok 1: Database Changes

**Pytanie:** Czy funkcja wymaga zmian w bazie?

- ❌ **Nie** → Simple (lub Medium jeśli complex business logic)
- ✅ **Tak** → Przejdź do Kroku 2

### Krok 2: Typ Zmiany w Bazie

**Pytanie:** Jaki typ zmiany w bazie?

- **ADD COLUMN (nullable)** → Simple
- **ADD COLUMN + INDEX** → Medium
- **CREATE TABLE + relations** → Complex

### Krok 3: API Endpoints

**Pytanie:** Ile nowych REST endpoints?

- **0** → Simple (jeśli modyfikacja istniejącego)
- **1-2** → Medium
- **3+** → Complex

### Krok 4: Frontend/Backend Integration

**Pytanie:** Czy wymaga zmian w obu warstwach?

- **Tylko frontend** → Simple/Medium
- **Tylko backend** → Simple/Medium
- **Frontend + Backend** → Medium/Complex (zależnie od liczby endpoints)

### Krok 5: Asynchronous Processing

**Pytanie:** Czy wymaga asynchronicznego przetwarzania?

- ❌ **Nie** → Simple/Medium (zależnie od Kroków 1-4)
- ✅ **Tak** → Complex (Spring Integration, error handling, state management)

### Krok 6: External Dependencies

**Pytanie:** Czy wymaga nowych bibliotek/API?

- ❌ **Nie** → Simple/Medium
- ✅ **Tak** → Complex (learning curve, integration testing, error handling)

## Tabela Quick Reference

| Feature | DB Changes | Endpoints | F+B | Async | Complexity |
|---------|------------|-----------|-----|-------|------------|
| Add description field | ADD COLUMN | 0 (modify PUT) | Yes | No | **Simple** |
| Rating system | ADD COLUMN | 1 (PUT) | Yes | No | **Medium** |
| Comments | CREATE TABLE | 3 (GET/POST/DELETE) | Yes | No | **Complex** |
| Batch upload async | No change | 1 (POST) | Yes | Yes | **Complex** |
| Sort by file size | No change | 0 (modify GET) | Yes | No | **Simple** |
| Date range filter | No change | 0 (modify GET) | Yes | No | **Medium** |
| Export to CSV | No change | 1 (GET) | Yes | No | **Medium** |
| Photo editing | No change | 2+ (POST) | Yes | No | **Complex** |

## Mikrus VPS Constraints

**Dodatkowe czynniki złożoności dla Mikrus VPS:**

- ✅ **NO background jobs** (Celery, Sidekiq) → wymusza synchronous processing
- ✅ **Limited CPU/RAM** → unikaj resource-intensive operations
- ✅ **Synchronous processing** → upload i przetwarzanie w jednym request (lub Spring Integration folder monitoring)

**Implikacje:**
- Funkcje wymagające background jobs → **automatycznie Complex** (wymaga Spring Integration workaround)
- Funkcje resource-intensive (image processing, ML) → **Complex lub Out of Scope**
- Funkcje z long-running requests → **Complex** (timeout considerations)

## Related Documentation

- `mvp-scope-boundaries.md` - czy funkcja w scope MVP
- `workflow-3x3.md` - jak rozbić funkcję na chunks
- `.ai/tech-stack.md` - tech constraints
