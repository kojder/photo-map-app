package com.photomap.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RatingRequest(
    @NotNull(message = "{validation.rating.required}")
    @Min(value = 1, message = "{validation.rating.min}")
    @Max(value = 5, message = "{validation.rating.max}")
    Integer rating
) {
}
