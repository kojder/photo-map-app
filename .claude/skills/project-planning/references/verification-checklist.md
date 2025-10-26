# Checklist Weryfikacji i Planowania Funkcji

## Przed Rozpoczęciem Implementacji

### 1. Context Check
- [ ] Przeczytać `.ai/prd.md` - zrozumieć MVP requirements
- [ ] Przeczytać `.ai/tech-stack.md` - znać tech constraints (Mikrus VPS)
- [ ] Sprawdzić `PROGRESS_TRACKER.md` - w której fazie jesteśmy
- [ ] Zidentyfikować dependencies - co musi być zrobione wcześniej

### 2. MVP Scope Verification
- [ ] Czy funkcja jest wymieniona w `.ai/prd.md` Core Features?
- [ ] Czy funkcja jest konieczna do podstawowego działania aplikacji?
- [ ] Czy funkcja NIE jest w "Out of Scope" liście?
- [ ] Sprawdzić `references/mvp-scope-boundaries.md` dla potwierdzenia

**Decyzja:**
- ✅ W scope → Kontynuuj
- ❌ Poza scope → Consulta z użytkownikiem lub odrzuć

### 3. Tech Stack Compatibility
- [ ] Sprawdzić `.ai/tech-stack.md` - czy używamy odpowiednich technologii
- [ ] Sprawdzić Mikrus VPS constraints:
  - [ ] Czy funkcja wymaga background jobs? (❌ out of scope)
  - [ ] Czy funkcja jest resource-intensive? (⚠️ ostrożnie)
  - [ ] Czy przetwarzanie może być synchroniczne? (✅ preferred)
- [ ] Sprawdzić compatibilność:
  - [ ] Angular 18 standalone components (no NgModules)
  - [ ] Spring Boot 3 + Java 17
  - [ ] PostgreSQL 15
  - [ ] Tailwind 3.x (NOT 4.x - Angular 18 incompatible)

**Decyzja:**
- ✅ Compatible → Kontynuuj
- ⚠️ Requires workaround → Zaplanuj alternatywne podejście
- ❌ Incompatible → Odrzuć lub zmień approach

### 4. Complexity Assessment
- [ ] Ocenić złożoność używając `references/complexity-assessment.md`
- [ ] Określić poziom: Simple / Medium / Complex
- [ ] Szacować timeline:
  - Simple: 1-2 chunks (1-2h)
  - Medium: 3-5 chunks (3-6h)
  - Complex: 6+ chunks (6-12h)
- [ ] Zidentyfikować dependencies:
  - Database migrations?
  - New endpoints?
  - Frontend + Backend integration?
  - External libraries?

**Decyzja:**
- ✅ Clear complexity → Kontynuuj do planowania
- ⚠️ Uncertain → Break down further lub consulta

## Planowanie Implementacji

### 5. Feature Breakdown
- [ ] Zdefiniować user story (As X, I want Y, so that Z)
- [ ] Rozbić na backend + frontend tasks
- [ ] Zidentyfikować acceptance criteria (testable!)
- [ ] Zaplanować testy (unit + integration)
- [ ] Szacować chunks (każdy chunk ~30-60 min)

**Użyj:**
- `templates/user-story-template.md`
- `templates/feature-proposal-template.md`
- `examples/good-feature-breakdown.md` (wzorzec)

### 6. Implementation Plan
- [ ] Rozbić na małe chunks (~30-60 min każdy)
- [ ] Każdy chunk powinien być:
  - Implementable (można zakończyć w jednym siedzie)
  - Testable (można zweryfikować czy działa)
  - Committable (można zcommitować z sensownym message)
- [ ] Zaplanować 3 chunks → checkpoint z użytkownikiem

**Przykład:**
1. Chunk 1: Backend endpoint + test
2. Chunk 2: Frontend service method + test
3. Chunk 3: Frontend component integration + manual test
4. **CHECKPOINT** → pokazać użytkownikowi działającą funkcję

Szczegóły: `references/workflow-3x3.md`

### 7. Risk Identification
- [ ] Zidentyfikować potencjalne problemy:
  - Performance bottlenecks?
  - Security concerns?
  - User scoping issues?
  - Error handling edge cases?
  - Migration rollback strategy?
- [ ] Zaplanować mitigation strategies

**Przykłady ryzyk:**
- "Rating system może mieć race conditions" → użyj database constraints
- "Batch upload może timeout" → async processing (Spring Integration)
- "Photo deletion może orphan thumbnails" → cascade delete

### 8. Testing Strategy
- [ ] Unit tests: coverage > 70% dla nowego kodu
- [ ] Integration tests: full flow (controller → service → repository)
- [ ] Manual testing plan: curl/Postman (backend) lub browser (frontend)
- [ ] Test data: przygotować sample data
- [ ] Edge cases: zidentyfikować i przetestować

**Test Checklist:**
- [ ] Happy path
- [ ] Edge cases (null, empty, max values)
- [ ] Error handling (401, 403, 404, 500)
- [ ] User scoping (can't access other user's data)
- [ ] Performance (acceptable response time)

## Podczas Implementacji

### Implementation Execution
- [ ] Implementować małe chunks (~30-60 min)
- [ ] Testować natychmiast (curl/browser)
- [ ] Commitować często (Conventional Commits)
- [ ] User scoping enforced (backend)
- [ ] Standalone components (frontend)
- [ ] Self-documenting code (minimalne komentarze)

### Quality Gates
- [ ] Code review (git diff przed commit)
- [ ] Unit tests passing (./mvnw test lub ng test)
- [ ] Manual test passing
- [ ] No console errors (frontend)
- [ ] Conventional Commits format

## Po Zakończeniu Funkcji

### Final Checks
- [ ] Wszystkie testy passing (unit + integration)
- [ ] Manual testing w browser/curl
- [ ] Update `PROGRESS_TRACKER.md` - check off tasks
- [ ] Dokumentacja zaktualizowana (jeśli potrzebna)
- [ ] Code review (jeśli team)
- [ ] Checkpoint z użytkownikiem

### Retrospective Questions
- [ ] Czy funkcja spełnia acceptance criteria?
- [ ] Czy timeline estimate był trafny?
- [ ] Czy napotkano unexpected problems?
- [ ] Czy można coś usprawnić w następnej iteracji?

## Quick Decision Matrix

| Pytanie | TAK | NIE | Akcja |
|---------|-----|-----|-------|
| Czy w MVP scope? | ✅ | ❌ | Consulta lub odrzuć |
| Czy tech compatible? | ✅ | ⚠️ | Find workaround lub odrzuć |
| Czy complexity clear? | ✅ | ⚠️ | Break down further |
| Czy risks identified? | ✅ | ⚠️ | Do risk assessment |
| Czy chunks < 60 min? | ✅ | ❌ | Break down smaller |

## Related Documentation

- `mvp-scope-boundaries.md` - czy w scope MVP
- `complexity-assessment.md` - jak ocenić złożoność
- `workflow-3x3.md` - jak rozbić na chunks
- `10xdevs-methodology.md` - pułapki planowania z AI
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - tech constraints
- `PROGRESS_TRACKER.md` - current status
