package com.photomap.dto;

public record LoginResponse(
        String token,
        String type,
        long expiresIn,
        UserResponse user
) {}
