# Przykład Over-Engineered Funkcji - "ML-Powered Photo Categorization"

## Pomysł (BAD for MVP)

"Dodaj automatyczne kategoryzowanie zdjęć używając machine learning - system powinien rozpoznawać obiekty na zdjęciach (ludzie, zwierzęta, budynki, natura) i automatycznie przypisywać tagi."

## Dlaczego to ZŁY pomysł dla MVP?

### ❌ Problem 1: Out of Scope

**Sprawdzenie `.ai/prd.md`:**
- Core Features: Upload, Gallery, Map, Rating, Admin
- Out of Scope: **"Face recognition lub tagging"**, **"Advanced features"**

**Verdict:** EXPLICIT OUT OF SCOPE

---

### ❌ Problem 2: Nie rozwiązuje Core Problem

**Photo Map MVP Core Problem:**
"Trudno zarządzać i przeglądać dużą kolekcję zdjęć z różnych miejsc i dat"

**Solution Focus:**
- Geolokalizacja (GPS markers na mapie)
- Organizacja po dacie/lokalizacji
- Rating system (manual favorites)

**ML Categorization:**
- Rozwiązuje INNY problem ("co jest na zdjęciu?")
- NIE adresuje core value proposition (geo + date organization)
- Nice to have, NOT must have

**Verdict:** NIE KONIECZNE dla MVP

---

### ❌ Problem 3: Nadmiernie Złożona Implementacja

#### Backend Complexity

**Wymagania:**
1. **ML Model Integration**
   - Wybór modelu (TensorFlow, PyTorch, Hugging Face?)
   - Model hosting (gdzie uruchomić model? CPU/GPU?)
   - Inference latency (ile czasu na kategoryzację?)

2. **Training Data**
   - Skąd wziąć labeled dataset?
   - Czy trenować własny model czy użyć pre-trained?
   - Jak aktualizować model?

3. **Kategoryzacja Process**
   - Synchronous czy asynchronous?
   - Batch processing (wiele zdjęć naraz)?
   - Error handling (co jeśli model fails?)

4. **Storage**
   - Nowa tabela `photo_tags` (many-to-many)
   - Confidence scores (how confident is the model?)
   - Tag taxonomy (categories, subcategories?)

**Complexity:** EXTREME (20+ chunks, 20-40h)

#### Frontend Complexity

**Wymagania:**
1. Tag display (w gallery, map popups)
2. Tag filtering (filter by category)
3. Tag management (edit/delete auto-generated tags?)
4. Confidence display (show confidence scores?)

**Complexity:** High (5+ chunks)

#### Mikrus VPS Constraints VIOLATION

**Problem:**
- ML models są resource-intensive (CPU/RAM/GPU)
- Mikrus VPS ma limited resources
- Inference może zająć 1-10s per photo (unacceptable latency)
- Brak GPU → very slow inference

**Verdict:** INCOMPATIBLE z Mikrus VPS constraints

---

### ❌ Problem 4: External Dependencies

**Nowe dependencies:**
- TensorFlow / PyTorch / Hugging Face Transformers
- Pre-trained model (download ~500MB-2GB)
- Python integration (jeśli backend to Java → multi-language complexity)

**Implications:**
- Long learning curve (jak używać ML bibliotek?)
- Dependency hell (version conflicts?)
- Deployment complexity (jak deploy model na VPS?)

**Verdict:** ZBYT DUŻO external dependencies dla MVP

---

### ❌ Problem 5: Timeline Impact

**Estimated Timeline:**
- Research ML models: 1-2 dni
- Integration + testing: 3-5 dni
- Debugging + optimization: 2-3 dni
- **Total: 6-10 dni** (cały MVP timeline!)

**MVP Timeline:** 10 dni total

**Impact:** Ta JEDNA funkcja zżera 60-100% MVP timeline!

**Verdict:** DELAYS MVP delivery

---

## Implementation Attempt (BROKEN)

Spróbujmy rozbić funkcję na małe chunks...

### Chunk 1: Research ML Model (???)
- Przeszukać Hugging Face hub
- Porównać modelos (accuracy, latency, size)
- Wybrać model
- **Time:** 4-8 godzin (NIE 30-60 min!)

### Chunk 2: Integrate Model (???)
- Download model (500MB-2GB)
- Setup Python environment (jeśli Java backend)
- Create inference endpoint
- **Time:** 3-6 godzin (NIE 30-60 min!)

### Chunk 3: Categorize Photos (???)
- Process uploaded photos
- Extract categories
- Save to database
- **Time:** 2-4 godziny (NIE 30-60 min!)

**Problem:** Chunks są ZBYT DUŻE (2-8h każdy!)
**Pattern BROKEN** - chunks powinny być 30-60 min!

---

## Alternative: Simplified Version?

### Próba Uproszczenia #1: Manual Tags

**Pomysł:**
Zamiast ML → pozwól użytkownikowi manual dodać tags

**Implementation:**
- ADD COLUMN `tags` TEXT[] (PostgreSQL array)
- Update PUT /api/photos/{id} endpoint (add tags field)
- Frontend: input field for tags (comma-separated)

