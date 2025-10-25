# Technology Decisions - Photo Map MVP

**Version:** 1.0
**Date:** 2025-10-19
**Purpose:** Decision rationale and technology comparisons

---

## Overview

Ten dokument wyjaśnia **DLACZEGO** wybraliśmy każdą technologię w stacku Photo Map MVP. Jest to **decision context dla ludzi** i **optional reference dla Claude Code** (gdy rozważa alternatywy lub dodaje nowe biblioteki).

**Dla implementacji specs:** Zobacz `.ai/tech-stack.md`

---

## Frontend Decisions

### Angular 18 - Dlaczego?

**Uzasadnienie wyboru:**
- **Standalone components** - eliminuje NgModules complexity, prostsza architektura
- **Modern features** - Signals, built-in control flow (@if, @for), improved performance
- **Mature ecosystem** - extensive libraries, tools, community support
- **TypeScript first** - strong typing reduces bugs, improves maintainability
- **CLI tooling** - scaffolding, building, testing out of the box

**Dlaczego Angular a nie React?**
- React wymaga więcej decyzji (routing library? state management? form handling?)
- Angular ma opinionated structure - szybszy start dla MVP
- TypeScript integration lepsze w Angular (built-in vs optional w React)

**Dlaczego Angular a nie Vue?**
- Vue ma mniejszy ecosystem dla enterprise apps
- Angular ma lepsze Spring Boot integration patterns (dokumentacja, examples)
- Bigger community dla Angular + Java stacku

### TypeScript 5.5.2+ (Strict Mode) - Dlaczego?

**Uzasadnienie:**
- **Type safety** - catch errors at compile time, not runtime
- **Better IDE support** - autocomplete, refactoring, navigation
- **Self-documenting** - types serve as documentation
- **Required by Angular** - Angular is built with TypeScript

**Dlaczego strict mode?**
- Maksymalna type safety
- Prevents implicit any
- Strict null checks - less runtime errors
- Better for long-term maintainability

### Tailwind CSS 3.4.17 - Dlaczego?

**Uzasadnienie:**
- **Rapid UI development** - build interfaces directly in HTML
- **Consistency** - predefined design system (spacing, colors, breakpoints)
- **Small bundle size** - PurgeCSS removes unused styles
- **No CSS conflicts** - utility classes avoid naming collisions

**Dlaczego Tailwind a nie SCSS?**
- SCSS requires more boilerplate and custom naming conventions
- Tailwind is faster for prototyping and MVP development
- No need to maintain separate .scss files

**Dlaczego Tailwind a nie CSS-in-JS?**
- CSS-in-JS adds complexity and bundle size
- Runtime performance overhead
- Tailwind is simpler for MVP

**Dlaczego Tailwind 3.x a nie 4.x?**
- **Angular 18 incompatibility** - Angular 18 doesn't support Tailwind 4 yet
- Tailwind 3.4.17 is stable and well-tested
- Can upgrade to 4.x when Angular adds support

### Leaflet.js 1.9.4 - Dlaczego?

**Uzasadnienie:**
- **Lightweight** - ~40KB gzipped vs Google Maps
- **Free** - open-source, OpenStreetMap tiles (no API keys)
- **Battle-tested** - industry standard for web maps
- **Mobile-friendly** - touch gestures, responsive
- **Extensible** - plugin ecosystem (marker clustering)

**Dlaczego Leaflet a nie Google Maps?**
- Google Maps requires API key
- Usage limits and costs for commercial use
- Leaflet is completely free

**Dlaczego Leaflet a nie Mapbox?**
- Mapbox also requires API key and has usage limits
- More complex setup than Leaflet
- Leaflet + OpenStreetMap is simpler for MVP

### State Management: Services + RxJS (NO NgRx) - Dlaczego?

**Uzasadnienie:**
- **MVP simplicity** - no Redux-like complexity
- Clear pattern: `BehaviorSubject` (private) → `Observable` (public) → Component
- **Less boilerplate** - no actions, reducers, effects
- **Easier testing** - simple unit tests for services

**Dlaczego NIE NgRx?**
- Overkill for MVP scope
- Steeper learning curve
- More code to maintain (actions, reducers, effects, selectors)
- Can add NgRx later if state complexity grows

