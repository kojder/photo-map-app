# 🚀 Prompt do Rozpoczęcia Nowej Sesji - Date Picker Customization

**Data utworzenia:** 2025-10-30  
**Kontekst:** Po zakończeniu pracy nad testami date filtering i revercie z Material Datepicker

---

## 📋 Quick Start dla AI

```
Kontynuuj pracę nad Photo Map MVP. 

Przeczytaj:
1. PROGRESS_TRACKER.md - sekcja "Currently Working On"
2. .github/copilot-instructions.md - workflow i konwencje
3. Ten plik - kontekst poprzedniej sesji

Zadanie na tę sesję: Customizacja date pickera aby uniknąć US locale issues (mm/dd/yyyy).
```

---

## 🎯 Cel Sesji: Date Picker Customization

### Problem do Rozwiązania

**Obecny stan:**
- Używamy HTML5 `<input type="date">` z Tailwind styling
- ✅ Działa poprawnie (199/199 frontend tests passing)
- ❌ **Problem:** Nie da się w pełni kontrolować formatowania daty
  - Format zależy od locale przeglądarki
  - W niektórych przeglądarkach może pokazywać mm/dd/yyyy (US format)
  - User complaint: "mnie irytuje jeśli mam pozamieniane miesiące z dniami"

**Co próbowaliśmy wcześniej:**
- Angular Material Datepicker - **FAILED** ❌
  - Reason: Material + Tailwind CSS Preflight conflicts
  - Material form fields nie renderowały się poprawnie (brak outline borders)
  - Decyzja: revert to HTML5 input (commit 05f51aa)

### Plan Eksploracji

**Opcje do zbadania (w kolejności priorytetu):**

1. **CSS-only tricks dla HTML5 date input**
   - Próba wymuszenia formatu przez CSS
   - `::before`/`::after` pseudo-elements
   - `content` property z custom text
   - **Pros:** Najprostsze, bez dodatkowych zależności
   - **Cons:** Może nie działać na wszystkich przeglądarkach

2. **Angular CDK Datepicker (bez Material)**
   - Lżejsza alternatywa dla Material Datepicker
   - Więcej kontroli nad stylingiem
   - **Pros:** Official Angular package, dobre wsparcie
   - **Cons:** Wciąż wymaga @angular/cdk, może konfliktować z Tailwind

3. **External lightweight libraries:**
   - `flatpickr` - najpopularniejsza (vanilla JS, Angular wrapper available)
   - `ngx-daterangepicker-material` - Material-like ale bez Material deps
   - `ng-pick-datetime` - lightweight Angular datepicker
   - **Pros:** Dedykowane rozwiązania, dobre UX
   - **Cons:** Dodatkowe zależności, trzeba utrzymywać

4. **Custom Angular Component**
   - Własny date picker od zera
   - Pełna kontrola nad UX i formatowaniem
   - **Pros:** Zero dependencies, full control
   - **Cons:** Dużo pracy, trzeba obsłużyć edge cases (leap years, etc.)

### Acceptance Criteria

**Must Have:**
- ✅ Date picker zawsze pokazuje daty w formacie **dd.MM.yyyy** lub **yyyy-MM-dd**
- ✅ Działa spójnie na wszystkich przeglądarkach (Chrome, Firefox, Safari, Edge)
- ✅ Nie psuje się na różnych locale systemowych (en-US, pl-PL, de-DE, etc.)
- ✅ Utrzymuje Tailwind design consistency (blue-600 primary, rounded-lg, etc.)
- ✅ Wszystkie testy przechodzą (backend 78/78, frontend 199/199)
- ✅ Mobile-friendly (touch gestures, responsive layout)

**Nice to Have:**
- ⭐ Keyboard shortcuts (arrows, ESC, Enter)
- ⭐ Localized month/day names (Polski: "Styczeń", "Poniedziałek")
- ⭐ Date range selection w jednym pickerze
- ⭐ Animations/transitions (subtle, nie rozpraszające)

### Alternatywne Podejście (Fallback)

Jeśli customizacja date pickera okaże się zbyt skomplikowana lub czasochłonna:

**Plan B:** Pozostawić HTML5 `<input type="date">` z dodatkami:
1. **User instructions:** Tooltip/placeholder z oczekiwanym formatem
2. **Client-side validation:** Sprawdzanie formatu przed wysłaniem filtrów
3. **Format converter:** Auto-detect formatu (mm/dd vs dd/mm) i konwersja
4. **Accept reality:** Zaakceptować że format zależy od przeglądarki
   - Dla większości Polish users będzie ok (Chrome/Firefox z pl-PL pokazuje dd.MM.yyyy)
   - Edge cases (US locale) są rzadkie

---

## 📊 Stan Projektu Po Ostatniej Sesji

### ✅ Completed (2025-10-30)

**Backend:**
- PhotoSpecificationTest: 5 nowych testów (+124 linie kodu)
- Date filtering fully covered (takenBefore, takenAfter, ranges, timezone)
- All 78 tests passing ✅

**Frontend:**
- Reverted from Material Datepicker to HTML5 `<input type="date">`
- Removed Material dependencies (3 packages)
- FilterFabComponent: dateFrom/dateTo jako `string` (yyyy-MM-dd format)
- Browser locale detection w app.config.ts (getBrowserLocale)
- All 199 tests passing ✅

**Git:**
- Commit: `05f51aa` - "test(filters): add date filtering tests + revert to HTML5 date inputs"
- Branch: `master`
- Clean working directory (no uncommitted changes)

### 🔧 Key Files dla Tej Sesji

