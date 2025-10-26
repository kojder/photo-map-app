# Przykład Złożonej Funkcji - Batch Upload z Async Processing

## User Story

**ID:** US-UPLOAD-002
**Tytuł:** Batch upload zdjęć z asynchronicznym przetwarzaniem
**Opis:** Jako użytkownik mogę wrzucić wiele zdjęć bezpośrednio do folderu `input/` (via scp/ftp) a system przetworzy je w tle.

**Kryteria Akceptacji:**
- User może wrzucić wiele zdjęć do `/opt/photo-map/storage/{userId}/input/`
- System monitoruje folder `input/` i automatycznie przetwarza nowe pliki
- Każde zdjęcie jest przetwarzane: EXIF extraction + thumbnail generation
- Przetworzone pliki przenoszone do `original/`, `small/`, `medium/`, `large/`
- Błędne pliki przenoszone do `failed/` z error logiem
- System jest resilient (one failed photo nie blokuje innych)
- Processing nie wpływa na responsywność web uploadu

## Complexity Assessment

### Database Changes
- No table changes (uses existing `photos` table)
- Maybe add `processing_status` enum (pending/processing/completed/failed)

### Integration Requirements
- **Spring Integration** (nowa technologia dla projektu)
- FileInboundChannelAdapter (monitoring folderu)
- Scheduled poller (co 10s)
- Service Activator (trigger processing)
- Error Channel (handle failures)

### Folder Structure
```
/opt/photo-map/storage/{userId}/
├── input/         # Drop zone (user uploads here via scp/ftp)
├── original/      # Processed originals
├── small/         # 150px thumbnails
├── medium/        # 400px thumbnails
├── large/         # 800px thumbnails
└── failed/        # Failed processing + error logs
```

### Processing Flow
1. User drops files to `input/` (scp/ftp)
2. Spring Integration poller detects new files (every 10s)
3. Service Activator triggers `PhotoProcessingService.processFile()`
4. EXIF extraction + thumbnail generation
5. Move to `original/`, generate thumbnails to `small/medium/large/`
6. Save Photo entity to database
7. On error → move to `failed/` + create error.log

### Complexity Level
**Complex** - 9 chunks, 8-12h

**Reasoning:**
- ✅ Spring Integration setup (NEW technology)
- ✅ Asynchronous processing (different from web upload)
- ✅ Error handling (resilience, failed files)
- ✅ Folder structure management
- ✅ Integration with existing processing services
- ⚠️ 7+ files to create/modify
- ⚠️ Testing complexity (async, file system)

## Feature Breakdown

### Phase 1: Spring Integration Setup (Chunks 1-3)

#### Chunk 1: Add Dependencies & Basic Config (60 min)

**Implementacja:**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.integration</groupId>
    <artifactId>spring-integration-file</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.integration</groupId>
    <artifactId>spring-integration-core</artifactId>
</dependency>
```

```java
// FileIntegrationConfig.java
@Configuration
@EnableIntegration
public class FileIntegrationConfig {

    @Value("${photo.storage.base-path}")
    private String storagePath;

    @Bean
    public MessageChannel fileInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel errorChannel() {
        return new DirectChannel();
    }

    @Bean
    @InboundChannelAdapter(
        channel = "fileInputChannel",
        poller = @Poller(fixedDelay = "10000") // 10 seconds
    )
    public MessageSource<File> fileReadingMessageSource() {
        FileReadingMessageSource source = new FileReadingMessageSource();
        source.setDirectory(new File(storagePath + "/input"));
        source.setFilter(new SimplePatternFileListFilter("*.{jpg,jpeg,png}"));
        return source;
    }
}
```

**Test:**
```bash
# Create test folder structure
mkdir -p /tmp/photo-test/input

# Update application.properties
photo.storage.base-path=/tmp/photo-test

# Run app
./mvnw spring-boot:run

# Drop test file
cp test-image.jpg /tmp/photo-test/input/

# Check logs → should see Spring Integration polling
```

**Commit:**
```
feat(integration): add Spring Integration dependencies and basic config

