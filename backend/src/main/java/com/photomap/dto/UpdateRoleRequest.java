package com.photomap.dto;

import com.photomap.model.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "{validation.role.required}")
        Role role
) {}