**Dlaczego NIE Akita?**
- Similar complexity to NgRx
- Smaller community than NgRx
- Simple services are enough for MVP

---

## Backend Decisions

### Spring Boot 3.2.11 (Java 17) - Dlaczego?

**Uzasadnienie:**
- **Enterprise-grade** - proven in production at massive scale
- **Auto-configuration** - minimal setup, sensible defaults
- **Embedded server** - no separate Tomcat/Jetty needed (JAR deployment)
- **Extensive ecosystem** - Spring Data, Spring Security, Spring Boot Actuator built-in
- **Java 17 support** - modern language features (records, pattern matching)

**Dlaczego Spring Boot a nie Node.js/Express?**
- **Better for CPU-intensive tasks** - thumbnail generation, EXIF extraction benefit from JVM performance
- **Stronger typing** - Java vs JavaScript (even with TypeScript on backend)
- **Enterprise patterns built-in** - dependency injection, transaction management, etc.
- **Team familiarity** - if team knows Java, Spring Boot is natural choice

**Dlaczego Spring Boot a nie Django/Flask (Python)?**
- Python is slower for CPU-intensive image processing
- Java has better concurrency model
- Spring Boot ecosystem is more mature for REST APIs

**Dlaczego Java 17 (LTS) a nie Java 21?**
- **Java 17 is more stable** for production MVP (LTS until 2029)
- Better library compatibility
- Can upgrade to Java 21 later when it's more widely adopted

### PostgreSQL 15 - Dlaczego?

**Uzasadnienie:**
- **Open source** - no licensing costs
- **ACID compliance** - reliability for photo metadata
- **JSON support** - flexible metadata storage (EXIF data)
- **Mikrus compatible** - runs well on VPS
- **Advanced features** - CTEs, window functions, full-text search (future)

**Dlaczego PostgreSQL a nie MySQL?**
- Better JSON support (native JSONB type)
- More advanced features (CTEs, window functions)
- Better for complex queries
- PostGIS extension available (future geospatial features)

**Dlaczego PostgreSQL a nie MongoDB?**
- **Relational model fits better** - users have photos (clear foreign key relationship)
- **ACID guarantees important** - photo metadata must be consistent
- **Simpler for MVP** - no need for NoSQL flexibility
- **Query complexity** - joins and transactions are easier in SQL

### Spring Security 6 (JWT) - Dlaczego?

**Uzasadnienie:**
- **Industry standard** - most secure Java framework
- **JWT support** - stateless authentication
- **Role-based access** - @PreAuthorize annotations
- **BCrypt built-in** - password hashing (slow by design, salted)
- **CSRF protection** - for stateful sessions if needed

**Dlaczego JWT a nie Sessions?**
- **Stateless** - no session storage on server (scales better)
- **Mobile-friendly** - works with any HTTP client
- **Scalable** - easy to add more servers later (no session replication needed)
- **Self-contained** - token contains user info + claims

**Dlaczego NIE OAuth2/OIDC?**
- Too complex for MVP
- No external identity providers needed
- Can add OAuth2 later if needed

### Photo Processing Libraries - Dlaczego?

#### metadata-extractor 2.19.0
**Uzasadnienie:**
- **Pure Java** - no native dependencies (easier deployment)
- **Comprehensive** - supports EXIF, IPTC, XMP
- **Maintained** - active development
- **Format support** - JPEG, PNG, TIFF, etc.

**Co ekstraktujemy i dlaczego:**
- GPS coordinates - **essential** for map visualization
- Date taken - **essential** for sorting/filtering
- Image dimensions - **useful** for display

**Czego NIE ekstraktujemy:**
- Camera make/model - **not needed** for MVP
- Lens info - **not needed** for MVP
- Exposure settings - **not needed** for MVP
- Rationale: MVP simplicity, less data to store

#### Thumbnailator 0.4.20
**Uzasadnienie:**
- **Simple API** - one-liner for resizing
- **Quality control** - preserve image quality
- **Multiple formats** - JPEG, PNG support
- **Efficient** - optimized for performance