- Add spring-integration-file dependencies
- Create FileIntegrationConfig with FileInboundChannelAdapter
- Configure poller (10s interval)
- Set up file input channel and error channel
- Filter for JPEG/PNG files only
```

---

#### Chunk 2: Service Activator & Processing Service (70 min)

**Implementacja:**

```java
// PhotoProcessingService.java
@Service
public class PhotoProcessingService {

    private final ExifService exifService;
    private final ThumbnailService thumbnailService;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;

    @ServiceActivator(inputChannel = "fileInputChannel", outputChannel = "nullChannel")
    public void processFile(Message<File> message) {
        File inputFile = message.getPayload();
        String userId = extractUserIdFromPath(inputFile);

        try {
            log.info("Processing file: {} for user: {}", inputFile.getName(), userId);

            // 1. Extract EXIF
            ExifData exif = exifService.extractExif(inputFile);

            // 2. Generate thumbnails
            Map<String, File> thumbnails = thumbnailService.generateThumbnails(
                inputFile,
                userId
            );

            // 3. Move original to original/ folder
            File originalDest = moveToOriginal(inputFile, userId);

            // 4. Save to database
            User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new UserNotFoundException(userId));

            Photo photo = Photo.builder()
                .user(user)
                .fileName(inputFile.getName())
                .fileSize(inputFile.length())
                .filePath(originalDest.getAbsolutePath())
                .latitude(exif.getLatitude())
                .longitude(exif.getLongitude())
                .dateTaken(exif.getDateTaken())
                .uploadedAt(LocalDateTime.now())
                .build();

            photoRepository.save(photo);

            log.info("Successfully processed: {}", inputFile.getName());

        } catch (Exception e) {
            log.error("Failed to process file: {}", inputFile.getName(), e);
            throw new FileProcessingException("Processing failed", e);
        }
    }

    private String extractUserIdFromPath(File file) {
        // Extract user ID from path: /storage/{userId}/input/file.jpg
        String path = file.getAbsolutePath();
        String[] parts = path.split("/");
        return parts[parts.length - 3]; // userId
    }

    private File moveToOriginal(File source, String userId) throws IOException {
        Path destPath = Paths.get(storagePath, userId, "original", source.getName());
        Files.createDirectories(destPath.getParent());
        Files.move(source.toPath(), destPath, StandardCopyOption.REPLACE_EXISTING);
        return destPath.toFile();
    }
}
```

**Test:**
```bash
# Drop test file with proper user path
cp test-image.jpg /tmp/photo-test/1/input/

# Check logs → processing started
# Check database → photo entry created
# Check folders:
#   /tmp/photo-test/1/original/test-image.jpg (moved)
#   /tmp/photo-test/1/small/test-image.jpg (thumbnail)
#   /tmp/photo-test/1/medium/test-image.jpg
#   /tmp/photo-test/1/large/test-image.jpg
```

**Commit:**
```
feat(integration): add PhotoProcessingService with Service Activator

- Create PhotoProcessingService with @ServiceActivator
- Process file: EXIF extraction, thumbnail generation, database save
- Move processed file to original/ folder
- Extract userId from file path
- Add logging for processing status
```

---

#### Chunk 3: Error Handling & Failed Files (60 min)

**Implementacja:**

```java
// FileIntegrationConfig.java - ADD ERROR HANDLER
@Bean
@ServiceActivator(inputChannel = "errorChannel")
public void handleError(ErrorMessage errorMessage) {
    Throwable cause = errorMessage.getPayload();
    Message<?> failedMessage = (Message<?>) errorMessage.getHeaders().get("originalMessage");

    if (failedMessage != null && failedMessage.getPayload() instanceof File) {
        File failedFile = (File) failedMessage.getPayload();
        moveToFailed(failedFile, cause);
    }
}

