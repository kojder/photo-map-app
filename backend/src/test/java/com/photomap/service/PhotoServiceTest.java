package com.photomap.service;

import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.RatingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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
        ReflectionTestUtils.setField(photoService, "uploadDirectory", tempDir.toString());

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
    }

    @Test
    void upload_ValidFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        Photo savedPhoto = new Photo();
        savedPhoto.setId(1L);
        when(photoRepository.save(any(Photo.class))).thenReturn(savedPhoto);

        Photo result = photoService.upload(file, testUser);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(photoRepository, times(1)).save(any(Photo.class));
    }

    @Test
    void upload_EmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                new byte[0]
        );

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.upload(emptyFile, testUser);
        });

        verify(photoRepository, never()).save(any(Photo.class));
    }

    @Test
    void upload_FileTooLarge_ThrowsException() {
        byte[] largeContent = new byte[11 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                largeContent
        );

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.upload(largeFile, testUser);
        });

        verify(photoRepository, never()).save(any(Photo.class));
    }

    @Test
    void upload_InvalidMimeType_ThrowsException() {
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "test content".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.upload(invalidFile, testUser);
        });

        verify(photoRepository, never()).save(any(Photo.class));
    }

    @Test
    void getPhotos_ReturnsPaginatedList() {
        List<Photo> photos = new ArrayList<>();
        photos.add(createTestPhoto(1L));
        photos.add(createTestPhoto(2L));

        Page<Photo> photoPage = new PageImpl<>(photos);
        Pageable pageable = PageRequest.of(0, 20);

        when(photoRepository.findAll(pageable)).thenReturn(photoPage);

        Page<Photo> result = photoService.getPhotos(testUser.getId(), pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        verify(photoRepository, times(1)).findAll(pageable);
    }

    @Test
    void getPhotoById_Found_ReturnsPhoto() {
        Photo photo = createTestPhoto(1L);
        photo.setUser(testUser);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        Optional<Photo> result = photoService.getPhotoById(1L, testUser.getId());

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getPhotoById_NotOwner_ReturnsEmpty() {
        User otherUser = new User();
        otherUser.setId(2L);

        Photo photo = createTestPhoto(1L);
        photo.setUser(otherUser);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        Optional<Photo> result = photoService.getPhotoById(1L, testUser.getId());

        assertFalse(result.isPresent());
    }

    @Test
    void deletePhoto_Success() throws IOException {
        Photo photo = createTestPhoto(1L);
        photo.setUser(testUser);
        photo.setFilename("test.jpg");

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        assertDoesNotThrow(() -> photoService.deletePhoto(1L, testUser.getId()));

        verify(photoRepository, times(1)).delete(photo);
    }

    @Test
    void deletePhoto_NotOwner_ThrowsException() {
        User otherUser = new User();
        otherUser.setId(2L);

        Photo photo = createTestPhoto(1L);
        photo.setUser(otherUser);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.deletePhoto(1L, testUser.getId());
        });

        verify(photoRepository, never()).delete(any(Photo.class));
    }

    @Test
    void ratePhoto_NewRating_Success() {
        Photo photo = createTestPhoto(1L);
        User photoOwner = new User();
        photoOwner.setId(2L);
        photo.setUser(photoOwner);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));
        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.empty());

        Rating savedRating = new Rating();
        savedRating.setId(1L);
        savedRating.setRating(5);
        when(ratingRepository.save(any(Rating.class))).thenReturn(savedRating);

        Rating result = photoService.ratePhoto(1L, testUser.getId(), 5);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        verify(ratingRepository, times(1)).save(any(Rating.class));
    }

    @Test
    void ratePhoto_UpdateExisting_Success() {
        Photo photo = createTestPhoto(1L);
        User photoOwner = new User();
        photoOwner.setId(2L);
        photo.setUser(photoOwner);

        Rating existingRating = new Rating();
        existingRating.setId(1L);
        existingRating.setRating(3);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));
        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.of(existingRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(existingRating);

        Rating result = photoService.ratePhoto(1L, testUser.getId(), 5);

        assertNotNull(result);
        assertEquals(5, result.getRating());
        verify(ratingRepository, times(1)).save(existingRating);
    }

    @Test
    void ratePhoto_OwnPhoto_ThrowsException() {
        Photo photo = createTestPhoto(1L);
        photo.setUser(testUser);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.ratePhoto(1L, testUser.getId(), 5);
        });

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void ratePhoto_RatingOutOfRange_ThrowsException() {
        Photo photo = createTestPhoto(1L);
        User photoOwner = new User();
        photoOwner.setId(2L);
        photo.setUser(photoOwner);

        when(photoRepository.findById(1L)).thenReturn(Optional.of(photo));

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.ratePhoto(1L, testUser.getId(), 6);
        });

        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void clearRating_Success() {
        Rating rating = new Rating();
        rating.setId(1L);

        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.of(rating));

        assertDoesNotThrow(() -> photoService.clearRating(1L, testUser.getId()));

        verify(ratingRepository, times(1)).deleteByPhotoIdAndUserId(1L, testUser.getId());
    }

    @Test
    void clearRating_NotFound_ThrowsException() {
        when(ratingRepository.findByPhotoIdAndUserId(1L, testUser.getId())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            photoService.clearRating(1L, testUser.getId());
        });

        verify(ratingRepository, never()).deleteByPhotoIdAndUserId(any(), any());
    }

    private Photo createTestPhoto(Long id) {
        Photo photo = new Photo();
        photo.setId(id);
        photo.setFilename("test.jpg");
        photo.setOriginalFilename("original.jpg");
        photo.setFileSize(1024L);
        photo.setMimeType("image/jpeg");
        return photo;
    }
}
