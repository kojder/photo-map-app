# Feature: NAS Batch Processing - Remote Photo Storage

**Version:** 1.0
**Date:** 2025-10-26
**Status:** 📋 Planning
**Priority:** Medium (Post-MVP Enhancement)

---

## 🎯 Overview

System przetwarzania zdjęć z NAS do MVP Photo Map, gdzie:
- **Oryginały** pozostają na NAS (storage zewnętrzny)
- **Miniatury** generowane i przechowywane lokalnie na Mikrus VPS
- **Batch processing** - przetwarzanie w partiach z tracking progressu
- **Deduplikacja** - wykrywanie duplikatów po hash MD5/SHA256

**Benefits:**
- ✅ **90% oszczędności miejsca** na Mikrus VPS (tylko miniatury, bez oryginałów)
- ✅ **Centralne źródło** - NAS jako single source of truth dla oryginałów
- ✅ **Skalowalność** - łatwe dodawanie tysięcy zdjęć przez NAS
- ✅ **Backup** - oryginały już backupowane na NAS (RAID, snapshoty)

---

## 📊 Use Case & Problem Statement

### Problem:
Użytkownik ma:
- **NAS z kilkoma tysiącami zdjęć** (np. 5000 zdjęć × 5MB = 25GB)
- **Mikrus VPS z 250GB dysku** - kopiowanie wszystkich zdjęć nieefektywne
- **Potrzeba:** Wyświetlać zdjęcia w galerii/mapie bez duplikacji na VPS

### Obecne ograniczenia (MVP):
```
uploads/
├── input/      # Drop zone (Spring Integration poller)
├── original/   # ❌ Oryginały kopiowane lokalnie (duplikacja!)
├── medium/     # Miniatury 300px
└── failed/     # Błędy
```

**Problem:** Duplikacja danych - oryginały są w `input/` i `original/`

### Docelowe rozwiązanie:
```
NAS (zdalne):
/volume1/photos/IMG_1234.JPG (5MB) ← Oryginały tutaj

Mikrus VPS (lokalne):
/mnt/nas-photos/                   ← NAS mount (read-only)
uploads/
  └── medium/abc-uuid-123.jpg      ← TYLKO miniatury (~500KB)

PostgreSQL:
photos.original_path = "/volume1/photos/IMG_1234.JPG"
photos.thumbnail_filename = "abc-uuid-123.jpg"
photos.processed = true
```

---

## 🏗️ Architecture

### Infrastructure:

```
┌─────────────────────────────────────────────────┐
│  NAS (Synology/QNAP/TrueNAS)                    │
│  /volume1/photos/ (25GB+)                       │
│  ├── IMG_1234.JPG                               │
│  ├── IMG_1235.JPG                               │
│  └── ... (tysiące zdjęć)                        │
└─────────────────────────────────────────────────┘
                    ↓
          NFS/SMB mount (read-only)
                    ↓
┌─────────────────────────────────────────────────┐
│  Mikrus VPS (250GB)                             │
│                                                  │
│  /mnt/nas-photos/ ← Mount point (RO)           │
│                                                  │
│  uploads/medium/ (~2.5GB dla 5000 zdjęć)       │
│                                                  │
│  PostgreSQL:                                     │
│  - photos (original_path, thumbnail_filename)   │
│  - batch_jobs (tracking, progress)              │
└─────────────────────────────────────────────────┘
```

### Storage Calculation:
```
Scenariusz: 5000 zdjęć

NAS:
- Oryginały: 5000 × 5MB = 25GB

Mikrus VPS:
- Miniatury: 5000 × 500KB = 2.5GB
- PostgreSQL: ~50MB
- Aplikacja: ~500MB
- TOTAL: ~3GB (z zapasem <10GB)

Oszczędność: 22GB (88%)! ✅
```

---

## 🗄️ Database Schema Changes

### New Table: `batch_jobs`

**Purpose:** Tracking batch processing jobs (scan NAS, process photos)

