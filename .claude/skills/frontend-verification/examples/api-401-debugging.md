# Example: Debugging API 401 Error

**Context:** Gallery page shows "Unauthorized" error

---

## Verification Steps

### 1. Navigate to gallery

```typescript
navigate_page(url: "http://localhost:4200/gallery")
```

---

### 2. Check console

```typescript
list_console_messages(types: ["error"])
```

→ Error: "HTTP 401 Unauthorized for /api/photos"

---

### 3. Check network

```typescript
list_network_requests(resourceTypes: ["fetch"])
get_network_request(reqid: 1)
```

→ GET /api/photos
→ Status: 401
→ Request headers: **No `Authorization` header!** ❌

---

### 4. Root cause

JWT interceptor not adding token

---

### 5. Check localStorage

```typescript
evaluate_script(function: "() => localStorage.getItem('token')")
```

→ Returns: `null` ❌
→ **User not logged in!**

---

### 6. Fix

Redirect to login if no token

---

### 7. Re-test after login

```typescript
navigate_page(url: "http://localhost:4200/login")
fill_form([
  { uid: "input-email", value: "test@example.com" },
  { uid: "input-password", value: "test123456" }
])
click(uid: "btn-login")
wait_for(text: "Photo Gallery")

list_network_requests()
get_network_request(reqid: 2)
```

→ GET /api/photos
→ Status: 200 OK ✅
→ Headers: `Authorization: Bearer eyJ...` ✅

---

## Result

✅ **Issue fixed. Auth interceptor works after login.**
