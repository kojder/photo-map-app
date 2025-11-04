package com.photomap.controller;

import com.photomap.dto.PhotoResponse;
import com.photomap.dto.RatingRequest;
import com.photomap.dto.RatingResponse;
import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import com.photomap.service.PhotoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
@Slf4j
public class PhotoController {

    private static final String ERROR_PHOTO_NOT_FOUND_OR_ACCESS_DENIED = "Photo not found or access denied";

    private final PhotoService photoService;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;

    @Value("${security.enabled:true}")
    private boolean securityEnabled;

    @Value("${photo.upload.directory.input}")
    private String inputDirectory;

    @Value("${photo.upload.directory.original}")
    private String originalDirectory;

    @Value("${photo.upload.directory.medium}")
    private String mediumDirectory;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestParam("file") final MultipartFile file,
            final Authentication authentication) throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size (10MB)");
        }

        final String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new IllegalArgumentException("File type not allowed. Only JPEG and PNG are supported");
        }

        final User currentUser = getCurrentUser(authentication);

        final String originalFilename = file.getOriginalFilename();
        final String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".jpg";
        final String filename = currentUser.getId() + "_" + UUID.randomUUID() + extension;

        final Path inputPath = Paths.get(inputDirectory, filename);
        Files.copy(file.getInputStream(), inputPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("File uploaded to input directory by user {}: {}", currentUser.getEmail(), filename);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of(
                        "message", "Photo queued for processing",
                        "filename", filename,
                        "status", "processing"
                ));
    }

    @GetMapping
    public ResponseEntity<Page<PhotoResponse>> getPhotos(
            @RequestParam(required = false) final String dateFrom,
            @RequestParam(required = false) final String dateTo,
            @RequestParam(required = false) final Integer minRating,
            @RequestParam(required = false) final Boolean hasGps,
            @PageableDefault(size = 20, sort = "uploadedAt", direction = Sort.Direction.DESC) final Pageable pageable,
            final Authentication authentication) {

        final User currentUser = getCurrentUser(authentication);

        if (!currentUser.isCanViewPhotos()) {
            throw new IllegalArgumentException("User does not have permission to view photos");
        }

        // Parse date parameters
        final LocalDateTime dateFromParsed = dateFrom != null ? LocalDateTime.parse(dateFrom + "T00:00:00") : null;
        final LocalDateTime dateToParsed = dateTo != null ? LocalDateTime.parse(dateTo + "T23:59:59") : null;

        final Page<Photo> photos = photoService.getPhotos(currentUser.getId(), pageable, dateFromParsed, dateToParsed, minRating, hasGps);

        final Page<PhotoResponse> response = photos.map(photo -> mapToPhotoResponse(photo, currentUser.getId()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PhotoResponse> getPhotoById(
            @PathVariable final Long id,
            final Authentication authentication) {

        final User currentUser = getCurrentUser(authentication);

        if (!currentUser.isCanViewPhotos()) {
            throw new IllegalArgumentException("User does not have permission to view photos");
        }

        final Photo photo = photoService.getPhotoById(id, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException(ERROR_PHOTO_NOT_FOUND_OR_ACCESS_DENIED));

        return ResponseEntity.ok(mapToPhotoResponse(photo, currentUser.getId()));
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<Resource> getThumbnail(@PathVariable final Long id, final Authentication authentication) throws IOException {
        final Photo photo;
        if (!securityEnabled) {
            photo = photoRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Photo not found"));
        } else {
            final User currentUser = getCurrentUser(authentication);

            if (!currentUser.isCanViewPhotos()) {
                throw new IllegalArgumentException("User does not have permission to view photos");
            }

            photo = photoService.getPhotoById(id, currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException(ERROR_PHOTO_NOT_FOUND_OR_ACCESS_DENIED));
        }

        String thumbnailFilename = photo.getThumbnailFilename();
        if (thumbnailFilename == null) {
            thumbnailFilename = photo.getFilename();
        }

        final Path filePath = Paths.get(mediumDirectory, thumbnailFilename);
        final Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = MediaType.IMAGE_JPEG_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @GetMapping("/{id}/full")
    public ResponseEntity<Resource> getFullImage(@PathVariable final Long id, final Authentication authentication) throws IOException {
        final Photo photo;
        if (!securityEnabled) {
            photo = photoRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Photo not found"));
        } else {
            final User currentUser = getCurrentUser(authentication);

            if (!currentUser.isCanViewPhotos()) {
                throw new IllegalArgumentException("User does not have permission to view photos");
            }

            photo = photoService.getPhotoById(id, currentUser.getId())
                    .orElseThrow(() -> new IllegalArgumentException(ERROR_PHOTO_NOT_FOUND_OR_ACCESS_DENIED));
        }

        final Path filePath = Paths.get(originalDirectory, photo.getFilename());
        final Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = MediaType.IMAGE_JPEG_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<RatingResponse> ratePhoto(
            @PathVariable final Long id,
            @Valid @RequestBody final RatingRequest request,
            final Authentication authentication) {

        final User currentUser = getCurrentUser(authentication);

        if (!currentUser.isCanRate()) {
            throw new IllegalArgumentException("User does not have permission to rate photos");
        }

        final Rating rating = photoService.ratePhoto(id, currentUser.getId(), request.rating());

        return ResponseEntity.ok(mapToRatingResponse(rating));
    }

    @DeleteMapping("/{id}/rating")
    public ResponseEntity<Void> clearRating(
            @PathVariable final Long id,
            final Authentication authentication) {

        final User currentUser = getCurrentUser(authentication);

        if (!currentUser.isCanRate()) {
            throw new IllegalArgumentException("User does not have permission to rate photos");
        }

        photoService.clearRating(id, currentUser.getId());

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(
            @PathVariable final Long id,
            final Authentication authentication) throws IOException {

        final User currentUser = getCurrentUser(authentication);
        photoService.deletePhoto(id, currentUser.getId());

        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(final Authentication authentication) {
        if (authentication == null) {
            return userRepository.findFirstByRole(Role.ADMIN)
                    .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));
        }
        final String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private PhotoResponse mapToPhotoResponse(final Photo photo, final Long currentUserId) {
        final String thumbnailUrl = photo.getThumbnailFilename() != null
                ? "/api/photos/" + photo.getId() + "/thumbnail"
                : null;

        final Integer userRating = currentUserId != null ? getUserRating(photo, currentUserId) : null;
        final Double displayRating = calculateDisplayRating(photo, currentUserId, userRating);
        final Integer totalRatings = photo.getRatings() != null ? photo.getRatings().size() : 0;

        return new PhotoResponse(
                photo.getId(),
                photo.getFilename(),
                photo.getOriginalFilename(),
                thumbnailUrl,
                photo.getFileSize(),
                photo.getMimeType(),
                photo.getGpsLatitude(),
                photo.getGpsLongitude(),
                photo.getTakenAt(),
                photo.getUploadedAt(),
                displayRating,
                totalRatings,
                userRating
        );
    }

    private RatingResponse mapToRatingResponse(final Rating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getPhoto().getId(),
                rating.getUser().getId(),
                rating.getRatingValue(),
                rating.getCreatedAt()
        );
    }

    private Double calculateAverageRating(final Photo photo) {
        if (photo.getRatings() == null || photo.getRatings().isEmpty()) {
            return null;
        }

        return photo.getRatings().stream()
                .mapToInt(Rating::getRatingValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculates personalized rating display:
     * - If user has rated the photo → show user's rating
     * - If user hasn't rated but others have → show average of others' ratings
     * - If no ratings exist → return null
     */
    private Double calculateDisplayRating(final Photo photo, final Long currentUserId, final Integer userRating) {
        if (photo.getRatings() == null || photo.getRatings().isEmpty()) {
            return null;
        }

        // If user has own rating, return it as display rating
        if (userRating != null) {
            return userRating.doubleValue();
        }

        // User hasn't rated - calculate average of OTHER users' ratings
        if (currentUserId != null) {
            return photo.getRatings().stream()
                    .filter(r -> !r.getUser().getId().equals(currentUserId))
                    .mapToInt(Rating::getRatingValue)
                    .average()
                    .orElse(0.0);
        }

        // Not logged in - show overall average
        return calculateAverageRating(photo);
    }

    private Integer getUserRating(final Photo photo, final Long userId) {
        if (photo.getRatings() == null) {
            return null;
        }

        return photo.getRatings().stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .map(Rating::getRatingValue)
                .findFirst()
                .orElse(null);
    }
}
