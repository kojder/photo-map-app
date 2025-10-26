# Tech Stack Analysis - Prompt Template

## Purpose

Ten template to prompt do przeprowadzenia krytycznej analizy tech stacku pod kątem wymagań PRD. Używany AFTER wygenerowania PRD, aby zweryfikować czy wybrane technologie są odpowiednie.

---

## Prompt Template

```
<tech-stack>
{{tech-stack}} <- wprowadź tutaj opis swojego stacku
</tech-stack>

Dokonaj krytycznej lecz rzeczowej analizy czy <tech-stack> odpowiednio adresuje
potrzeby @prd.md. Rozważ następujące pytania:

1. Czy technologia pozwoli nam szybko dostarczyć MVP?
2. Czy rozwiązanie będzie skalowalne w miarę wzrostu projektu?
3. Czy koszt utrzymania i rozwoju będzie akceptowalny?
4. Czy potrzebujemy aż tak złożonego rozwiązania?
5. Czy nie istnieje prostsze podejście, które spełni nasze wymagania?
6. Czy technologie pozwolą nam zadbać o odpowiednie bezpieczeństwo?

Wygeneruj szczegółową analizę w formacie markdown z następującymi sekcjami:

## Analiza Tech Stack

### 1. Time to Market (MVP Delivery Speed)
[Ocena: Szybki / Średni / Wolny]
[Uzasadnienie: dlaczego tak oceniasz?]

### 2. Skalowalno ść
[Ocena: Wysoka / Średnia / Niska]
[Uzasadnienie: czy można dodawać features bez major refactoring?]

### 3. Koszt Utrzymania
[Ocena: Niski / Średni / Wysoki]
[Breakdown: licensing, hosting, developer time]

### 4. Complexity Assessment
[Ocena: Odpowiedni / Over-engineered / Under-engineered]
[Uzasadnienie: czy poziom złożoności pasuje do MVP?]

### 5. Prostsze Alternatywy
[Lista: czy są prostsze rozwiązania dla poszczególnych komponentów?]

### 6. Bezpieczeństwo
[Ocena: Wystarczające / Wymaga Wzmocnienia / Niewystarczające]
[Checklist: authentication, authorization, data encryption, input validation]

## Rekomendacje

### Zatwierdzone Technologie ✅
[Lista: które technologie są OK]

### Wymaga Zmian ⚠️
[Lista: które technologie powinny być zamienione + alternatywy]

### Red Flags ❌
[Lista: które technologie są problematyczne + dlaczego]

## Podsumowanie

[Końcowy verdict: APPROVE / APPROVE WITH CHANGES / REJECT]
[Kluczowe argumenty]
```

---

## Example Input

### Tech Stack Description:

```
Frontend: Angular 18 (standalone components), TypeScript 5, Tailwind CSS 4, Leaflet.js
Backend: Spring Boot 3, Java 17, PostgreSQL 15, Spring Security (JWT)
Libraries: metadata-extractor (EXIF), Thumbnailator (thumbnails)
Caching: Redis
Background Jobs: Celery (Python)
Deployment: Mikrus VPS (limited resources)
```

---

## Example Output

