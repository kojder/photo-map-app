package com.photomap.controller;

import com.photomap.model.Photo;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.service.PhotoService;
import com.photomap.service.UserService;
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

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private PhotoService photoService;

    @InjectMocks
    private AdminController adminController;

    private User adminUser;
    private User regularUser;
    private Photo photo1;
    private Photo photo2;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ADMIN);

        regularUser = new User();
        regularUser.setId(2L);
        regularUser.setEmail("user@example.com");
        regularUser.setRole(Role.USER);

        photo1 = new Photo();
        photo1.setId(1L);
        photo1.setFilename("test1.jpg");
        photo1.setOriginalFilename("original1.jpg");
        photo1.setFileSize(1024L);
        photo1.setMimeType("image/jpeg");
        photo1.setUploadedAt(Instant.now());
        photo1.setUser(adminUser);
        photo1.setRatings(new ArrayList<>());

        photo2 = new Photo();
        photo2.setId(2L);
        photo2.setFilename("test2.jpg");
        photo2.setOriginalFilename("original2.jpg");
        photo2.setFileSize(2048L);
        photo2.setMimeType("image/jpeg");
        photo2.setUploadedAt(Instant.now());
        photo2.setUser(regularUser);
        photo2.setRatings(new ArrayList<>());
    }

    @Test
    void listAllPhotos_ShouldReturnPhotosWithOwnerInfo() {
        final List<Photo> photos = List.of(photo1, photo2);
        final Page<Photo> photoPage = new PageImpl<>(photos);

        when(photoService.getPhotosForAdmin(any(Pageable.class))).thenReturn(photoPage);

        final ResponseEntity<?> response = adminController.listAllPhotos(0, 20, "uploadedAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(photoService).getPhotosForAdmin(any(Pageable.class));
    }

    @Test
    void listAllPhotos_ShouldHandlePagination() {
        final List<Photo> photos = List.of(photo1);
        final Page<Photo> photoPage = new PageImpl<>(photos, PageRequest.of(1, 10), 2);

        when(photoService.getPhotosForAdmin(any(Pageable.class))).thenReturn(photoPage);

        final ResponseEntity<?> response = adminController.listAllPhotos(1, 10, "uploadedAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(photoService).getPhotosForAdmin(any(Pageable.class));
    }

    @Test
    void listAllPhotos_ShouldHandleEmptyResult() {
        final Page<Photo> emptyPage = new PageImpl<>(new ArrayList<>());

        when(photoService.getPhotosForAdmin(any(Pageable.class))).thenReturn(emptyPage);

        final ResponseEntity<?> response = adminController.listAllPhotos(0, 20, "uploadedAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(photoService).getPhotosForAdmin(any(Pageable.class));
    }

    @Test
    void deletePhoto_ShouldCallDeletePhotoByAdmin() throws Exception {
        doNothing().when(photoService).deletePhotoByAdmin(1L);

        final ResponseEntity<Void> response = adminController.deletePhoto(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(photoService).deletePhotoByAdmin(1L);
    }

    @Test
    void deletePhoto_WhenPhotoNotFound_ShouldThrowException() throws Exception {
        doThrow(new IllegalArgumentException("Photo not found"))
                .when(photoService).deletePhotoByAdmin(999L);

        assertThatThrownBy(() -> adminController.deletePhoto(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Photo not found");

        verify(photoService).deletePhotoByAdmin(999L);
    }
}