**Do potencjalnej modyfikacji:**
- `frontend/src/app/components/filter-fab/filter-fab.component.html` - Date input template
- `frontend/src/app/components/filter-fab/filter-fab.component.ts` - Date handling logic
- `frontend/src/app/components/filter-fab/filter-fab.component.css` - Date input styling
- `frontend/src/app/app.config.ts` - Locale configuration (jeśli używamy CDK/Material)
- `frontend/package.json` - Dependencies (jeśli dodajemy external library)

**Do przeczytania (kontekst):**
- `.github/copilot-instructions.md` - Project conventions, workflow
- `PROGRESS_TRACKER.md` - Roadmap, completed work
- `frontend/src/app/app.config.spec.ts` - Locale detection tests (reference)

---

## 🚦 Workflow Reminder

### Przed rozpoczęciem implementacji:

1. **Check development environment:**
   ```bash
   # Sprawdź czy backend + frontend działają
   tail -n 20 scripts/.pid/backend.log
   tail -n 20 scripts/.pid/frontend.log
   
   # Jeśli nie działają - uruchom (PostgreSQL już powinien działać w Dockerze)
   ./scripts/start-dev.sh
   ```

2. **Run tests (baseline):**
   ```bash
   # Backend tests
   cd backend && ./mvnw test
   # Expected: 78/78 passing
   
   # Frontend tests
   cd frontend && npm test -- --browsers=ChromeHeadless --watch=false
   # Expected: 199/199 passing
   ```

3. **Create feature branch (optional):**
   ```bash
   git checkout -b feature/date-picker-customization
   ```

### Podczas implementacji:

1. **Eksploruj opcje** - zacznij od najprostszych (CSS tricks)
2. **Testuj na różnych przeglądarkach** - Chrome, Firefox (minimum)
3. **Chrome DevTools MCP** - weryfikuj zmiany wizualne w przeglądarce
4. **Incremental commits** - commituj małe, działające zmiany

### Po implementacji:

1. **Run all tests:**
   ```bash
   # Backend (should still be 78/78)
   cd backend && ./mvnw test
   
   # Frontend (should still be 199/199)
   cd frontend && npm test -- --browsers=ChromeHeadless --watch=false
   ```

2. **Manual verification with Chrome DevTools MCP:**
   - Navigate to http://localhost:4200
   - Open filter panel (FAB button)
   - Check date inputs rendering
   - Try different locales (browser settings)
   - Verify mobile responsiveness

3. **Update documentation:**
   - `PROGRESS_TRACKER.md` - move task to "Last Completed"
   - `copilot-instructions.md` - if architecture/patterns changed
   - This file (NEW_SESSION_PROMPT.md) - if continuing in another session

4. **Commit with conventional message:**
   ```bash
   git add -A
   git status  # review changes
   git diff --cached --stat  # summary
   # Wait for user approval
   git commit -m "feat(filters): customize date picker to avoid US locale format"
   ```

---

## 💡 Helpful Resources

### Chrome DevTools MCP Usage

**See:** `.github/chrome-devtools.instructions.md` dla comprehensive guide

**Quick commands dla tej sesji:**
```
# Verify date picker rendering
"Navigate to localhost:4200 and take screenshot of filter panel with date inputs open"

# Test different locales
"Open Chrome DevTools → Settings → Language → change to en-US, refresh page, screenshot filter panel"

# Mobile verification
"Resize browser to mobile viewport (375x667), open filter panel, screenshot"

# Performance check
"Analyze filter panel performance - check for layout shifts or slow rendering"
```

### External Libraries Research

**If going with external library option:**

1. **flatpickr:**
   - Website: https://flatpickr.js.org/
   - Angular wrapper: `angularx-flatpickr` or use vanilla JS
   - Check bundle size impact: https://bundlephobia.com/package/flatpickr

2. **ngx-daterangepicker-material:**
   - GitHub: https://github.com/fetrarij/ngx-daterangepicker-material
   - Check compatibility with Angular 18 standalone components

3. **ng-pick-datetime:**
   - GitHub: https://github.com/DanielYKPan/date-time-picker
   - Last updated: check if maintained

**Evaluation criteria:**
- Bundle size (< 50KB preferred)
- Angular 18 compatibility
- Active maintenance (last commit < 6 months)
- TypeScript support
- Tailwind CSS compatibility
- Mobile support

---

## 🎯 Success Metrics

### Definition of Done:

- [ ] Date picker shows dates in dd.MM.yyyy or yyyy-MM-dd format consistently
- [ ] Works on Chrome, Firefox (minimum)
- [ ] Mobile-friendly (touch interactions work)
- [ ] All 78 backend tests passing (no regressions)
- [ ] All 199 frontend tests passing + any new tests
- [ ] Manual verification with Chrome DevTools MCP ✅
- [ ] PROGRESS_TRACKER.md updated
- [ ] Changes committed with conventional message
- [ ] User approval received 👍

### Time Estimate:

- **CSS-only approach:** 2-3 hours (if successful)
- **CDK/External library:** 4-6 hours (integration + testing)
- **Custom component:** 8-12 hours (full implementation)

**Recommended:** Start with CSS-only, escalate if needed.

---

## 🔗 Quick Links

- **Project Overview:** `README.md`
- **Workflow Instructions:** `CLAUDE.md`
- **Progress Tracker:** `PROGRESS_TRACKER.md`
- **Chrome DevTools Guide:** `.github/chrome-devtools.instructions.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`

---

**Last Updated:** 2025-10-30  
**Previous Commit:** 05f51aa - "test(filters): add date filtering tests + revert to HTML5 date inputs"  
**Next Session Goal:** Date picker customization to avoid US locale issues