**Dlaczego 3 rozmiary miniatur?**
- **Small (150x150px)** - gallery thumbnails, map markers (minimal bandwidth)
- **Medium (400x400px)** - photo preview (balance quality/bandwidth)
- **Large (800x800px)** - detailed view (high quality preview)
- **Original** - available for download

### Deployment Decisions

#### Nginx - Dlaczego?

**Uzasadnienie:**
- **Lightweight** - low memory footprint (perfect for Mikrus VPS)
- **Fast** - efficient static file serving
- **Reverse proxy** - forward `/api/*` to Spring Boot
- **HTTPS** - easy Let's Encrypt integration

**Dlaczego Nginx a nie Apache?**
- Lower resource usage (critical for Mikrus)
- Better for reverse proxy scenarios
- Simpler configuration for MVP

#### Systemd - Dlaczego?

**Uzasadnienie:**
- **Built-in** - standard on modern Linux
- **Auto-restart** - restart on crashes
- **Boot start** - start on server reboot
- **Logging** - integrated with journalctl

**Dlaczego NIE Docker (dla MVP)?**
- **Simpler deployment** - just copy JAR file
- **Lower resource usage** - no container overhead (critical for Mikrus)
- **Easier debugging** - direct access to logs
- Can add Docker later for production scaling

---

## Development Tooling Decisions

### GitHub Copilot Configuration - Dlaczego?

**Date:** 2025-10-25

**Uzasadnienie:**
- **AI-assisted development** - faster coding with context-aware suggestions
- **Project-specific patterns** - enforce conventions (Conventional Commits, testing >70%, security patterns)
- **Automated workflows** - documentation sync, test generation, code reviews
- **Consistency** - all AI agents (Copilot, Claude) follow same rules

**Struktura:**
1. **`.github/copilot-instructions.md`** - Main instructions (~350 lines)
   - Architecture patterns (Spring Integration, BehaviorSubject, JWT)
   - Git workflow (commit review, NEVER auto-push)
   - Testing requirements (>70% coverage, JUnit/Jasmine patterns)
   
2. **`.github/backend.instructions.md`** - Backend-specific (~240 lines)
   - User scoping security pattern (CRITICAL)
   - DTOs always (never expose entities)
   - @Transactional on services
   - Auto-applies when editing `.java`, `.xml`, `.properties`, `.sql`
   
3. **`.github/frontend.instructions.md`** - Frontend-specific (~280 lines)
   - Standalone components ONLY (no NgModules)
   - inject() function (not constructor injection)
   - BehaviorSubject vs signals pattern
   - Tailwind 3.4.17 constraint
   - Auto-applies when editing `.ts`, `.html`, `.css`
   
4. **`.github/prompts/`** - Reusable commands
   - `/update-docs` - sync PROGRESS_TRACKER, .ai/, .decisions/, README
   - `/generate-tests` - JUnit 5 + Mockito (backend), Jasmine + Karma (frontend)
   - `/commit-message` - Conventional Commits with project scopes
   - `/review-code` - security + quality checklist

**Dlaczego NIE samo README.md?**
- GitHub Copilot nie czyta README.md automatycznie
- `.instructions.md` files są dodawane do kontekstu automatycznie przy edycji plików
- Prompts są reusable commands (nie trzeba powtarzać kontekstu)

**Dlaczego applyTo patterns?**
- Backend instructions tylko przy edycji backend files (oszczędność kontekstu)
- Frontend instructions tylko przy edycji frontend files
- Mniej tokensów zużytych = lepsza wydajność

**Dlaczego oddzielne prompts?**
- `/update-docs` - dokumentacja może się rozjechać, potrzeba automatyzacji
- `/generate-tests` - >70% coverage requirement, szablony dla JUnit/Jasmine
- `/commit-message` - Conventional Commits format enforcement
- `/review-code` - security checklist (user scoping, validation, SQL injection)

**Trade-offs:**
- ✅ Pros: Consistency, automation, context-aware AI suggestions
- ⚠️ Cons: Może być overwhelming na początku (3 instruction files + 4 prompts)
- ⚠️ Maintenance: Trzeba updatować instructions gdy zmienia się architektura

**Alternatives considered:**
- **Single copilot-instructions.md** - za długi (~850 linii), za dużo kontekstu
- **No instructions** - AI nie zna project-specific patterns (security, testing)
- **Comments in code** - nie skaluje się, trudno utrzymać

