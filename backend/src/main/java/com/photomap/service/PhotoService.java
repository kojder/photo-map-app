package com.photomap.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.RatingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final RatingRepository ratingRepository;

    @Value("${photo.upload.directory}")
    private String uploadDirectory;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final String[] ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"};
    private static final int[] THUMBNAIL_SIZES = {150, 400, 800};

    @PostConstruct
    public void init() throws IOException {
        Path uploadPath = Paths.get(uploadDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath.toAbsolutePath());
        }
    }

    @Transactional
    public Photo upload(MultipartFile file, User currentUser) throws IOException {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String uuidFilename = UUID.randomUUID().toString() + extension;

        Path originalPath = Paths.get(uploadDirectory, uuidFilename);
        Files.copy(file.getInputStream(), originalPath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Saved original file: {}", originalPath.toAbsolutePath());

        Photo photo = new Photo();
        photo.setUser(currentUser);
        photo.setFilename(uuidFilename);
        photo.setOriginalFilename(originalFilename);
        photo.setFileSize(file.getSize());
        photo.setMimeType(file.getContentType());

        try {
            extractExifMetadata(originalPath.toFile(), photo);
        } catch (Exception e) {
            log.warn("Failed to extract EXIF metadata from {}: {}", uuidFilename, e.getMessage());
        }

        try {
            String thumbnailFilename = generateThumbnails(originalPath.toFile(), uuidFilename);
            photo.setThumbnailFilename(thumbnailFilename);
        } catch (Exception e) {
            log.warn("Failed to generate thumbnails for {}: {}", uuidFilename, e.getMessage());
        }

        Photo savedPhoto = photoRepository.save(photo);
        log.info("Photo uploaded successfully: id={}, filename={}", savedPhoto.getId(), uuidFilename);
        return savedPhoto;
    }

    public Page<Photo> getPhotos(Long userId, Pageable pageable) {
        return photoRepository.findAll(pageable);
    }

    public Optional<Photo> getPhotoById(Long photoId, Long userId) {
        return photoRepository.findById(photoId)
                .filter(photo -> photo.getUser().getId().equals(userId));
    }

    @Transactional
    public void deletePhoto(Long photoId, Long userId) throws IOException {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (!photo.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("User does not own this photo");
        }

        deletePhotoFiles(photo);
        photoRepository.delete(photo);
        log.info("Photo deleted: id={}, filename={}", photoId, photo.getFilename());
    }

    @Transactional
    public Rating ratePhoto(Long photoId, Long userId, Integer ratingValue) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (photo.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot rate own photo");
        }

        if (ratingValue < 1 || ratingValue > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Optional<Rating> existingRating = ratingRepository.findByPhotoIdAndUserId(photoId, userId);

        if (existingRating.isPresent()) {
            Rating rating = existingRating.get();
            rating.setRating(ratingValue);
            return ratingRepository.save(rating);
        } else {
            Rating newRating = new Rating();
            newRating.setPhoto(photo);
            newRating.setUser(new User());
            newRating.getUser().setId(userId);
            newRating.setRating(ratingValue);
            return ratingRepository.save(newRating);
        }
    }

    @Transactional
    public void clearRating(Long photoId, Long userId) {
        ratingRepository.findByPhotoIdAndUserId(photoId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));

        ratingRepository.deleteByPhotoIdAndUserId(photoId, userId);
        log.info("Rating cleared: photoId={}, userId={}", photoId, userId);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size (10MB)");
        }

        String contentType = file.getContentType();
        boolean isAllowed = false;
        for (String allowedType : ALLOWED_MIME_TYPES) {
            if (allowedType.equals(contentType)) {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed) {
            throw new IllegalArgumentException("File type not allowed. Only JPEG and PNG are supported");
        }
    }

    private void extractExifMetadata(File file, Photo photo) throws Exception {
        Metadata metadata = ImageMetadataReader.readMetadata(file);

        GpsDirectory gpsDirectory = metadata.getFirstDirectoryOfType(GpsDirectory.class);
        if (gpsDirectory != null) {
            if (gpsDirectory.getGeoLocation() != null) {
                photo.setGpsLatitude(BigDecimal.valueOf(gpsDirectory.getGeoLocation().getLatitude()));
                photo.setGpsLongitude(BigDecimal.valueOf(gpsDirectory.getGeoLocation().getLongitude()));
                log.info("Extracted GPS: lat={}, lng={}", photo.getGpsLatitude(), photo.getGpsLongitude());
            }
        }

        ExifSubIFDDirectory exifDirectory = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
        if (exifDirectory != null) {
            Date dateTaken = exifDirectory.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
            if (dateTaken != null) {
                photo.setTakenAt(dateTaken.toInstant());
                log.info("Extracted date taken: {}", photo.getTakenAt());
            }
        }
    }

    private String generateThumbnails(File originalFile, String baseFilename) throws IOException {
        String filenameWithoutExt = baseFilename.substring(0, baseFilename.lastIndexOf('.'));
        String extension = baseFilename.substring(baseFilename.lastIndexOf('.'));

        for (int size : THUMBNAIL_SIZES) {
            String thumbnailFilename = filenameWithoutExt + "_" + size + extension;
            Path thumbnailPath = Paths.get(uploadDirectory, thumbnailFilename);

            Thumbnails.of(originalFile)
                    .size(size, size)
                    .keepAspectRatio(false)
                    .toFile(thumbnailPath.toFile());

            log.info("Generated thumbnail: {}x{} -> {}", size, size, thumbnailFilename);
        }

        return filenameWithoutExt + "_400" + extension;
    }

    private void deletePhotoFiles(Photo photo) throws IOException {
        Path originalPath = Paths.get(uploadDirectory, photo.getFilename());
        Files.deleteIfExists(originalPath);

        if (photo.getThumbnailFilename() != null) {
            String filenameWithoutExt = photo.getFilename().substring(0, photo.getFilename().lastIndexOf('.'));
            String extension = photo.getFilename().substring(photo.getFilename().lastIndexOf('.'));

            for (int size : THUMBNAIL_SIZES) {
                String thumbnailFilename = filenameWithoutExt + "_" + size + extension;
                Path thumbnailPath = Paths.get(uploadDirectory, thumbnailFilename);
                Files.deleteIfExists(thumbnailPath);
            }
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
