Uruchom aplikację Photo Map (backend + frontend + PostgreSQL jeśli nie działa)

**Wykonaj następujące kroki:**

1. **Sprawdź czy PostgreSQL działa**
   - `lsof -i:5432 -sTCP:LISTEN` (sprawdź port 5432)
   - Jeśli NIE działa → użyj flagi `--with-db`
   - Jeśli DZIAŁA → uruchom bez flagi

2. **Uruchom aplikację**
   - Użyj: `./scripts/start-dev.sh` (jeśli PostgreSQL działa)
   - LUB: `./scripts/start-dev.sh --with-db` (jeśli PostgreSQL nie działa)
   - Skrypt automatycznie sprawdzi procesy i porty

3. **Poczekaj na startup**
   - Skrypt czeka na porty: 8080 (backend), 4200 (frontend)
   - Timeout: 60s (backend), 90s (frontend)
   - Jeśli timeout → sprawdź logi w `scripts/.pid/backend.log` lub `frontend.log`

4. **Wyświetl status**
   - ✅ Backend: http://localhost:8080
   - ✅ Frontend: http://localhost:4200
   - 💾 PostgreSQL: localhost:5432
   - 📋 Logi: scripts/.pid/*.log

**Komunikacja:**
- Używaj emoji dla statusu: ✅ (działa), ⏳ (startuje), ❌ (błąd)
- Jeśli błąd → pokaż fragment logów i zasugeruj rozwiązanie
- Potwierdź że wszystko działa lub zgłoś problem

**Przykładowy output:**
```
⏳ Sprawdzam PostgreSQL...
✅ PostgreSQL działa na porcie 5432

⏳ Uruchamiam backend...
✅ Backend uruchomiony na http://localhost:8080

⏳ Uruchamiam frontend...
✅ Frontend uruchomiony na http://localhost:4200

🎉 Aplikacja gotowa!
- Backend: http://localhost:8080
- Frontend: http://localhost:4200
```