```sql
CREATE TABLE batch_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,          -- 'INITIAL_SCAN', 'INCREMENTAL_SCAN', 'MANUAL_TRIGGER'
    total_files INT DEFAULT 0,              -- Liczba zdjęć do przetworzenia
    processed_files INT DEFAULT 0,          -- Przetworzono pomyślnie
    failed_files INT DEFAULT 0,             -- Błędy przetwarzania
    status VARCHAR(20) DEFAULT 'RUNNING',   -- 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,                     -- Ostatni błąd (jeśli FAILED)
    
    INDEX batch_jobs_status_idx (status),
    INDEX batch_jobs_started_at_idx (started_at)
);
```

### Modified Table: `photos`

**Changes:**
- Add `original_path` - ścieżka do pliku na NAS
- Add `nas_file_hash` - MD5/SHA256 hash dla deduplikacji
- Add `processed` - flag czy zdjęcie zostało przetworzone
- Add `processed_at` - timestamp przetworzenia
- Remove `filename` - zbędne (mamy `original_filename` i `thumbnail_filename`)

```sql
ALTER TABLE photos
  DROP COLUMN filename,
  ADD COLUMN original_path VARCHAR(1000) NOT NULL UNIQUE,
  ADD COLUMN nas_file_hash VARCHAR(64),
  ADD COLUMN processed BOOLEAN DEFAULT false,
  ADD COLUMN processed_at TIMESTAMP;

CREATE INDEX photos_original_path_idx ON photos(original_path);
CREATE INDEX photos_processed_idx ON photos(processed);
CREATE INDEX photos_nas_hash_idx ON photos(nas_file_hash);
```

**Updated Photo Entity Fields:**
- `id` - BIGSERIAL PRIMARY KEY
- `user_id` - BIGINT (nullable, może być null dla batch uploads)
- `original_path` - VARCHAR(1000) UNIQUE NOT NULL - ścieżka na NAS
- `original_filename` - VARCHAR(500) NOT NULL - nazwa z EXIF
- `file_size` - BIGINT NOT NULL
- `mime_type` - VARCHAR(100) NOT NULL
- `nas_file_hash` - VARCHAR(64) - MD5/SHA256
- `thumbnail_filename` - VARCHAR(500) NOT NULL - lokalny plik miniatury
- `gps_latitude`, `gps_longitude` - DECIMAL (EXIF GPS)
- `taken_at` - TIMESTAMP (EXIF date)
- `processed` - BOOLEAN - czy przetworzono
- `processed_at` - TIMESTAMP - kiedy przetworzono
- `uploaded_at`, `updated_at` - timestamps

---

## 🔄 Workflows

### Workflow 1: Inicjalne Skanowanie NAS (Jednorazowe)

**Trigger:** Admin wywołuje `POST /api/admin/nas/scan`

**Steps:**
1. **Scan NAS:**
   - Rekurencyjne skanowanie `/mnt/nas-photos/`
   - Filtrowanie: tylko `.jpg`, `.jpeg`, `.png`
   - Zapisz listę znalezionych plików

2. **Filter Unprocessed:**
   - Dla każdego pliku: sprawdź w DB czy istnieje `photos.original_path`
   - Jeśli NIE istnieje → dodaj do kolejki przetwarzania

3. **Create Batch Job:**
   - Insert do `batch_jobs`: `job_type='INITIAL_SCAN'`, `total_files=N`, `status='RUNNING'`

4. **Process in Batches:**
   - Podziel na partie (np. 100 zdjęć na raz)
   - Dla każdej partii:
     - Odczytaj EXIF (przez NFS mount)
     - Generuj miniaturę → zapisz lokalnie do `/uploads/medium/`
     - Oblicz hash MD5 (opcjonalnie)
     - Zapisz do DB: `photos` table
     - Update `batch_jobs.processed_files`

5. **Complete Job:**
   - Update `batch_jobs`: `status='COMPLETED'`, `completed_at=NOW()`
   - Log summary: total processed, failed, time elapsed

**Expected Time:** 5000 zdjęć × 2s = ~3 godziny (można optymalizować)

---

### Workflow 2: Przyrostowe Skanowanie (Okresowe)

