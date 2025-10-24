# Development Scripts

Skrypty do zarządzania środowiskiem deweloperskim Photo Map MVP.

## 🚀 Szybki start

### 1. Uruchom PostgreSQL (raz na początek sesji)
```bash
docker-compose up -d
```

### 2. Uruchom aplikację (backend + frontend)
```bash
./scripts/start-dev.sh
```

### 3. Zatrzymaj aplikację
```bash
./scripts/stop-dev.sh
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

## 📂 Struktura

```
scripts/
├── start-dev.sh       # Uruchamianie aplikacji
├── stop-dev.sh        # Zatrzymywanie aplikacji
├── README.md          # Ta dokumentacja
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
1. Uruchom PostgreSQL raz na początek: `docker-compose up -d`
2. Używaj `start-dev.sh` / `stop-dev.sh` wielokrotnie w sesji
3. PostgreSQL może zostać włączony cały czas (niskie zużycie zasobów)

**Wielokrotne uruchomienie:**
- Skrypt `start-dev.sh` wykrywa już działające procesy
- Można uruchomić ponownie bez zatrzymywania (bezpieczne)

**Logi:**
- Backend/Frontend logują do `scripts/.pid/*.log`
- Logi są nadpisywane przy każdym starcie
- Użyj `tail -f` do monitorowania w czasie rzeczywistym
