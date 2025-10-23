package com.photomap.controller;

import com.photomap.dto.PhotoDto;
import com.photomap.dto.PhotoUploadResponse;
import com.photomap.dto.RatingUpdateRequest;
import com.photomap.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;

/**
 * REST Controller for Photo Management
 *
 * Base URL: /api/photos
 * Security: All endpoints require authentication (JWT)
 *
 * Features:
 * - List user's photos
 * - Get photo by ID
 * - Upload photo (multipart/form-data)
 * - Update photo rating
 * - Delete photo
 */
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    /**
     * GET /api/photos
     *
     * List all photos for authenticated user.
     * User scoping enforced - users see only their own photos.
     */
    @GetMapping
    public ResponseEntity<List<PhotoDto>> getUserPhotos(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        List<PhotoDto> photos = photoService.findPhotosByUserId(userId);
        return ResponseEntity.ok(photos);
    }

    /**
     * GET /api/photos/{photoId}
     *
     * Get single photo by ID.
     * User scoping enforced - 404 if photo doesn't belong to user.
     */
    @GetMapping("/{photoId}")
    public ResponseEntity<PhotoDto> getPhotoById(
        @PathVariable Long photoId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        PhotoDto photo = photoService.findPhotoById(photoId, userId);
        return ResponseEntity.ok(photo);
    }

    /**
     * POST /api/photos/upload
     *
     * Upload photo with multipart/form-data.
     *
     * Process:
     * 1. Validate file (type, size)
     * 2. Save original file
     * 3. Extract EXIF metadata
     * 4. Generate thumbnails
     * 5. Save to database
     *
     * Returns 201 Created with photo details.
     */
    @PostMapping("/upload")
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        PhotoUploadResponse response = photoService.uploadPhoto(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/photos/{photoId}/rating
     *
     * Update photo rating (1-10 stars).
     * User scoping enforced - can only rate own photos.
     *
     * Request body: { "rating": 8 }
     * Returns 204 No Content on success.
     */
    @PutMapping("/{photoId}/rating")
    public ResponseEntity<Void> updateRating(
        @PathVariable Long photoId,
        @RequestBody @Valid RatingUpdateRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        photoService.updateRating(photoId, request.getRating(), userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/photos/{photoId}
     *
     * Delete photo (files + database record).
     * User scoping enforced - can only delete own photos.
     *
     * Returns 204 No Content on success.
     */
    @DeleteMapping("/{photoId}")
    public ResponseEntity<Void> deletePhoto(
        @PathVariable Long photoId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        photoService.deletePhoto(photoId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract user ID from authenticated principal.
     *
     * Assumes CustomUserDetails implementation with getUserId() method.
     */
    private Long extractUserId(UserDetails userDetails) {
        return ((CustomUserDetails) userDetails).getUserId();
    }
}
