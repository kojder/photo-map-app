package com.photomap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateSettingsRequest(
        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.format}")
        String adminContactEmail
) {}
