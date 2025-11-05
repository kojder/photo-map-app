package com.photomap.controller;

import com.photomap.dto.AppSettingsResponse;
import com.photomap.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicControllerTest {

    @Mock
    private SettingsService settingsService;

    @InjectMocks
    private PublicController publicController;

    @Test
    void getPublicSettings_WithEmail_ReturnsEmail() {
        when(settingsService.getSetting("admin_contact_email")).thenReturn("admin@example.com");

        final ResponseEntity<AppSettingsResponse> response = publicController.getPublicSettings();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().adminContactEmail()).isEqualTo("admin@example.com");
        verify(settingsService, times(1)).getSetting("admin_contact_email");
    }

    @Test
    void getPublicSettings_WithoutEmail_ReturnsNullEmail() {
        when(settingsService.getSetting("admin_contact_email")).thenReturn(null);

        final ResponseEntity<AppSettingsResponse> response = publicController.getPublicSettings();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().adminContactEmail()).isNull();
        verify(settingsService, times(1)).getSetting("admin_contact_email");
    }
}
