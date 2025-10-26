package com.photomap.dto;

import jakarta.validation.constraints.NotNull;

public record UpdatePermissionsRequest(
        @NotNull(message = "{validation.permissions.canViewPhotos.required}")
        Boolean canViewPhotos,

        @NotNull(message = "{validation.permissions.canRate.required}")
        Boolean canRate
) {}
