# Product Requirements Document - Photo Map MVP

**Version:** 4.0 (Requirements Only)
**Date:** 2025-10-19
**Status:** 📋 Ready for Implementation
**Project Type:** MVP (Minimum Viable Product)

> **For business context:** See `.decisions/prd-context.md`

---

## 1. Executive Summary

Photo Map MVP to full-stack aplikacja (Angular 18 + Spring Boot 3 + PostgreSQL) do zarządzania zdjęciami z geolokalizacją.

### Core Capabilities

1. **Upload i Przetwarzanie** - Upload zdjęć z automatyczną ekstrakcją EXIF i generowaniem miniatur
2. **Wizualizacja** - Galeria siatki i mapa (Leaflet.js) z markerami GPS
3. **Interakcja** - Ocena zdjęć (1-10) i zaawansowane filtrowanie
4. **Bezpieczeństwo** - Autentykacja JWT, izolacja danych użytkowników
5. **Administracja** - Panel admina do zarządzania użytkownikami

---

## 2. Core Features

### 2.1. Autentykacja Użytkowników

**Wymagania:**
- Rejestracja (email + password)
- Login z JWT token
- Hasła hashowane (BCrypt)
- Izolacja danych - użytkownik widzi tylko swoje zdjęcia
- Role: USER (domyślna), ADMIN

**User Stories:**
- **US-AUTH-001:** Jako użytkownik mogę się zarejestrować aby mieć konto
- **US-AUTH-002:** Jako użytkownik mogę się zalogować aby uzyskać dostęp
- **US-AUTH-003:** Jako użytkownik widzę tylko swoje zdjęcia

### 2.2. Upload Zdjęć

**Wymagania:**
- Upload pojedynczych plików (JPEG, PNG)
- Automatyczna ekstrakcja EXIF (GPS, data, rozmiar)
- Automatyczne generowanie miniatur (400x300px)
- Walidacja formatu i rozmiaru (max 10MB)
- Przechowywanie na serwerze w strukturze folderów

> **Note:** HEIC/HEIF support excluded from MVP scope (see tech-stack.md for rationale)

**User Stories:**
- **US-UPLOAD-001:** Jako użytkownik mogę uploadować zdjęcia (JPEG, PNG)
- **US-UPLOAD-002:** System automatycznie ekstraktuje dane GPS i datę
- **US-UPLOAD-003:** System generuje miniatury dla wydajności

### 2.3. Galeria Zdjęć

**Wymagania:**
- Responsywna siatka zdjęć (1-5 kolumn, mobile-first)
- Lazy loading dla wydajności
- Wyświetlanie: miniatura, nazwa, rozmiar, ocena, data
- Sortowanie: data, nazwa, ocena
- Paginacja (20 zdjęć na stronę)

**User Stories:**
- **US-GAL-001:** Jako użytkownik mogę przeglądać galerie w siatce
- **US-GAL-002:** Jako użytkownik widzę miniatury dla szybkiego ładowania
- **US-GAL-003:** Jako użytkownik mogę sortować zdjęcia

### 2.4. Mapa Zdjęć

**Wymagania:**
- Interaktywna mapa (Leaflet.js + OpenStreetMap)
- Markery GPS dla zdjęć z danymi lokalizacji
- Clustering markerów dla skupisk zdjęć
- Popupy z miniaturą, nazwą, datą, oceną
- Automatyczne dopasowanie widoku (fitBounds)
- Statystyki: "X of Y photos have GPS"

**User Stories:**
- **US-MAP-001:** Jako użytkownik mogę zobaczyć zdjęcia na mapie
- **US-MAP-002:** Jako użytkownik widzę clustering dla wielu zdjęć w jednym miejscu
- **US-MAP-003:** Jako użytkownik klikam marker aby zobaczyć szczegóły

### 2.5. System Ocen

**Wymagania:**
- Ocena 1-10 (liczby całkowite)
- Inline rating w galerii
- Rating w popup'ach mapy
- Edycja i usuwanie ocen
- Sortowanie po ocenie

**User Stories:**
- **US-RAT-001:** Jako użytkownik mogę ocenić zdjęcie 1-10
- **US-RAT-002:** Jako użytkownik mogę zmienić ocenę
- **US-RAT-003:** Jako użytkownik widzę oceny w galerii i na mapie

**Business Rules:**
- Użytkownik NIE może ocenić własnego zdjęcia
- Jeden użytkownik może wystawić tylko jedną ocenę na zdjęcie (może ją edytować)
- Ocena wyświetlana to średnia ze wszystkich ocen użytkowników

### 2.6. Filtrowanie

**Wymagania:**
- **Rating Filter:** min-max ocena (np. 8-10 dla ulubionych)
- **Date Filter:** zakres dat z precyzją do dnia
- **Combined Filters:** rating AND date razem
- Real-time update listy zdjęć
- Clear filter option
- Licznik przefiltrowanych zdjęć

**User Stories:**
- **US-FIL-001:** Jako użytkownik mogę filtrować po ocenie
- **US-FIL-002:** Jako użytkownik mogę filtrować po dacie
- **US-FIL-003:** Jako użytkownik mogę używać wielu filtrów jednocześnie

