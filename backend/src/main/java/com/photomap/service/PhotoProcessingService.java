package com.photomap.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.photomap.model.Photo;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoProcessingService {

    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;

    @Value("${photo.upload.directory.input}")
    private String inputDirectory;

    @Value("${photo.upload.directory.original}")
    private String originalDirectory;

    @Value("${photo.upload.directory.medium}")
    private String mediumDirectory;

    @Value("${photo.upload.directory.failed}")
    private String failedDirectory;

    @Value("${photo.processing.admin.id}")
    private Long adminUserId;

    private static final String[] ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"};
    private static final int THUMBNAIL_MEDIUM = 300;
    private static final double THUMBNAIL_QUALITY = 0.85;

    @PostConstruct
    public void init() throws IOException {
        createDirectoryIfNotExists(inputDirectory);
        createDirectoryIfNotExists(originalDirectory);
        createDirectoryIfNotExists(mediumDirectory);
        createDirectoryIfNotExists(failedDirectory);
        log.info("Photo processing directories initialized");
    }

    @Transactional
    public void processPhoto(File file) {
        String filename = file.getName();
        log.info("Processing photo: {}", filename);

        try {
            if (!isValidFileExtension(filename)) {
                throw new IllegalArgumentException("Unsupported file extension: " + filename);
            }

            String extension = getFileExtension(filename);
            String baseFilename = filename.substring(0, filename.lastIndexOf('.'));

            Photo photo = new Photo();
            photo.setFilename(baseFilename + extension);
            photo.setOriginalFilename(filename);
            photo.setFileSize(file.length());
            photo.setMimeType(getMimeType(extension));

            User adminUser = userRepository.findById(adminUserId)
                    .orElseThrow(() -> new IllegalStateException("Admin user not found: " + adminUserId));
            photo.setUser(adminUser);

            extractExifMetadata(file, photo);

            Path originalPath = moveToDirectory(file, originalDirectory, baseFilename + extension);
            log.info("Moved to original: {}", originalPath);

            String mediumFilename = generateThumbnail(originalPath.toFile(), mediumDirectory, baseFilename, extension, THUMBNAIL_MEDIUM);
            photo.setThumbnailFilename(mediumFilename);

            photoRepository.save(photo);
            log.info("Photo processed successfully: id={}, filename={}", photo.getId(), filename);

        } catch (Exception e) {
            log.error("Failed to process photo: {}", filename, e);
            moveToFailed(file, e);
        }
    }

    private void extractExifMetadata(File file, Photo photo) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(file);

            GpsDirectory gpsDirectory = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gpsDirectory != null && gpsDirectory.getGeoLocation() != null) {
                photo.setGpsLatitude(BigDecimal.valueOf(gpsDirectory.getGeoLocation().getLatitude()));
                photo.setGpsLongitude(BigDecimal.valueOf(gpsDirectory.getGeoLocation().getLongitude()));
                log.info("Extracted GPS: lat={}, lng={}", photo.getGpsLatitude(), photo.getGpsLongitude());
            }

            ExifSubIFDDirectory exifDirectory = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exifDirectory != null) {
                Date dateTaken = exifDirectory.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
                if (dateTaken != null) {
                    photo.setTakenAt(dateTaken.toInstant());
                    log.info("Extracted date taken: {}", photo.getTakenAt());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract EXIF metadata from {}: {}", file.getName(), e.getMessage());
        }
    }

    private String generateThumbnail(File originalFile, String targetDirectory, String baseFilename, String extension, int size) throws IOException {
        String thumbnailFilename = baseFilename + extension;
        Path thumbnailPath = Paths.get(targetDirectory, thumbnailFilename);

        Thumbnails.of(originalFile)
                .size(size, size)
                .outputQuality(THUMBNAIL_QUALITY)
                .keepAspectRatio(true)
                .toFile(thumbnailPath.toFile());

        log.info("Generated thumbnail: {}x{} (quality: {}) -> {}", size, size, THUMBNAIL_QUALITY, thumbnailPath);
        return thumbnailFilename;
    }

    private Path moveToDirectory(File file, String targetDirectory, String targetFilename) throws IOException {
        Path targetPath = Paths.get(targetDirectory, targetFilename);
        Files.move(file.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        return targetPath;
    }

    private void moveToFailed(File file, Exception e) {
        try {
            Path failedPath = Paths.get(failedDirectory, file.getName());
            Files.move(file.toPath(), failedPath, StandardCopyOption.REPLACE_EXISTING);

            Path errorLogPath = Paths.get(failedDirectory, file.getName() + ".error.txt");
            String errorMessage = String.format("Error: %s\nMessage: %s\nTimestamp: %s",
                    e.getClass().getName(), e.getMessage(), java.time.Instant.now());
            Files.writeString(errorLogPath, errorMessage);

            log.info("Moved failed photo to: {}", failedPath);
        } catch (IOException ioException) {
            log.error("Failed to move file to failed directory: {}", file.getName(), ioException);
        }
    }

    private void createDirectoryIfNotExists(String directory) throws IOException {
        Path path = Paths.get(directory);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
            log.info("Created directory: {}", path.toAbsolutePath());
        }
    }

    private boolean isValidFileExtension(String filename) {
        String lowerCaseFilename = filename.toLowerCase();
        for (String ext : ALLOWED_EXTENSIONS) {
            if (lowerCaseFilename.endsWith(ext)) {
                return true;
            }
        }
        return false;
    }

    private String getFileExtension(String filename) {
        return filename.substring(filename.lastIndexOf('.'));
    }

    private String getMimeType(String extension) {
        return switch (extension.toLowerCase()) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            default -> "application/octet-stream";
        };
    }
}
