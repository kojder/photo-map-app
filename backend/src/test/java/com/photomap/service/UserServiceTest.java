package com.photomap.service;

import com.photomap.dto.UpdatePermissionsRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;

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
    private PasswordEncoder passwordEncoder;

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
    void listAllUsers_WithSearchEmail_FiltersUsers() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> userPage = new PageImpl<>(List.of(user1));

        when(userRepository.findByEmailContainingIgnoreCase("user1", pageable)).thenReturn(userPage);
        when(photoRepository.countByUserId(1L)).thenReturn(5L);

        Page<UserAdminResponse> result = userService.listAllUsers(pageable, "user1");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).email()).isEqualTo("user1@example.com");
        verify(userRepository).findByEmailContainingIgnoreCase("user1", pageable);
        verify(photoRepository).countByUserId(1L);
    }

    @Test
    void listAllUsers_WithEmptySearchEmail_ReturnsAllUsers() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> userPage = new PageImpl<>(List.of(user1, user2));

        when(userRepository.findAll(pageable)).thenReturn(userPage);
        when(photoRepository.countByUserId(1L)).thenReturn(5L);
        when(photoRepository.countByUserId(2L)).thenReturn(3L);

        Page<UserAdminResponse> result = userService.listAllUsers(pageable, "   ");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        verify(userRepository).findAll(pageable);
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

    @Test
    void updateUserPermissions_Success_UpdatesPermissions() {
        UpdatePermissionsRequest request = new UpdatePermissionsRequest(true, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.save(any(User.class))).thenReturn(user1);

        UserResponse response = userService.updateUserPermissions(1L, request);

        assertThat(response).isNotNull();
        assertThat(user1.isCanViewPhotos()).isTrue();
        assertThat(user1.isCanRate()).isTrue();
        verify(userRepository).findById(1L);
        verify(userRepository).save(user1);
    }

    @Test
    void updateUserPermissions_UserNotFound_ThrowsException() {
        UpdatePermissionsRequest request = new UpdatePermissionsRequest(true, true);
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUserPermissions(999L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deactivateUser_Success_AnonymizesAndDeactivatesUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(passwordEncoder.encode(any(String.class))).thenReturn("encoded-random-hash");
        when(userRepository.save(any(User.class))).thenReturn(user1);

        userService.deactivateUser(1L);

        assertThat(user1.getEmail()).startsWith("inactive_");
        assertThat(user1.getEmail()).contains("_1@deleted.local");
        assertThat(user1.getPasswordHash()).isEqualTo("encoded-random-hash");
        assertThat(user1.isActive()).isFalse();
        assertThat(user1.isCanUpload()).isFalse();
        assertThat(user1.isCanViewPhotos()).isFalse();
        assertThat(user1.isCanRate()).isFalse();

        verify(userRepository).findById(1L);
        verify(passwordEncoder).encode(any(String.class));
        verify(userRepository).save(user1);
    }

    @Test
    void deactivateUser_AdminUser_ThrowsException() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));

        assertThatThrownBy(() -> userService.deactivateUser(2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cannot deactivate admin user");

        verify(userRepository).findById(2L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deactivateUser_UserNotFound_ThrowsException() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deactivateUser(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("User not found");

        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getInactiveUsers_Success_ReturnsInactiveUsers() {
        user1.setActive(false);
        User user3 = new User();
        user3.setId(3L);
        user3.setEmail("user3@example.com");
        user3.setActive(false);

        when(userRepository.findByIsActive(false)).thenReturn(List.of(user1, user3));

        List<User> result = userService.getInactiveUsers();

        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(user1, user3);
        verify(userRepository).findByIsActive(false);
    }
}