**Trigger:** Cron job (np. codziennie o 3:00 AM) lub webhook z NAS

**Steps:**
1. **Scan for New Files:**
   - Skanuj `/mnt/nas-photos/`
   - Filter: tylko pliki których `original_path` NIE MA w DB

2. **Process New Files:**
   - Analogicznie jak Workflow 1, ale tylko dla nowych
   - `job_type='INCREMENTAL_SCAN'`

3. **Deduplikacja:**
   - Przed zapisem: sprawdź `nas_file_hash` w DB
   - Jeśli duplikat → skip (log warning)

**Alternative:** Webhook z NAS
- Synology DSM: File Station → Webhook on file create
- POST `/api/admin/nas/process-photo?path=/volume1/photos/new.jpg`

---

### Workflow 3: Wyświetlanie Zdjęć (Frontend)

**Galeria/Mapa - Miniatury:**
```
GET /api/photos/{id}/thumbnail
→ Backend zwraca lokalny plik z /uploads/medium/
→ Szybko (local disk)
```

**Full View - Oryginał:**
```
GET /api/photos/{id}/original
→ Backend:
  1. Odczytuje photo.original_path z DB
  2. Proxy do /mnt/nas-photos/IMG_1234.JPG (przez NFS mount)
  3. Zwraca binary image data
→ Wolniejsze (network I/O przez NFS), ale akceptowalne
```

**Opcjonalna optymalizacja:** Nginx cache dla oryginałów (30 dni)

---

## 🛠️ Backend Implementation Plan

### Phase 1: Database Migration (30 min)

**Tasks:**
- [ ] Create Flyway migration `V6__nas_batch_processing.sql`
- [ ] Add columns to `photos` table
- [ ] Create `batch_jobs` table
- [ ] Create indexes

**Deliverables:**
- SQL migration file
- Updated JPA entities: `Photo`, `BatchJob`

---

### Phase 2: Batch Processing Service (3-4 hours)

**New Classes:**

1. **`BatchJob` Entity**
   - JPA entity mapping `batch_jobs` table
   - Fields: id, jobType, totalFiles, processedFiles, failedFiles, status, timestamps

2. **`PhotoBatchService`**
   - Method: `scanNasAndProcess(int batchSize)` → BatchJob
   - Method: `scanNasDirectory(String path)` → List<Path>
   - Method: `processBatch(List<Path> photos, BatchJob job)` → void
   - Method: `processPhotoFromNas(Path nasPath)` → void (EXIF + thumbnail + DB save)
   - Method: `calculateFileHash(Path file)` → String (MD5/SHA256)

3. **`BatchJobRepository`**
   - Extends `JpaRepository<BatchJob, Long>`
   - Custom queries: `findByStatus(String status)`, `findRecent()`

**Configuration:**
```properties
# application.properties
nas.mount.path=/mnt/nas-photos
nas.batch.size=100
nas.hash.algorithm=MD5  # lub SHA256
```

**Key Logic:**
- **Deduplikacja:** Before insert, check `photoRepository.existsByNasFileHash(hash)`
- **Error handling:** Try-catch per photo, move to `failed_files` counter
- **Progress tracking:** Update `batch_jobs.processed_files` co 10 zdjęć

---

### Phase 3: Admin API Endpoints (2 hours)

**New Endpoints:**

1. **POST `/api/admin/nas/scan`**
   - Request: `{ batchSize?: number }` (default: 100)
   - Response: `{ jobId, status: 'RUNNING', totalFiles, startedAt }`
   - Starts async batch job (return 202 Accepted)

2. **GET `/api/admin/nas/jobs`**
   - Query params: `?status=RUNNING&page=0&size=20`
   - Response: `PageResponse<BatchJobResponse>`
   - List all batch jobs with pagination

3. **GET `/api/admin/nas/jobs/{id}`**
   - Response: `{ id, jobType, totalFiles, processedFiles, failedFiles, status, progress%, startedAt, completedAt }`
   - Get single batch job details