**Best practices followed:**
- YAML frontmatter z `description` i `applyTo` (oficjalny format VS Code)
- .instructions.md dla auto-apply rules (200-300 linii max)
- .prompt.md dla reusable commands
- Bez `tools` field w YAML (VS Code nie wspiera)

### Photo Viewer - Fullscreen Photo Browser

**Date:** 2025-10-25
**Status:** ✅ Implemented (Phase 1-4 Complete)

**Uzasadnienie:**
- **Immersive photo viewing** - users can browse photos without UI clutter
- **Keyboard navigation** - arrows for next/prev, ESC to close (desktop standard)
- **Mobile touch gestures** - swipe left/right for navigation, tap-to-close
- **Context-aware** - navigates only through filtered photos from gallery or map
- **Returns to source** - maintains user context (gallery vs map route)
- **Simple implementation** - CSS position: fixed, no browser fullscreen API complexity

**Technical decisions:**
1. **CSS Fixed Position vs Browser Fullscreen API**
   - CSS `position: fixed` + `z-index: 9999` chosen for simplicity
   - Avoids browser compatibility issues
   - Better control over UI elements
   - Consistent experience across browsers

2. **Photo Size: Large (800px) vs Original**
   - Initially used `originalDirectory` (blurry on small screens)
   - Changed to `largeDirectory` (800px) for optimal quality/performance
   - Original files can be 5-10MB (slow on mobile networks)
   - 800px is sweet spot for most screens

3. **State Management: PhotoViewerService**
   - BehaviorSubject pattern consistent with PhotoService, FilterService
   - Stores: photos array, currentIndex, sourceRoute
   - Components subscribe to `viewerState$`
   - Simple to test and maintain

4. **Source Route Tracking**
   - Service stores `/gallery` or `/map` when opening viewer
   - `Router.navigate(sourceRoute)` when closing
   - Preserves filter state and scroll position
   - Better UX than always returning to gallery

5. **Mobile Touch Gestures**
   - 50px swipe threshold (industry standard, prevents accidental triggers)
   - Tap-to-close: movement <10px = tap, ≥10px = ignored
   - Touch targets: 48px minimum (WCAG accessibility guidelines)
   - Always visible controls on mobile (no hover state)

**Implementation phases:**
- ✅ Phase 1: Core viewer component with keyboard navigation (~1.5h)
- ✅ Phase 2: Gallery integration - click photo → fullscreen (~1h)
- ✅ Phase 3: Map integration - click popup thumbnail → fullscreen (~1h)
- ✅ Phase 4: Mobile touch support (swipe gestures, tap-to-close) (~1.5h)
- 🔜 Phase 5: UX enhancements (loading, preloading, animations) (~2h) - optional

**Trade-offs:**
- ✅ Pros: Simple, fast, works everywhere, keyboard+touch friendly
- ⚠️ Cons: Not native fullscreen (browser chrome still visible)
- ✅ Benefit: Mobile-first design with touch gesture support

**Alternatives considered:**
- **Browser Fullscreen API** - more complex, browser compatibility issues, rejected
- **Lightbox library (ng-gallery)** - adds dependency, less control, rejected
- **Modal dialog** - less immersive, not truly fullscreen, rejected

**Future enhancements (optional):**
- Phase 5: Preloading (next/prev photos), loading states, fade animations
- Image zoom/pan functionality
- Photo metadata display (filename, date, rating in footer)

**Testing:**
- ✅ Unit tests: 27/27 passing (keyboard nav + touch gestures + boundaries)
- ✅ Backend tests: 61/61 passing
- 📝 Manual testing recommended: Chrome DevTools MCP on mobile viewport

### Chrome DevTools MCP - Dlaczego?

**Date:** 2025-10-25

**Uzasadnienie:**
- **Frontend verification** - AI może "zobaczyć" co dzieje się w przeglądarce
- **Real-time debugging** - inspect console errors, network failures, DOM state
- **Performance analysis** - measure LCP, TBT, FCP with real traces
- **Integration testing** - simulate user flows (login → upload → gallery → map)

