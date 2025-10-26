package com.photomap.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PhotoAdminResponse(
    Long id,
    String filename,
    String originalFilename,
    String thumbnailUrl,
    Long fileSize,
    String mimeType,
    BigDecimal gpsLatitude,
    BigDecimal gpsLongitude,
    Instant takenAt,
    Instant uploadedAt,
    Double averageRating,
    Integer totalRatings,
    Long userId,
    String userEmail
) {
}
