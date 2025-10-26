# Example: After Implementing Login Component

**Context:** Just finished implementing LoginComponent with reactive form

---

## Verification Steps

### 1. Check servers

```bash
# Sprawdź czy serwery działają
[ -f scripts/.pid/backend.pid ] && kill -0 $(cat scripts/.pid/backend.pid)
[ -f scripts/.pid/frontend.pid ] && kill -0 $(cat scripts/.pid/frontend.pid)

# Jeśli nie działają → uruchom
./scripts/start-dev.sh
```

→ Both running ✅

---

### 2. Navigate to login

```typescript
navigate_page(url: "http://localhost:4200/login")
```

---

### 3. Visual check (structural)

```typescript
take_snapshot()
```

→ Found: form, input[email], input[password], button[Login]
→ ✅ Structure correct

---

### 4. Screenshot (visual)

```typescript
take_screenshot()
```

→ ✅ Tailwind styles applied correctly

---

### 5. Test login flow

```typescript
fill_form([
  { uid: "input-email", value: "test@example.com" },
  { uid: "input-password", value: "test123456" }
])
click(uid: "btn-login")
wait_for(text: "Photo Gallery", timeout: 5000)
```

→ ✅ Redirect successful

---

### 6. Check network

```typescript
list_network_requests(resourceTypes: ["fetch"])
```

→ POST /api/auth/login → 200 OK
→ Response body: `{ "token": "eyJ...", "email": "test@example.com" }`
→ ✅ JWT token received

---

### 7. Check console

```typescript
list_console_messages(types: ["error", "warn"])
```

→ No errors ✅

---

## Result

✅ **Login component works correctly. Ready to commit.**
