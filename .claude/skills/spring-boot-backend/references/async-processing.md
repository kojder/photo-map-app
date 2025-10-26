# Asynchronous Photo Processing - Spring Integration File Pattern

## Overview

**Photo Map MVP uses Spring Integration File for asynchronous photo processing.**

### Key Benefits

- **Decoupled upload & processing** - fast web response (202 Accepted)
- **Batch upload support** - easy scp/ftp for large photo collections
- **Error resilience** - one failed photo doesn't block others
- **Scalability** - processing can be tuned independently

---

## Folder Structure

```
uploads/
├── input/      # Drop zone for new photos (web upload or scp/ftp)
├── original/   # Processed originals
├── small/      # 150px thumbnails
├── medium/     # 400px thumbnails
├── large/      # 800px thumbnails
└── failed/     # Failed processing + error logs
```

### Folder Responsibilities

| Folder | Purpose | Created By |
|--------|---------|------------|
| `input/` | Drop zone for new photos | Web upload or manual scp/ftp |
| `original/` | Processed original files | Photo processing service |
| `small/` | 150px thumbnails | Thumbnail service |
| `medium/` | 400px thumbnails | Thumbnail service |
| `large/` | 800px thumbnails | Thumbnail service |
| `failed/` | Failed photos + error logs | Error handler |

---

## Spring Integration Configuration

### Configuration Class

```java
@Configuration
@EnableIntegration
public class FileIntegrationConfig {

    @Value("${photo.upload.input-path}")
    private String inputPath;

    @Value("${photo.upload.failed-path}")
    private String failedPath;

    /**
     * File Inbound Channel Adapter
     * Monitors input/ directory for new files
     */
    @Bean
    public MessageSource<File> fileMessageSource() {
        final FileReadingMessageSource source = new FileReadingMessageSource();
        source.setDirectory(new File(inputPath));
        source.setFilter(new SimplePatternFileListFilter("*.{jpg,jpeg,png,heic}"));
        source.setAutoCreateDirectory(true);
        return source;
    }

    /**
     * Poller Configuration
     * Checks for new files every 10 seconds
     */
    @Bean
    public IntegrationFlow fileProcessingFlow(
        final PhotoProcessingService photoProcessingService
    ) {
        return IntegrationFlows
            .from(fileMessageSource(), config -> config.poller(Pollers
                .fixedDelay(10000) // 10 seconds
                .maxMessagesPerPoll(5) // Process max 5 files at once
                .errorChannel("photoProcessingErrorChannel")
            ))
            .handle(photoProcessingService, "processPhoto")
            .get();
    }

    /**
     * Error Channel
     * Handles processing failures
     */
    @Bean
    public IntegrationFlow photoProcessingErrorFlow() {
        return IntegrationFlows
            .from("photoProcessingErrorChannel")
            .handle(message -> {
                final Throwable error = (Throwable) message.getPayload();
                final File file = (File) message.getHeaders().get("file_originalFile");

                // Move failed file to failed/ directory
                if (file != null && file.exists()) {
                    final File failedFile = new File(failedPath, file.getName());
                    file.renameTo(failedFile);

                    // Write error log
                    final File errorLog = new File(failedPath, file.getName() + ".error.txt");
                    Files.writeString(
                        errorLog.toPath(),
                        "Error: " + error.getMessage() + "\n" +
                        "Timestamp: " + LocalDateTime.now() + "\n" +
                        "File: " + file.getName()
                    );
                }
            })
            .get();
    }
}
```

### Application Properties

```properties
# Photo upload configuration
photo.upload.input-path=/uploads/input
photo.upload.original-path=/uploads/original
photo.upload.thumbnail-small-path=/uploads/small
photo.upload.thumbnail-medium-path=/uploads/medium
photo.upload.thumbnail-large-path=/uploads/large
photo.upload.failed-path=/uploads/failed

# Spring Integration
spring.integration.poller.fixed-delay=10000
spring.integration.poller.max-messages-per-poll=5
```

---

## Photo Processing Service

