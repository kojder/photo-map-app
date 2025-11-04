package com.photomap.config;

import com.photomap.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void shouldLoadSecurityFilterChainBean() {
        assertThat(securityFilterChain).isNotNull();
    }

    @Test
    void shouldLoadPasswordEncoderBean() {
        assertThat(passwordEncoder).isNotNull();

        String password = "test123";
        String encoded = passwordEncoder.encode(password);

        assertThat(encoded).isNotBlank();
        assertThat(passwordEncoder.matches(password, encoded)).isTrue();
    }

    @Test
    void shouldLoadAuthenticationManagerBean() {
        assertThat(authenticationManager).isNotNull();
    }

    @Test
    void shouldLoadJwtAuthenticationFilterBean() {
        assertThat(jwtAuthenticationFilter).isNotNull();
    }
}
