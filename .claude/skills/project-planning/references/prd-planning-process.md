# Proces Planowania PRD

## Overview

Proces planowania Product Requirements Document (PRD) dla nowego projektu z wykorzystaniem AI składa się z kilku kluczowych kroków.

## Etapy Procesu

### Etap 1: High-Level Concept

**Input:**
- Pomysł na projekt (1-3 akapity)
- Główny problem użytkownika
- Target users

**Output:**
- Wstępny opis MVP
- Core features (lista 3-5 funkcji)
- Out of scope (lista feature exclusions)

**Przykład - Photo Map MVP:**
```
Problem: Trudno zarządzać i przeglądać dużą kolekcją zdjęć z różnych miejsc i dat

Core Features:
1. Upload zdjęć z EXIF extraction
2. Gallery view (responsive grid)
3. Map view (GPS markers)
4. Rating system (1-5 stars)
5. Admin panel

Out of Scope:
- Comments, sharing, albums
- Advanced editing (crop, filters)
- Social features
```

### Etap 2: Sesja Planistyczna (Q&A Rounds)

**Proces:**
1. AI generuje 10 pytań i zaleceń
2. Użytkownik odpowiada na pytania
3. AI generuje kolejne pytania (na podstawie odpowiedzi)
4. Repeat 3-5+ rund (zależnie od złożoności projektu)
5. AI generuje podsumowanie rozmowy

**Kategorie pytań:**
- Szczegóły problemu użytkownika
- Priorytetyzacja funkcjonalności
- Oczekiwane doświadczenie użytkownika
- Mierzalne wskaźniki sukcesu
- Potencjalne ryzyka i wyzwania
- Harmonogram i zasoby

**Format pytania:**
```
Pytanie: Czy już od startu projektu planujesz wprowadzenie płatnych subskrypcji?

Rekomendacja: Pierwszy etap projektu może skupić się na funkcjonalnościach
darmowych, aby przyciągnąć użytkowników, a płatne funkcje można wprowadzić
w późniejszym etapie.
```

**Ile rund należy odbyć?**
- **Side project / MVP:** 3-5 rund wystarczy
- **Komercyjny projekt:** 10-20+ rund (więcej stakeholders, wymagań)

**Kiedy zakończyć sesję?**
- Wszystkie kluczowe kwestie są wyjaśnione
- Brak major uncertainties
- Użytkownik czuje się confident z direction

### Etap 3: Podsumowanie Sesji

**AI generuje podsumowanie zawierające:**
1. **Decisions** - lista decyzji podjętych przez użytkownika
2. **Matched Recommendations** - najistotniejsze zalecenia AI
3. **PRD Planning Summary** - szczegółowe podsumowanie rozmowy
4. **Unresolved Issues** - nierozwiązane kwestie (jeśli są)

**Przykład podsumowania:**
```markdown
## Decisions
1. MVP będzie wspierać tylko JPEG i PNG (no HEIC w MVP)
2. Hosting: Mikrus VPS (limited resources, no background jobs)
3. Authentication: JWT tokens (stateless)
4. Photo processing: synchronous (no async queues)
5. Admin panel: simple user management (no advanced analytics)

## Matched Recommendations
- Użyj in-memory cache zamiast Redis (simpler, MVP-appropriate)
- Spring Integration folder monitoring zamiast Celery (no background jobs)
- Tailwind 3.x (Angular 18 incompatible with Tailwind 4)

## PRD Planning Summary
Photo Map MVP to aplikacja do zarządzania zdjęciami z geolokalizacją.
Core functionality: upload, EXIF extraction, gallery view, map view, rating system.
Target users: fotografowie amatorzy, podróżnicy.
Deployment: Mikrus VPS (resource constraints).
Timeline: 10 dni (6 faz implementacji).

## Unresolved Issues
- Batch upload: czy przez web form czy tylko scp/ftp do input/ folder?
  → Rozwiązane: Spring Integration file monitoring, oba sposoby supported
```

### Etap 4: Generowanie PRD

**AI generuje kompleksowy PRD zawierający:**

**Sekcje PRD:**
1. **Przegląd Produktu** - cel, target users, główne funkcjonalności
2. **Problem Użytkownika** - jaki problem rozwiązujemy
3. **Wymagania Funkcjonalne** - szczegółowy opis core features
4. **Granice Produktu** - co NIE wchodzi w scope MVP
5. **Historyjki Użytkowników** - user stories + acceptance criteria
6. **Metryki Sukcesu** - jak zmierzymy success MVP

**User Stories Format:**
```
ID: US-AUTH-001
Tytuł: Rejestracja użytkownika
Opis: Jako użytkownik mogę się zarejestrować aby mieć konto
Kryteria akceptacji:
- User może podać email + password
- Password jest hashowany (BCrypt)
- User otrzymuje JWT token po rejestracji
- User jest automatycznie zalogowany po rejestracji
```

**Wytyczne:**
- ✅ Każda user story musi być testowalna
- ✅ Kryteria akceptacji jasne i konkretne
- ✅ Wystarczająco dużo user stories aby zbudować w pełni funkcjonalną aplikację
- ✅ Uwzględnić authentication/authorization (jeśli applicable)

### Etap 5: Analiza Tech Stack

**Proces:**
1. Użytkownik definiuje wstępny tech stack
2. AI przeprowadza krytyczną analizę pod kątem PRD
3. AI zadaje pytania kontrolne (6 kategorii)
4. AI proponuje alternatywy (jeśli potrzebne)
5. AI tworzy dokument `.ai/tech-stack.md`

