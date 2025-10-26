# Feature Proposal Template

## Feature Overview

**Feature Name:** [Krótka nazwa funkcji]

**User Story:**
As a [type of user], I want [goal] so that [reason/benefit].

**Problem Statement:**
[Jaki problem rozwiązujemy? Dlaczego użytkownik tego potrzebuje?]

---

## Verification Checklist

### 1. MVP Scope Check

- [ ] Czy funkcja jest wymieniona w `.ai/prd.md` Core Features?
- [ ] Czy funkcja jest w "Out of Scope" liście? (jeśli TAK → STOP)
- [ ] Czy funkcja rozwiązuje core problem aplikacji?

**Decision:** ✅ In Scope / ⚠️ Maybe / ❌ Out of Scope

**Notes:**
[Uzasadnienie decyzji]

---

### 2. Tech Stack Compatibility

- [ ] Sprawdzono `.ai/tech-stack.md` - czy używamy odpowiednich technologii?
- [ ] Czy funkcja jest zgodna z Mikrus VPS constraints?
  - [ ] No background jobs (synchronous processing preferred)
  - [ ] No resource-intensive operations (ML, heavy image processing)
  - [ ] No exotic dependencies
- [ ] Czy funkcja wymaga nowych bibliotek? (jeśli TAK → lista poniżej)

**Required Dependencies:**
- [Lista nowych dependencies, jeśli potrzebne]

**Decision:** ✅ Compatible / ⚠️ Needs Workaround / ❌ Incompatible

**Notes:**
[Uzasadnienie, alternatywne podejścia]

---

### 3. Complexity Assessment

**Database Changes:**
- [ ] No changes
- [ ] ADD COLUMN (nullable)
- [ ] ADD COLUMN + INDEX
- [ ] CREATE TABLE + relations

**API Endpoints:**
- [ ] No new endpoints (modify existing)
- [ ] 1-2 new endpoints
- [ ] 3+ new endpoints

**Frontend Changes:**
- [ ] Simple UI change (modify existing component)
- [ ] New component (1-2 components)
- [ ] Complex UI (3+ components, state management)

**Asynchronous Processing:**
- [ ] No (synchronous)
- [ ] Yes (requires Spring Integration or similar)

**Complexity Level:** Simple / Medium / Complex

**Estimated Chunks:** [liczba chunks, np. 1-2 / 3-5 / 6+]

**Estimated Timeline:** [godziny, np. 1-2h / 3-6h / 6-12h]

**Reference:** `references/complexity-assessment.md`

---

### 4. Risk Assessment

**Identified Risks:**
1. [Risk 1 - description]
   - **Impact:** High / Medium / Low
   - **Mitigation:** [Jak zmniejszyć ryzyko]

2. [Risk 2 - description]
   - **Impact:** High / Medium / Low
   - **Mitigation:** [Jak zmniejszyć ryzyko]

**Common Risks to Consider:**
- Performance issues (slow queries, large files)
- Security concerns (user scoping, validation)
- Race conditions (concurrent updates)
- Error handling edge cases
- Migration rollback strategy

---

## Feature Specification

### Acceptance Criteria

1. [Criterion 1 - testable!]
2. [Criterion 2 - testable!]
3. [Criterion 3 - testable!]

**Format:** "Given [context], when [action], then [expected result]"

**Example:**
- Given user is logged in, when user clicks rating star, then rating is updated and persisted

---

### Implementation Plan

**Phase 1: [Name] (Chunks 1-3)**

**Chunk 1:** [Description] (XX min)
- Task 1
- Task 2
- Test: [How to verify]
- Commit: `type(scope): description`

**Chunk 2:** [Description] (XX min)
- Task 1
- Task 2
- Test: [How to verify]
- Commit: `type(scope): description`

**Chunk 3:** [Description] (XX min)
- Task 1
- Task 2
- Test: [How to verify]
- Commit: `type(scope): description`

**CHECKPOINT** → [What to show user]

---

**Phase 2: [Name] (Chunks 4-6)** - jeśli Medium/Complex

[Repeat pattern above]

---

### Testing Strategy

**Unit Tests:**
- [ ] Backend service methods (coverage >70%)
- [ ] Frontend component logic

**Integration Tests:**
- [ ] API endpoints (MockMvc)
- [ ] Database queries
- [ ] Full flow (controller → service → repository)

**Manual Tests:**
- [ ] Happy path (curl/browser)
- [ ] Edge cases ([list specific cases])
- [ ] Error scenarios ([list specific cases])
- [ ] User scoping (can't access other users' data)

**Test Data:**
[Describe sample data needed for testing]

---

### Database Changes

**Migration:** V00X__[description].sql

```sql
-- Example:
ALTER TABLE photos ADD COLUMN description VARCHAR(500);
CREATE INDEX idx_photos_description ON photos(description);
```

**Rollback Strategy:**
```sql
-- Rollback (if needed):
ALTER TABLE photos DROP COLUMN description;
```

---

### API Changes

**Endpoint:** [METHOD] `/api/[resource]/[path]`

**Request:**
```json
{
  "field": "value"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "field": "value"
}
```

**Error Responses:**
- 400 Bad Request - [when?]
- 401 Unauthorized - [when?]
- 403 Forbidden - [when?]
- 404 Not Found - [when?]

**Reference:** `templates/api-endpoint-spec-template.md`

---

### Frontend Changes

**Components:**
- [ComponentName] - [purpose]

**Services:**
- [ServiceName].[methodName]() - [purpose]

**State Management:**
- [BehaviorSubject/Signal] - [what state]

**Routing:**
- [Route changes, if any]

---

## Decision Summary

### Final Decision

**Decision:** ✅ Approve / ⚠️ Approve with Changes / ❌ Reject

**Reasoning:**
[Dlaczego approve/reject, kluczowe argumenty]

---

### Alternative Approaches (jeśli applicable)

**Original Proposal:** [Description]
- **Pros:** [Lista pros]
- **Cons:** [Lista cons]
- **Decision:** [Accept/Reject]

**Simplified Alternative:** [Description]
- **Pros:** [Lista pros]
- **Cons:** [Lista cons]
- **Decision:** [Accept/Reject]

---

### Next Steps

1. [ ] Get user confirmation
2. [ ] Update `PROGRESS_TRACKER.md` (add tasks)
3. [ ] Create Flyway migration (if DB changes)
4. [ ] Start implementation (Chunk 1)

---

## Related Documentation

- `references/mvp-scope-boundaries.md` - MVP scope check
- `references/complexity-assessment.md` - complexity levels
- `references/workflow-3x3.md` - implementation pattern
- `references/verification-checklist.md` - checklist
- `examples/good-feature-breakdown.md` - przykład dobrej funkcji
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - tech constraints