4. **POST `/api/admin/nas/process-photo`**
   - Query param: `?path=/volume1/photos/new.jpg`
   - Response: `{ status: 'processed' | 'failed', photoId? }`
   - Webhook endpoint (single photo)

5. **DELETE `/api/admin/nas/jobs/{id}`**
   - Delete completed/failed batch job record (cleanup)

**Security:** All endpoints require ADMIN role

---

### Phase 4: Photo Serving from NAS (1 hour)

**Modified Endpoint:**

**GET `/api/photos/{id}/original`**
```java
// Old (MVP):
Path originalPath = Paths.get(originalDirectory, photo.getFilename());

// New (NAS):
Path originalPath = Paths.get(photo.getOriginalPath());

// Validation:
if (!Files.exists(originalPath)) {
    throw new NotFoundException("Original photo not found on NAS");
}

// Proxy from NAS:
Resource resource = new FileSystemResource(originalPath);
return ResponseEntity.ok()
    .contentType(MediaType.parseMediaType(photo.getMimeType()))
    .body(resource);
```

**Error Handling:**
- If NAS mount unavailable → return 503 Service Unavailable
- Frontend shows: "Original photo temporarily unavailable"

---

### Phase 5: Async Job Executor (Optional - 2 hours)

**Purpose:** Run batch jobs asynchronously without blocking API

**Implementation:**
- Spring `@Async` with thread pool
- Or: Spring Integration scheduled poller

**Benefits:**
- Admin calls `/api/admin/nas/scan` → immediate 202 response
- Job runs in background
- Admin can check progress via `/api/admin/nas/jobs/{id}`

---

## 🎨 Frontend Implementation Plan

### Phase 1: Admin UI - NAS Management (3-4 hours)

**New Component:** `NasManagementComponent` (admin panel section)

**Features:**

1. **Scan NAS Button**
   - Button: "Scan NAS for New Photos"
   - Input: Batch size (default 100)
   - On click → POST `/api/admin/nas/scan`
   - Show notification: "Scan started, Job ID: 123"

2. **Batch Jobs List**
   - Table columns: Job ID, Type, Total, Processed, Failed, Status, Progress%, Started, Completed
   - Auto-refresh every 5s for RUNNING jobs (via RxJS interval)
   - Color coding: RUNNING (blue), COMPLETED (green), FAILED (red)

3. **Job Details Modal**
   - Click job → open modal with full details
   - Show error message if FAILED
   - Button: "Delete Job" (cleanup)

4. **Progress Bar**
   - For RUNNING jobs: animated progress bar
   - Calculation: `(processedFiles / totalFiles) × 100%`

**Service:** `NasBatchService`
```typescript
export class NasBatchService {
  scanNas(batchSize: number): Observable<BatchJob>;
  getBatchJobs(status?: string, page?: number): Observable<PageResponse<BatchJob>>;
  getBatchJob(id: number): Observable<BatchJob>;
  deleteBatchJob(id: number): Observable<void>;
}
```

---

### Phase 2: Gallery/Map - No Changes (0 hours)

**Reason:** Frontend NIE WIE że oryginały są na NAS!

Endpoints pozostają te same:
- `/api/photos/{id}/thumbnail` → local (fast)
- `/api/photos/{id}/original` → backend proxy (transparent to frontend)

**Optional Enhancement:** Loading indicator for original view (slower NAS read)

---

## 🧪 Testing Strategy

### Unit Tests (Backend)

1. **PhotoBatchServiceTest**
   - Test: `scanNasDirectory()` filters only .jpg/.jpeg/.png
   - Test: `processPhotoFromNas()` extracts EXIF correctly
   - Test: `calculateFileHash()` returns consistent MD5
   - Test: Deduplikacja - skip if hash exists in DB
   - Test: Error handling - failed photo increments `failed_files`

2. **AdminControllerTest (NAS endpoints)**
   - Test: POST `/api/admin/nas/scan` returns 202 Accepted
   - Test: GET `/api/admin/nas/jobs` requires ADMIN role
   - Test: GET `/api/admin/nas/jobs/{id}` returns correct job

### Integration Tests

