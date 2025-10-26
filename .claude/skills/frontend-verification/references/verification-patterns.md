# Verification Patterns

Szczegółowe wzorce weryfikacji frontendu z Chrome DevTools MCP.

## Pattern 1: Console Error Verification

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

---

## Pattern 2: Network Request Verification

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

---

## Pattern 3: Visual Verification

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

---

## Pattern 4: Interactive Testing

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

---

## Pattern 5: Performance Verification

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
