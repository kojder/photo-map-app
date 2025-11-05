package com.photomap.service;

import com.photomap.model.AppSettings;
import com.photomap.repository.AppSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private AppSettingsRepository appSettingsRepository;

    @InjectMocks
    private SettingsService settingsService;

    private AppSettings testSetting;

    @BeforeEach
    void setUp() {
        testSetting = new AppSettings();
        testSetting.setId(1L);
        testSetting.setSettingKey("test_key");
        testSetting.setSettingValue("test_value");
    }

    @Test
    void getSetting_Found_ReturnsValue() {
        when(appSettingsRepository.findBySettingKey("test_key")).thenReturn(Optional.of(testSetting));

        final String result = settingsService.getSetting("test_key");

        assertNotNull(result);
        assertEquals("test_value", result);
        verify(appSettingsRepository, times(1)).findBySettingKey("test_key");
    }

    @Test
    void getSetting_NotFound_ReturnsNull() {
        when(appSettingsRepository.findBySettingKey("nonexistent_key")).thenReturn(Optional.empty());

        final String result = settingsService.getSetting("nonexistent_key");

        assertNull(result);
        verify(appSettingsRepository, times(1)).findBySettingKey("nonexistent_key");
    }

    @Test
    void updateSetting_Existing_UpdatesValue() {
        when(appSettingsRepository.findBySettingKey("test_key")).thenReturn(Optional.of(testSetting));
        when(appSettingsRepository.save(any(AppSettings.class))).thenReturn(testSetting);

        settingsService.updateSetting("test_key", "new_value");

        assertEquals("new_value", testSetting.getSettingValue());
        verify(appSettingsRepository, times(1)).findBySettingKey("test_key");
        verify(appSettingsRepository, times(1)).save(testSetting);
    }

    @Test
    void updateSetting_New_CreatesNewSetting() {
        when(appSettingsRepository.findBySettingKey("new_key")).thenReturn(Optional.empty());
        when(appSettingsRepository.save(any(AppSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        settingsService.updateSetting("new_key", "new_value");

        verify(appSettingsRepository, times(1)).findBySettingKey("new_key");
        verify(appSettingsRepository, times(1)).save(any(AppSettings.class));
    }

    @Test
    void updateSetting_Multiple_CorrectlyManagesSettings() {
        final AppSettings setting1 = new AppSettings();
        setting1.setId(1L);
        setting1.setSettingKey("key1");
        setting1.setSettingValue("value1");

        final AppSettings setting2 = new AppSettings();
        setting2.setId(2L);
        setting2.setSettingKey("key2");
        setting2.setSettingValue("value2");

        when(appSettingsRepository.findBySettingKey("key1")).thenReturn(Optional.of(setting1));
        when(appSettingsRepository.findBySettingKey("key2")).thenReturn(Optional.empty());
        when(appSettingsRepository.save(any(AppSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        settingsService.updateSetting("key1", "updated_value1");
        settingsService.updateSetting("key2", "value2");

        assertEquals("updated_value1", setting1.getSettingValue());
        verify(appSettingsRepository, times(2)).findBySettingKey(anyString());
        verify(appSettingsRepository, times(2)).save(any(AppSettings.class));
    }
}