private void moveToFailed(File file, Throwable error) {
    try {
        String userId = extractUserIdFromPath(file);
        Path failedDir = Paths.get(storagePath, userId, "failed");
        Files.createDirectories(failedDir);

        // Move file to failed/
        Path failedFile = failedDir.resolve(file.getName());
        Files.move(file.toPath(), failedFile, StandardCopyOption.REPLACE_EXISTING);

        // Create error log
        Path errorLog = failedDir.resolve(file.getName() + ".error.log");
        String errorMsg = String.format(
            "File: %s\nError: %s\nStack Trace:\n%s\nTimestamp: %s",
            file.getName(),
            error.getMessage(),
            getStackTrace(error),
            LocalDateTime.now()
        );
        Files.writeString(errorLog, errorMsg);

        log.warn("Moved failed file to: {}", failedFile);

    } catch (IOException e) {
        log.error("Failed to move file to failed/ folder", e);
    }
}
```

**Test:**
```bash
# Drop corrupt file
cp corrupt.jpg /tmp/photo-test/1/input/

# Wait for polling (10s)
# Check logs → error logged
# Check failed/ folder:
#   /tmp/photo-test/1/failed/corrupt.jpg
#   /tmp/photo-test/1/failed/corrupt.jpg.error.log
```

**Commit:**
```
feat(integration): add error handling for failed files

- Add error channel handler (@ServiceActivator on errorChannel)
- Move failed files to failed/ folder
- Generate error.log with stack trace and timestamp
- Ensure one failed file doesn't block other files
- Add logging for failed files
```

**CHECKPOINT #1** → Async processing działa lokalnie

---

### Phase 2: Web Upload Integration (Chunks 4-6)

#### Chunk 4: Refactor Existing Upload Endpoint (50 min)

**Problem:** Existing POST `/api/photos/upload` is synchronous - needs refactoring

**Implementacja:**

```java
// PhotoController.java - REFACTOR
@PostMapping("/upload")
public ResponseEntity<UploadResponse> uploadPhoto(
    @RequestParam("file") MultipartFile file,
    @AuthenticationPrincipal UserDetails userDetails
) {
    // Save to input/ folder instead of processing immediately
    User user = userService.findByEmail(userDetails.getUsername());
    Path inputPath = Paths.get(storagePath, user.getId().toString(), "input", file.getOriginalFilename());

    Files.createDirectories(inputPath.getParent());
    file.transferTo(inputPath);

    log.info("File uploaded to input/ folder: {}", inputPath);

    // Return 202 Accepted (processing will happen async)
    return ResponseEntity.accepted()
        .body(new UploadResponse(
            "File uploaded successfully and will be processed shortly",
            file.getOriginalFilename()
        ));
}

public record UploadResponse(String message, String fileName) {}
```

**Test:**
```bash
curl -X POST http://localhost:8080/api/photos/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg"

# Response: 202 Accepted
# File saved to input/ folder
# Wait 10s → Spring Integration processes it
```

**Commit:**
```
refactor(api): change upload endpoint to async processing

- Save uploaded files to input/ folder (not process immediately)
- Return 202 Accepted (async processing)
- Spring Integration will pick up file and process it
- Remove synchronous EXIF/thumbnail processing from controller
```

---

#### Chunk 5: Processing Status Tracking (60 min)

**Implementacja:**

```sql
-- V006__add_processing_status.sql
ALTER TABLE photos ADD COLUMN processing_status VARCHAR(20) DEFAULT 'completed';
CREATE INDEX idx_photos_processing_status ON photos(processing_status);
```

```java
// Photo.java
@Entity
public class Photo {
    // ... existing fields ...

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status")
    private ProcessingStatus processingStatus = ProcessingStatus.COMPLETED;
}

public enum ProcessingStatus {
    PENDING,     // File in input/ folder, not processed yet
    PROCESSING,  // Currently being processed
    COMPLETED,   // Successfully processed
    FAILED       // Processing failed
}

