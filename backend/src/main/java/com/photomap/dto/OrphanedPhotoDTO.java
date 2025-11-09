package com.photomap.dto;

import java.time.Instant;

public record OrphanedPhotoDTO(
        Long id,
        String filename,
        String originalFilename,
        Long fileSize,
        Instant uploadedAt,
        Double gpsLatitude,
        Double gpsLongitude
) {
}
