package com.photomap.config;

import com.photomap.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration - Spring Security 6 with JWT
 *
 * Best Practices Demonstrated:
 * - Constructor injection with final fields (@RequiredArgsConstructor)
 * - Stateless session management (JWT-based)
 * - Public endpoints for auth (/api/auth/**)
 * - Role-based access control (ADMIN, USER)
 * - JWT filter before Spring's authentication filter
 * - BCrypt password encoding
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enable @PreAuthorize, @PostAuthorize, etc.
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        http
            // Disable CSRF (not needed for stateless JWT)
            .csrf(csrf -> csrf.disable())

            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Public: login, register
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Admin only
                .requestMatchers("/actuator/health").permitAll() // Public health check
                .requestMatchers("/actuator/**").hasRole("ADMIN") // Admin actuator
                .anyRequest().authenticated() // All other require authentication
            )

            // Stateless session management (JWT-based, no HTTP sessions)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Set authentication provider
            .authenticationProvider(authenticationProvider())

            // Add JWT filter before Spring's authentication filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // BCrypt for password hashing
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        final DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
        final AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
