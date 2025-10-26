package com.photomap.controller;

import com.photomap.model.Photo;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import com.photomap.service.PhotoService;
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
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PhotoControllerTest {

    @Mock
    private PhotoService photoService;

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PhotoController photoController;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(7L);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ADMIN);

        regularUser = new User();
        regularUser.setId(1L);
        regularUser.setEmail("user@example.com");
        regularUser.setRole(Role.USER);
    }

    @Test
    void getPhotos_WhenAuthenticationIsNull_ShouldUseFirstAdminUser() {
        final List<Photo> photos = new ArrayList<>();
        final Page<Photo> photoPage = new PageImpl<>(photos);
        final Pageable pageable = PageRequest.of(0, 20);

        when(userRepository.findFirstByRole(Role.ADMIN)).thenReturn(Optional.of(adminUser));
        when(photoService.getPhotos(eq(7L), any(Pageable.class), any(), any(), any(), any()))
                .thenReturn(photoPage);

        final ResponseEntity<?> response = photoController.getPhotos(null, null, null, null, pageable, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPhotos_WhenAuthenticationIsNullAndNoAdmin_ShouldThrowException() {
        final Pageable pageable = PageRequest.of(0, 20);

        when(userRepository.findFirstByRole(Role.ADMIN)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> photoController.getPhotos(null, null, null, null, pageable, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Admin user not found");
    }
}
