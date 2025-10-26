package com.photomap.config;

import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(final String... args) {
        final long adminCount = userRepository.countByRole(Role.ADMIN);

        if (adminCount == 0) {
            final User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setMustChangePassword(true);

            userRepository.save(admin);
            log.info("✅ Created default admin user: {}", adminEmail);
            log.warn("⚠️  Admin must change password on first login!");
        } else {
            log.info("ℹ️  Admin user(s) already exist (count: {})", adminCount);
        }
    }
}