### 2.7. Panel Administracyjny

**Wymagania:**
- Lista wszystkich użytkowników (widoczna tylko dla ADMIN)
- Informacje: ID, email, rola, data rejestracji, liczba zdjęć
- Możliwość zmiany roli użytkownika (USER ↔ ADMIN)
- Endpoint: `GET /api/admin/users`, `PUT /api/admin/users/{id}/role`

**User Stories:**
- **US-ADMIN-001:** Jako admin mogę zobaczyć listę użytkowników
- **US-ADMIN-002:** Jako admin mogę zmienić rolę użytkownika

---

## 3. Non-Functional Requirements

### 3.1. Responsywność (RWD)

**Breakpoints:**
- Mobile (< 640px): 1 kolumna galerii
- Tablet (640-1024px): 2-3 kolumny
- Desktop (> 1024px): 4-5 kolumn

**Mobile-First:** Touch-friendly controls, full-screen map

### 3.2. Wydajność

- Initial load < 3 sekundy
- Lazy loading obrazów
- Miniatury zamiast full-size w galerii
- Paginacja dla dużych kolekcji
- Debounce dla filtrów

### 3.3. Bezpieczeństwo

- JWT authentication
- Hasła hashowane (BCrypt)
- Izolacja danych między użytkownikami
- Walidacja inputów (frontend + backend)
- CORS configuration

### 3.4. Testowanie

- Unit testy dla serwisów (coverage > 50%)
- Integration testy dla API endpoints
- E2E testy dla critical flows (opcjonalne)
- **Test IDs:** Wszystkie interactive elements mają `data-testid` attributes
- **Konwencja naming:** kebab-case, format `component-element` lub `component-element-action`
  - Przykłady: `gallery-photo-card`, `upload-photo-btn`, `map-marker-popup`, `login-email-input`, `photo-card-rate-btn`, `filter-clear-btn`

### 3.5. Browser Support

- Chrome/Edge (latest 2)
- Firefox (latest 2)
- Safari (latest 2)
- Mobile browsers (iOS Safari, Chrome Android)

---

## 4. Success Criteria

MVP jest sukcesem jeśli:

✅ **Funkcjonalne:**
1. Użytkownicy mogą się zarejestrować i zalogować
2. Użytkownicy mogą uploadować zdjęcia (JPEG, PNG, HEIC)
3. System automatycznie ekstraktuje EXIF i generuje miniatury
4. Galeria wyświetla zdjęcia w responsywnej siatce
5. Mapa wyświetla zdjęcia z GPS i clustering działa
6. Użytkownicy mogą oceniać zdjęcia i filtrować po ocenie/dacie
7. Admin może zarządzać użytkownikami
8. Layout jest zoptymalizowany dla mobile i desktop

✅ **Techniczne:**
1. Angular 18 standalone + Spring Boot 3 + PostgreSQL działają razem
2. JWT authentication działa poprawnie
3. Leaflet.js integracja jest płynna
4. RxJS state management jest jasny i maintainable
5. Testy backend > 50% coverage
6. Brak błędów w konsoli
7. Performance targets spełnione

✅ **UX:**
1. Użytkownicy wykonują core tasks intuicyjnie
2. Interface jest czysty i przejrzysty
3. Mobile experience jest przyjazny dla dotyku
4. Brak major usability issues

---

## 5. Out of Scope (Not in MVP)

❌ **Advanced Features:**
- Edycja zdjęć (crop, filters, rotation)
- Batch operations (bulk delete, move)
- Photo sharing (public links, social media)
- Comments lub annotations
- Face recognition lub tagging
- Albums/collections
- Export data (ZIP download)

❌ **Performance Features:**
- Service Workers lub PWA
- Offline mode
- CDN integration
- Image optimization pipeline (progressive JPEG, WebP)

❌ **Social Features:**
- Follow other users
- Like/comment on photos
- Activity feed

---

## 6. Technical Architecture (High-Level)

### Frontend (Angular 18)
```
src/app/
├── auth/           # Login, Register components
├── gallery/        # Gallery view, Photo card component
├── map/            # Map view, Leaflet integration
├── admin/          # Admin panel (users list)
├── services/       # PhotoService, AuthService, FilterService
└── models/         # Photo, User interfaces
```

### Backend (Spring Boot 3)
```
src/main/java/.../
├── controller/     # REST endpoints (@RestController)
├── service/        # Business logic
├── repository/     # JPA repositories
├── entity/         # JPA entities (User, Photo)
├── dto/            # Data Transfer Objects
├── security/       # JWT config, UserDetailsService
└── config/         # CORS, File upload config
```

### Database (PostgreSQL)
```
Tables:
- users (id, email, password, role, created_at)
- photos (id, user_id, file_name, file_path, file_size, latitude, longitude, date_taken, rating, uploaded_at)
```

---

**Document Purpose:** Technical requirements for Claude Code implementation
**Related:** `.decisions/prd-context.md` (business context, future vision)
**Document Status:** ✅ Ready for Implementation
**Last Updated:** 2025-10-19
