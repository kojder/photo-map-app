# PRD Summary - Prompt Template

## Purpose

Ten template to prompt do wygenerowania podsumowania sesji planistycznej PRD. Używany AFTER kilku rund Q&A z AI.

---

## Prompt Template

```
Podsumowanie sesji planistycznej:
{{latest-round-answers}} <- twoja lista odpowiedzi na ostatnią rundę pytań

---

Jesteś asystentem AI, którego zadaniem jest podsumowanie rozmowy na temat planowania PRD
(Product Requirements Document) dla MVP i przygotowanie zwięzłego podsumowania dla
następnego etapu rozwoju.

W historii konwersacji znajdziesz następujące informacje:
1. Opis projektu
2. Zidentyfikowany problem użytkownika
3. Historia rozmów zawierająca pytania i odpowiedzi
4. Zalecenia dotyczące zawartości PRD

Twoim zadaniem jest:

1. Podsumować historię konwersacji, koncentrując się na wszystkich decyzjach
   związanych z planowaniem PRD.

2. Dopasowanie zaleceń modelu do odpowiedzi udzielonych w historii konwersacji.
   Zidentyfikuj, które zalecenia są istotne w oparciu o dyskusję.

3. Przygotuj szczegółowe podsumowanie rozmowy, które obejmuje:
   a. Główne wymagania funkcjonalne produktu
   b. Kluczowe historie użytkownika i ścieżki korzystania
   c. Ważne kryteria sukcesu i sposoby ich mierzenia
   d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia

4. Sformatuj wyniki w następujący sposób:

<conversation_summary>
<decisions>
[Wymień decyzje podjęte przez użytkownika, ponumerowane].
</decisions>

<matched_recommendations>
[Lista najistotniejszych zaleceń dopasowanych do rozmowy, ponumerowanych]
</matched_recommendations>

<prd_planning_summary>
[Podaj szczegółowe podsumowanie rozmowy, w tym elementy wymienione w kroku 3].
</prd_planning_summary>

<unresolved_issues>
[Wymień wszelkie nierozwiązane kwestie lub obszary wymagające dalszych wyjaśnień, jeśli takie istnieją]
</unresolved_issues>
</conversation_summary>

Końcowy wynik powinien zawierać tylko treść w formacie markdown.
Upewnij się, że Twoje podsumowanie jest jasne, zwięzłe i zapewnia cenne informacje
dla następnego etapu tworzenia PRD.
```

---

## Example Output

### Input (Answers from Session):

```
Rundą 1:
1. Płatne subskrypcje? → NIE (MVP free)
2. Formaty zdjęć? → JPEG, PNG (no HEIC w MVP)
3. Public sharing? → NIE (out of scope)
4. Mikrus VPS constraints? → Limited resources, no background jobs
5. Batch upload? → TAK (via scp/ftp to input/ folder)

Runda 2:
1. Async processing? → TAK (Spring Integration file monitoring)
2. Thumbnail sizes? → 3 rozmiary (150px, 400px, 800px)
3. Rating system? → Stars 1-5
4. Admin panel? → User management (list, change role)
5. Deployment? → Manual (systemd service)

Runda 3:
1. Database relations? → One-to-many (user → photos)
2. JWT expiration? → 24h (configurable)
3. File storage path? → /opt/photo-map/storage/{userId}/
4. Frontend state? → BehaviorSubject (no NgRx)
5. Error handling? → Consistent ErrorResponse DTO
```

### Output (AI Generated):

