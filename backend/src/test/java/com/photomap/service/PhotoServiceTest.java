package com.photomap.service;

import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.RatingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class PhotoServiceTest {

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private RatingRepository ratingRepository;

    @InjectMocks
    private PhotoService photoService;

    @TempDir
    Path tempDir;

    private User testUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(photoService, "originalDirectory", tempDir.resolve("original").toString());
        ReflectionTestUtils.setField(photoService, "mediumDirectory", tempDir.resolve("medium").toString());

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
    }

    @Test
    void getPhotos_ReturnsPaginatedList() {
        final List<Photo> photos = new ArrayList<>();
        photos.add(createTestPhoto(1L));
        photos.add(createTestPhoto(2L));

        final Page<Photo> photoPage = new PageImpl<>(photos);
        final Pageable pageable = PageRequest.of(0, 20);

        when(photoRepository.findAll(nullable(Specification.class), eq(pageable))).thenReturn(photoPage);

        final Page<Photo> result = photoService.getPhotos(testUser.getId(), pageable, null, null, null, null);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        verify(photoRepository, times(1)).findAll(nullable(Specification.class), eq(pageable));
    }

    @Test
    void getPhotos_WithFilters_AppliesSpecifications() {
        final List<Photo> photos = new ArrayList<>();
        photos.add(createTestPhoto(1L));

        final Page<Photo> photoPage = new PageImpl<>(photos);
        final Pageable pageable = PageRequest.of(0, 20);

        when(photoRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(photoPage);

        final Page<Photo> result = photoService.getPhotos(
                testUser.getId(), 
                pageable, 
                java.time.LocalDateTime.now().minusDays(7), 
                java.time.LocalDateTime.now(), 
                3, 
                true
        );

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(photoRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void getPhotoById_Found_ReturnsPhoto() {
        final Photo photo = createTestPhoto(1L);
        photo.setUser(testUser);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        final Optional<Photo> result = photoService.getPhotoById(1L, testUser.getId());

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getPhotoById_NotFound_ReturnsEmpty() {
        when(photoRepository.findById(1L)).thenReturn(Optional.empty());

        final Optional<Photo> result = photoService.getPhotoById(1L, testUser.getId());

        assertFalse(result.isPresent());
    }

    @Test
    void deletePhoto_Success() {
        final Photo photo = createTestPhoto(1L);
        photo.setUser(testUser);
        photo.setFilename("test.jpg");

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        assertDoesNotThrow(() -> photoService.deletePhoto(1L, testUser.getId()));

        verify(photoRepository, times(1)).delete(photo);
    }

    @Test
    void deletePhoto_NotOwner_ThrowsException() {
        final User otherUser = new User();
        otherUser.setId(2L);

        final Photo photo = createTestPhoto(1L);
        photo.setUser(otherUser);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        Executable deleteAction = () -> photoService.deletePhoto(1L, testUser.getId());
        assertThrows(IllegalArgumentException.class, deleteAction);

        verify(photoRepository, never()).delete(any(Photo.class));
    }

    @Test
    void ratePhoto_NewRating_Success() {
        final Photo photo = createTestPhoto(1L);
        final User photoOwner = new User();
        photoOwner.setId(2L);
        photo.setUser(photoOwner);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));
        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.empty());

        final Rating savedRating = new Rating();
        savedRating.setId(1L);
        savedRating.setRatingValue(5);
        when(ratingRepository.save(any(Rating.class))).thenReturn(savedRating);

        final Rating result = photoService.ratePhoto(1L, testUser.getId(), 5);

        assertNotNull(result);
        assertEquals(5, result.getRatingValue());
        verify(ratingRepository, times(1)).save(any(Rating.class));
    }

    @Test
    void ratePhoto_UpdateExisting_Success() {
        final Photo photo = createTestPhoto(1L);
        final User photoOwner = new User();
        photoOwner.setId(2L);
        photo.setUser(photoOwner);

        final Rating existingRating = new Rating();
        existingRating.setId(1L);
        existingRating.setRatingValue(3);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));
        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.of(existingRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(existingRating);

        final Rating result = photoService.ratePhoto(1L, testUser.getId(), 5);

        assertNotNull(result);
        assertEquals(5, result.getRatingValue());
        verify(ratingRepository, times(1)).save(existingRating);
    }

    @Test
    void ratePhoto_RatingOutOfRange_ThrowsException() {
        final Photo photo = createTestPhoto(1L);
        final User photoOwner = new User();
        photoOwner.setId(2L);
        photo.setUser(photoOwner);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        Executable rateAction = () -> photoService.ratePhoto(1L, testUser.getId(), 6);
        assertThrows(IllegalArgumentException.class, rateAction);

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void clearRating_Success() {
        final Rating rating = new Rating();
        rating.setId(1L);

        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.of(rating));

        assertDoesNotThrow(() -> photoService.clearRating(1L, testUser.getId()));

        verify(ratingRepository, times(1)).deleteByPhotoIdAndUserId(1L, testUser.getId());
    }

    @Test
    void clearRating_NotFound_ThrowsException() {
        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.empty());

        Executable clearAction = () -> photoService.clearRating(1L, testUser.getId());
        assertThrows(IllegalArgumentException.class, clearAction);

        verify(ratingRepository, never()).deleteByPhotoIdAndUserId(any(), any());
    }

    @Test
    void getPhotosForAdmin_Success() {
        final Pageable pageable = PageRequest.of(0, 20);
        final Photo photo = createTestPhoto(1L);
        final List<Photo> photos = List.of(photo);
        final Page<Photo> photoPage = new PageImpl<>(photos);

        when(photoRepository.findAll(pageable)).thenReturn(photoPage);

        final Page<Photo> result = photoService.getPhotosForAdmin(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(photoRepository, times(1)).findAll(pageable);
    }

    @Test
    void deletePhotoByAdmin_Success() {
        final Photo photo = createTestPhoto(1L);
        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        assertDoesNotThrow(() -> photoService.deletePhotoByAdmin(1L));

        verify(photoRepository, times(1)).delete(photo);
    }

    @Test
    void deletePhotoByAdmin_PhotoNotFound_ThrowsException() {
        when(photoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
            () -> photoService.deletePhotoByAdmin(999L));

        verify(photoRepository, never()).delete(any(Photo.class));
    }

    private Photo createTestPhoto(final Long id) {
        final Photo photo = new Photo();
        photo.setId(id);
        photo.setFilename("test.jpg");
        photo.setOriginalFilename("original.jpg");
        photo.setFileSize(1024L);
        photo.setMimeType("image/jpeg");
        return photo;
    }
}
