---
name: Frontend Verification & Testing
description: Verify and test Angular 18 frontend changes using Chrome DevTools MCP. Automatically check console errors, network requests, and visual rendering after implementing tasks or when fixing UI bugs. Use when creating components, debugging visual issues, validating API integration, or ensuring UI requirements are met. File types: .ts, .html, .css, .scss
allowed-tools: Read, Bash, mcp__chrome-devtools__*
---

# Frontend Verification & Testing - Photo Map MVP

## Project Context

**Photo Map MVP** - Angular 18 SPA dla zarządzania zdjęciami z geolokalizacją.

**Frontend Stack:**
- **Angular:** 18.2.0+ (standalone components)
- **Dev Server:** http://localhost:4200
- **Backend API:** http://localhost:8080
- **Build Tool:** Angular CLI + esbuild

**Backend Context:**
- **Spring Boot:** 3.2.11+
- **API Base:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/actuator/health

**Key Constraints:**
- Both frontend and backend must be running for full verification
- JWT authentication required for protected routes
- All API calls should include `Authorization: Bearer <token>` header

---

## When to Use This Skill

**Automatic Triggers (use proactively when):**

1. **After implementing task logic** - po ukończeniu implementacji feature z taska
   - Example: Po dodaniu Gallery Component → weryfikuj czy zdjęcia się ładują
   - Example: Po implementacji Login Component → sprawdź formularz i API call

2. **When uncertain about code behavior** - gdy masz wątpliwości czy coś zadziała bazując tylko na kodzie
   - Example: Complex RxJS pipeline → verify with console logs
   - Example: Leaflet map initialization → check visual rendering

3. **When fixing UI bugs (iterative)** - przy naprawie błędów wizualnych (iteracyjnie: sprawdź → napraw → sprawdź ponownie)
   - Example: Layout issue → take screenshot → fix CSS → verify again
   - Example: API 401 error → check network → fix auth → verify

4. **On explicit request** - na wyraźne żądanie użytkownika
   - Example: "zweryfikuj frontend"
   - Example: "sprawdź czy login działa"

**DO NOT use for:**
- ❌ Simple code reading (use Read tool)
- ❌ Unit test execution (use Bash with `ng test`)
- ❌ Backend-only changes (use spring-boot-backend skill)

---

## Verification Workflow

### Standard Workflow (5 Steps)

```
1. Check Servers Status
   ↓
2. Start Servers if Needed
   ↓
3. Navigate & Capture State
   ↓
4. Run Verifications (Console, Network, Visual)
   ↓
5. Report Results
```

### Detailed Step-by-Step

**Step 1: Check Servers Status**
```bash
./.claude/skills/frontend-verification/scripts/check-servers.sh
```
- Returns: ✅ Both running | ⚠️ One running | ❌ Both stopped

**Step 2: Start Servers if Needed**
```bash
./.claude/skills/frontend-verification/scripts/start-dev-servers.sh
```
- Starts backend (port 8080) if not running
- Starts frontend (port 4200) if not running
- Waits for health checks before proceeding

**Step 3: Navigate & Capture State**
- Use `list_pages` → check open pages
- Use `navigate_page(url: "http://localhost:4200/path")` → go to route
- Use `take_snapshot()` → get accessibility tree (structural verification)
- Use `take_screenshot()` → get visual representation

**Step 4: Run Verifications**
- **Console Errors:** `list_console_messages(types: ["error", "warn"])`
- **Network Requests:** `list_network_requests(resourceTypes: ["xhr", "fetch"])`
- **Visual Checks:** Compare screenshot with expected UI
- **Interactive Tests:** Use `click`, `fill`, `hover` to test interactions

**Step 5: Report Results**
- ✅ **PASS:** "All verifications passed. No console errors, API calls successful (200 OK), UI renders correctly."
- ❌ **FAIL:** "Found issues:
  - Console: 'Cannot read property X of undefined' at component.ts:42
  - Network: POST /api/auth/login returned 401 Unauthorized
  - Visual: Button missing padding (Tailwind class issue)"

---

## MCP Chrome DevTools Tools

### Navigation & Page Management

**list_pages()**
- Lists all open browser tabs
- Use: Check current page, select active page

**navigate_page(url, timeout)**
- Navigate to URL (e.g., "http://localhost:4200/login")
- Timeout: 30000ms recommended for initial load

**select_page(pageIdx)**
- Switch context to specific page
- Use when working with multiple tabs

