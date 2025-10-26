# Server Management Reference

Szczegółowa dokumentacja zarządzania serwerami deweloperskimi (backend + frontend).

## Overview

Photo Map MVP używa project-level scripts w `/scripts/`:
- `start-dev.sh` - uruchomienie backend + frontend
- `stop-dev.sh` - zatrzymanie serwerów
- PID tracking w `scripts/.pid/`
- Logi w `scripts/.pid/backend.log`, `frontend.log`

**Porty:**
- Backend: 8080
- Frontend: 4200
- PostgreSQL: 5432

---

## Quick Start

### Pierwsze uruchomienie (z PostgreSQL)
```bash
./scripts/start-dev.sh --with-db
```

### Kolejne uruchomienia (PostgreSQL już działa)
```bash
./scripts/start-dev.sh
```

### Zatrzymanie aplikacji
```bash
./scripts/stop-dev.sh
# PostgreSQL nadal działa - to normalne!
```

### Całkowite zatrzymanie (rzadko potrzebne)
```bash
./scripts/stop-dev.sh --with-db
```

---

## Sprawdzanie statusu

### Sprawdź procesy
```bash
# Backend
lsof -i:8080

# Frontend
lsof -i:4200

# PostgreSQL
lsof -i:5432
```

### Sprawdź PID files
```bash
# Backend PID
cat scripts/.pid/backend.pid
kill -0 $(cat scripts/.pid/backend.pid) && echo "Running" || echo "Not running"

# Frontend PID
cat scripts/.pid/frontend.pid
kill -0 $(cat scripts/.pid/frontend.pid) && echo "Running" || echo "Not running"
```

### Sprawdź health endpoints
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend (status code)
curl -I http://localhost:4200
```

---

## Logi w czasie rzeczywistym

```bash
# Backend
tail -f scripts/.pid/backend.log

# Frontend
tail -f scripts/.pid/frontend.log
```

---

## Rebuild & Restart Workflow

**Kiedy potrzebny:**
- Po zmianach w kodzie Java/TypeScript
- Po zmianach w konfiguracji (application.properties, angular.json)
- Po dodaniu nowych zależności (pom.xml, package.json)

**Workflow:**
```bash
# 1. Zatrzymaj serwery
./scripts/stop-dev.sh

# 2. Rebuild (jeśli backend changes)
cd backend
./mvnw clean package
cd ..

# 3. Rebuild (jeśli frontend changes)
cd frontend
npm run build
cd ..

# 4. Restart serwery
./scripts/start-dev.sh
```

---

## Troubleshooting

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

## Debug Mode

Oba skrypty wspierają tryb debug:

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

---

## Funkcje skryptów

### start-dev.sh

**Funkcje:**
- ✅ Sprawdza czy procesy już działają (unika duplikatów)
- ✅ Zapisuje PID procesów do `scripts/.pid/`
- ✅ Czeka na startup i weryfikuje porty
- ✅ Automatyczne health checks
- ✅ Loguje output do plików
- ✅ Opcjonalnie uruchamia PostgreSQL (docker-compose)

**Wymagania:**
- PostgreSQL musi działać (lub użyj `--with-db`)
- Maven wrapper w `backend/mvnw`
- npm/Node.js dla frontendu

### stop-dev.sh

**Funkcje:**
- ✅ Graceful shutdown (SIGTERM → timeout → SIGKILL)
- ✅ Znajduje procesy po PID lub porcie
- ✅ Timeout 30s na shutdown
- ✅ Automatyczne czyszczenie plików PID
- ✅ Opcjonalnie zatrzymuje PostgreSQL

---

## Wskazówki

**Zalecany workflow:**
1. **Pierwszy start po włączeniu komputera:**
   ```bash
   ./scripts/start-dev.sh --with-db
   ```

2. **Kolejne starty (w tej samej sesji):**
   ```bash
   ./scripts/start-dev.sh
   ```

3. **Restart backend/frontend bez DB:**
   ```bash
   ./scripts/stop-dev.sh
   ./scripts/start-dev.sh
   ```

4. **Całkowite wyczyszczenie (koniec dnia):**
   ```bash
   ./scripts/stop-dev.sh --with-db
   ```

**PostgreSQL w tle:**
- `start-dev.sh --with-db` uruchamia PostgreSQL jako kontener Docker
- `stop-dev.sh` **NIE zatrzymuje** PostgreSQL - zostaje w tle
- `stop-dev.sh --with-db` zatrzymuje PostgreSQL (docker-compose down)
- PostgreSQL jest lekki - można zostawić włączony cały dzień

**Wielokrotne uruchomienie:**
- Skrypt `start-dev.sh` wykrywa już działające procesy
- Można uruchomić ponownie bez zatrzymywania (bezpieczne)
