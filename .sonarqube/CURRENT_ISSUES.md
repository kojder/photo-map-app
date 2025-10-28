# SonarQube Issues - photo-map-app

**Last Updated:** 2025-10-28  
**Total OPEN Issues:** 57  
**Showing:** TOP 5 by severity (BLOCKER → CRITICAL → MAJOR)

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| BLOCKER | 1 | ⏳ To Fix |
| CRITICAL | 1 | ⏳ To Fix |
| MAJOR | 3 | ⏳ To Fix |

**Total effort for top 5:** ~16 minutes

## BLOCKER (1 issue)

### 1. Output bindings should not be named as standard DOM events
- [ ] **To Fix**
- **Key:** `AZooC6FAsJkyPCnzajQ2`
- **File:** `src/app/components/upload-dialog/upload-dialog.component.ts`
- **Line:** 14
- **Rule:** typescript:S7651
- **Type:** CODE_SMELL
- **Message:** Output bindings, including aliases, should not be named as standard DOM events
- **Effort:** 5min

**Details:**
Angular output properties should not use names that conflict with standard DOM events (like `click`, `change`, `input`, etc.). This can cause confusion and unexpected behavior.

---

## CRITICAL (1 issue)

### 2. Refactor function to reduce Cognitive Complexity
- [ ] **To Fix**
- **Key:** `AZooC6HRsJkyPCnzajRQ`
- **File:** `src/app/services/photo.service.ts`
- **Line:** 94
- **Rule:** typescript:S3776
- **Type:** CODE_SMELL
- **Message:** Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- **Effort:** 6min

**Details:**
The function has too many nested conditions, loops, or branches. Break it down into smaller, more focused functions.

---

## MAJOR (3 issues)

### 3. Empty CSS file
- [ ] **To Fix**
- **Key:** `AZooC6ApsJkyPCnzajQU`
- **File:** `src/app/components/login/login.component.css`
- **Line:** 1
- **Rule:** css:S4667
- **Type:** CODE_SMELL
- **Message:** Unexpected empty source
- **Effort:** 1min

**Fix:** Delete the empty CSS file or add `/* empty */` comment if it's intentionally empty.

---

### 4. Mark FormBuilder as readonly
- [ ] **To Fix**
- **Key:** `AZooC6BAsJkyPCnzajQV`
- **File:** `src/app/components/login/login.component.ts`
- **Line:** 20
- **Rule:** typescript:S2933
- **Type:** CODE_SMELL
- **Message:** Member 'fb: FormBuilder' is never reassigned; mark it as `readonly`.
- **Effort:** 2min

**Fix:** Add `readonly` modifier to the constructor parameter.

---

### 5. Mark AuthService as readonly
- [ ] **To Fix**
- **Key:** `AZooC6BAsJkyPCnzajQW`
- **File:** `src/app/components/login/login.component.ts`
- **Line:** 21
- **Rule:** typescript:S2933
- **Type:** CODE_SMELL
- **Message:** Member 'authService: AuthService' is never reassigned; mark it as `readonly`.
- **Effort:** 2min

**Fix:** Add `readonly` modifier to the constructor parameter.

---

## Next Steps

1. Fix BLOCKER issue first (upload-dialog output binding)
2. Fix CRITICAL issue (photo.service complexity)
3. Fix MAJOR issues (quick wins: empty CSS, readonly modifiers)
4. Run tests after each fix
5. Commit with conventional commit messages
6. Re-scan with SonarCloud to verify fixes

## Workflow

```bash
# After fixing issues, commit changes
git add .
git commit -m "fix(frontend): resolve SonarQube BLOCKER and CRITICAL issues"

# Wait 2-5 minutes, then re-fetch issues
# Pobierz aktualne sonarqube issues, 5 z najwyższym priority
```

---

**Note:** This file tracks HIGH PRIORITY issues only. For complete list, visit:  
https://sonarcloud.io/project/issues?resolved=false&id=kojder_photo-map-app

