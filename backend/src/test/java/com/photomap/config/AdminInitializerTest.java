package com.photomap.config;

import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AdminInitializerTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminInitializer adminInitializer;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldCreateAdminWhenNoneExists() {
        adminInitializer.run();

        final long adminCount = userRepository.countByRole(Role.ADMIN);
        assertThat(adminCount).isEqualTo(1);

        final User admin = userRepository.findByEmail("admin@example.com").orElseThrow();
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.isMustChangePassword()).isTrue();
    }

    @Test
    void shouldNotCreateDuplicateAdminOnRestart() {
        adminInitializer.run();
        final long initialCount = userRepository.countByRole(Role.ADMIN);

        adminInitializer.run();

        final long finalCount = userRepository.countByRole(Role.ADMIN);
        assertThat(finalCount).isEqualTo(initialCount);
    }

    @Test
    void shouldNotCreateNewAdminAfterEmailChange() {
        adminInitializer.run();
        final User admin = userRepository.findByEmail("admin@example.com").orElseThrow();
        admin.setEmail("newadmin@example.com");
        userRepository.save(admin);

        adminInitializer.run();

        final long adminCount = userRepository.countByRole(Role.ADMIN);
        assertThat(adminCount).isEqualTo(1);
    }
}