```markdown
<conversation_summary>
<decisions>
1. MVP będzie całkowicie darmowy - brak płatnych subskrypcji w pierwszym etapie
2. Wspierane formaty zdjęć: JPEG i PNG (HEIC excluded z MVP scope)
3. Zdjęcia prywatne (user-scoped) - brak public sharing w MVP
4. Deployment na Mikrus VPS z constraints: no background jobs, limited resources
5. Batch upload wspierany via Spring Integration file monitoring (input/ folder)
6. Asynchroniczne przetwarzanie zdjęć (upload i processing oddzielone)
7. Thumbnail generation: 3 rozmiary (150px, 400px, 800px)
8. Rating system: 1-5 gwiazdek
9. Admin panel: basic user management (list users, change roles)
10. Manual deployment: systemd service, no CI/CD w MVP
11. Database: PostgreSQL z relacją one-to-many (user → photos)
12. Authentication: JWT tokens (24h expiration)
13. File storage: /opt/photo-map/storage/{userId}/ z folder structure
14. Frontend state: BehaviorSubject pattern (no NgRx dla MVP)
15. Error handling: Consistent ErrorResponse DTO format
</decisions>

<matched_recommendations>
1. ✅ Użyj in-memory cache zamiast Redis - simpler, Mikrus-appropriate
2. ✅ Spring Integration file monitoring zamiast Celery - no background jobs constraint
3. ✅ Tailwind 3.x (not 4.x) - Angular 18 incompatibility noted
4. ✅ BehaviorSubject pattern dla state - avoid NgRx complexity w MVP
5. ✅ Synchronous thumbnail generation - keep it simple, Mikrus compatible
6. ⚠️ Consider async processing dla batch upload - Spring Integration selected
7. ⚠️ Plan for folder permissions on deployment - noted dla Phase 6
</matched_recommendations>

<prd_planning_summary>
## Project Overview
Photo Map MVP to full-stack aplikacja (Angular 18 + Spring Boot 3 + PostgreSQL 15)
do zarządzania zdjęciami z geolokalizacją. Deployment na Mikrus VPS (limited resources).

## Core Features
1. **Authentication** - JWT-based login/registration (24h token expiration)
2. **Photo Upload** - Web upload + batch upload (Spring Integration file monitoring)
3. **EXIF Extraction** - Automatyczna ekstrakcja GPS, date, camera metadata
4. **Thumbnail Generation** - 3 rozmiary (150/400/800px), synchronous processing
5. **Gallery View** - Responsive grid, rating 1-5★, filtering (date, rating)
6. **Map View** - Leaflet.js z GPS markers, clustering, popups
7. **Admin Panel** - User management (list, change roles)

## User Flows
**Flow 1: Upload & View**
1. User logs in → JWT token
2. User uploads photos (web form or scp to input/ folder)
3. System processes: EXIF extraction, thumbnail generation
4. Photos appear in gallery and map

**Flow 2: Organize & Filter**
1. User rates photos (1-5★)
2. User filters by rating (min-max range)
3. User filters by date (date range)
4. View filtered results in gallery/map

**Flow 3: Admin Management**
1. Admin logs in
2. Admin views user list (email, role, photo count)
3. Admin changes user role (USER ↔ ADMIN)

## Tech Stack
- **Frontend:** Angular 18 standalone, Tailwind 3.4.17, Leaflet.js 1.9.4
- **Backend:** Spring Boot 3, Java 17, Spring Security (JWT), Spring Integration
- **Database:** PostgreSQL 15
- **Libraries:** metadata-extractor (EXIF), Thumbnailator (thumbnails)
- **Deployment:** Mikrus VPS, Nginx reverse proxy, Systemd service

## Constraints (Mikrus VPS)
- ❌ No background jobs (Celery, Sidekiq) → Spring Integration workaround
- ❌ No resource-intensive operations → synchronous processing preferred
- ✅ In-memory cache (60s TTL) → no Redis
- ✅ Limited concurrent users (10-20)

## Success Criteria
- ✅ User can upload photos (web + batch)
- ✅ System extracts EXIF (GPS, date) automatically
- ✅ Thumbnails generated (3 sizes)
- ✅ Gallery responsive (mobile, tablet, desktop)
- ✅ Map displays photos with GPS + clustering
- ✅ User can rate and filter photos
- ✅ Admin can manage users
- ✅ Performance: initial load <3s, pages load <2s

## Timeline
- **Target:** 10 days
- **Phases:** 6 (Backend Setup & Auth, Backend Photos, Frontend Setup & Auth,
  Frontend Gallery & Map, Admin Panel, Deployment)
</prd_planning_summary>

<unresolved_issues>
1. **Folder permissions on Mikrus VPS** - need to verify /opt/photo-map/ permissions
   during deployment (Phase 6). User `photo-map` (non-root) must have write access
   to storage folders.

2. **Spring Integration polling interval** - 10s selected, but może być za długi/krótki.
   Tuning needed based on usage patterns. Consider making it configurable.

3. **HEIC/HEIF future support** - explicitly excluded from MVP, but users may request it.
   Need plan for post-MVP: conversion library (imageio-heif) or client-side conversion?
</unresolved_issues>
</conversation_summary>
```

---

## Usage Instructions

### When to Use

Use this prompt AFTER completing 3-5+ rounds of Q&A with AI during PRD planning session.

**Triggers:**
- User says "podsumuj" lub "summary"
- All major questions answered
- Ready to generate final PRD
- Session feels complete

### How to Use

1. **Gather all answers** - collect responses from all Q&A rounds
2. **Insert into template** - paste answers into `{{latest-round-answers}}`
3. **Run prompt** - AI generates structured summary
4. **Review summary** - verify decisions, recommendations, unresolved issues
5. **Use for PRD generation** - summary becomes input for final PRD

---

## What to Do with Summary

### Immediate Next Steps

1. **Review with User**
   - Confirm all decisions are correct
   - Address unresolved issues
   - Get final approval

2. **Generate PRD**
   - Use summary to populate `.ai/prd.md`
   - Include: overview, features, user stories, acceptance criteria
   - See `templates/tech-stack-analysis-template.md` for next step

3. **Document Decisions**
   - Save important decisions to `.decisions/prd-context.md`
   - Document WHY certain choices were made
   - Useful for future reference

---

## Quality Checklist

### Good Summary Should Have:

- [ ] **Decisions** (10-15 konkretnych decyzji)
- [ ] **Matched Recommendations** (5-7 kluczowych zaleceń)
- [ ] **PRD Planning Summary** (kompletny overview projektu)
- [ ] **Unresolved Issues** (2-5 issues lub "None" jeśli wszystko resolved)

### Red Flags:

- ❌ Too few decisions (<5) - session was too short, need more rounds
- ❌ No recommendations matched - AI nie rozumie kontekstu
- ❌ Vague summary - brak konkretów (tech stack, timeline, features)
- ❌ Too many unresolved issues (>10) - need more Q&A rounds

---

## Related Documentation

- `references/prd-planning-process.md` - pełny proces planowania PRD
- `references/10xdevs-methodology.md` - metodologia z kursu
- `templates/prd-planning-session-template.md` - prompt do sesji Q&A
- `templates/tech-stack-analysis-template.md` - następny krok (analiza stacku)
- `.ai/prd.md` - przykład finalnego PRD wygenerowanego z summary