**wait_for(text, timeout)**
- Wait until specific text appears on page
- Use: Verify async content loaded (e.g., "Photo Gallery")

### State Capture & Inspection

**take_snapshot(verbose)**
- Returns accessibility tree with element UIDs
- Use: Quick structural verification (elements present?)
- Fast, text-based, no images

**take_screenshot(uid, fullPage, format, quality)**
- Captures visual representation (PNG/JPEG/WebP)
- `fullPage: true` → full page screenshot
- `uid` → screenshot specific element
- Use: Visual regression, layout verification

**evaluate_script(function, args)**
- Execute JavaScript in page context
- Use: Check app state, query DOM, validate data
- Example: `() => window['ng']?.getComponent(document.querySelector('app-root'))`

### Console & Debugging

**list_console_messages(types, pageIdx, pageSize)**
- Get console output (log, error, warn, info, debug)
- `types: ["error", "warn"]` → filter errors only
- Returns: timestamp, type, message, source

**get_console_message(msgid)**
- Get detailed info for specific console message
- Use: Deep dive into error stack traces

### Network Monitoring

**list_network_requests(resourceTypes, pageIdx, pageSize)**
- List all HTTP requests since page load
- `resourceTypes: ["xhr", "fetch"]` → API calls only
- Returns: URL, status code, method, timing

**get_network_request(reqid)**
- Detailed info for specific request
- Includes: headers, payload, response body, timing

### Interaction & Testing

**click(uid, dblClick)**
- Click element by UID (from snapshot)
- Use: Test button clicks, navigation

**fill(uid, value)**
- Fill input/textarea/select
- Use: Test form submission

**fill_form(elements)**
- Fill multiple form fields at once
- Use: Complete login form, registration

**hover(uid)**
- Hover over element
- Use: Test tooltips, hover states

**press_key(key)**
- Send keyboard input (supports modifiers)
- Use: Test keyboard shortcuts, Enter key

### Emulation & Performance

**resize_page(width, height)**
- Change viewport size
- Use: Test responsive layout (mobile: 375x667, tablet: 768x1024, desktop: 1920x1080)

**emulate_network(throttlingOption)**
- Simulate network conditions
- Options: "No emulation", "Offline", "Slow 3G", "Fast 3G", "Slow 4G", "Fast 4G"
- Use: Test loading states, offline behavior

**emulate_cpu(throttlingRate)**
- Slow down CPU execution (1-20x)
- Use: Test on low-end devices

**performance_start_trace(reload, autoStop)**
- Start performance recording
- Captures Core Web Vitals (LCP, CLS, FCP)

**performance_stop_trace()**
- Stop recording, get metrics
- Returns: LCP, CLS, performance insights

---

## Verification Patterns

### Pattern 1: Console Error Verification

**When:** After implementing any component logic

```typescript
// Use Case: Verify no JavaScript errors after adding PhotoGalleryComponent

1. Navigate to page:
   navigate_page(url: "http://localhost:4200/gallery")

2. List console errors:
   list_console_messages(types: ["error", "warn"])

3. Analyze results:
   ✅ PASS: No errors → Component works correctly
   ❌ FAIL: Errors found → Fix and re-verify

4. If errors found, get details:
   get_console_message(msgid: 123)
   → Stack trace points to gallery.component.ts:42
   → Fix: Add null check for photo.fileName
```

**Common Console Errors:**
- `Cannot read property 'X' of undefined` → Missing null checks
- `ExpressionChangedAfterItHasBeenCheckedError` → Change detection issue
- `No provider for XService` → Missing import in standalone component
- `NG0100: Expression has changed` → Async data race condition

### Pattern 2: Network Request Verification

**When:** After implementing API integration

```typescript
// Use Case: Verify login API call works correctly

1. Navigate to login page:
   navigate_page(url: "http://localhost:4200/login")

2. Fill form and submit:
   fill_form(elements: [
     { uid: "input-email", value: "test@example.com" },
     { uid: "input-password", value: "password123" }
   ])
   click(uid: "btn-login")

3. Wait for redirect:
   wait_for(text: "Photo Gallery", timeout: 5000)

4. Check network requests:
   list_network_requests(resourceTypes: ["xhr", "fetch"])

5. Analyze API call:
   get_network_request(reqid: 1)
   → POST /api/auth/login
   → Status: 200 OK
   → Response: { "token": "eyJhbGc...", "email": "test@example.com" }
   ✅ PASS: Login successful

6. If 401/403:
   → Check request headers (Authorization missing?)
   → Check credentials validity
   → Fix AuthService, re-verify
```

