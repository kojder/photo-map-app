package com.photomap.dto;

import com.photomap.model.Photo;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * Photo DTOs - Request and Response patterns
 *
 * Best Practices Demonstrated:
 * - Records for immutable response DTOs (Java 16+)
 * - Static factory methods (fromEntity, fromEntities)
 * - Validation annotations on request DTOs
 * - Clear separation: Response DTO vs Request DTO
 */

// ========================================
// Response DTO (Record - immutable)
// ========================================

public record PhotoDto(
    Long id,
    String fileName,
    Long fileSize,
    String thumbnailSmallUrl,
    String thumbnailMediumUrl,
    String thumbnailLargeUrl,
    Double latitude,
    Double longitude,
    Integer rating,
    String takenAt,
    Integer width,
    Integer height
) {
    /**
     * Static factory method - Entity to DTO conversion
     */
    public static PhotoDto fromEntity(final Photo photo) {
        return new PhotoDto(
            photo.getId(),
            photo.getFileName(),
            photo.getFileSize(),
            "/api/photos/" + photo.getId() + "/thumbnails/small",
            "/api/photos/" + photo.getId() + "/thumbnails/medium",
            "/api/photos/" + photo.getId() + "/thumbnails/large",
            photo.getLatitude(),
            photo.getLongitude(),
            photo.getRating(),
            photo.getTakenAt() != null ? photo.getTakenAt().toString() : null,
            photo.getWidth(),
            photo.getHeight()
        );
    }

    /**
     * Bulk conversion - List<Entity> to List<DTO>
     */
    public static List<PhotoDto> fromEntities(final List<Photo> photos) {
        return photos.stream()
            .map(PhotoDto::fromEntity)
            .toList(); // Java 16+ - returns immutable list
    }
}

// ========================================
// Request DTO - Rating Update
// ========================================

@Data
public class RatingUpdateRequest {

    @NotNull(message = "{validation.rating.required}")
    @Min(value = 1, message = "{validation.rating.range}")
    @Max(value = 10, message = "{validation.rating.range}")
    private Integer rating;
}

// ========================================
// Response DTO - Upload Response
// ========================================

@Data
@Builder
public class PhotoUploadResponse {
    private Long photoId;
    private String fileName;
    private String status; // "QUEUED", "PROCESSING", "COMPLETED"
    private String message;
    private Double latitude;
    private Double longitude;

    public static PhotoUploadResponse fromEntity(final Photo photo) {
        return PhotoUploadResponse.builder()
            .photoId(photo.getId())
            .fileName(photo.getFileName())
            .status("COMPLETED")
            .message("Photo uploaded and processed successfully")
            .latitude(photo.getLatitude())
            .longitude(photo.getLongitude())
            .build();
    }
}