// PhotoProcessingService.java - UPDATE
public void processFile(Message<File> message) {
    File inputFile = message.getPayload();
    String userId = extractUserIdFromPath(inputFile);

    // Create PENDING entry first
    Photo photo = Photo.builder()
        .user(user)
        .fileName(inputFile.getName())
        .processingStatus(ProcessingStatus.PENDING)
        .build();
    photoRepository.save(photo);

    try {
        // Update to PROCESSING
        photo.setProcessingStatus(ProcessingStatus.PROCESSING);
        photoRepository.save(photo);

        // ... process file ...

        // Update to COMPLETED
        photo.setProcessingStatus(ProcessingStatus.COMPLETED);
        photoRepository.save(photo);

    } catch (Exception e) {
        // Update to FAILED
        photo.setProcessingStatus(ProcessingStatus.FAILED);
        photoRepository.save(photo);
        throw new FileProcessingException("Processing failed", e);
    }
}
```

**Test:**
```bash
# Upload file
curl -X POST .../upload -F "file=@test.jpg"

# Check database immediately
SELECT id, file_name, processing_status FROM photos WHERE file_name = 'test.jpg';
# → status: PENDING

# Wait 10s, check again
# → status: PROCESSING

# Wait another 5s, check again
# → status: COMPLETED
```

**Commit:**
```
feat(photo): add processing status tracking

- Add processing_status enum (PENDING/PROCESSING/COMPLETED/FAILED)
- Update PhotoProcessingService to track status
- Create database index on processing_status
- Update status at each stage (pending → processing → completed/failed)
```

---

#### Chunk 6: Frontend Status Display (50 min)

**Implementacja:**

```typescript
// photo.interface.ts
export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Photo {
  // ... existing fields ...
  processingStatus: ProcessingStatus;
}

// photo-card.component.ts - ADD STATUS BADGE
<div class="photo-card" [class.processing]="photo.processingStatus !== 'COMPLETED'">
  @if (photo.processingStatus === 'PENDING') {
    <div class="status-badge bg-yellow-500" data-testid="status-pending">
      ⏳ Pending
    </div>
  }
  @if (photo.processingStatus === 'PROCESSING') {
    <div class="status-badge bg-blue-500" data-testid="status-processing">
      ⚙️ Processing...
    </div>
  }
  @if (photo.processingStatus === 'FAILED') {
    <div class="status-badge bg-red-500" data-testid="status-failed">
      ❌ Failed
    </div>
  }

  <img [src]="photo.thumbnailUrl" [alt]="photo.fileName" />
  <!-- ... rest of card ... -->
</div>

// photo.service.ts - POLLING for pending photos
pollPendingPhotos(): void {
  interval(5000) // Poll every 5 seconds
    .pipe(
      switchMap(() => this.getPhotos()),
      filter(photos => photos.some(p => p.processingStatus !== 'COMPLETED'))
    )
    .subscribe(photos => {
      this.photosSubject.next(photos);
    });
}
```

**Test:**
1. Upload file via web form
2. Gallery shows "⏳ Pending" badge immediately
3. After 10s → badge changes to "⚙️ Processing..."
4. After 15s → badge disappears (status = COMPLETED)
5. Thumbnail appears in gallery

**Commit:**
```
feat(ui): add processing status display in gallery

- Add ProcessingStatus enum to Photo interface
- Display status badges (pending/processing/failed)
- Add polling for pending photos (every 5s)
- Update gallery UI when status changes
- Add visual feedback for async processing
```

**CHECKPOINT #2** → Web upload + async processing integration complete

---

### Phase 3: Testing & Polish (Chunks 7-9)

#### Chunk 7: Unit Tests (60 min)

**Implementacja:**

```java
// PhotoProcessingServiceTest.java
@ExtendWith(MockitoExtension.class)
class PhotoProcessingServiceTest {

    @Mock private ExifService exifService;
    @Mock private ThumbnailService thumbnailService;
    @Mock private PhotoRepository photoRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private PhotoProcessingService service;

    @Test
    void processFile_validFile_savesPhoto() {
        // Given
        File testFile = new File("/storage/1/input/test.jpg");
        Message<File> message = MessageBuilder.withPayload(testFile).build();

        ExifData exifData = new ExifData(52.2297, 21.0122, LocalDateTime.now());
        when(exifService.extractExif(any())).thenReturn(exifData);

        Map<String, File> thumbnails = Map.of(
            "small", new File("/storage/1/small/test.jpg"),
            "medium", new File("/storage/1/medium/test.jpg"),
            "large", new File("/storage/1/large/test.jpg")
        );
        when(thumbnailService.generateThumbnails(any(), any())).thenReturn(thumbnails);

        User user = new User();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When
        service.processFile(message);

        // Then
        verify(photoRepository).save(argThat(photo ->
            photo.getFileName().equals("test.jpg") &&
            photo.getProcessingStatus() == ProcessingStatus.COMPLETED
        ));
    }