**Capabilities:**
1. **Verify code changes** - AI can test its changes in real browser
2. **Diagnose errors** - console.log, network 404/500, CORS issues visible
3. **Performance audits** - run traces, analyze metrics, suggest optimizations
4. **DOM inspection** - check layout, CSS, element states
5. **User simulation** - fill forms, click buttons, upload files

**Integration with Photo Map MVP:**
- **After frontend implementation** - verify login, gallery, map work correctly
- **Bug diagnosis** - "photos not loading" → check console + network
- **Before deployment** - performance audit, responsive design check
- **CRITICAL step** - always verify app is running first (check logs, start with `./scripts/start-dev.sh`)

**Tools used:**
- `navigate_page` - open localhost:4200
- `list_console_messages` - check JS errors
- `list_network_requests` - verify API calls to localhost:8080
- `performance_start_trace` / `performance_analyze_insight` - performance metrics
- `take_snapshot` / `take_screenshot` - DOM/visual inspection
- `click` / `fill_form` / `upload_file` - user interaction simulation

**Dlaczego Chrome DevTools MCP a nie tylko manual testing?**
- **Automated verification** - AI can test immediately after implementation
- **Evidence-based debugging** - real console errors, not guesswork
- **Performance data** - actual LCP/TBT metrics, not assumptions
- **Repeatable** - same test scenario every time

**Dlaczego NIE Playwright/Cypress dla MVP?**
- Chrome DevTools MCP integrates with AI workflow (no separate test files)
- Faster feedback loop (AI verifies inline)
- Can add Playwright E2E later for CI/CD

**Trade-offs:**
- ✅ Pros: AI gets real browser feedback, faster debugging, performance insights
- ⚠️ Cons: Requires app to be running, adds MCP server dependency
- ⚠️ Limitation: Public preview (active development, API may change)

**Best practices:**
- Always check app status first (`scripts/.pid/backend.log`, `frontend.log`)
- Start app if needed (`./scripts/start-dev.sh --with-db`)
- Use for verification AFTER implementation (not during)
- Check console + network together (root cause often in network)

**Documentation:** `.github/chrome-devtools.instructions.md` (~350 lines)

---

## Technology Decisions Summary

### ✅ CO INCLUDUJEMY:

- **Angular 18** - modern framework, standalone components
- **TypeScript 5.5.2+** - type safety, strict mode
- **Tailwind CSS 3.4.17** - rapid UI development
- **Leaflet.js** - free, lightweight maps
- **RxJS Services** - simple state management
- **Spring Boot 3** - enterprise backend framework
- **Java 17 LTS** - stable, modern features
- **Spring Security 6** - JWT authentication
- **PostgreSQL 15** - reliable relational database
- **Nginx** - lightweight web server
- **Systemd** - simple process management

### ❌ CO EXCLUDUJEMY (i dlaczego):

- **NgRx/Redux** - too complex for MVP, simple services are enough
- **Docker** - adds complexity, not needed for single-server MVP
- **Google Maps** - costs, API keys (Leaflet is free)
- **Mapbox** - similar to Google Maps issues
- **MongoDB** - relational model fits better, no need for NoSQL
- **Redis** - overkill for MVP, in-memory cache in Spring Boot is enough
- **RabbitMQ/Kafka** - no need for message queues, process immediately
- **Kubernetes** - one VPS is enough, no orchestration needed
- **GraphQL** - REST is simpler and sufficient for MVP
- **OAuth2/OIDC** - too complex for MVP, JWT is enough
- **Java 21** - Java 17 LTS is more stable for production

---

## Future Considerations

Po stabilizacji MVP można rozważyć:

🔮 **Docker Deployment** - jeśli potrzebujemy multiple environments
🔮 **Redis Cache** - jeśli performance becomes issue (>50 concurrent users)
🔮 **NgRx** - jeśli state complexity grows significantly
🔮 **CDN** - jeśli serving users globally
🔮 **GraphQL** - jeśli frontend needs more flexible queries
🔮 **WebSocket** - dla real-time notifications
🔮 **Kubernetes** - jeśli scaling beyond single VPS

---

**Document Purpose:** Decision rationale for humans + optional reference for Claude Code
**Related:** `.ai/tech-stack.md` (implementation specs)
**Last Updated:** 2025-10-25