```markdown
## Analiza Tech Stack

### 1. Time to Market (MVP Delivery Speed)
**Ocena:** Średni

**Uzasadnienie:**
- ✅ Angular CLI + Spring Boot auto-config → szybki start
- ✅ PostgreSQL well-known → brak learning curve
- ⚠️ Tailwind 4 → Angular 18 incompatible (breaking change!)
- ❌ Redis + Celery → dodatkowa konfiguracja, deployment complexity
- ❌ Celery (Python) → multi-language stack (Java + Python)

**Timeline Impact:** +2-3 dni na setup Redis/Celery, troubleshooting Tailwind 4 issues

---

### 2. Skalowalność
**Ocena:** Wysoka

**Uzasadnienie:**
- ✅ Spring Boot + PostgreSQL → proven scalability
- ✅ Angular SPA → client-side rendering, nie obciąża backend
- ✅ Redis caching → performance boost (ale see Section 4)

**Potential Issues:**
- Mikrus VPS ma limited resources → Redis może być overkill
- Celery wymaga separate worker processes → resource contention

---

### 3. Koszt Utrzymania
**Ocena:** Średni

**Breakdown:**
- **Licensing:** €0 (all open-source)
- **Hosting:** Mikrus VPS €5/month (OK)
- **Developer Time:**
  - Multi-language (Java + Python) → higher maintenance
  - Redis + Celery → more components to monitor/debug
  - Tailwind 4 issues → bugfixing Angular incompatibility

**Annual Cost Estimate:** €60 hosting + ~20-30h/year maintenance

---

### 4. Complexity Assessment
**Ocena:** Over-engineered

**Uzasadnienie:**
- ❌ **Redis** - dla MVP in-memory cache wystarczy (60s TTL)
- ❌ **Celery** - Mikrus VPS nie ma zasobów na background workers
  - Spring Integration file monitoring może zastąpić Celery
- ❌ **Multi-language** (Java + Python) - adds deployment complexity
- ⚠️ **Tailwind 4** - Angular 18 incompatible, should use 3.x

**Verdict:** Stack jest za złożony dla MVP. Prostsze alternatywy dostępne.

---

### 5. Prostsze Alternatywy

| Component | Current | Simpler Alternative | Benefit |
|-----------|---------|---------------------|---------|
| Caching | Redis | In-memory (Caffeine, Guava) | No separate service, Mikrus-friendly |
| Background Jobs | Celery (Python) | Spring Integration | Single language, no workers |
| CSS Framework | Tailwind 4 | Tailwind 3.4.17 | Angular 18 compatible |

**Recommended Changes:**
1. **Redis → In-memory cache** (Spring @Cacheable with Caffeine)
2. **Celery → Spring Integration** (FileInboundChannelAdapter dla batch upload)
3. **Tailwind 4 → Tailwind 3.x** (Angular 18 compatible version)

---

### 6. Bezpieczeństwo
**Ocena:** Wystarczające (with JWT + Spring Security)

**Checklist:**
- ✅ **Authentication:** JWT tokens (stateless)
- ✅ **Password Hashing:** BCrypt (Spring Security built-in)
- ✅ **Authorization:** Role-based (USER/ADMIN) + user scoping
- ✅ **Input Validation:** @Valid annotations + DTO validation
- ⚠️ **HTTPS:** Need SSL certificate (Let's Encrypt) - deployment Phase 6
- ⚠️ **CORS:** Need configuration (allow Angular frontend origin)

**Additional Security Concerns:**
- File upload security: validate MIME type, max file size
- SQL injection: use JPA (PreparedStatements automatically)
- XSS: Angular sanitizes by default, verify no [innerHTML] usage

---

## Rekomendacje

### Zatwierdzone Technologie ✅
1. **Angular 18** (standalone components) - modern, well-supported
2. **Spring Boot 3 + Java 17** - mature, excellent ecosystem
3. **PostgreSQL 15** - reliable, proven for photo metadata
4. **Spring Security + JWT** - industry standard for auth
5. **Leaflet.js** - lightweight, perfect dla map view
6. **metadata-extractor** - pure Java, no native dependencies
7. **Thumbnailator** - simple thumbnail generation

---

### Wymaga Zmian ⚠️

1. **Tailwind CSS 4 → Tailwind 3.4.17**
   - **Powód:** Angular 18 incompatible with Tailwind 4
   - **Action:** Use version 3.x until Angular supports v4

2. **Redis → In-memory cache (Caffeine/Guava)**
   - **Powód:** Overkill dla MVP, Mikrus VPS limited resources
   - **Action:** Spring @Cacheable with in-memory cache (60s TTL)

3. **Celery (Python) → Spring Integration**
   - **Powód:** Multi-language complexity, Mikrus VPS no background workers
   - **Action:** Spring Integration FileInboundChannelAdapter (Java only)

---

### Red Flags ❌

1. **❌ Tailwind 4 + Angular 18** - INCOMPATIBLE (breaking change)
   - Impact: High (broken styles, build errors)
   - Fix: Downgrade to Tailwind 3.x immediately

2. **❌ Celery on Mikrus VPS** - Resource constraint violation
   - Impact: High (performance issues, worker crashes)
   - Fix: Use Spring Integration instead

3. **❌ Redis on Mikrus VPS** - Unnecessary complexity
   - Impact: Medium (extra service to manage, resource usage)
   - Fix: Use in-memory cache for MVP

---

## Podsumowanie

**Final Verdict:** ⚠️ **APPROVE WITH CHANGES**

**Kluczowe Argumenty:**

**Strengths:**
- Core stack (Angular + Spring Boot + PostgreSQL) is solid ✅
- Security setup appropriate (JWT + Spring Security) ✅
- Libraries well-chosen (metadata-extractor, Thumbnailator) ✅

**Required Changes:**
1. Downgrade Tailwind 4 → 3.4.17 (compatibility)
2. Remove Redis → in-memory cache (simplicity)
3. Remove Celery → Spring Integration (Mikrus constraints)

**After Changes:**
- ✅ Time to Market: Szybki (remove multi-language complexity)
- ✅ Koszt: Niski (fewer components, simpler deployment)
- ✅ Complexity: Odpowiedni (no over-engineering)
- ✅ Mikrus VPS: Compatible (no Redis, no Celery workers)

**Recommended Final Stack:**
```
Frontend: Angular 18, TypeScript 5, Tailwind CSS 3.4.17, Leaflet.js
Backend: Spring Boot 3, Java 17, PostgreSQL 15, Spring Security (JWT), Spring Integration
Caching: In-memory (Caffeine) - 60s TTL
Libraries: metadata-extractor, Thumbnailator
Deployment: Mikrus VPS, Nginx, Systemd
```

**Next Steps:**
1. Update tech stack documentation (`.ai/tech-stack.md`)
2. Document decisions in `.decisions/tech-decisions.md`
3. Proceed with detailed planning (db-plan, api-plan, ui-plan)
```

