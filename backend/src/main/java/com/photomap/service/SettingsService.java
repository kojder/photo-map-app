package com.photomap.service;

import com.photomap.model.AppSettings;
import com.photomap.repository.AppSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final AppSettingsRepository appSettingsRepository;

    @Transactional(readOnly = true)
    public String getSetting(final String key) {
        return appSettingsRepository.findBySettingKey(key)
                .map(AppSettings::getSettingValue)
                .orElse(null);
    }

    @Transactional
    public void updateSetting(final String key, final String value) {
        final Optional<AppSettings> existingOpt = appSettingsRepository.findBySettingKey(key);

        if (existingOpt.isPresent()) {
            final AppSettings existing = existingOpt.get();
            existing.setSettingValue(value);
            appSettingsRepository.save(existing);
        } else {
            final AppSettings newSetting = new AppSettings();
            newSetting.setSettingKey(key);
            newSetting.setSettingValue(value);
            appSettingsRepository.save(newSetting);
        }
    }
}
