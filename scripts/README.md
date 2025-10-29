# Development Scripts

Skrypty do zarządzania środowiskiem deweloperskim Photo Map MVP.

## 🚀 Szybki start

### 1. Uruchom PostgreSQL (raz na początek sesji)
```bash
# Przy PIERWSZYM uruchomieniu po starcie środowiska:
./scripts/start-dev.sh --with-db

# Kolejne uruchomienia (PostgreSQL już działa w Dockerze):
./scripts/start-dev.sh
```

**WAŻNE:** 
- `--with-db` uruchamia PostgreSQL w Dockerze
- `./scripts/stop-dev.sh` **NIE zatrzymuje PostgreSQL** - działa w tle dalej
- PostgreSQL wyłączy się dopiero po `docker-compose down` lub restarcie systemu

### 2. Zatrzymaj aplikację (backend + frontend)
```bash
./scripts/stop-dev.sh
# PostgreSQL nadal działa - to normalne!
```

### 3. Całkowite zatrzymanie (rzadko potrzebne)
```bash
./scripts/stop-dev.sh --with-db
# Zatrzymuje backend + frontend + PostgreSQL
```

---

## 📜 Dostępne skrypty

### `start-dev.sh`

Uruchamia backend (Spring Boot) i frontend (Angular) w tle.

**Podstawowe użycie:**
```bash
./scripts/start-dev.sh
```

**Z PostgreSQL:**
```bash
./scripts/start-dev.sh --with-db
```

**Funkcje:**
- ✅ Sprawdza czy procesy już działają (unika duplikatów)
- ✅ Zapisuje PID procesów do `scripts/.pid/`
- ✅ Czeka na startup i weryfikuje porty (bez sudo - używa ss/lsof/nc fallback)
- ✅ Automatyczne health checks dla backend i frontend
- ✅ Loguje output do plików: `scripts/.pid/backend.log`, `scripts/.pid/frontend.log`
- ✅ Opcjonalnie uruchamia PostgreSQL (docker-compose)
- ✅ Debug mode dla diagnostyki problemów

**Wymagania:**
- PostgreSQL musi działać (lub użyj `--with-db`)
- Maven wrapper w `backend/mvnw`
- npm/Node.js dla frontendu

---

### `stop-dev.sh`

Zatrzymuje backend i frontend z graceful shutdown.

**Podstawowe użycie:**
```bash
./scripts/stop-dev.sh
```

**Z PostgreSQL:**
```bash
./scripts/stop-dev.sh --with-db
```

**Funkcje:**
- ✅ Graceful shutdown (SIGTERM → timeout → SIGKILL)
- ✅ Znajduje procesy po PID lub porcie (bez sudo - używa ss/lsof/netstat fallback)
- ✅ Timeout 30s na shutdown
- ✅ Automatyczne czyszczenie plików PID
- ✅ Opcjonalnie zatrzymuje PostgreSQL (docker-compose down)
- ✅ Debug mode dla diagnostyki problemów

---

### `run-all-tests.sh`

Uruchamia wszystkie testy: frontend unit, backend i E2E.

**Podstawowe użycie:**
```bash
./scripts/run-all-tests.sh
```

**Funkcje:**
- ✅ Automatycznie sprawdza i uruchamia PostgreSQL testową (port 5433)
- ✅ Uruchamia po kolei:
  - Frontend Unit Tests (Karma): `npm run test:coverage`
  - Backend Tests (Maven): `./mvnw test`
  - E2E Tests (Playwright): `npm run test:e2e`
- ✅ Zatrzymuje się przy pierwszym fail
- ✅ Wyświetla szczegółowe summary z wynikami
- ✅ Pokazuje ścieżki do coverage reports
- ✅ Exit code 0 (sukces) lub 1 (fail)

**Output:**
```
============================================
  TEST RESULTS SUMMARY
============================================
Frontend Unit Tests (Karma):    ✅ PASSED
Backend Tests (Maven):           ✅ PASSED
E2E Tests (Playwright):          ✅ PASSED
============================================
✓ All tests PASSED - OK to commit!

Coverage reports:
- frontend/coverage/frontend/index.html
- backend/target/site/jacoco/index.html
- frontend/playwright-report/index.html
```

**Wymagania:**
- Docker (dla PostgreSQL testowej)
- Maven wrapper w `backend/mvnw`
- npm/Node.js dla frontendu

**Zastosowanie:**
- Przed commitem (ręcznie lub przez pre-commit hook)
- Po większych zmianach w kodzie
- Weryfikacja stanu przed pull requestem
- CI/CD pipeline

---

### `install-hooks.sh`

Instaluje git pre-commit hook, który automatycznie uruchamia wszystkie testy przed każdym commitem.

**Podstawowe użycie (jednorazowa instalacja):**
```bash
./scripts/install-hooks.sh
```

**Funkcje:**
- ✅ Kopiuje pre-commit hook do `.git/hooks/`
- ✅ Ustawia uprawnienia wykonywalne
- ✅ Wyświetla instrukcje użycia

**Działanie pre-commit hooka:**
- Hook wywołuje `./scripts/run-all-tests.sh` automatycznie
- Jeśli testy FAIL → commit **przerwany**
- Jeśli testy PASS → commit przechodzi

