# Przykład Weryfikacji Funkcji - "Dodaj System Komentarzy"

## Pomysł Użytkownika

"Chciałbym dodać system komentarzy do zdjęć, żeby użytkownicy mogli zostawiać notatki i opisy pod swoimi zdjęciami."

## Proces Weryfikacji

### Krok 1: MVP Scope Check

**Pytanie:** Czy funkcja jest wymieniona w `.ai/prd.md` Core Features?

**Sprawdzenie `.ai/prd.md`:**
- Core Features: Authentication, Photo Management, Gallery View, Map View, Admin Panel
- ❌ System komentarzy NIE jest wymieniony

**Sprawdzenie "Out of Scope" listy:**
- ❌ "Comments lub annotations" jest EXPLICITLY excluded z MVP

**Decyzja:** ❌ Funkcja POZA SCOPE MVP

---

### Krok 2: Business Justification

**Pytanie:** Czy funkcja jest KONIECZNA do podstawowego działania aplikacji?

**Analiza:**
- Photo Map MVP to aplikacja do ZARZĄDZANIA zdjęciami z geolokalizacją
- Core value proposition: organizacja zdjęć (gallery, map, rating, filtering)
- Komentarze to **dodatek** (nice to have), NIE core functionality

**Decyzja:** ❌ Funkcja nie jest konieczna dla MVP

---

### Krok 3: Simplification Attempt

**Pytanie:** Czy można uprościć funkcję żeby pasowała do MVP?

**Simplified version:**
- Zamiast full comment system → dodać pole `description` do `Photo` entity
- User może dodać JEDNĄ notatkę/opis do zdjęcia
- No threading, no replies, no moderation

**Analiza:**
- ✅ Prosta implementacja (ADD COLUMN, update DTO, modify PUT endpoint)
- ✅ Complexity: Simple (1-2 chunks)
- ✅ Provides value (user can annotate own photos)

**Decyzja:** ⚠️ Simplified version MOŻLIWA (consulta z użytkownikiem)

---

### Krok 4: Tech Stack Compatibility

**Pytanie:** Czy simplified version jest zgodna z tech stack?

**Analiza:**
- Database: ADD COLUMN `description` VARCHAR(500) → trivial migration
- Backend: Modify `PhotoDTO`, update `PUT /api/photos/{id}` endpoint → easy
- Frontend: Add textarea w PhotoCard component → simple
- No external dependencies, no async processing

**Decyzja:** ✅ Tech compatible (dla simplified version)

---

### Krok 5: Complexity Assessment

**Simplified version ("description field"):**
- Database: ADD COLUMN (nullable) → trivial
- Backend: Modify DTO, update PUT endpoint → 1 chunk
- Frontend: Add textarea, update service → 1 chunk
- Tests: 1-2 test cases

**Complexity:** Simple (1-2 chunks, 1-2h)

**Timeline estimate:** ~1-2 godziny

---

## Final Decision

### Original Proposal: "System Komentarzy"
**Decyzja:** ❌ **ODRZUCONE** - out of scope MVP

**Powody:**
1. Explicitly excluded w `.ai/prd.md` (Out of Scope list)
2. Not core functionality (nice to have, not must have)
3. Complex implementation (nowa tabela `comments`, CRUD endpoints, threading?, moderation?)
4. Adds 6+ chunks → delays MVP delivery

---

### Simplified Proposal: "Photo Description Field"
**Decyzja:** ✅ **MOŻLIWE** - consulta z użytkownikiem

**Powody:**
1. Simple implementation (ADD COLUMN, modify endpoint)
2. Provides similar value (user can annotate photos)
3. Complexity: Simple (1-2 chunks, 1-2h)
4. No impact on MVP timeline

**Implementacja:**
- Chunk 1: Backend (Flyway migration, update DTO, modify PUT /api/photos/{id})
- Chunk 2: Frontend (add textarea w PhotoCard, update PhotoService)
- **CHECKPOINT** → Feature complete

---

## Lessons Learned

### ✅ Dobre Praktyki
1. **Sprawdzić `.ai/prd.md` NAJPIERW** - zaoszczędza czas
2. **Szukać simplified version** - może spełnić podobne wymagania
3. **Consulta z użytkownikiem** - jeśli simplified version ma sense
4. **Dokumentować decision** - dlaczego odrzucone/zaakceptowane

### ❌ Częste Błędy
1. **Implementować bez weryfikacji scope** → wasted effort
2. **Nie pytać o simplified version** → missed opportunity
3. **Zakładać że "mała zmiana" = mała funkcja** → comments system to 6+ chunks!

### 💡 Tips
- Jeśli funkcja w "Out of Scope" → prawie zawsze ODRZUĆ (consulta jeśli ma strong business case)
- Jeśli można uprościć 10x → ROZWAŻ simplified version
- Zawsze pytaj: "Czy to jest MUST HAVE czy NICE TO HAVE dla MVP?"

---

## Related Examples

- `simple-feature-example.md` - przykład prostej funkcji (photo description field)
- `bad-feature-example.md` - przykład over-engineered funkcji (ML auto-tagging)
- `good-feature-breakdown.md` - przykład dobrego rozbicia funkcji (rating system)
