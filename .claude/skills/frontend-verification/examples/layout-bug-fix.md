# Example: Fixing Layout Bug in Gallery

**Context:** User reports photos overlapping on mobile

---

## Verification Steps

### 1. Navigate to gallery (desktop)

```typescript
navigate_page(url: "http://localhost:4200/gallery")
take_screenshot(fullPage: true)
```

→ ✅ Desktop layout looks good (4 columns)

---

### 2. Switch to mobile viewport

```typescript
resize_page(width: 375, height: 667)
take_screenshot(fullPage: true)
```

→ ❌ **Photos overlapping! Grid not responding**

---

### 3. Inspect snapshot

```typescript
take_snapshot()
```

→ Found: `<div class="grid grid-cols-4 gap-4">`
→ **Problem: Missing responsive classes!**

---

### 4. Fix code

```typescript
// Edit gallery.component.html
// Old: class="grid grid-cols-4 gap-4"
// New: class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
```

---

### 5. Restart frontend (code changed)

```bash
./scripts/stop-dev.sh
./scripts/start-dev.sh
```

---

### 6. Re-verify mobile

```typescript
navigate_page(url: "http://localhost:4200/gallery")
resize_page(width: 375, height: 667)
take_screenshot(fullPage: true)
```

→ ✅ **Single column on mobile - fixed!**

---

### 7. Test breakpoints

```typescript
// Tablet
resize_page(width: 768, height: 1024)
take_screenshot()
```
→ ✅ 2 columns

```typescript
// Desktop
resize_page(width: 1920, height: 1080)
take_screenshot()
```
→ ✅ 4 columns

---

## Result

✅ **Layout bug fixed. Responsive grid works correctly on all breakpoints.**