**Bypass hooka (tylko w awaryjnych sytuacjach):**
```bash
git commit --no-verify -m "wip: work in progress"
```

**Przykład workflow:**
```bash
# 1. Zainstaluj hook (raz)
./scripts/install-hooks.sh

# 2. Normalny commit
git add .
git commit -m "feat: add feature"
  ↓
🧪 Hook uruchamia testy automatycznie
  ↓
✅ Wszystkie OK → Commit utworzony
❌ Fail → Commit przerwany

# 3. Jeśli fail - napraw kod i spróbuj ponownie
```

---

## 📂 Struktura

```
scripts/
├── start-dev.sh       # Uruchamianie aplikacji
├── stop-dev.sh        # Zatrzymywanie aplikacji
├── run-all-tests.sh   # Uruchamianie wszystkich testów
├── install-hooks.sh   # Instalacja git pre-commit hooka
├── README.md          # Ta dokumentacja
├── git-hooks/         # Templates git hooków
│   └── pre-commit     # Pre-commit hook (kopiowany do .git/hooks/)
└── .pid/              # PID files i logi (gitignored)
    ├── backend.pid
    ├── frontend.pid
    ├── backend.log
    └── frontend.log
```

---

## 🔍 Sprawdzanie statusu

### Procesy
```bash
# Backend
lsof -i:8080

# Frontend
lsof -i:4200

# PostgreSQL
lsof -i:5432
```

### Logi w czasie rzeczywistym
```bash
# Backend
tail -f scripts/.pid/backend.log

# Frontend
tail -f scripts/.pid/frontend.log
```

### Health checks
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend (status code)
curl -I http://localhost:4200
```

**Uwaga:** Skrypt `start-dev.sh` automatycznie weryfikuje health endpoints po starcie i pokazuje status ✅ lub ⚠️.

---

## 🐛 Troubleshooting

### Problem: "Port 8080 already in use"
```bash
# Znajdź i zabij proces
lsof -ti:8080 | xargs kill -9
```

### Problem: "PostgreSQL nie działa"
```bash
# Uruchom ręcznie
docker-compose up -d

# Sprawdź status
docker-compose ps
```

### Problem: "Backend nie startuje"
```bash
# Sprawdź logi
cat scripts/.pid/backend.log

# Lub uruchom ręcznie w terminalu
cd backend
./mvnw spring-boot:run
```

### Problem: "Frontend nie startuje"
```bash
# Sprawdź logi
cat scripts/.pid/frontend.log

# Przebuduj node_modules
cd frontend
rm -rf node_modules
npm install
```

---

## 🐞 Debug Mode

Oba skrypty wspierają tryb debug, który pokazuje szczegółowe informacje o procesie wykrywania portów i PIDów.

**Włączenie debug mode:**
```bash
# Start z debugiem
DEBUG=true ./scripts/start-dev.sh

# Stop z debugiem
DEBUG=true ./scripts/stop-dev.sh
```

**Co pokazuje debug mode:**
- Metody wykrywania portów (ss → lsof → nc)
- Metody wykrywania PID (ss → lsof → netstat)
- Health check endpoints
- Szczegółowe informacje o procesach

**Przykład outputu:**
```
[DEBUG] Sprawdzam port 5432...
[DEBUG] Używam ss dla portu 5432
[DEBUG] Port 5432 jest zajęty (wykryte przez ss)
[DEBUG] Sprawdzam backend health endpoint...
[DEBUG] Backend health: UP
```

**Użyteczne gdy:**
- Skrypty nie wykrywają procesów poprawnie
- Problemy z wykrywaniem portów
- Diagnozowanie problemów ze startupem

---

## 💡 Wskazówki

**Zalecany workflow:**
1. **Pierwszy start po włączeniu komputera:**
   ```bash
   ./scripts/start-dev.sh --with-db
   ```
   
2. **Kolejne starty (w tej samej sesji):**
   ```bash
   # PostgreSQL już działa w Dockerze, więc:
   ./scripts/start-dev.sh
   ```

3. **Restart backend/frontend bez DB:**
   ```bash
   ./scripts/stop-dev.sh      # Zatrzymuje tylko backend + frontend
   ./scripts/start-dev.sh     # PostgreSQL nadal działa!
   ```

4. **Całkowite wyczyszczenie (koniec dnia):**
   ```bash
   ./scripts/stop-dev.sh --with-db
   # Lub ręcznie:
   docker-compose down
   ```

**PostgreSQL w tle:**
- `start-dev.sh --with-db` uruchamia PostgreSQL jako kontener Docker
- `stop-dev.sh` **NIE zatrzymuje** PostgreSQL - zostaje w tle
- `stop-dev.sh --with-db` zatrzymuje PostgreSQL (docker-compose down)
- PostgreSQL jest lekki - można zostawić włączony cały dzień

**Wielokrotne uruchomienie:**
- Skrypt `start-dev.sh` wykrywa już działające procesy
- Można uruchomić ponownie bez zatrzymywania (bezpieczne)

**Logi:**
- Backend/Frontend logują do `scripts/.pid/*.log`
- Logi są nadpisywane przy każdym starcie
- Użyj `tail -f` do monitorowania w czasie rzeczywistym