### Service Activator

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoProcessingService {

    private final ExifService exifService;
    private final ThumbnailService thumbnailService;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;

    @Value("${photo.upload.original-path}")
    private String originalPath;

    /**
     * Service Activator - processes incoming photo files
     * Called by Spring Integration for each file in input/
     */
    @ServiceActivator
    public void processPhoto(final Message<File> message) {
        final File inputFile = message.getPayload();
        log.info("Processing photo: {}", inputFile.getName());

        try {
            // 1. Extract user ID from filename (format: userId_originalName.jpg)
            final Long userId = extractUserIdFromFilename(inputFile.getName());

            // 2. Verify user exists
            final User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            // 3. Move to original/ directory
            final File originalFile = moveToOriginalDirectory(inputFile, userId);
            log.debug("File moved to original: {}", originalFile.getPath());

            // 4. Extract EXIF metadata
            final ExifData exifData = exifService.extractExif(originalFile);
            log.debug("EXIF extracted: GPS={}, Date={}", exifData.hasGps(), exifData.getTakenAt());

            // 5. Generate thumbnails (3 sizes)
            final Map<ThumbnailSize, File> thumbnails = thumbnailService.generateThumbnails(
                originalFile, userId
            );
            log.debug("Thumbnails generated: {}", thumbnails.keySet());

            // 6. Save to database
            final Photo photo = Photo.builder()
                .user(user)
                .fileName(inputFile.getName())
                .fileSize(inputFile.length())
                .originalPath(originalFile.getPath())
                .thumbnailSmallPath(thumbnails.get(ThumbnailSize.SMALL).getPath())
                .thumbnailMediumPath(thumbnails.get(ThumbnailSize.MEDIUM).getPath())
                .thumbnailLargePath(thumbnails.get(ThumbnailSize.LARGE).getPath())
                .latitude(exifData.getLatitude())
                .longitude(exifData.getLongitude())
                .takenAt(exifData.getTakenAt())
                .width(exifData.getWidth())
                .height(exifData.getHeight())
                .build();

            photoRepository.save(photo);
            log.info("Photo saved to database: id={}, userId={}", photo.getId(), userId);

            // 7. Delete from input/ (file already moved to original/)
            if (inputFile.exists()) {
                inputFile.delete();
            }

        } catch (final Exception e) {
            log.error("Failed to process photo: {}", inputFile.getName(), e);
            throw new PhotoProcessingException("Processing failed: " + e.getMessage(), e);
        }
    }

    private Long extractUserIdFromFilename(final String filename) {
        // Expected format: userId_originalName.jpg
        // Example: 123_vacation.jpg → userId = 123
        final String[] parts = filename.split("_", 2);
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid filename format: " + filename);
        }
        return Long.parseLong(parts[0]);
    }

    private File moveToOriginalDirectory(final File inputFile, final Long userId) throws IOException {
        final String userDir = originalPath + "/" + userId;
        final File userDirectory = new File(userDir);
        if (!userDirectory.exists()) {
            userDirectory.mkdirs();
        }

        final File destination = new File(userDirectory, inputFile.getName());
        Files.move(inputFile.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);
        return destination;
    }
}
```

---

## Web Upload Flow (Async)

### Controller - Returns 202 Accepted

```java
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoUploadService photoUploadService;

    /**
     * Upload photo - asynchronous processing
     * Returns 202 Accepted immediately (fast response)
     * Photo processed in background by Spring Integration
     */
    @PostMapping("/upload")
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
        @RequestParam("file") final MultipartFile file,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        final Long userId = extractUserId(userDetails);

        // Validate file
        validateFile(file);

        // Save to input/ directory with userId prefix
        final String filename = userId + "_" + file.getOriginalFilename();
        final File inputFile = photoUploadService.saveToInputDirectory(file, filename);

        // Return 202 Accepted (queued for processing)
        final PhotoUploadResponse response = PhotoUploadResponse.builder()
            .message("Photo queued for processing")
            .filename(file.getOriginalFilename())
            .status("QUEUED")
            .build();

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    private void validateFile(final MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }
        if (file.getSize() > 50 * 1024 * 1024) { // 50MB
            throw new FileUploadException("File size exceeds 50MB");
        }
        final String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new FileUploadException("File must be an image (JPEG, PNG, HEIC)");
        }
    }
}
```

### PhotoUploadService

```java
@Service
@RequiredArgsConstructor
public class PhotoUploadService {

    @Value("${photo.upload.input-path}")
    private String inputPath;

