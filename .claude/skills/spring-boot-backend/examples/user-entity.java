package com.photomap.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User Entity - JPA entity implementing UserDetails for Spring Security
 *
 * Best Practices Demonstrated:
 * - Implements UserDetails for Spring Security integration
 * - BCrypt password hashing (stored in passwordHash field)
 * - Role enum for type safety
 * - One-to-Many relationship with Photo (cascade operations)
 * - @PrePersist for timestamp management
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash; // BCrypt hashed password

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // One user can have many photos
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (role == null) {
            role = Role.USER;
        }
    }

    // ========================================
    // UserDetails Implementation
    // ========================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email; // Email is username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

/**
 * Role Enum - Type-safe roles
 */
enum Role {
    USER,
    ADMIN
}