    @Test
    void processFile_exifExtractionFails_movesToFailed() {
        // Given
        File testFile = new File("/storage/1/input/test.jpg");
        Message<File> message = MessageBuilder.withPayload(testFile).build();

        when(exifService.extractExif(any())).thenThrow(new ExifExtractionException("Corrupt file"));

        // When & Then
        assertThrows(FileProcessingException.class, () -> service.processFile(message));

        verify(photoRepository).save(argThat(photo ->
            photo.getProcessingStatus() == ProcessingStatus.FAILED
        ));
    }
}
```

**Commit:**
```
test(integration): add unit tests for PhotoProcessingService

- Test valid file processing (happy path)
- Test EXIF extraction failure
- Test thumbnail generation failure
- Test user not found scenario
- Verify processing status transitions
```

---

#### Chunk 8: Integration Tests (70 min)

**Implementacja:**

```java
// FileIntegrationTest.java
@SpringBootTest
@TestPropertySource(properties = {
    "photo.storage.base-path=/tmp/test-storage"
})
class FileIntegrationTest {

    @Autowired
    private PhotoRepository photoRepository;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setup() throws IOException {
        // Create folder structure
        Files.createDirectories(tempDir.resolve("1/input"));
        Files.createDirectories(tempDir.resolve("1/original"));
        Files.createDirectories(tempDir.resolve("1/small"));
    }

    @Test
    void whenFileDroppedToInput_thenProcessedSuccessfully() throws Exception {
        // Given
        Path testFile = tempDir.resolve("1/input/test.jpg");
        Files.copy(
            new ClassPathResource("test-images/valid.jpg").getInputStream(),
            testFile
        );

        // Wait for poller (max 15 seconds)
        await().atMost(15, SECONDS).until(() ->
            !Files.exists(testFile) // File moved from input/
        );

        // Then
        Photo photo = photoRepository.findByFileName("test.jpg").orElseThrow();
        assertEquals(ProcessingStatus.COMPLETED, photo.getProcessingStatus());
        assertTrue(Files.exists(tempDir.resolve("1/original/test.jpg")));
        assertTrue(Files.exists(tempDir.resolve("1/small/test.jpg")));
    }

    @Test
    void whenCorruptFileDropped_thenMovedToFailed() throws Exception {
        // Given
        Path corruptFile = tempDir.resolve("1/input/corrupt.jpg");
        Files.writeString(corruptFile, "NOT A JPEG");

        // Wait for poller
        await().atMost(15, SECONDS).until(() ->
            Files.exists(tempDir.resolve("1/failed/corrupt.jpg"))
        );

        // Then
        assertTrue(Files.exists(tempDir.resolve("1/failed/corrupt.jpg.error.log")));

        Photo photo = photoRepository.findByFileName("corrupt.jpg").orElseThrow();
        assertEquals(ProcessingStatus.FAILED, photo.getProcessingStatus());
    }
}
```

**Commit:**
```
test(integration): add file processing integration tests

- Test file drop to input/ → processed successfully
- Test corrupt file → moved to failed/ with error log
- Test concurrent file processing (multiple files)
- Verify folder structure (original/, small/, medium/, large/)
- Use @TempDir for isolated test environment
```

---

#### Chunk 9: Documentation & Monitoring (40 min)

**Implementacja:**

```markdown
<!-- docs/BATCH_UPLOAD.md -->
# Batch Upload - User Guide

## Overview
Batch upload allows uploading multiple photos via scp/ftp instead of web interface.

## Setup

### 1. Get your User ID
Login to web app → check /api/auth/me → note your user ID

### 2. Prepare folder structure
mkdir -p /opt/photo-map/storage/{YOUR_USER_ID}/input

