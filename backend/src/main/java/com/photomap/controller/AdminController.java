package com.photomap.controller;

import com.photomap.dto.PhotoAdminResponse;
import com.photomap.dto.UpdateRoleRequest;
import com.photomap.dto.UserAdminResponse;
import com.photomap.dto.UserResponse;
import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.service.PhotoService;
import com.photomap.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final PhotoService photoService;

    public AdminController(final UserService userService, final PhotoService photoService) {
        this.userService = userService;
        this.photoService = photoService;
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminResponse>> listAllUsers(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "20") final int size,
            @RequestParam(defaultValue = "createdAt,desc") final String sort) {

        final String[] sortParams = sort.split(",");
        final Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        final Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        final Page<UserAdminResponse> users = userService.listAllUsers(pageable);

        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> changeUserRole(
            @PathVariable final Long id,
            @Valid @RequestBody final UpdateRoleRequest request) {

        final UserResponse response = userService.changeUserRole(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable final Long id) {
        userService.deleteUser(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/photos")
    public ResponseEntity<Page<PhotoAdminResponse>> listAllPhotos(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "20") final int size,
            @RequestParam(defaultValue = "uploadedAt,desc") final String sort) {

        final String[] sortParams = sort.split(",");
        final Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        final Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));
        final Page<Photo> photos = photoService.getPhotosForAdmin(pageable);

        final Page<PhotoAdminResponse> response = photos.map(this::mapToPhotoAdminResponse);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable final Long id) throws IOException {
        photoService.deletePhotoByAdmin(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    private PhotoAdminResponse mapToPhotoAdminResponse(final Photo photo) {
        final String thumbnailUrl = photo.getThumbnailFilename() != null
                ? "/api/photos/" + photo.getId() + "/thumbnail"
                : null;

        final Double averageRating = calculateAverageRating(photo);
        final Integer totalRatings = photo.getRatings() != null ? photo.getRatings().size() : 0;

        final Long userId = photo.getUser() != null ? photo.getUser().getId() : null;
        final String userEmail = photo.getUser() != null ? photo.getUser().getEmail() : null;

        return new PhotoAdminResponse(
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
                userId,
                userEmail
        );
    }

    private Double calculateAverageRating(final Photo photo) {
        if (photo.getRatings() == null || photo.getRatings().isEmpty()) {
            return null;
        }

        return photo.getRatings().stream()
                .mapToInt(Rating::getRating)
                .average()
                .orElse(0.0);
    }
}