1. **NAS Batch Processing Integration Test**
   - Setup: Mock NAS directory with 10 test photos
   - Test: Full scan → all photos processed → batch job COMPLETED
   - Verify: 10 records in `photos` table, 10 thumbnails in `/uploads/medium/`

2. **Photo Serving from NAS**
   - Test: GET `/api/photos/{id}/original` serves from NAS path
   - Test: 404 if NAS file deleted
   - Test: 503 if NAS mount unavailable

### Manual Testing Checklist

- [ ] NFS mount works (read files from `/mnt/nas-photos/`)
- [ ] Scan 100 photos → all processed without errors
- [ ] Deduplikacja działa (duplikat skipped)
- [ ] Progress tracking aktualizuje się w real-time
- [ ] Frontend gallery shows thumbnails correctly
- [ ] Full view loads original from NAS (może być wolniejsze)

---

## 📦 Deployment Considerations

### Infrastructure Setup (Mikrus VPS)

**Step 1: NFS/SMB Mount**

**Option A: NFS (Recommended - fastest)**
```bash
# Install NFS client
sudo apt install nfs-common

# Create mount point
sudo mkdir -p /mnt/nas-photos

# Test mount (manual)
sudo mount -t nfs nas.local:/volume1/photos /mnt/nas-photos

# Add to /etc/fstab (persistent)
nas.local:/volume1/photos /mnt/nas-photos nfs ro,noatime,soft,timeo=10 0 0

# Mount all
sudo mount -a
```

**Option B: SMB (if NAS only supports SMB)**
```bash
# Install SMB client
sudo apt install cifs-utils

# Create credentials file
sudo nano /root/.nascreds
# Content:
# username=your_nas_user
# password=your_nas_password

# Mount
sudo mount -t cifs //nas.local/photos /mnt/nas-photos -o credentials=/root/.nascreds,ro

# Add to /etc/fstab
//nas.local/photos /mnt/nas-photos cifs credentials=/root/.nascreds,ro 0 0
```

**Verify:**
```bash
ls /mnt/nas-photos/  # Should list photos
df -h | grep nas     # Should show mounted filesystem
```

---

### Step 2: Application Configuration

**application.properties (production):**
```properties
# NAS mount path
nas.mount.path=/mnt/nas-photos
nas.batch.size=100

# Uploads (only thumbnails locally)
photo.upload.directory.medium=/var/photo-map/uploads/medium

# Remove original directory config (not needed anymore)
# photo.upload.directory.original=...
```

**Disk Space Management:**
```bash
# Check disk usage
df -h

# Expected:
# NAS: 25GB (remote, doesn't count)
# Mikrus: ~3GB (thumbnails + DB + app)
```

---

### Step 3: Nginx Cache (Optional)

**Purpose:** Cache original photos from NAS for faster repeated access

**nginx.conf:**
```nginx
proxy_cache_path /var/cache/nginx/photos 
    levels=1:2 
    keys_zone=photos:10m 
    max_size=5g 
    inactive=30d;

location /api/photos {
    # Thumbnails - no cache (local, fast)
    location ~ /api/photos/\d+/thumbnail {
        proxy_pass http://localhost:8080;
    }
    
    # Originals - cache for 30 days
    location ~ /api/photos/\d+/original {
        proxy_cache photos;
        proxy_cache_valid 200 30d;
        proxy_cache_key "$uri";
        proxy_pass http://localhost:8080;
    }
}
```

**Benefits:**
- Pierwsze odczytanie: wolne (przez NFS)
- Kolejne odczytania: szybkie (z cache Nginx)
- Cache limit: 5GB (najczęściej oglądane zdjęcia)

---

### Step 4: Monitoring & Alerts

**Health Checks:**
1. **NAS Mount Status**
   ```bash
   # Cron job - check every 5 min
   */5 * * * * mountpoint -q /mnt/nas-photos || notify-admin "NAS mount down!"
   ```

2. **Disk Space Alert**
   ```bash
   # Alert if thumbnails exceed 10GB
   df -h /var/photo-map/uploads/medium | awk '{ if ($5 > 80) print "Disk usage high!" }'
   ```