**Complexity:** Simple (1-2 chunks)

**Value:** Użytkownik może organizować po tagach (manual)

**Verdict:** ✅ Znacznie prostsze, podobny outcome

---

### Próba Uproszczenia #2: EXIF Metadata Display

**Pomysł:**
Wyświetlać istniejące EXIF metadata (camera model, ISO, aperture) - nie dodawać ML

**Implementation:**
- Extract więcej EXIF fields (metadata-extractor already used)
- Display w PhotoCard/popup
- No new tables, no ML

**Complexity:** Simple (1 chunk)

**Value:** Użytkownik widzi szczegóły zdjęć (camera settings)

**Verdict:** ✅ Bardzo proste, realny value

---

## Correct Decision

### Original Proposal: "ML-Powered Categorization"
**Decyzja:** ❌ **ODRZUCONE**

**Powody:**
1. Out of scope MVP (explicit exclusion)
2. Nie rozwiązuje core problem
3. Over-engineered (20+ chunks, 20-40h)
4. Mikrus VPS constraints violation (resource-intensive)
5. Zbyt dużo external dependencies
6. Delays MVP delivery (6-10 dni dla jednej funkcji)

---

### Simplified Alternative: "Manual Tags"
**Decyzja:** ⚠️ **MOŻLIWE** - consulta z użytkownikiem

**Implementation:**
- Chunk 1: Backend (ADD COLUMN tags, modify PUT endpoint)
- Chunk 2: Frontend (tags input field, display tags)
- **Total:** 1-2 chunks, 1-2h

**Value:** Similar outcome (organization by categories), 95% mniej czasu

---

## Red Flags - Jak Rozpoznać Bad Feature?

### 🚩 Red Flag #1: "AI-powered", "ML-based", "Smart"
**Problem:** Buzzwords często oznaczają over-engineered solution

**Pytanie:** Czy możemy osiągnąć podobny rezultat bez AI/ML?

---

### 🚩 Red Flag #2: Wymaga Nowych Technologii
**Problem:** Long learning curve, deployment complexity

**Pytanie:** Czy możemy użyć existing stack?

---

### 🚩 Red Flag #3: Resource-Intensive
**Problem:** Mikrus VPS ma limited resources

**Pytanie:** Czy to będzie działać na naszym hostingu?

---

### 🚩 Red Flag #4: Chunks > 2 godziny
**Problem:** Pattern broken (chunks powinny być 30-60 min)

**Pytanie:** Czy możemy rozdzielić na mniejsze chunks?

---

### 🚩 Red Flag #5: Nie Adresuje Core Problem
**Problem:** Nice to have, not must have

**Pytanie:** Czy to jest KONIECZNE dla MVP value proposition?

---

## Lessons Learned

### ✅ Co Robić

1. **Weryfikować scope NAJPIERW** - sprawdzić `.ai/prd.md` przed planowaniem
2. **Pytać o simplified version** - może manual solution wystarczy?
3. **Szacować timeline** - czy funkcja zabierze >20% MVP timeline?
4. **Sprawdzać constraints** - czy compatible z Mikrus VPS?
5. **Pytać "dlaczego?"** - czy to rozwiązuje core problem?

### ❌ Czego Unikać

1. **Buzzwords** - "AI-powered", "ML-based" często = over-engineered
2. **Over-optimization** - MVP nie musi mieć wszystkich fancy features
3. **Scope creep** - trzymać się Core Features z PRD
4. **Complex dependencies** - unikać exotic bibliotek dla MVP
5. **Resource-intensive features** - sprawdzać hosting constraints

### 💡 Tips

- **KISS principle** - Keep It Simple, Stupid
- **Manual > Automated** dla MVP (można automatyzować później)
- **80/20 rule** - 20% effort, 80% value (manual tags vs ML categorization)
- **Consulta simplified version** - może prostsze rozwiązanie wystarczy

---

## Comparison: Good vs Bad Feature

| Aspect | Good (Rating System) | Bad (ML Categorization) |
|--------|----------------------|-------------------------|
| **Scope** | In PRD Core Features | Out of scope (explicit exclusion) |
| **Complexity** | Medium (6 chunks, 4h) | Extreme (20+ chunks, 20-40h) |
| **Dependencies** | None (existing stack) | ML libraries, Python, model hosting |
| **Chunks** | 30-50 min each | 2-8h each (BROKEN) |
| **Timeline** | 4h (5% MVP time) | 6-10 days (60-100% MVP time) |
| **Constraints** | Compatible (Mikrus VPS OK) | Incompatible (resource-intensive) |
| **Value** | Core functionality | Nice to have |
| **Decision** | ✅ Implement | ❌ Reject |

---

## Related Examples

- `good-feature-breakdown.md` - przykład dobrej funkcji (rating system)
- `simple-feature-example.md` - przykład prostej funkcji (photo description)
- `feature-verification-example.md` - jak weryfikować pomysł przed implementacją