**Common Network Issues:**
- `401 Unauthorized` → JWT token missing or expired
- `403 Forbidden` → User lacks required role (ADMIN)
- `404 Not Found` → Incorrect API endpoint URL
- `CORS error` → Backend CORS configuration issue
- `500 Internal Server Error` → Backend bug, check backend logs

### Pattern 3: Visual Verification

**When:** After implementing UI components or fixing layout issues

```typescript
// Use Case: Verify Gallery displays photos in responsive grid

1. Navigate to gallery:
   navigate_page(url: "http://localhost:4200/gallery")

2. Take snapshot (structural check):
   take_snapshot()
   → Verify elements present: "app-photo-card", "img", "rating"
   ✅ PASS: All expected elements found

3. Take screenshot (visual check):
   take_screenshot(fullPage: true, format: "png")
   → Analyze: Photo cards in grid layout
   → Verify: Tailwind classes applied (rounded-lg, shadow-md)
   → Check: Responsive spacing (gap-4)
   ✅ PASS: Layout matches design

4. Test responsive (mobile):
   resize_page(width: 375, height: 667)
   take_screenshot()
   → Verify: Single column layout on mobile
   ✅ PASS: Responsive breakpoints work

5. Test hover states:
   hover(uid: "photo-card-1")
   take_screenshot(uid: "photo-card-1")
   → Verify: shadow-lg on hover
   ✅ PASS: Hover transition works
```

**Visual Issues to Check:**
- Layout: Grid columns, spacing, alignment
- Typography: Font sizes, weights, line heights
- Colors: Tailwind utilities applied correctly
- Shadows: Proper elevation (shadow-sm, shadow-md, shadow-lg)
- Borders: Border radius (rounded-lg), border colors
- Responsive: Mobile (375px), Tablet (768px), Desktop (1920px)
- Hover/Focus states: Transitions, color changes

### Pattern 4: Interactive Testing

**When:** Testing user flows (login, upload, rating)

```typescript
// Use Case: Test photo upload flow end-to-end

1. Navigate to gallery:
   navigate_page(url: "http://localhost:4200/gallery")

2. Click upload button:
   click(uid: "btn-upload-photo")

3. Upload file:
   upload_file(uid: "input-file", filePath: "/path/to/test-photo.jpg")

4. Wait for upload completion:
   wait_for(text: "Photo uploaded successfully", timeout: 10000)

5. Verify new photo appears:
   take_snapshot()
   → Check: New photo card with filename "test-photo.jpg"
   ✅ PASS: Upload successful

6. Check network:
   list_network_requests()
   → POST /api/photos/upload → 201 Created
   → GET /api/photos → 200 OK (refreshed list)
   ✅ PASS: API calls successful

7. Verify console clean:
   list_console_messages(types: ["error"])
   → No errors
   ✅ PASS: No JavaScript errors
```

### Pattern 5: Performance Verification

**When:** After major feature implementation, before deployment

```typescript
// Use Case: Measure Core Web Vitals for Gallery page

1. Start performance trace:
   performance_start_trace(reload: true, autoStop: true)

2. Wait for trace completion (automatic)

3. Analyze metrics:
   → LCP: 2100ms ✅ (< 2500ms = Good)
   → CLS: 0.05 ✅ (< 0.1 = Good)
   → FCP: 1200ms ✅

4. Check insights:
   performance_analyze_insight(insightName: "LCPBreakdown")
   → TTFB: 300ms (good)
   → Load delay: 800ms (acceptable)
   → Render delay: 1000ms (could improve)

5. Recommendations:
   → Consider lazy loading images
   → Add loading="lazy" to <img> tags
   → Optimize thumbnail sizes

6. Re-test after optimization:
   performance_start_trace(reload: true, autoStop: true)
   → LCP: 1800ms ✅ (improved by 300ms)
```

---

## Example Scenarios

### Scenario 1: After Implementing Login Component

**Context:** Just finished implementing LoginComponent with reactive form

**Verification Steps:**

1. **Check servers:**
   ```bash
   ./.claude/skills/frontend-verification/scripts/check-servers.sh
   ```
   → Both running ✅

2. **Navigate to login:**
   ```typescript
   navigate_page(url: "http://localhost:4200/login")
   ```

3. **Visual check:**
   ```typescript
   take_snapshot()
   ```
   → Found: form, input[email], input[password], button[Login]
   → ✅ Structure correct