    /**
     * Save uploaded file to input/ directory
     * Spring Integration will pick it up and process asynchronously
     */
    public File saveToInputDirectory(final MultipartFile file, final String filename) {
        try {
            final File inputDir = new File(inputPath);
            if (!inputDir.exists()) {
                inputDir.mkdirs();
            }

            final File destination = new File(inputDir, filename);
            file.transferTo(destination);

            return destination;
        } catch (final IOException e) {
            throw new FileUploadException("Failed to save file: " + e.getMessage(), e);
        }
    }
}
```

---

## Batch Upload via scp/ftp

### Manual Upload Process

```bash
# 1. Prepare photos with userId prefix
# Format: userId_originalName.jpg

mv vacation.jpg 123_vacation.jpg
mv beach.jpg 123_beach.jpg
mv sunset.jpg 123_sunset.jpg

# 2. Upload to input/ directory via scp
scp 123_*.jpg user@server:/uploads/input/

# 3. Spring Integration automatically processes files
# - Poller checks input/ every 10 seconds
# - Files processed in background
# - Originals moved to original/
# - Thumbnails generated
# - Database updated
```

### Benefits

- ✅ Fast bulk upload (no web form overhead)
- ✅ Large collections (hundreds of photos)
- ✅ Automatic processing (no manual intervention)
- ✅ Error handling (failed files moved to failed/)

---

## Error Handling

### Error Flow

```
1. Exception thrown in PhotoProcessingService
   ↓
2. Spring Integration catches exception
   ↓
3. Error Channel (photoProcessingErrorChannel) activated
   ↓
4. Failed file moved to failed/ directory
   ↓
5. Error log created: filename.error.txt
   ↓
6. Processing continues with next file
```

### Error Log Example

```
Error: Invalid EXIF data: GPS coordinates missing
Timestamp: 2025-01-24T10:30:45
File: 123_vacation.jpg
Stack trace:
  at com.photomap.service.ExifService.extractExif(ExifService.java:42)
  at com.photomap.service.PhotoProcessingService.processPhoto(PhotoProcessingService.java:78)
  ...
```

### Manual Retry

```bash
# 1. Check failed/ directory
ls /uploads/failed/

# 2. Review error log
cat /uploads/failed/123_vacation.jpg.error.txt

# 3. Fix issue (e.g., re-encode file)

# 4. Move back to input/ for retry
mv /uploads/failed/123_vacation.jpg /uploads/input/
```

---

## Monitoring & Observability

### Log Output

```
2025-01-24 10:30:00 INFO  Processing photo: 123_vacation.jpg
2025-01-24 10:30:01 DEBUG File moved to original: /uploads/original/123/123_vacation.jpg
2025-01-24 10:30:02 DEBUG EXIF extracted: GPS=true, Date=2025-01-20T14:30:00
2025-01-24 10:30:05 DEBUG Thumbnails generated: [SMALL, MEDIUM, LARGE]
2025-01-24 10:30:06 INFO  Photo saved to database: id=456, userId=123
```

### Actuator Metrics

```java
// Custom metrics for photo processing
@Component
public class PhotoProcessingMetrics {

    private final MeterRegistry meterRegistry;

    public PhotoProcessingMetrics(final MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void recordProcessingSuccess() {
        meterRegistry.counter("photo.processing.success").increment();
    }

    public void recordProcessingFailure() {
        meterRegistry.counter("photo.processing.failure").increment();
    }

    public void recordProcessingTime(final long durationMs) {
        meterRegistry.timer("photo.processing.duration").record(durationMs, TimeUnit.MILLISECONDS);
    }
}
```

---

## Key Reminders

**Spring Integration:**
- ✅ File Inbound Channel Adapter monitors `input/`
- ✅ Poller checks every 10 seconds (configurable)
- ✅ Service Activator processes each file
- ✅ Error Channel handles failures

**Folder Structure:**
- ✅ `input/` - drop zone (web or scp/ftp)
- ✅ `original/` - processed originals
- ✅ `small/`, `medium/`, `large/` - thumbnails
- ✅ `failed/` - failed files + error logs

**Async Benefits:**
- ✅ Fast web response (202 Accepted)
- ✅ Batch upload support (scp/ftp)
- ✅ Error resilience (one failure doesn't block others)
- ✅ Scalable (processing can be tuned independently)

**Error Handling:**
- ✅ Failed files moved to `failed/`
- ✅ Error log created with stack trace
- ✅ Manual retry by moving back to `input/`
- ✅ Metrics tracked for monitoring
