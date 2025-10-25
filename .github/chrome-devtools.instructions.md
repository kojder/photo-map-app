---
description: "Chrome DevTools MCP - Frontend debugging, verification, and performance analysis"
applyTo: "**/*.ts,**/*.html,**/*.css,scripts/start-dev.sh,scripts/stop-dev.sh"
---

# Chrome DevTools MCP - Frontend Verification & Debugging

Use Chrome DevTools MCP to give AI "eyes" in the browser for real-time frontend verification, debugging, and performance analysis.

## 🎯 Primary Use Cases for Photo Map MVP

### 1. Verify Frontend Changes After Implementation

**When to use:** After implementing any frontend feature (Phase 2, Phase 4, future changes)

**Workflow:**
1. Ensure app is running (check logs, start if needed)
2. Navigate to relevant page (login, gallery, map)
3. Verify feature works as expected
4. Check console for errors
5. Inspect network requests for API calls

**Example prompts:**
```
"Verify that the login form works correctly on localhost:4200"
"Check if gallery photos are loading and displayed properly"
"Test the rating feature - click stars and verify API call"
"Verify map markers appear for photos with GPS coordinates"
```

**Tools used:**
- `navigate_page` - open localhost:4200
- `fill_form` / `click` - interact with UI
- `list_console_messages` - check for JS errors
- `list_network_requests` - verify API calls to localhost:8080
- `take_screenshot` - capture visual state

### 2. Diagnose Frontend Bugs & Errors

**When to use:** User reports issue, something doesn't work, visual glitches

**Workflow:**
1. Check if backend/frontend are running (see logs in `scripts/.pid/`)
2. If not running, start with: `./scripts/start-dev.sh --with-db`
3. Navigate to problem page
4. Inspect console errors, network failures, DOM state
5. Identify root cause (CORS, 404, JS exception, CSS issue)
6. Propose fix based on real evidence

**Example prompts:**
```
"Photos not loading in gallery - diagnose the issue"
"Login button does nothing when clicked - what's wrong?"
"Map not showing - check console and network for errors"
"Rating stars don't update after clicking - debug this"
```

**Tools used:**
- `list_console_messages` - find JavaScript errors
- `list_network_requests` - find failed API calls (404, 500, CORS)
- `get_network_request` - inspect specific request/response
- `evaluate_script` - check JavaScript state
- `take_snapshot` - inspect DOM structure

### 3. Performance Analysis & Optimization

**When to use:** Page loads slowly, UI feels laggy, before deployment

**Workflow:**
1. Start performance trace
2. Navigate/interact with page
3. Stop trace and analyze insights
4. Identify bottlenecks (large images, slow API, render blocking)
5. Suggest optimizations with evidence

**Example prompts:**
```
"Analyze gallery page performance - is it fast enough?"
"Measure map page load time and suggest optimizations"
"Check if thumbnail images are properly optimized"
"Analyze Largest Contentful Paint (LCP) for gallery"
```

**Tools used:**
- `performance_start_trace` - begin recording
- `performance_stop_trace` - stop recording
- `performance_analyze_insight` - get metrics (LCP, TBT, FCP)
- `list_network_requests` - find slow API calls or large resources

### 4. Cross-Feature Integration Testing

**When to use:** Testing complete user flows (auth → upload → gallery → map)

**Workflow:**
1. Start from login page
2. Simulate user journey (login → upload photo → view gallery → check map)
3. Verify each step works and data persists
4. Check for errors at any stage

**Example prompts:**
```
"Test the complete flow: login → upload photo → view in gallery → see on map"
"Verify rating persists after page refresh"
"Test logout and verify redirect to login"
```

**Tools used:**
- `navigate_page` - move between routes
- `fill_form` / `click` - user interactions
- `upload_file` - test photo upload
- `wait_for` - wait for navigation/renders
- `list_console_messages` - errors during flow

### 5. Responsive Design & Layout Verification

**When to use:** After CSS changes, before deployment, fixing layout bugs

**Workflow:**
1. Navigate to page
2. Resize viewport (mobile, tablet, desktop)
3. Check if layout adapts correctly
4. Verify Tailwind responsive classes work
5. Take screenshots for comparison