### 3. Upload files
# Via SCP
scp *.jpg user@server:/opt/photo-map/storage/{YOUR_USER_ID}/input/

# Via FTP
# Connect to server and upload to /opt/photo-map/storage/{YOUR_USER_ID}/input/

### 4. Monitor processing
- Files are processed every 10 seconds
- Check web app gallery for new photos
- Check /opt/photo-map/storage/{YOUR_USER_ID}/failed/ for errors

## Troubleshooting

### File not processed
- Check file format (only JPEG, PNG supported)
- Check file permissions
- Check logs: /opt/photo-map/logs/spring-boot.log

### File in failed/ folder
- Read error.log file in failed/ folder
- Common causes: corrupt file, unsupported format, no EXIF data
```

```java
// FileIntegrationConfig.java - ADD ACTUATOR ENDPOINT
@Bean
public IntegrationMBeanExporter integrationMBeanExporter() {
    IntegrationMBeanExporter exporter = new IntegrationMBeanExporter();
    exporter.setDefaultDomain("photo-map");
    return exporter;
}

// Exposes metrics:
// - photo-map.fileReadingMessageSource.receiveCount
// - photo-map.fileReadingMessageSource.errorCount
// - photo-map.photoProcessingService.processTime
```

**Commit:**
```
docs: add batch upload user guide and monitoring

- Create BATCH_UPLOAD.md with setup instructions
- Add troubleshooting section
- Expose Spring Integration metrics via JMX
- Add Actuator integration for monitoring
- Document common issues and solutions
```

**CHECKPOINT #3** → Batch upload feature complete with tests and docs

---

## Summary

### Metrics
- **Total chunks:** 9
- **Total time:** ~9h
- **Complexity:** Complex (6+ chunks prediction ✅, actual: 9)
- **Files changed:** 15
  - Backend: 10 (config, service, controller, tests, migration)
  - Frontend: 3 (interface, component, service)
  - Docs: 2 (user guide, monitoring)

### What Went Well ✅
- **Checkpoints** - regularne checkpoints (po chunks 3, 6, 9)
- **Resilience** - error handling ensures one failed file nie blokuje innych
- **Decoupling** - web upload i batch upload używają tego samego processing pipeline
- **Testing** - unit + integration tests (coverage >70%)
- **Monitoring** - metrics, logs, status tracking

### Challenges
- **Spring Integration** - nowa technologia (learning curve)
- **Async testing** - integration tests z polling (await, timeouts)
- **Folder permissions** - production deployment may have issues
- **Polling interval** - 10s może być za długi/krótki (tuning needed)

### Acceptance Criteria Check
- ✅ User może wrzucić wiele zdjęć do input/ folder
- ✅ System monitoruje folder i automatycznie przetwarza
- ✅ EXIF extraction + thumbnail generation działa
- ✅ Przetworzone pliki w original/, small/, medium/, large/
- ✅ Błędne pliki w failed/ z error logiem
- ✅ Resilient (one failed photo nie blokuje)
- ✅ Processing nie wpływa na responsywność web uploadu

**Feature complete!** 🎉

---

## Why This Is a COMPLEX Feature

### ✅ New Technology Integration
- Spring Integration (FileInboundChannelAdapter, Service Activator)
- Learning curve + configuration complexity

### ✅ Asynchronous Processing
- Different from synchronous web upload
- State management (PENDING → PROCESSING → COMPLETED)
- Polling, error handling, resilience

### ✅ Multiple Components
- Backend: config, service, controller, error handler
- Frontend: status display, polling
- File system: folder structure, permissions

### ✅ Complex Testing
- Async integration tests (await, timeouts)
- File system mocking (TempDir)
- Error scenarios (corrupt files, permission issues)

### ✅ Production Considerations
- Monitoring (metrics, logs)
- Documentation (user guide, troubleshooting)
- Deployment (folder permissions, polling tuning)

---

## Related Examples

- `simple-feature-example.md` - przykład Simple feature (description field)
- `good-feature-breakdown.md` - przykład Medium feature (rating system)
- `bad-feature-example.md` - przykład over-engineered feature (ML categorization)
