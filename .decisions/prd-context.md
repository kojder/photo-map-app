# PRD Context - Photo Map MVP

**Version:** 1.0
**Date:** 2025-10-19
**Purpose:** Business rationale and problem context

---

## Overview

Ten dokument wyjaśnia **DLACZEGO** budujemy Photo Map MVP. Jest to **business context dla ludzi** i **optional reference dla Claude Code** (gdy potrzebuje zrozumieć szerszy kontekst produktu).

**Dla requirements specs:** Zobacz `.ai/prd.md`

---

## 1. Problem Statement

### Użytkownicy potrzebują:

1. **Prostego sposobu na organizację zbioru zdjęć z podróży**
   - Obecnie: zdjęcia rozrzucone w różnych folderach
   - Brak struktury i łatwego dostępu
   - Trudność w znalezieniu konkretnego zdjęcia

2. **Wizualizacji zdjęć na mapie według lokalizacji GPS**
   - Standardowe galerie nie pokazują kontekstu geograficznego
   - Trudno zobaczyć "gdzie to było?"
   - Brak możliwości odkrywania zdjęć według lokalizacji

3. **Oceny i filtrowania ulubionych zdjęć**
   - Nie każde zdjęcie jest równie wartościowe
   - Brak sposobu na oznaczanie najlepszych zdjęć
   - Trudność w szybkim dostępie do ulubionych

4. **Bezpiecznego przechowywania zdjęć w chmurze**
   - Ryzyko utraty danych na lokalnym dysku
   - Brak backup
   - Chęć dostępu z różnych urządzeń

5. **Dostępu z dowolnego urządzenia (RWD)**
   - Mobilne przeglądanie zdjęć
   - Desktop dla większego ekranu
   - Tablet dla komfortowego przeglądania

### Obecne problemy:

❌ **Brak kontekstu geograficznego** - standardowe galerie (Google Photos, Apple Photos) pokazują tylko thumbnails bez mapy

❌ **Trudność w znalezieniu zdjęć** - brak filtrowania według:
- Konkretnej lokalizacji ("Kraków", "Zakopane")
- Daty ("wakacje 2024")
- Oceny ("tylko najlepsze")

❌ **Brak możliwości oznaczania ulubionych** - większość galerii ma tylko "ulubione" (TAK/NIE), bez gradacji (1-10)

❌ **Ograniczone możliwości filtrowania** - brak kombinacji filtrów (np. "zdjęcia z Krakowa, 5★+, sierpień 2024")

❌ **Vendor lock-in** - Google Photos, iCloud wiążą z ekosystemem

### Target User Personas:

**1. Travel Enthusiast (główny target)**
- Wiek: 25-45
- Podróżuje 2-3 razy rocznie
- Robi 500+ zdjęć z każdej podróży
- Chce łatwo przypomnieć sobie "gdzie to było"
- Use case: "Pokaż mi wszystkie zdjęcia z Krakowa"

**2. Photography Hobbyist**
- Wiek: 30-50
- Ma 5000+ zdjęć z różnych miejsc
- Chce oceniać swoje najlepsze zdjęcia
- Use case: "Tylko zdjęcia 8★+ na mapie"

**3. Family Organizer**
- Wiek: 35-55
- Organizuje zdjęcia rodzinne
- Chce łatwo znaleźć zdjęcia z konkretnych wydarzeń
- Use case: "Zdjęcia z wakacji nad morzem, lipiec 2024"

---

## 2. Executive Summary (Extended)

### Wizja Produktu

Photo Map MVP to **self-hosted, full-stack aplikacja** do zarządzania prywatną kolekcją zdjęć z geolokalizacją. Użytkownicy mogą:

1. **Uploadować zdjęcia** - system automatycznie ekstraktuje GPS i datę z EXIF
2. **Przeglądać w galerii** - responsywna siatka z sortowaniem i filtrowaniem
3. **Wizualizować na mapie** - interaktywna mapa (Leaflet.js) z markerami
4. **Oceniać zdjęcia** - skala 1-10 dla ulubionych
5. **Zarządzać użytkownikami** - panel admina (multi-user support)

### Kluczowe Differentiatory

🎯 **Mapa jako first-class citizen** - nie dodatek, ale główny sposób nawigacji
🎯 **Oceny 1-10** - nie tylko "ulubione", ale gradacja jakości
🎯 **Self-hosted** - pełna kontrola nad danymi, no vendor lock-in
🎯 **Simple MVP** - focus na core features, no bloat