**Example prompts:**
```
"Check if gallery grid is responsive (mobile, tablet, desktop)"
"Verify navbar collapses properly on mobile"
"Test map component at different viewport sizes"
```

**Tools used:**
- `resize_page` - change viewport dimensions
- `take_snapshot` - inspect DOM/CSS
- `take_screenshot` - visual verification
- `evaluate_script` - check computed styles

## 🚨 Critical: Check App Status First

**ALWAYS verify app is running before using Chrome DevTools MCP!**

### Check Backend Status
```bash
# Check backend log
tail -n 20 scripts/.pid/backend.log

# Check if backend is running
lsof -i:8080 || ss -tuln | grep :8080

# Backend health check
curl http://localhost:8080/actuator/health
```

### Check Frontend Status
```bash
# Check frontend log
tail -n 20 scripts/.pid/frontend.log

# Check if frontend is running
lsof -i:4200 || ss -tuln | grep :4200

# Frontend health check
curl -I http://localhost:4200
```

### Start App If Not Running
```bash
# Start backend + frontend + PostgreSQL
./scripts/start-dev.sh --with-db

# Or manually (see scripts/README.md)
cd backend && ./mvnw spring-boot:run &
cd frontend && ng serve &
```

**IMPORTANT:** Chrome DevTools MCP cannot verify code if the app is not running. Always check logs and start the app first!

## 📋 Photo Map MVP Specific Patterns

### Login/Auth Testing
```typescript
// Verify login works
navigate_page("http://localhost:4200/login")
fill_form({ email: "admin@photomap.com", password: "admin123" })
click("button[type='submit']")
wait_for("navigation")
list_console_messages() // Check for errors
```

### Gallery Testing
```typescript
// Verify gallery loads photos
navigate_page("http://localhost:4200/gallery")
wait_for("selector: .photo-card") // Wait for photos to render
list_network_requests() // Check /api/photos call
take_snapshot() // Inspect gallery grid DOM
```

### Map Testing
```typescript
// Verify map markers
navigate_page("http://localhost:4200/map")
evaluate_script("return document.querySelectorAll('.leaflet-marker-icon').length")
list_console_messages() // Check for Leaflet errors
```

### Photo Upload Testing
```typescript
// Verify upload dialog
navigate_page("http://localhost:4200/gallery")
click("button[data-testid='upload-button']")
upload_file("input[type='file']", "/path/to/test/photo.jpg")
wait_for("selector: .upload-progress")
list_network_requests() // Check POST /api/photos
```

### Rating Testing
```typescript
// Verify rating API call
navigate_page("http://localhost:4200/gallery")
click(".photo-card:first-child .star-rating .star:nth-child(4)") // Click 4th star
wait_for("networkidle")
list_network_requests() // Check PUT /api/photos/{id}/rating
```

## 🔍 Debugging Checklist

When frontend issue reported, follow this checklist:

1. **App Status**
   - [ ] Backend running on :8080? Check `scripts/.pid/backend.log`
   - [ ] Frontend running on :4200? Check `scripts/.pid/frontend.log`
   - [ ] PostgreSQL running? Check `docker-compose ps`
   - [ ] If not running, start with `./scripts/start-dev.sh --with-db`

2. **Console Errors**
   - [ ] Navigate to problem page
   - [ ] `list_console_messages()` - any JS errors?
   - [ ] Check for TypeScript compilation errors
   - [ ] Check for Angular runtime errors

3. **Network Issues**
   - [ ] `list_network_requests()` - any failed requests?
   - [ ] Check for 404 (wrong endpoint), 500 (backend error), 401 (auth issue)
   - [ ] `get_network_request(id)` - inspect failed request details
   - [ ] Verify proxy.conf.json routes `/api/*` to localhost:8080

4. **DOM/CSS Issues**
   - [ ] `take_snapshot()` - inspect DOM structure
   - [ ] `evaluate_script()` - check computed styles
   - [ ] Verify Tailwind classes are applied
   - [ ] Check for missing CSS imports

5. **Performance Issues**
   - [ ] `performance_start_trace()` → interact → `performance_stop_trace()`
   - [ ] `performance_analyze_insight()` - check LCP, TBT, FCP
   - [ ] Check for large images (should use thumbnails: small/medium/large)
   - [ ] Check for slow API calls (>500ms)

