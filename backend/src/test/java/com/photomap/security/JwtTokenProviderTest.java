package com.photomap.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "test-secret-key-for-jwt-token-generation-minimum-32-characters");
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 86400000L);
    }

    @Test
    void generateToken_ValidAuthentication_ReturnsToken() {
        UserDetails userDetails = User.builder()
                .username("test@example.com")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        String token = jwtTokenProvider.generateToken(authentication);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void generateToken_ValidEmail_ReturnsToken() {
        String email = "test@example.com";

        String token = jwtTokenProvider.generateToken(email);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void getEmailFromToken_ValidToken_ReturnsEmail() {
        String email = "test@example.com";
        String token = jwtTokenProvider.generateToken(email);

        String extractedEmail = jwtTokenProvider.getEmailFromToken(token);

        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    void validateToken_ValidToken_ReturnsTrue() {
        String email = "test@example.com";
        String token = jwtTokenProvider.generateToken(email);

        boolean isValid = jwtTokenProvider.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    void validateToken_InvalidToken_ReturnsFalse() {
        String invalidToken = "invalid.jwt.token";

        boolean isValid = jwtTokenProvider.validateToken(invalidToken);

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_MalformedToken_ReturnsFalse() {
        String malformedToken = "malformed-token-without-dots";

        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", -1000L);
        String email = "test@example.com";
        String token = jwtTokenProvider.generateToken(email);

        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 86400000L);

        boolean isValid = jwtTokenProvider.validateToken(token);

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_EmptyToken_ReturnsFalse() {
        boolean isValid = jwtTokenProvider.validateToken("");

        assertThat(isValid).isFalse();
    }
}