**Pytania kontrolne:**
1. Czy technologia pozwoli szybko dostarczyć MVP?
2. Czy rozwiązanie będzie skalowalne?
3. Czy koszt utrzymania będzie akceptowalny?
4. Czy nie jest to over-engineered?
5. Czy nie istnieje prostsze podejście?
6. Czy bezpieczeństwo jest odpowiednio zaadresowane?

**Przykład analizy:**
```
Stack: Angular 18 + Spring Boot 3 + PostgreSQL 15

Analiza:
✅ Szybkie MVP - Angular CLI + Spring Boot auto-config
✅ Skalowalne - można dodać features później
✅ Akceptowalny koszt - open-source, Mikrus VPS €5/month
⚠️ Mikrus constraints - no Redis, no background jobs
✅ Odpowiednio złożone - NOT too simple (SQLite), NOT too complex (microservices)
✅ Bezpieczeństwo - JWT, BCrypt, user scoping

Rekomendacje:
- Użyj in-memory cache (NOT Redis) - Mikrus constraints
- Spring Integration file monitoring (NOT Celery) - no background jobs
- Tailwind 3.x (NOT 4.x) - Angular 18 incompatibility
```

### Etap 6: Szczegółowe Plany

Po zatwierdzeniu PRD i tech stack, AI tworzy szczegółowe plany:

**Dokumenty `.ai/`:**
1. `.ai/prd.md` - Product Requirements Document
2. `.ai/tech-stack.md` - Technology stack + rationale
3. `.ai/db-plan.md` - Database schema (tables, relations, indexes)
4. `.ai/api-plan.md` - REST API specification (endpoints, DTOs, errors)
5. `.ai/ui-plan.md` - Frontend architecture (components, services, routing)

**Dokumenty `.decisions/`:**
1. `.decisions/prd-context.md` - Business context + future vision
2. `.decisions/tech-decisions.md` - Technology decisions rationale

**Progress Tracking:**
1. `PROGRESS_TRACKER.md` - 6 faz implementacji + current status

## Workflow Diagram

```
1. High-Level Concept
   ↓
2. Sesja Planistyczna (3-5+ rund Q&A)
   ↓
3. Podsumowanie Sesji
   ↓
4. Generowanie PRD (.ai/prd.md)
   ↓
5. Analiza Tech Stack (.ai/tech-stack.md)
   ↓
6. Szczegółowe Plany (.ai/db-plan.md, api-plan.md, ui-plan.md)
   ↓
7. Implementation (6 faz, małe chunks z checkpoints)
```

## Tips dla Efektywnej Sesji Planistycznej

### Przygotowanie
- Mieć jasny problem do rozwiązania
- Zidentyfikować target users
- Określić timeline (MVP w X tygodni)
- Znać constraints (hosting, budget, team size)

### Podczas Sesji
- Odpowiadać szczegółowo na pytania AI
- Pytać o clarifications jeśli pytania niejasne
- Nie spieszyć się - lepiej 5 rund dokładnych niż 2 powierzchowne
- Dokumentować kluczowe decyzje (będą w podsumowaniu)

### Red Flags
- ⚠️ AI proponuje over-engineered solution (mikroservices dla MVP)
- ⚠️ AI proponuje exotic technologies (long learning curve)
- ⚠️ AI ignoruje constraints (Mikrus VPS → Redis, Celery)
- ⚠️ AI proponuje out-of-scope features (comments, sharing w MVP)

### Jak reagować na Red Flags:
- Pytać: "Czy to nie jest za złożone dla MVP?"
- Sprawdzać: "Czy to jest zgodne z constraints w tech-stack?"
- Upraszczać: "Jaka jest MINIMALNA wersja tej funkcji?"

## Przykład Pełnej Sesji - Photo Map MVP

### Runda 1 - AI Questions
1. Czy planowane są płatne subskrypcje? → NIE (MVP free)
2. Jakie formaty zdjęć wspieramy? → JPEG, PNG (no HEIC w MVP)
3. Czy użytkownicy mogą udostępniać zdjęcia? → NIE (out of scope)
4. Jakie są constraints hostingu? → Mikrus VPS (limited resources)
5. Czy batch upload jest wymagany? → TAK (via scp/ftp to input/ folder)

### Runda 2 - AI Follow-up Questions
1. Batch upload: synchronous czy async? → Async (Spring Integration)
2. Thumbnail sizes? → 3 rozmiary (150px, 400px, 800px)
3. Rating system: stars czy numeric? → Stars (1-5)
4. Admin panel: jakie funkcje? → User management (list, change role)
5. Deployment: automatyczny czy manual? → Manual (MVP - systemd service)

### Runda 3 - Technical Clarifications
1. Database: relacje między users/photos? → One-to-many (user → photos)
2. Authentication: JWT expiration? → 24h (configurable)
3. File storage: gdzie? → `/opt/photo-map/storage/{userId}/`
4. Frontend state: NgRx czy simple? → Simple (BehaviorSubject, no NgRx)
5. Error handling: format? → Consistent ErrorResponse DTO

### Podsumowanie → PRD → Tech Stack → Szczegółowe Plany → Implementation

## Related Documentation

- `10xdevs-methodology.md` - pułapki planowania z AI
- `mvp-scope-boundaries.md` - granice scope MVP
- `verification-checklist.md` - checklist weryfikacji pomysłu
- `templates/prd-planning-session-template.md` - prompt do sesji
- `templates/prd-summary-template.md` - prompt do podsumowania
- `templates/tech-stack-analysis-template.md` - prompt do analizy stacku
- `.ai/prd.md` - przykład finalnego PRD