## 🚀 Best Practices

### DO:
✅ **Always check app is running first** (logs, ports, health checks)
✅ **Start app if needed** using `./scripts/start-dev.sh --with-db`
✅ **Use real test data** (test_photos/ folder has sample images)
✅ **Verify both frontend AND backend** (UI might work but API fails)
✅ **Check console + network together** (root cause often in network)
✅ **Take screenshots for visual bugs** (layout, CSS issues)
✅ **Use performance traces before deployment** (ensure fast UX)

### DON'T:
❌ **Don't assume app is running** - always verify first
❌ **Don't skip console check** - JS errors break functionality silently
❌ **Don't ignore network errors** - CORS, 404, 500 are common
❌ **Don't test without backend** - frontend needs API responses
❌ **Don't forget to wait** - use `wait_for` for async operations
❌ **Don't test in production browser** - use isolated Chrome instance

## 🛠️ Common Photo Map MVP Issues

### Issue: Photos not loading in gallery
**Diagnosis:**
1. `list_network_requests()` → Check GET /api/photos response
2. `list_console_messages()` → Check for JS errors
3. Backend running? Check `scripts/.pid/backend.log`

**Common causes:**
- Backend not running (start with `./scripts/start-dev.sh`)
- No photos in database (upload via UI or check `uploads/` folders)
- CORS issue (should not happen with proxy.conf.json)

### Issue: Rating not working
**Diagnosis:**
1. Click star → `list_network_requests()` → Check PUT /api/photos/{id}/rating
2. Check console for 401 (not authenticated), 404 (photo not found)
3. Verify JWT token in localStorage: `evaluate_script("return localStorage.getItem('token')")`

**Common causes:**
- Not logged in (JWT token missing)
- Backend validation error (rating must be 1-5)
- Photo ID mismatch

### Issue: Map not showing markers
**Diagnosis:**
1. `navigate_page("http://localhost:4200/map")`
2. `list_console_messages()` → Check for Leaflet errors
3. `evaluate_script("return window.L !== undefined")` → Verify Leaflet loaded
4. `evaluate_script("return document.querySelectorAll('.leaflet-marker-icon').length")` → Count markers

**Common causes:**
- No photos with GPS coordinates (upload photos with EXIF GPS)
- Leaflet.js not loaded (check network for 404 on leaflet.js)
- Map container not initialized (check MapComponent lifecycle)

### Issue: Slow page load
**Diagnosis:**
1. `performance_start_trace()`
2. `navigate_page("http://localhost:4200/gallery")`
3. `performance_stop_trace()` → `performance_analyze_insight()`
4. Check LCP, TBT - should be <2.5s, <200ms

**Common causes:**
- Large original images (should use thumbnails: medium/ folder)
- Too many photos loaded at once (implement pagination)
- Slow API response (check backend performance)

## 🔗 Integration with Project Workflow

### After implementing new feature:
1. Implement code (TypeScript, HTML, CSS)
2. **Verify with Chrome DevTools MCP** (this is the critical step!)
3. Write unit tests (Jasmine + Karma)
4. Run tests: `ng test`
5. Commit if all pass

### When user reports bug:
1. **Reproduce with Chrome DevTools MCP** (navigate, interact, inspect)
2. Identify root cause (console, network, DOM)
3. Fix code
4. **Verify fix with Chrome DevTools MCP** (ensure it works)
5. Write test to prevent regression
6. Commit

### Before deployment:
1. **Run performance audit** (trace + analyze)
2. Check LCP <2.5s, TBT <200ms, FCP <1.8s
3. Optimize if needed (image compression, lazy loading)
4. **Verify on mobile viewport** (resize_page)
5. Deploy

## 📚 Additional Resources

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [MCP Tools Documentation](https://github.com/ChromeDevTools/chrome-devtools-mcp#tools)
- Photo Map specific: `scripts/README.md` (how to start/stop app)
- Backend API: `.ai/api-plan.md`
- Frontend architecture: `.ai/ui-plan.md`

---

**Key Insight:** Chrome DevTools MCP turns AI from "blind coder" to "eyes-on debugger". Always verify code in real browser, not just in theory!
