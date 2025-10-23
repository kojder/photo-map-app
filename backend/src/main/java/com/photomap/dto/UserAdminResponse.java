package com.photomap.dto;

import com.photomap.model.Role;

import java.time.Instant;

public record UserAdminResponse(
        Long id,
        String email,
        Role role,
        Instant createdAt,
        Long totalPhotos
) {}
