# Implementation Plan Template

## Feature: [Feature Name]

**Complexity:** Simple / Medium / Complex
**Estimated Chunks:** [1-2 / 3-5 / 6+]
**Estimated Timeline:** [1-2h / 3-6h / 6-12h]

---

## Phase 1: [Phase Name] (Chunks 1-3)

### Chunk 1: [Task Name] ([XX] min)

**Goal:** [What this chunk accomplishes]

**Implementation Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Files to Change:**
- `path/to/file1.java` - [what changes]
- `path/to/file2.ts` - [what changes]

**Test:**
```bash
# Backend test
curl -X [METHOD] http://localhost:8080/api/[endpoint]

# Frontend test
# [Manual test steps in browser]
```

**Expected Result:**
[What should happen after this chunk]

**Commit Message:**
```
type(scope): description

- Bullet 1
- Bullet 2
```

---

### Chunk 2: [Task Name] ([XX] min)

**Goal:** [What this chunk accomplishes]

**Implementation Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Files to Change:**
- `path/to/file1.java` - [what changes]
- `path/to/file2.ts` - [what changes]

**Test:**
```bash
# Test command
```

**Expected Result:**
[What should happen after this chunk]

**Commit Message:**
```
type(scope): description

- Bullet 1
- Bullet 2
```

---

### Chunk 3: [Task Name] ([XX] min)

**Goal:** [What this chunk accomplishes]

**Implementation Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Files to Change:**
- `path/to/file1.java` - [what changes]
- `path/to/file2.ts` - [what changes]

**Test:**
```bash
# Test command
```

**Expected Result:**
[What should happen after this chunk]

**Commit Message:**
```
type(scope): description

- Bullet 1
- Bullet 2
```

---

### CHECKPOINT #1

**What to Show User:**
- [Demo 1]
- [Demo 2]
- [Screenshots/video if applicable]

**Checkpoint Questions:**
1. Czy direction jest ok?
2. Czy user experience jest jak oczekiwany?
3. Czy coś należy zmienić przed kontynuacją?

**Possible Outcomes:**
- ✅ Continue → Phase 2
- ⚠️ Adjust → Refactor i kontynuuj
- ❌ Stop → Feature out of scope

---

## Phase 2: [Phase Name] (Chunks 4-6)

**Note:** Only for Medium/Complex features

### Chunk 4: [Task Name] ([XX] min)

[Repeat pattern from Chunk 1-3]

---

### Chunk 5: [Task Name] ([XX] min)

[Repeat pattern from Chunk 1-3]

---

### Chunk 6: [Task Name] ([XX] min)

[Repeat pattern from Chunk 1-3]

---

### CHECKPOINT #2

**What to Show User:**
- [Demo]

**Status:** [Feature complete? Needs more chunks?]

---

## Phase 3: [Phase Name] (Chunks 7-9)

**Note:** Only for Complex features

[Repeat pattern from Phase 1]

---

## Testing Checklist

### Unit Tests
- [ ] Backend service methods (coverage >70%)
- [ ] Frontend component logic
- [ ] Edge cases covered

### Integration Tests
- [ ] API endpoints (MockMvc)
- [ ] Full flow (controller → service → repository)
- [ ] Error scenarios

### Manual Tests
- [ ] Happy path w browser/curl
- [ ] Edge cases: [list specific cases]
- [ ] Error handling: [list specific scenarios]
- [ ] User scoping enforced

---

## Acceptance Criteria Verification

- [ ] Criterion 1: [testable criterion]
- [ ] Criterion 2: [testable criterion]
- [ ] Criterion 3: [testable criterion]

**All criteria met?** ✅ YES / ❌ NO

**If NO, what's missing:**
[List items]

---

## Completion Summary

### Metrics
- **Total chunks:** [actual number]
- **Total time:** [actual time]
- **Complexity:** [was estimate correct?]
- **Files changed:** [count]

### What Went Well ✅
1. [Success 1]
2. [Success 2]

### Challenges ⚠️
1. [Challenge 1 - how solved]
2. [Challenge 2 - how solved]

### Lessons Learned 💡
1. [Lesson 1]
2. [Lesson 2]

### Final Status
✅ Feature complete - ready for production
⚠️ Feature complete - needs polish
❌ Feature incomplete - needs more work

---

## Post-Implementation Tasks

- [ ] Update `PROGRESS_TRACKER.md` - mark completed
- [ ] Update documentation (if needed)
- [ ] Code review (if team)
- [ ] Manual testing w production-like environment
- [ ] User acceptance testing

---

## Related Documentation

- `references/verification-checklist.md` - checklist before/during/after
- `examples/good-feature-breakdown.md` - przykład dobrego planu
- `.ai/prd.md` - MVP requirements
- `.ai/tech-stack.md` - tech constraints
