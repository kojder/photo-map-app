package com.photomap.dto;

import com.photomap.model.Role;

import java.time.Instant;

public record UserSummaryDTO(
        Long id,
        String email,
        Role role,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
}
