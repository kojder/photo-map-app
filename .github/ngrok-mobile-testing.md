# Ngrok Mobile Testing Setup

## 🎯 Cel

Umożliwienie testowania aplikacji Photo Map na telefonie komórkowym podczas developmentu w VM Linux.

## 📋 Wymagania

- Konto ngrok (darmowe): https://dashboard.ngrok.com/signup
- Frontend i backend uruchomione (`./scripts/start-dev.sh --with-db`)

## 🚀 Szybki start

### 1. Konfiguracja (jednorazowo)

```bash
# 1. Skopiuj .env.example do .env (jeśli jeszcze nie zrobiłeś)
cp .env.example .env

# 2. Pobierz authtoken z ngrok
# Otwórz: https://dashboard.ngrok.com/get-started/your-authtoken
# Skopiuj token (format: 2a...długi_string)

# 3. Edytuj .env i wklej token
nano .env

# Znajdź sekcję:
# NGROK_AUTHTOKEN=paste_your_token_here
# Zamień na:
# NGROK_AUTHTOKEN=twoj_prawdziwy_token_tutaj
```

### 2. Uruchomienie tunelu

```bash
# WAŻNE: PostgreSQL musi działać!
# Przy pierwszym uruchomieniu po starcie środowiska:
./scripts/start-dev.sh --with-db

# Kolejne uruchomienia (PostgreSQL już działa):
./scripts/start-dev.sh

# UWAGA: ./scripts/stop-dev.sh NIE zatrzymuje PostgreSQL!
# PostgreSQL pozostaje włączony w Dockerze - to normalne.

# Uruchom ngrok tunnel
./scripts/start-ngrok.sh
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Ngrok tunnel is ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Public URL: https://abc123.ngrok-free.app

  Ngrok Dashboard: http://localhost:4040

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ Open the URL on your mobile device to test the app!
```

### 3. Testowanie na telefonie

1. **Otwórz przeglądarkę** na telefonie
2. **Wejdź na URL** z outputu (np. `https://abc123.ngrok-free.app`)
3. **Kliknij "Visit Site"** (ngrok pokazuje warning page przy pierwszym wejściu)
4. **Testuj aplikację!** 🎉

### 4. Zatrzymanie tunelu

```bash
./scripts/stop-ngrok.sh
```

## 🔍 Diagnostyka

### Sprawdź status ngrok

```bash
# Dashboard z request logs
open http://localhost:4040

# Lub sprawdź logi
tail -f scripts/.pid/ngrok.log
```

### Problemy z authtokenem

```bash
# Sprawdź czy token jest ustawiony
grep NGROK_AUTHTOKEN .env

# Jeśli token jest nieprawidłowy, edytuj .env
nano .env

# Potem uruchom ponownie
./scripts/start-ngrok.sh
```

### Frontend nie działa

```bash
# Sprawdź czy frontend jest uruchomiony
curl http://localhost:4200

# Jeśli nie działa, uruchom dev serwery
./scripts/start-dev.sh --with-db
```

## 📝 Uwagi

### Limitacje darmowego ngrok:

- ✅ **1 tunel jednocześnie** - wystarczy dla frontend (backend działa przez Angular proxy)
- ✅ **URL zmienia się** przy każdym restarcie ngrok
- ✅ **Warning page** przy pierwszym wejściu (kliknij "Visit Site")
- ✅ **60 połączeń/minutę** - wystarczy dla testów

### Proxy configuration

Angular dev server (`proxy.conf.json`) przekierowuje `/api/*` do backendu (`localhost:8080`), więc:

- Frontend przez ngrok: `https://abc123.ngrok-free.app` ✅
- Backend automatycznie przez proxy: `https://abc123.ngrok-free.app/api/*` ✅

**Nie musisz** tworzyć osobnego tunelu dla backendu!

## 🔐 Bezpieczeństwo

- ❌ **NIGDY nie commituj `.env`** do Git!
- ✅ `.env` jest w `.gitignore`
- ✅ Token ngrok jest poufny - nie udostępniaj go
- ⚠️ Darmowy ngrok to **publiczny URL** - każdy kto ma link może zobaczyć aplikację
- 💡 Dla produkcji użyj VPS z SSL (np. Mikrus)

## 🎯 Use Cases

### Testowanie responsywności

```bash
# Uruchom ngrok
./scripts/start-ngrok.sh

# Otwórz na telefonie i testuj:
# - Touch gestures w photo viewer
# - Nawigacja na małym ekranie
# - Performance na słabszym device
```

### Testowanie GPS/lokalizacji

Photo Map wymaga GPS:
- Telefon może używać prawdziwej lokalizacji
- Testuj upload zdjęć z EXIF GPS
- Sprawdź czy mapa poprawnie centruje się na lokalizacji

### Demo dla klienta/teamu

```bash
# Uruchom ngrok i wyślij URL
./scripts/start-ngrok.sh

# Każdy z linkiem może zobaczyć live demo!
```

## 🛠️ Alternatywy (bez ngrok)

### Opcja A: VirtualBox Port Forwarding

1. VirtualBox → VM Settings → Network → Port Forwarding
2. Dodaj: Host `4200` → Guest `4200`
3. Frontend: `ng serve --host 0.0.0.0 --disable-host-check`
4. Telefon: `http://IP_WINDOWS:4200`

**Wymaga:** Telefon w tej samej sieci Wi-Fi co Windows

### Opcja B: Bridged Network

1. VirtualBox → VM Settings → Network
2. Adapter 1: **Bridged Adapter**
3. Restart VM
4. VM dostaje własne IP w sieci LAN
5. Telefon: `http://VM_IP:4200`

**Wymaga:** Restart VM, telefon w LAN

## 📚 Dokumentacja

- Ngrok: https://ngrok.com/docs
- Dashboard: https://dashboard.ngrok.com
- API: http://localhost:4040/api/tunnels
