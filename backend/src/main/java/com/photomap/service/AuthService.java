package com.photomap.service;

import com.photomap.dto.LoginRequest;
import com.photomap.dto.LoginResponse;
import com.photomap.dto.RegisterRequest;
import com.photomap.dto.UserResponse;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import com.photomap.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(final UserRepository userRepository, final PasswordEncoder passwordEncoder,
                       final JwtTokenProvider jwtTokenProvider, final AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public UserResponse register(final RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        final User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setCanViewPhotos(false);
        user.setCanRate(false);

        final User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getCreatedAt(),
                savedUser.isCanViewPhotos(),
                savedUser.isCanRate()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(final LoginRequest request) {
        final Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        final String token = jwtTokenProvider.generateToken(authentication);

        final User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        final UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.isCanViewPhotos(),
                user.isCanRate()
        );

        return new LoginResponse(token, "Bearer", 86400, userResponse);
    }
}
