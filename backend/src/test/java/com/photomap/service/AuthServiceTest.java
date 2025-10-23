package com.photomap.service;

import com.photomap.dto.LoginRequest;
import com.photomap.dto.LoginResponse;
import com.photomap.dto.RegisterRequest;
import com.photomap.dto.UserResponse;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import com.photomap.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest("test@example.com", "testpass123");
        loginRequest = new LoginRequest("test@example.com", "testpass123");

        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPasswordHash("$2a$10$hashedPassword");
        user.setRole(Role.USER);
        user.setCreatedAt(Instant.now());
    }

    @Test
    void register_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("test@example.com");
        assertThat(response.role()).isEqualTo(Role.USER);
        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder).encode("testpass123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Email already exists");

        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success_ReturnsTokenAndUser() {
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("jwt.token.here");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        LoginResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("jwt.token.here");
        assertThat(response.type()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(86400);
        assertThat(response.user().email()).isEqualTo("test@example.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider).generateToken(authentication);
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("jwt.token.here");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findByEmail("test@example.com");
    }
}
