package com.photomap.controller;

import com.photomap.dto.AppSettingsResponse;
import com.photomap.dto.BulkDeleteResponse;
import com.photomap.dto.OrphanedPhotoDTO;
import com.photomap.dto.UpdatePermissionsRequest;
import com.photomap.dto.UpdateSettingsRequest;
import com.photomap.dto.UserResponse;
import com.photomap.dto.UserSummaryDTO;
import com.photomap.model.Photo;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.service.PhotoService;
import com.photomap.service.SettingsService;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private PhotoService photoService;

    @Mock
    private SettingsService settingsService;

    @Mock
    private PhotoRepository photoRepository;

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

    @Test
    void updateUserPermissions_Success_UpdatesPermissions() {
        final UpdatePermissionsRequest request = new UpdatePermissionsRequest(true, false);
        final UserResponse userResponse = new UserResponse(
                regularUser.getId(),
                regularUser.getEmail(),
                regularUser.getRole(),
                regularUser.getCreatedAt(),
                true,
                false
        );

        when(userService.updateUserPermissions(2L, request)).thenReturn(userResponse);

        final ResponseEntity<UserResponse> response = adminController.updateUserPermissions(2L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().canViewPhotos()).isTrue();
        assertThat(response.getBody().canRate()).isFalse();
        verify(userService).updateUserPermissions(2L, request);
    }

    @Test
    void getSettings_Success_ReturnsSettings() {
        when(settingsService.getSetting("admin_contact_email")).thenReturn("admin@test.com");

        final ResponseEntity<AppSettingsResponse> response = adminController.getSettings();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().adminContactEmail()).isEqualTo("admin@test.com");
        verify(settingsService).getSetting("admin_contact_email");
    }

    @Test
    void updateSettings_Success_UpdatesSettings() {
        final UpdateSettingsRequest request = new UpdateSettingsRequest("newemail@test.com");
        doNothing().when(settingsService).updateSetting("admin_contact_email", "newemail@test.com");

        final ResponseEntity<AppSettingsResponse> response = adminController.updateSettings(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().adminContactEmail()).isEqualTo("newemail@test.com");
        verify(settingsService).updateSetting("admin_contact_email", "newemail@test.com");
    }

    @Test
    void listAllPhotos_WithAscSort_SortsCorrectly() {
        final List<Photo> photos = List.of(photo1);
        final Page<Photo> photoPage = new PageImpl<>(photos);

        when(photoService.getPhotosForAdmin(any(Pageable.class))).thenReturn(photoPage);

        final ResponseEntity<?> response = adminController.listAllPhotos(0, 20, "uploadedAt,asc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(photoService).getPhotosForAdmin(any(Pageable.class));
    }

    @Test
    void getInactiveUsers_Success_ReturnsInactiveUsers() {
        final User inactiveUser1 = new User();
        inactiveUser1.setId(3L);
        inactiveUser1.setEmail("inactive_123456789_3@deleted.local");
        inactiveUser1.setRole(Role.USER);
        inactiveUser1.setActive(false);
        inactiveUser1.setCreatedAt(Instant.now());
        inactiveUser1.setUpdatedAt(Instant.now());

        when(userService.getInactiveUsers()).thenReturn(List.of(inactiveUser1));

        final ResponseEntity<List<UserSummaryDTO>> response = adminController.getInactiveUsers();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).email()).isEqualTo("inactive_123456789_3@deleted.local");
        assertThat(response.getBody().get(0).isActive()).isFalse();
        verify(userService).getInactiveUsers();
    }

    @Test
    void getOrphanedPhotos_Success_ReturnsOrphanedPhotos() {
        final Photo orphanedPhoto = new Photo();
        orphanedPhoto.setId(100L);
        orphanedPhoto.setFilename("orphaned.jpg");
        orphanedPhoto.setOriginalFilename("original_orphaned.jpg");
        orphanedPhoto.setFileSize(5000L);
        orphanedPhoto.setUploadedAt(Instant.now());
        orphanedPhoto.setUser(null);

        final Page<Photo> orphanedPage = new PageImpl<>(List.of(orphanedPhoto));
        when(photoRepository.findByUserIdIsNull(any(Pageable.class))).thenReturn(orphanedPage);

        final ResponseEntity<Page<OrphanedPhotoDTO>> response = adminController.getOrphanedPhotos(0, 20);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).filename()).isEqualTo("orphaned.jpg");
        verify(photoRepository).findByUserIdIsNull(any(Pageable.class));
    }

    @Test
    void deleteOrphanedPhotos_Success_DeletesAllOrphanedPhotos() throws Exception {
        final Photo orphanedPhoto1 = new Photo();
        orphanedPhoto1.setId(101L);
        orphanedPhoto1.setUser(null);

        final Photo orphanedPhoto2 = new Photo();
        orphanedPhoto2.setId(102L);
        orphanedPhoto2.setUser(null);

        when(photoRepository.findByUserIdIsNull()).thenReturn(List.of(orphanedPhoto1, orphanedPhoto2));
        doNothing().when(photoService).deletePhotoByAdmin(anyLong());

        final ResponseEntity<BulkDeleteResponse> response = adminController.deleteOrphanedPhotos();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().deletedCount()).isEqualTo(2);
        assertThat(response.getBody().totalCount()).isEqualTo(2);
        verify(photoRepository).findByUserIdIsNull();
        verify(photoService, times(2)).deletePhotoByAdmin(anyLong());
    }

    @Test
    void deleteOrphanedPhotos_PartialFailure_ReturnsPartialCount() throws Exception {
        final Photo orphanedPhoto1 = new Photo();
        orphanedPhoto1.setId(101L);
        orphanedPhoto1.setUser(null);

        final Photo orphanedPhoto2 = new Photo();
        orphanedPhoto2.setId(102L);
        orphanedPhoto2.setUser(null);

        when(photoRepository.findByUserIdIsNull()).thenReturn(List.of(orphanedPhoto1, orphanedPhoto2));
        doNothing().when(photoService).deletePhotoByAdmin(101L);
        doThrow(new RuntimeException("Delete failed")).when(photoService).deletePhotoByAdmin(102L);

        final ResponseEntity<BulkDeleteResponse> response = adminController.deleteOrphanedPhotos();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().deletedCount()).isEqualTo(1);
        assertThat(response.getBody().totalCount()).isEqualTo(2);
        verify(photoRepository).findByUserIdIsNull();
        verify(photoService, times(2)).deletePhotoByAdmin(anyLong());
    }
}
