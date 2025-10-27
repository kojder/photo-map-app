# Deployment Setup - Verification Prompt (Post /clear)

**Użycie:** Wklej ten prompt po wykonaniu `/clear` aby zweryfikować spójność dokumentacji deployment.

---

## 📋 Prompt Weryfikacyjny:

```
Sprawdź spójność dokumentacji deployment dla Photo Map MVP:

**Kontekst:**
- VPS: marcin288.mikrus.xyz (srv07.mikr.us, port SSH: 10288)
- Porty: 20288 (n8n), 30288 (photo-map frontend)
- Domena: photos.tojest.dev → port 30288
- SSH Key: ~/.ssh/id_ed25519_mikrus (passwordless)
- Strategy: Docker Compose (backend + frontend containers)

**Pliki do sprawdzenia:**
1. PROGRESS_TRACKER.md - Phase 6 (Task 6.1-6.2 completed)
2. .ai/features/feature-deployment-mikrus.md
3. deployment/MIKRUS_SETUP.md
4. deployment/README.md
5. deployment/docker-compose.yml
6. deployment/.env.production.example
7. deployment/scripts/*.sh

**Weryfikuj:**
1. **Porty:**
   - Frontend external port = 30288 (WSZĘDZIE)
   - Backend internal port = 8080
   - NIE POWINNO być: 20100, 20288 dla photo-map

2. **Domeny/Hosty:**
   - photos.tojest.dev (custom subdomain)
   - srv07.mikr.us lub marcin288.mikrus.xyz (NIE srv01)
   - srv07-30288.wykr.es (shared domain fallback)

3. **SSH Commands:**
   - Wszystkie używają: -i ~/.ssh/id_ed25519_mikrus -p 10288
   - Host: root@marcin288.mikrus.xyz
   - Path na VPS: /opt/photo-map

4. **Docker Compose:**
   - Frontend port mapping: "30288:80"
   - Backend port: 8080 (internal only)
   - Volume: photo-map-uploads
   - Network: photo-map-network

5. **Dokumentacja:**
   - PROGRESS_TRACKER.md - Task 6.1-6.2 marked as completed ✅
   - Phase 6 status: Docker Compose (NIE "Native + Manual")
   - Acceptance Criteria: Docker containers (NIE systemd)

**Output format:**
```
✅ SPÓJNOŚĆ OK - wszystkie wartości zgodne
lub
❌ NIESPÓJNOŚCI ZNALEZIONE:
  - Plik X, linia Y: wartość Z (powinno być: W)
  - ...
```

**Dodatkowe sprawdzenia:**
- Czy deployment/scripts/*.sh mają chmod +x?
- Czy MIKRUS_SETUP.md zawiera konkretne wartości marcin288?
- Czy brak starych plików: deployment/systemd/, deployment/nginx/, deployment/scripts/mikrus-setup.sh?
```

---

## 🔍 Checklist (dla Claude po /clear):

- [ ] Przeczytać PROGRESS_TRACKER.md (Phase 6 section)
- [ ] Przeczytać .ai/features/feature-deployment-mikrus.md (cały plik)
- [ ] Przeczytać deployment/MIKRUS_SETUP.md (cały plik)
- [ ] Grep porty: `grep -r "20100\|20288\|30288" deployment/ .ai/ PROGRESS_TRACKER.md`
- [ ] Grep hosty: `grep -r "srv01\|srv07\|marcin288" deployment/ .ai/ PROGRESS_TRACKER.md`
- [ ] Grep domeny: `grep -r "tojest.dev\|wykr.es" deployment/ .ai/ PROGRESS_TRACKER.md`
- [ ] Sprawdzić docker-compose.yml - port mapping
- [ ] Sprawdzić deploy-marcin288.sh - SSH config
- [ ] Sprawdzić .env.production.example - przykładowe wartości

---

## ✅ Expected Values (Reference):

**VPS Configuration:**
- Host: `marcin288.mikrus.xyz`
- Server: `srv07.mikr.us`
- SSH Port: `10288`
- SSH Key: `~/.ssh/id_ed25519_mikrus`
- User: `root`

**Application Ports:**
- Frontend External: `30288`
- Backend Internal: `8080`
- n8n (occupied): `20288`

**Domains:**
- Primary: `photos.tojest.dev`
- Fallback: `srv07-30288.wykr.es`

**Docker:**
- Backend image: `photo-map-backend:latest`
- Frontend image: `photo-map-frontend:latest`
- Volume: `photo-map-uploads`
- Network: `photo-map-network`
- Deploy path: `/opt/photo-map`

**PostgreSQL:**
- Host: `psql01.mikr.us:5432`
- Database: `db_marcin288`
- Username: `usermarcin288`

---

**Created:** 2025-10-27
**Purpose:** Verification after /clear to ensure documentation consistency
**Usage:** Copy-paste prompt above into fresh Claude Code session