---

## Usage Instructions

### When to Use

Use this prompt AFTER:
- ✅ PRD generated (`.ai/prd.md` complete)
- ✅ Initial tech stack proposed
- ✅ Before detailed implementation planning

**Triggers:**
- User proposes tech stack
- Want to verify tech choices
- Uncertain about complexity level
- Need to justify decisions to stakeholders

### How to Use

1. **Prepare Tech Stack Description**
   - List all technologies (frontend, backend, database, libraries)
   - Include hosting constraints (Mikrus VPS, AWS, etc.)
   - Note any special requirements

2. **Insert into Template**
   - Paste description into `{{tech-stack}}`
   - Reference PRD (use @prd.md)

3. **Run Analysis**
   - AI generates detailed analysis
   - Review each section carefully

4. **Act on Recommendations**
   - Approve ✅ → proceed with planning
   - Changes ⚠️ → update tech stack, re-analyze
   - Reject ❌ → reconsider entire approach

---

## Quality Checklist

### Good Analysis Should Have:

- [ ] **Specific Assessments** (not vague "it's good/bad")
- [ ] **Concrete Alternatives** (if suggesting changes)
- [ ] **Cost/Benefit Analysis** (trade-offs clear)
- [ ] **Constraints Considered** (Mikrus VPS, budget, timeline)
- [ ] **Security Addressed** (not overlooked)
- [ ] **Clear Verdict** (approve/changes/reject + why)

### Red Flags in Analysis:

- ❌ Too positive (no critical points) - AI being overly agreeable
- ❌ Too negative (rejecting everything) - AI being overly critical
- ❌ No alternatives suggested - not actionable
- ❌ Ignores constraints - analysis not grounded in reality

---

## Related Documentation

- `references/10xdevs-methodology.md` - metodologia analizy stacku
- `references/prd-planning-process.md` - proces PRD → tech stack → szczegóły
- `templates/prd-summary-template.md` - poprzedni krok (summary)
- `.ai/tech-stack.md` - przykład finalnego tech stack doc
- `.decisions/tech-decisions.md` - dokumentacja decyzji technicznych
