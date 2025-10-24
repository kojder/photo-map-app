Zatrzymaj aplikację Photo Map (backend + frontend, BEZ PostgreSQL)

**Wykonaj następujące kroki:**

1. **Zatrzymaj aplikację**
   - Użyj: `./scripts/stop-dev.sh` (BEZ flagi --with-db!)
   - PostgreSQL zostaje włączony (zgodnie z zaleceniami)
   - Skrypt wykonuje graceful shutdown (SIGTERM → timeout 30s → SIGKILL)

2. **Poczekaj na shutdown**
   - Skrypt automatycznie poczeka na zakończenie procesów
   - Timeout: 30s na proces
   - Jeśli timeout → wymuszenie SIGKILL

3. **Sprawdź czy procesy zatrzymane**
   - Backend (port 8080) powinien być wolny
   - Frontend (port 4200) powinien być wolny
   - PostgreSQL (port 5432) NADAL działa

4. **Wyświetl status**
   - ✅ Backend zatrzymany
   - ✅ Frontend zatrzymany
   - 💾 PostgreSQL nadal działa (OK)

**Komunikacja:**
- Używaj emoji dla statusu: ✅ (zatrzymany), ⏳ (zatrzymuję), ⚠️ (wymuszam)
- Potwierdź że procesy zatrzymane
- Potwierdź że PostgreSQL nadal działa (to jest zamierzone!)

**Przykładowy output:**
```
⏳ Zatrzymuję backend...
✅ Backend zatrzymany

⏳ Zatrzymuję frontend...
✅ Frontend zatrzymany

💾 PostgreSQL nadal działa (zgodnie z zaleceniami)

🎉 Aplikacja zatrzymana!
```
