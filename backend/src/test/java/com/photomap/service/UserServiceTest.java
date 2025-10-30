package com.photomap.service;

import com.photomap.dto.UpdateRoleRequest;
import com.photomap.dto.UserAdminResponse;
import com.photomap.dto.UserResponse;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private UserService userService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(1L);
        user1.setEmail("user1@example.com");
        user1.setPasswordHash("hash");
        user1.setRole(Role.USER);
        user1.setCreatedAt(Instant.now());

        user2 = new User();
        user2.setId(2L);
        user2.setEmail("admin@example.com");
        user2.setPasswordHash("hash");
        user2.setRole(Role.ADMIN);
        user2.setCreatedAt(Instant.now());
    }

    @Test
    void listAllUsers_Success_ReturnsPageWithTotalPhotos() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> userPage = new PageImpl<>(List.of(user1, user2));

        when(userRepository.findAll(pageable)).thenReturn(userPage);
        when(photoRepository.countByUserId(1L)).thenReturn(5L);
        when(photoRepository.countByUserId(2L)).thenReturn(3L);

        Page<UserAdminResponse> result = userService.listAllUsers(pageable, null);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).totalPhotos()).isEqualTo(5L);
        assertThat(result.getContent().get(1).totalPhotos()).isEqualTo(3L);
        verify(userRepository).findAll(pageable);
        verify(photoRepository).countByUserId(1L);
        verify(photoRepository).countByUserId(2L);
    }

    @Test
    void changeUserRole_Success_UpdatesRole() {
        UpdateRoleRequest request = new UpdateRoleRequest(Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.save(any(User.class))).thenReturn(user1);

        UserResponse response = userService.changeUserRole(1L, request);

        assertThat(response).isNotNull();
        assertThat(user1.getRole()).isEqualTo(Role.ADMIN);
        verify(userRepository).findById(1L);
        verify(userRepository).save(user1);
    }

    @Test
    void changeUserRole_UserNotFound_ThrowsException() {
        UpdateRoleRequest request = new UpdateRoleRequest(Role.ADMIN);
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.changeUserRole(999L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUser_Success_DeletesUser() {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("admin@example.com")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        userService.deleteUser(1L);

        verify(userRepository).findById(1L);
        verify(userRepository).delete(user1);
    }

    @Test
    void deleteUser_CannotDeleteSelf_ThrowsException() {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("user1@example.com")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

        assertThatThrownBy(() -> userService.deleteUser(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot delete yourself");

        verify(userRepository).findById(1L);
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void deleteUser_UserNotFound_ThrowsException() {
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("admin@example.com")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findById(999L);
        verify(userRepository, never()).delete(any(User.class));
    }
}
