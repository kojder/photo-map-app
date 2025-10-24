package com.photomap.dto;

import java.time.Instant;

public record RatingResponse(
    Long id,
    Long photoId,
    Long userId,
    Integer rating,
    Instant createdAt
) {
}
