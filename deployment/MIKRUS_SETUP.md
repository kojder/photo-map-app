# Mikrus VPS Setup - marcin288.mikrus.xyz

**VPS Info:**
- Host: `marcin288.mikrus.xyz`
- SSH Port: `10288`
- Server: `srv07.mikr.us`
- Available Ports: `20288` (n8n), `30288` (photo-map)
- Domain: `tojest.dev` (subdomain: `photos.tojest.dev`)

---

## 🔑 Step 1: SSH Key Setup (REQUIRED - do raz)

Klucz już wygenerowany w: `~/.ssh/id_ed25519_mikrus`

**Skopiuj klucz na VPS:**

```bash
# Skopiuj klucz na VPS (wymaga hasła - ostatni raz!)
ssh-copy-id -i ~/.ssh/id_ed25519_mikrus.pub -p 10288 root@marcin288.mikrus.xyz

# Test połączenia (BEZ hasła)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz
```

Po tym kroku będziesz mógł logować się bez hasła! 🎉

---

## 🌐 Step 2: Subdomena Setup (DONE ✅)

**Status:** ✅ Subdomena już skonfigurowana w panelu Mikrus!

- **Domena:** `photos.tojest.dev`
- **Cel:** `[2a01:4f9:4a:5029::288]:30288`
- **Status:** Niebieski (ETA ~2 min po deployment)

**Test po deployment:**
```bash
# Sprawdź czy subdomena odpowiada
curl https://photos.tojest.dev/
# Powinno zwrócić Angular index.html
```

**Jeśli subdomena nie działa:**
- Poczekaj 2-5 minut na propagację DNS
- Sprawdź status w panelu: https://mikr.us/panel/?a=re-domain

---

## 📦 Step 3: PostgreSQL Credentials

1. **Panel:** https://mikr.us/panel/?a=postgres
2. **Pobierz credentials:**
   - Database: `db_marcin288`
   - User: `usermarcin288`
   - Password: `<skopiuj z panelu>`
   - Host: `psql01.mikr.us:5432`

3. **Utworzyć plik `.env`:**
   ```bash
   cp deployment/.env.production.example deployment/.env
   nano deployment/.env
   ```

4. **Wpisz credentials:**
   ```env
   DATABASE_URL=jdbc:postgresql://psql01.mikr.us:5432/db_marcin288
   DATABASE_USERNAME=usermarcin288
   DATABASE_PASSWORD=<PASTE_FROM_PANEL>
   JWT_SECRET=<GENERATE: openssl rand -base64 32>
   ADMIN_EMAIL=your@email.com
   ```

---

## 🚀 Step 4: Deployment Workflow

### Pierwsza instalacja:

```bash
# 1. Build Docker images lokalnie
./deployment/scripts/build-images.sh

# 2. Deploy na VPS (używa SSH key automatycznie)
./deployment/scripts/deploy-marcin288.sh
```

### Kolejne updates:

```bash
# 1. Rebuild images (po zmianach w kodzie)
./deployment/scripts/build-images.sh

# 2. Deploy
./deployment/scripts/deploy-marcin288.sh
```

---

## ✅ Step 5: Weryfikacja

```bash
# Check containers status (na VPS)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'cd /opt/photo-map && docker compose ps'

# Check backend logs
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'docker logs photo-map-backend --tail 50'

# Check frontend
curl https://photos.tojest.dev/
```

**Expected:**
- Backend: `Started PhotoMapApplication in X seconds`
- Frontend: Angular index.html (HTML response)
- URL: `https://photos.tojest.dev/` działa

---

## 🔧 Troubleshooting

### Problem: SSH key not working

```bash
# Sprawdź czy klucz jest dodany do ssh-agent
ssh-add -l

# Jeśli brak, dodaj:
ssh-add ~/.ssh/id_ed25519_mikrus

# Test połączenia
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz
```

### Problem: Subdomena nie działa (timeout)

```bash
# Sprawdź czy port 30288 jest otwarty
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'netstat -tulpn | grep 30288'

# Sprawdź logi frontendu
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'docker logs photo-map-frontend'
```

### Problem: Backend nie startuje

```bash
# Sprawdź logi backendu
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'docker logs photo-map-backend --tail 100 | grep -i error'

# Sprawdź czy PostgreSQL credentials są poprawne
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'cd /opt/photo-map && cat .env | grep DATABASE'
```

---

## 📚 Useful Commands

```bash
# Restart containers
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'cd /opt/photo-map && docker compose restart'

# Stop containers
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'cd /opt/photo-map && docker compose down'

# Start containers
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'cd /opt/photo-map && docker compose up -d'

# View logs (real-time)
ssh -i ~/.ssh/id_ed25519_mikrus -p 10288 root@marcin288.mikrus.xyz \
  'docker logs photo-map-backend -f'
```

---

**Created:** 2025-10-27
**Last Updated:** 2025-10-27