### Business Goals

1. **Validate market demand** - czy users potrzebują map-based photo gallery?
2. **Prove technical feasibility** - czy Angular + Spring Boot + PostgreSQL działa dobrze?
3. **Build foundation** - architektura skalowalna na przyszłe features
4. **Deploy on budget** - Mikrus VPS (~20 PLN/month), no cloud costs

---

## 3. Success Criteria (MVP Validation)

> **Kontekst:** Prosta aplikacja na Mikrus VPS do sprawdzenia podstawowych funkcji. Brak zaawansowanego skalowania.

### Functional Validation

MVP jest sukcesem jeśli **podstawowe funkcje działają**:

✅ **Core Features Work:**
- Użytkownicy mogą się zarejestrować i zalogować
- System uploaduje zdjęcia i ekstraktuje EXIF (GPS, data)
- Galeria wyświetla zdjęcia w responsywnej siatce
- Mapa pokazuje zdjęcia z GPS na Leaflet.js
- System ocen (1-10) i filtrowanie działają
- Admin może zarządzać użytkownikami

✅ **User Experience:**
- Interface jest intuicyjny i czysty
- Mobile i desktop layouts działają poprawnie
- Brak major usability issues

### Technical Validation

✅ **Stack Integration:**
- Angular 18 + Spring Boot 3 + PostgreSQL współpracują
- JWT authentication jest bezpieczny
- EXIF extraction i thumbnails działają poprawnie
- Leaflet.js integracja jest płynna

✅ **Basic Performance (Mikrus VPS limits):**
- Initial load < 3s (na wolniejszym hostingu)
- Upload działa dla standardowych zdjęć (do 10MB)
- Mapa ładuje się bez błędów
- Aplikacja działa dla 2-5 użytkowników jednocześnie

✅ **Code Quality:**
- Testy backend > 50% coverage
- Brak critical bugs i console errors
- Kod jest maintainable i self-documenting

---

## 4. MVP Scope Rationale

### Why Full-Stack MVP (not POC)?

**Decyzja:** Full-stack (Angular + Spring Boot + PostgreSQL) **vs** POC (frontend only + mock data)

**Rationale:**
- ✅ Validate real user workflows (upload, auth, persistence)
- ✅ Prove deployment feasibility (Mikrus VPS)
- ✅ Test real performance (database queries, image processing)
- ✅ Build on solid foundation (can scale later)
- ❌ POC would skip critical technical risks (EXIF extraction, file storage, auth)

### Why These Core Features?

**Upload + EXIF Extraction**
- **Must-have:** Without GPS data, no map visualization
- **Technical risk:** EXIF parsing, thumbnail generation, file storage

**Gallery + Map Views**
- **Must-have:** Core value proposition
- **Map differentiator:** Proof that map-based navigation works

**Rating 1-10**
- **Nice-to-have but included:** Enables filtering by quality
- **Simple to implement:** Single column in database

**Auth + Multi-User**
- **Must-have:** Privacy, data isolation
- **Technical complexity:** Worth it for real-world validation

**Admin Panel**
- **Must-have:** User management, troubleshooting
- **MVP-appropriate:** Simple CRUD, no complex features

### What We Intentionally Excluded

See `.ai/prd.md` → "Out of Scope" section

**Quick summary:**
- ❌ Editing (crop, filters) - complex, low ROI for MVP
- ❌ Sharing (public links) - adds complexity, not core value
- ❌ Albums/collections - organizational complexity
- ❌ Comments - social feature, not needed for private gallery
- ❌ PWA/Offline - technical complexity, marginal benefit

---

## 5. Future Vision (Post-MVP)

Po walidacji MVP i osiągnięciu success metrics, rozważamy:

🔮 **Phase 2: Enhanced Organization**
- Albums/collections (group photos by trips)
- Tags and categories
- Advanced search (by place name, not just GPS)

🔮 **Phase 3: Social Features**
- Share albums with friends (read-only links)
- Collaborative albums (multiple contributors)
- Comments on photos

🔮 **Phase 4: Advanced Features**
- Photo editing (basic crop, rotate, filters)
- Batch operations (bulk delete, move)
- AI tagging (object detection, face recognition)

🔮 **Phase 5: Mobile App**
- Native iOS/Android app
- Offline mode
- Background upload

---

**Document Purpose:** Business context for humans + optional reference for Claude Code
**Related:** `.ai/prd.md` (technical requirements)
**Last Updated:** 2025-10-19
