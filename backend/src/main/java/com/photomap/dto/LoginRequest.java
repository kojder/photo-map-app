package com.photomap.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "{validation.email.required}")
        String email,

        @NotBlank(message = "{validation.password.required}")
        String password
) {}
