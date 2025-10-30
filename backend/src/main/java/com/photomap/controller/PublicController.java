package com.photomap.controller;

import com.photomap.dto.AppSettingsResponse;
import com.photomap.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final SettingsService settingsService;

    public PublicController(final SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping("/settings")
    public ResponseEntity<AppSettingsResponse> getPublicSettings() {
        final String adminContactEmail = settingsService.getSetting("admin_contact_email");
        return ResponseEntity.ok(new AppSettingsResponse(adminContactEmail));
    }
}