3. **Batch Job Monitoring**
   - Spring Boot Actuator: `/actuator/metrics`
   - Custom metric: `batch.jobs.running`, `batch.jobs.failed`

---

## ⚙️ Configuration Options

### Environment Variables (.env)

```bash
# NAS Configuration
NAS_MOUNT_PATH=/mnt/nas-photos
NAS_BATCH_SIZE=100
NAS_HASH_ALGORITHM=MD5  # or SHA256

# Upload Directories (local only)
UPLOAD_DIR_MEDIUM=/var/photo-map/uploads/medium
UPLOAD_DIR_FAILED=/var/photo-map/uploads/failed

# Cron Job (incremental scan)
NAS_SCAN_CRON=0 3 * * *  # Daily at 3 AM
```

### application.properties

```properties
# NAS Batch Processing
nas.mount.path=${NAS_MOUNT_PATH:/mnt/nas-photos}
nas.batch.size=${NAS_BATCH_SIZE:100}
nas.hash.algorithm=${NAS_HASH_ALGORITHM:MD5}

# Uploads
photo.upload.directory.medium=${UPLOAD_DIR_MEDIUM:./uploads/medium}
photo.upload.directory.failed=${UPLOAD_DIR_FAILED:./uploads/failed}

# Cron (for incremental scan)
nas.scan.cron=${NAS_SCAN_CRON:0 3 * * *}
```

---

## 🚀 Migration Path (from MVP)

### Phase 1: Backward Compatibility (1 hour)

**Goal:** New code works with existing MVP photos

**Strategy:**
- `photos.original_path` nullable initially
- If `original_path = NULL` → fallback to old logic (local `original/` folder)
- New photos: always use NAS path

**Code:**
```java
public Path getOriginalPhotoPath(Photo photo) {
    if (photo.getOriginalPath() != null) {
        return Paths.get(photo.getOriginalPath());  // NAS path
    } else {
        return Paths.get(originalDirectory, photo.getFilename());  // Legacy MVP
    }
}
```

### Phase 2: Data Migration (Optional)

**If you want to move existing MVP photos to NAS:**

1. Copy `uploads/original/*` to NAS
2. Update DB: `UPDATE photos SET original_path = '/mnt/nas-photos/' || filename`
3. Delete local `uploads/original/` folder

**Script:**
```bash
#!/bin/bash
# Copy MVP originals to NAS
rsync -av /var/photo-map/uploads/original/ /mnt/nas-photos/

# Update DB (via Spring Boot admin endpoint)
curl -X POST http://localhost:8080/api/admin/nas/migrate-legacy
```

---

## 📈 Performance Considerations

### Expected Performance:

| Operation | MVP (Local) | NAS (Remote) | Impact |
|-----------|-------------|--------------|--------|
| Thumbnail load | ~5ms | ~5ms | ✅ No change (local) |
| Original load | ~10ms | ~50-100ms | ⚠️ Slower (NFS latency) |
| Batch processing | 2s/photo | 3s/photo | ⚠️ EXIF read over network |
| Disk usage (5000 photos) | 27.5GB | 2.5GB | ✅ 90% reduction |

### Optimizations:

1. **Nginx Cache** - cache frequently viewed originals (5GB limit)
2. **Parallel Processing** - process 10 photos concurrently (Java parallel streams)
3. **Lazy Loading** - frontend loads thumbnails first, original on demand
4. **CDN** (future) - serve NAS originals via CDN for global users

---

## 🔒 Security Considerations

### NAS Mount Security:

1. **Read-Only Mount**
   - Prevent accidental deletion from application
   - Config: `mount -o ro` in /etc/fstab

2. **Network Security**
   - NAS accessible only from Mikrus VPS IP (firewall)
   - Use NFS with Kerberos (or SMB with encryption)

3. **Credentials**
   - SMB credentials in `/root/.nascreds` (chmod 600)
   - NFS exports restricted to VPS IP only

### Application Security:

