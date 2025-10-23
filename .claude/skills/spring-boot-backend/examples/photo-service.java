package com.photomap.service;

import com.photomap.dto.PhotoDto;
import com.photomap.dto.PhotoUploadResponse;
import com.photomap.exception.FileUploadException;
import com.photomap.exception.ResourceNotFoundException;
import com.photomap.model.Photo;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Photo Service - Business Logic Layer
 *
 * Responsibilities:
 * - Photo upload processing (save file, extract EXIF, generate thumbnails)
 * - CRUD operations with user scoping
 * - Business rule validation
 * - Transaction management
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final ExifService exifService;
    private final ThumbnailService thumbnailService;
    private final FileStorageService fileStorageService;

    @Value("${photo.storage.path}")
    private String storagePath;

    /**
     * Upload photo with full processing pipeline:
     * 1. Validate file
     * 2. Save original file
     * 3. Extract EXIF metadata
     * 4. Generate thumbnails
     * 5. Save to database
     *
     * @param file - Multipart file from upload
     * @param userId - Owner of the photo
     * @return PhotoUploadResponse with photo details
     */
    public PhotoUploadResponse uploadPhoto(MultipartFile file, Long userId) {
        log.info("Uploading photo for user {}: {}", userId, file.getOriginalFilename());

        // Validate file
        validatePhotoFile(file);

        // Get user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Save original file
        String originalPath = fileStorageService.saveOriginal(file, userId);
        log.debug("Original file saved: {}", originalPath);

        // Extract EXIF metadata
        ExifData exifData = exifService.extractExif(file);
        log.debug("EXIF data extracted: GPS={}, Date={}",
            exifData.hasGps(), exifData.getTakenAt());

        // Generate thumbnails (small: 150px, medium: 400px, large: 800px)
        Map<ThumbnailSize, String> thumbnails = thumbnailService.generateThumbnails(
            originalPath, userId
        );
        log.debug("Thumbnails generated: {}", thumbnails.keySet());

        // Create and save photo entity
        Photo photo = Photo.builder()
            .user(user)
            .fileName(file.getOriginalFilename())
            .fileSize(file.getSize())
            .originalPath(originalPath)
            .thumbnailSmallPath(thumbnails.get(ThumbnailSize.SMALL))
            .thumbnailMediumPath(thumbnails.get(ThumbnailSize.MEDIUM))
            .thumbnailLargePath(thumbnails.get(ThumbnailSize.LARGE))
            .latitude(exifData.getLatitude())
            .longitude(exifData.getLongitude())
            .takenAt(exifData.getTakenAt())
            .width(exifData.getWidth())
            .height(exifData.getHeight())
            .build();

        Photo saved = photoRepository.save(photo);
        log.info("Photo uploaded successfully: id={}", saved.getId());

        return PhotoUploadResponse.fromEntity(saved);
    }

    /**
     * Find all photos for user (with user scoping).
     * Read-only transaction for performance.
     *
     * @param userId - User ID
     * @return List of photos sorted by takenAt DESC
     */
    @Transactional(readOnly = true)
    public List<PhotoDto> findPhotosByUserId(Long userId) {
        log.debug("Finding photos for user {}", userId);

        List<Photo> photos = photoRepository.findByUserIdOrderByTakenAtDesc(userId);

        return photos.stream()
            .map(PhotoDto::fromEntity)
            .toList();
    }

    /**
     * Find photo by ID with user scoping.
     * User can only access their own photos.
     *
     * @param photoId - Photo ID
     * @param userId - User ID (for scoping)
     * @return PhotoDto
     * @throws ResourceNotFoundException if photo not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public PhotoDto findPhotoById(Long photoId, Long userId) {
        log.debug("Finding photo {} for user {}", photoId, userId);

        Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

        return PhotoDto.fromEntity(photo);
    }

    /**
     * Update photo rating (1-10 stars).
     *
     * @param photoId - Photo ID
     * @param rating - Rating value (1-10)
     * @param userId - User ID (for scoping)
     * @throws ResourceNotFoundException if photo not found
     */
    public void updateRating(Long photoId, Integer rating, Long userId) {
        log.info("Updating rating for photo {} to {}", photoId, rating);

        Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

        photo.setRating(rating);
        photoRepository.save(photo);

        log.info("Rating updated successfully");
    }

    /**
     * Delete photo (files + database record).
     *
     * Process:
     * 1. Find photo (with user scoping)
     * 2. Delete physical files
     * 3. Delete database record
     *
     * @param photoId - Photo ID
     * @param userId - User ID (for scoping)
     * @throws ResourceNotFoundException if photo not found
     */
    public void deletePhoto(Long photoId, Long userId) {
        log.info("Deleting photo {} for user {}", photoId, userId);

        Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));

        // Delete physical files (original + thumbnails)
        fileStorageService.deleteFiles(photo);
        log.debug("Physical files deleted");

        // Delete from database
        photoRepository.delete(photo);
        log.info("Photo deleted successfully");
    }

    /**
     * Validate uploaded photo file.
     *
     * Rules:
     * - File not empty
     * - Size <= 50MB
     * - Content type starts with "image/"
     *
     * @param file - Multipart file
     * @throws FileUploadException if validation fails
     */
    private void validatePhotoFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileUploadException("File is empty");
        }

        if (file.getSize() > 50 * 1024 * 1024) { // 50MB
            throw new FileUploadException("File size exceeds 50MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new FileUploadException("File must be an image (JPEG, PNG, HEIC)");
        }
    }
}