4. **Screenshot:**
   ```typescript
   take_screenshot()
   ```
   → ✅ Tailwind styles applied correctly

5. **Test login flow:**
   ```typescript
   fill_form([
     { uid: "input-email", value: "test@example.com" },
     { uid: "input-password", value: "test123456" }
   ])
   click(uid: "btn-login")
   wait_for(text: "Photo Gallery", timeout: 5000)
   ```
   → ✅ Redirect successful

6. **Check network:**
   ```typescript
   list_network_requests(resourceTypes: ["fetch"])
   ```
   → POST /api/auth/login → 200 OK
   → Response body: `{ "token": "eyJ...", "email": "test@example.com" }`
   → ✅ JWT token received

7. **Check console:**
   ```typescript
   list_console_messages(types: ["error", "warn"])
   ```
   → No errors ✅

**Result:** ✅ Login component works correctly. Ready to commit.

---

### Scenario 2: Fixing Layout Bug in Gallery

**Context:** User reports photos overlapping on mobile

**Verification Steps:**

1. **Navigate to gallery (desktop):**
   ```typescript
   navigate_page(url: "http://localhost:4200/gallery")
   take_screenshot(fullPage: true)
   ```
   → ✅ Desktop layout looks good (4 columns)

2. **Switch to mobile viewport:**
   ```typescript
   resize_page(width: 375, height: 667)
   take_screenshot(fullPage: true)
   ```
   → ❌ Photos overlapping! Grid not responding

3. **Inspect snapshot:**
   ```typescript
   take_snapshot()
   ```
   → Found: `<div class="grid grid-cols-4 gap-4">`
   → Problem: Missing responsive classes!

4. **Fix code:**
   ```typescript
   // Edit gallery.component.html
   // Old: class="grid grid-cols-4 gap-4"
   // New: class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
   ```

5. **Re-verify mobile:**
   ```typescript
   navigate_page(url: "http://localhost:4200/gallery")
   resize_page(width: 375, height: 667)
   take_screenshot(fullPage: true)
   ```
   → ✅ Single column on mobile - fixed!

6. **Test breakpoints:**
   ```typescript
   // Tablet
   resize_page(width: 768, height: 1024)
   take_screenshot()
   → ✅ 2 columns

   // Desktop
   resize_page(width: 1920, height: 1080)
   take_screenshot()
   → ✅ 4 columns
   ```

**Result:** ✅ Layout bug fixed. Responsive grid works correctly on all breakpoints.

---

### Scenario 3: Debugging API 401 Error

**Context:** Gallery page shows "Unauthorized" error

**Verification Steps:**

1. **Navigate to gallery:**
   ```typescript
   navigate_page(url: "http://localhost:4200/gallery")
   ```

2. **Check console:**
   ```typescript
   list_console_messages(types: ["error"])
   ```
   → Error: "HTTP 401 Unauthorized for /api/photos"

3. **Check network:**
   ```typescript
   list_network_requests(resourceTypes: ["fetch"])
   get_network_request(reqid: 1)
   ```
   → GET /api/photos
   → Status: 401
   → Request headers: No `Authorization` header! ❌

4. **Root cause:** JWT interceptor not adding token

5. **Check localStorage:**
   ```typescript
   evaluate_script(function: "() => localStorage.getItem('token')")
   ```
   → Returns: `null` ❌
   → User not logged in!

6. **Fix:** Redirect to login if no token

7. **Re-test after login:**
   ```typescript
   navigate_page(url: "http://localhost:4200/login")
   fill_form([...])
   click(uid: "btn-login")
   wait_for(text: "Photo Gallery")

   list_network_requests()
   get_network_request(reqid: 2)
   ```
   → GET /api/photos
   → Status: 200 OK ✅
   → Headers: `Authorization: Bearer eyJ...` ✅

**Result:** ✅ Issue fixed. Auth interceptor works after login.

---

## Helper Scripts Usage

### Check Servers Status

```bash
./.claude/skills/frontend-verification/scripts/check-servers.sh
```

**Output:**
```
=== Checking Dev Servers Status ===
✅ Backend: RUNNING (port 8080)
✅ Frontend: RUNNING (port 4200)

=== Summary ===
✅ Both servers are RUNNING
```

**Exit Codes:**
- `0` → Both running
- `1` → Only one running
- `2` → Both stopped

---

### Start Dev Servers

```bash
./.claude/skills/frontend-verification/scripts/start-dev-servers.sh
```

