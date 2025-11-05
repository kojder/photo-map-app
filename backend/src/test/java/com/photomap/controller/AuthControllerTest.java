package com.photomap.controller;

import com.photomap.dto.LoginRequest;
import com.photomap.dto.LoginResponse;
import com.photomap.dto.RegisterRequest;
import com.photomap.dto.UserResponse;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import com.photomap.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private UserResponse testUserResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole(Role.USER);
        testUser.setCreatedAt(Instant.now());
        testUser.setCanViewPhotos(true);
        testUser.setCanRate(true);

        testUserResponse = new UserResponse(
                testUser.getId(),
                testUser.getEmail(),
                testUser.getRole(),
                testUser.getCreatedAt(),
                testUser.isCanViewPhotos(),
                testUser.isCanRate()
        );
    }

    @Test
    void register_ValidRequest_ReturnsCreated() {
        final RegisterRequest request = new RegisterRequest("new@example.com", "Password123!");
        when(authService.register(any(RegisterRequest.class))).thenReturn(testUserResponse);

        final ResponseEntity<UserResponse> response = authController.register(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().email()).isEqualTo("test@example.com");
        verify(authService, times(1)).register(any(RegisterRequest.class));
    }

    @Test
    void login_ValidCredentials_ReturnsOk() {
        final LoginRequest request = new LoginRequest("test@example.com", "Password123!");
        final LoginResponse loginResponse = new LoginResponse("fake-jwt-token", "Bearer", 3600L, testUserResponse);
        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        final ResponseEntity<LoginResponse> response = authController.login(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isEqualTo("fake-jwt-token");
        assertThat(response.getBody().type()).isEqualTo("Bearer");
        assertThat(response.getBody().expiresIn()).isEqualTo(3600L);
        assertThat(response.getBody().user().email()).isEqualTo("test@example.com");
        verify(authService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    void getCurrentUser_Authenticated_ReturnsUserInfo() {
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        final ResponseEntity<UserResponse> response = authController.getCurrentUser(authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().email()).isEqualTo("test@example.com");
        assertThat(response.getBody().role()).isEqualTo(Role.USER);
        verify(authentication, times(1)).getName();
        verify(userRepository, times(1)).findByEmail("test@example.com");
    }

    @Test
    void getCurrentUser_UserNotFound_ThrowsException() {
        when(authentication.getName()).thenReturn("nonexistent@example.com");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authController.getCurrentUser(authentication))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(authentication, times(1)).getName();
        verify(userRepository, times(1)).findByEmail("nonexistent@example.com");
    }
}