1. **Path Traversal Prevention**
   ```java
   // Validate NAS path before access
   Path requestedPath = Paths.get(nasBasePath, photo.getOriginalPath());
   if (!requestedPath.startsWith(nasBasePath)) {
       throw new SecurityException("Invalid path");
   }
   ```

2. **Admin-Only Endpoints**
   - All `/api/admin/nas/*` require ADMIN role
   - Rate limiting on scan endpoint (prevent DoS)

---

## 📋 Acceptance Criteria

### Must Have (MVP for NAS Integration):
- ✅ NAS zmontowany i dostępny w `/mnt/nas-photos/`
- ✅ Admin może wywołać scan NAS przez API
- ✅ Batch processing działa (100 zdjęć na raz)
- ✅ Progress tracking w real-time (batch jobs table)
- ✅ Miniatury generowane lokalnie (~2.5GB dla 5000 zdjęć)
- ✅ Oryginały serwowane z NAS (przez backend proxy)
- ✅ Frontend gallery/map działają bez zmian
- ✅ Deduplikacja po hash (skip duplikaty)
- ✅ Error handling (failed photos to `failed_files` counter)

### Nice to Have (Optional Enhancements):
- ⭐ Nginx cache dla oryginałów (5GB limit)
- ⭐ Cron job - przyrostowe skanowanie (codziennie)
- ⭐ Webhook z NAS - real-time processing
- ⭐ Parallel processing (10 photos concurrent)
- ⭐ Admin UI - batch jobs progress bar + auto-refresh
- ⭐ Metrics - Actuator metrics dla batch jobs

---

## 🎯 Success Metrics

**Storage Efficiency:**
- Target: <10GB total on Mikrus VPS (for 5000 photos)
- Baseline: 27.5GB (MVP with local originals)
- **Goal: 75%+ reduction** ✅

**Processing Speed:**
- Target: 5000 photos in <4 hours (initial scan)
- Rate: ~1000 photos/hour (~2.5s per photo)

**Availability:**
- Thumbnails: 99.9% uptime (local, fast)
- Originals: 95% uptime (depends on NAS network)

**User Experience:**
- Gallery load: <2s (thumbnails local)
- Original view: <5s (NAS proxy, acceptable)

---

## 📚 Related Documentation

- **Tech Stack:** `.ai/tech-stack.md` - Spring Integration async processing
- **Database:** `.ai/db-plan.md` - Photos table schema
- **API:** `.ai/api-plan.md` - Photo endpoints
- **Progress:** `PROGRESS_TRACKER.md` - Implementation phases

---

## 🛣️ Implementation Roadmap

### Phase 1: Infrastructure (1-2 days)
- [ ] Setup NFS/SMB mount na Mikrus VPS
- [ ] Test: Read files from `/mnt/nas-photos/`
- [ ] Database migration V6 (`batch_jobs`, `photos` changes)
- [ ] Create JPA entities (BatchJob, updated Photo)

### Phase 2: Backend Batch Service (2-3 days)
- [ ] PhotoBatchService implementation
- [ ] Admin API endpoints (scan, jobs list, job details)
- [ ] Unit tests (coverage >70%)
- [ ] Integration test (mock NAS with 10 photos)

### Phase 3: Photo Serving (1 day)
- [ ] Update PhotoController.getOriginal() - serve from NAS
- [ ] Error handling (NAS unavailable → 503)
- [ ] Backward compatibility (legacy MVP photos)

### Phase 4: Admin UI (2-3 days)
- [ ] NasManagementComponent (scan button, jobs list)
- [ ] NasBatchService (Angular)
- [ ] Progress bar with auto-refresh
- [ ] Tests (unit + manual)

### Phase 5: Deployment & Optimization (1-2 days)
- [ ] Deploy to Mikrus VPS
- [ ] Configure Nginx cache (optional)
- [ ] Setup cron job (incremental scan - optional)
- [ ] Monitoring & alerts

**Total Estimated Time:** 7-11 days (1.5-2 weeks)

---

**Document Purpose:** Implementation plan for NAS Batch Processing feature
**Target Audience:** Developers implementing Post-MVP enhancement
**Last Updated:** 2025-10-26