**What it does:**
1. Checks if backend (port 8080) is running
2. If not → starts `./mvnw spring-boot:run` in background
3. Waits for backend health check (http://localhost:8080/actuator/health)
4. Checks if frontend (port 4200) is running
5. If not → starts `ng serve` in background
6. Waits for frontend to be ready
7. Returns when both servers are healthy

**Output:**
```
=== Starting Dev Servers ===
🚀 Starting backend...
   Backend PID: 12345 (log: .claude/skills/frontend-verification/scripts/backend.log)
⏳ Waiting for backend to be ready (timeout: 120s)...
✅ Backend is ready!

🚀 Starting frontend...
   Frontend PID: 12346 (log: .claude/skills/frontend-verification/scripts/frontend.log)
⏳ Waiting for frontend to be ready (timeout: 120s)...
✅ Frontend is ready!

=== Dev Servers Started Successfully ===
✅ Backend:  http://localhost:8080
✅ Frontend: http://localhost:4200
```

**PID Files:**
- `.claude/skills/frontend-verification/scripts/backend.pid`
- `.claude/skills/frontend-verification/scripts/frontend.pid`

**Log Files:**
- `.claude/skills/frontend-verification/scripts/backend.log`
- `.claude/skills/frontend-verification/scripts/frontend.log`

---

### Stop Dev Servers

```bash
./.claude/skills/frontend-verification/scripts/stop-dev-servers.sh
```

**What it does:**
1. Reads PID files for backend and frontend
2. Sends SIGTERM (graceful shutdown)
3. Waits up to 30 seconds for processes to stop
4. If not stopped → sends SIGKILL (force stop)
5. Verifies ports 8080 and 4200 are free
6. Cleans up PID and log files

**Output:**
```
=== Stopping Dev Servers ===
🛑 Stopping Backend (PID: 12345)...
✅ Backend stopped gracefully

🛑 Stopping Frontend (PID: 12346)...
✅ Frontend stopped gracefully

=== Verification ===
✅ Backend port 8080 is free
✅ Frontend port 4200 is free

=== Summary ===
✅ Both servers stopped successfully
```

---

## Best Practices

### 1. Always Verify Console First

Before reporting success, ALWAYS check console for errors:

```typescript
list_console_messages(types: ["error", "warn"])
```

Even if UI looks correct, console errors indicate problems.

### 2. Check Network for API Calls

For any feature involving backend:

```typescript
list_network_requests(resourceTypes: ["xhr", "fetch"])
```

Verify:
- ✅ Status codes (200, 201, 204)
- ✅ Request headers (Authorization)
- ✅ Response payloads

### 3. Test Responsive Layouts

Always test breakpoints:

```typescript
// Mobile
resize_page(width: 375, height: 667)

// Tablet
resize_page(width: 768, height: 1024)

// Desktop
resize_page(width: 1920, height: 1080)
```

### 4. Use Snapshots for Structure, Screenshots for Visual

- **Snapshot** (fast, text) → "Are elements present?"
- **Screenshot** (slow, image) → "Does it look right?"

### 5. Iterative Verification for Bug Fixes

When fixing bugs:
1. Verify bug exists (screenshot, console, network)
2. Fix code
3. Re-verify
4. Repeat until ✅

### 6. Report Actionable Issues

When reporting failures:
- ❌ BAD: "Login doesn't work"
- ✅ GOOD: "Login failed: POST /api/auth/login returned 401. Request missing Authorization header. Check AuthInterceptor."

### 7. Clean Up After Verification

If you started servers for verification, consider stopping them:

```bash
./.claude/skills/frontend-verification/scripts/stop-dev-servers.sh
```

Unless user is actively developing.

---

## Related Skills

- **angular-frontend** - For implementing Angular components
- **spring-boot-backend** - For backend API development
- **code-review** - For code quality checks

---

## Key Reminders

**Proactive Verification:**
- ✅ Use this skill after implementing tasks
- ✅ Verify BEFORE marking task as complete
- ✅ Catch issues early in development cycle

**Comprehensive Checks:**
- ✅ Console errors (ALWAYS check)
- ✅ Network requests (for API features)
- ✅ Visual rendering (for UI features)
- ✅ Responsive layout (mobile, tablet, desktop)

**Iterative Debugging:**
- ✅ Verify bug → Fix → Verify again → Repeat
- ✅ Don't assume fix works - verify with tools
- ✅ Report clear, actionable issues

**Server Management:**
- ✅ Check servers before starting
- ✅ Wait for health checks (don't rush)
- ✅ Use helper scripts (check, start, stop)
