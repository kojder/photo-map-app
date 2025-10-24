package com.photomap.controller;

import com.photomap.dto.PhotoResponse;
import com.photomap.dto.RatingRequest;
import com.photomap.dto.RatingResponse;
import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.User;
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

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
@Slf4j
public class PhotoController {

    private final PhotoService photoService;
    private final UserRepository userRepository;

    @Value("${photo.upload.directory}")
    private String uploadDirectory;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        User currentUser = getCurrentUser(authentication);
        Photo photo = photoService.upload(file, currentUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapToPhotoResponse(photo, null));
    }

    @GetMapping
    public ResponseEntity<Page<PhotoResponse>> getPhotos(
            @PageableDefault(size = 20, sort = "uploadedAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        Page<Photo> photos = photoService.getPhotos(currentUser.getId(), pageable);

        Page<PhotoResponse> response = photos.map(photo -> mapToPhotoResponse(photo, currentUser.getId()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PhotoResponse> getPhotoById(
            @PathVariable Long id,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        Photo photo = photoService.getPhotoById(id, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Photo not found or access denied"));

        return ResponseEntity.ok(mapToPhotoResponse(photo, currentUser.getId()));
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<Resource> getThumbnail(@PathVariable Long id, Authentication authentication) throws IOException {
        User currentUser = getCurrentUser(authentication);
        Photo photo = photoService.getPhotoById(id, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Photo not found or access denied"));

        String thumbnailFilename = photo.getThumbnailFilename();
        if (thumbnailFilename == null) {
            thumbnailFilename = photo.getFilename();
        }

        Path filePath = Paths.get(uploadDirectory, thumbnailFilename);
        Resource resource = new FileSystemResource(filePath);

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
    public ResponseEntity<Resource> getFullImage(@PathVariable Long id, Authentication authentication) throws IOException {
        User currentUser = getCurrentUser(authentication);
        Photo photo = photoService.getPhotoById(id, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Photo not found or access denied"));

        Path filePath = Paths.get(uploadDirectory, photo.getFilename());
        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getMimeType()))
                .body(resource);
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<RatingResponse> ratePhoto(
            @PathVariable Long id,
            @Valid @RequestBody RatingRequest request,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        Rating rating = photoService.ratePhoto(id, currentUser.getId(), request.rating());

        return ResponseEntity.ok(mapToRatingResponse(rating));
    }

    @DeleteMapping("/{id}/rating")
    public ResponseEntity<Void> clearRating(
            @PathVariable Long id,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        photoService.clearRating(id, currentUser.getId());

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(
            @PathVariable Long id,
            Authentication authentication) throws IOException {

        User currentUser = getCurrentUser(authentication);
        photoService.deletePhoto(id, currentUser.getId());

        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private PhotoResponse mapToPhotoResponse(Photo photo, Long currentUserId) {
        String thumbnailUrl = photo.getThumbnailFilename() != null
                ? "/api/photos/" + photo.getId() + "/thumbnail"
                : null;

        Double averageRating = calculateAverageRating(photo);
        Integer totalRatings = photo.getRatings() != null ? photo.getRatings().size() : 0;
        Integer userRating = currentUserId != null ? getUserRating(photo, currentUserId) : null;

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
                averageRating,
                totalRatings,
                userRating
        );
    }

    private RatingResponse mapToRatingResponse(Rating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getPhoto().getId(),
                rating.getUser().getId(),
                rating.getRating(),
                rating.getCreatedAt()
        );
    }

    private Double calculateAverageRating(Photo photo) {
        if (photo.getRatings() == null || photo.getRatings().isEmpty()) {
            return null;
        }

        return photo.getRatings().stream()
                .mapToInt(Rating::getRating)
                .average()
                .orElse(0.0);
    }

    private Integer getUserRating(Photo photo, Long userId) {
        if (photo.getRatings() == null) {
            return null;
        }

        return photo.getRatings().stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .map(Rating::getRating)
                .findFirst()
                .orElse(null);
    }
}
