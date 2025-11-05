package com.photomap.service;

import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhotoProcessingServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PhotoProcessingService photoProcessingService;

    @TempDir
    Path tempDir;

    private Path inputDir;
    private Path originalDir;
    private Path mediumDir;
    private Path failedDir;

    @BeforeEach
    void setUp() throws IOException {
        inputDir = tempDir.resolve("input");
        originalDir = tempDir.resolve("original");
        mediumDir = tempDir.resolve("medium");
        failedDir = tempDir.resolve("failed");

        Files.createDirectories(inputDir);
        Files.createDirectories(originalDir);
        Files.createDirectories(mediumDir);
        Files.createDirectories(failedDir);

        ReflectionTestUtils.setField(photoProcessingService, "inputDirectory", inputDir.toString());
        ReflectionTestUtils.setField(photoProcessingService, "originalDirectory", originalDir.toString());
        ReflectionTestUtils.setField(photoProcessingService, "mediumDirectory", mediumDir.toString());
        ReflectionTestUtils.setField(photoProcessingService, "failedDirectory", failedDir.toString());
    }

    @Test
    void isValidFileExtension_ShouldReturnTrue_ForJpgExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.jpg");

        assertTrue(result);
    }

    @Test
    void isValidFileExtension_ShouldReturnTrue_ForJpegExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.jpeg");

        assertTrue(result);
    }

    @Test
    void isValidFileExtension_ShouldReturnTrue_ForPngExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.png");

        assertTrue(result);
    }

    @Test
    void isValidFileExtension_ShouldReturnTrue_ForUppercaseExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.JPG");

        assertTrue(result);
    }

    @Test
    void isValidFileExtension_ShouldReturnFalse_ForUnsupportedExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.gif");

        assertFalse(result);
    }

    @Test
    void getFileExtension_ShouldReturnCorrectExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getFileExtension", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, "photo.jpg");

        assertEquals(".jpg", result);
    }

    @Test
    void getFileExtension_ShouldReturnCorrectExtension_ForMultipleDots() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getFileExtension", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, "my.photo.name.png");

        assertEquals(".png", result);
    }

    @Test
    void getMimeType_ShouldReturnImageJpeg_ForJpgExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getMimeType", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, ".jpg");

        assertEquals("image/jpeg", result);
    }

    @Test
    void getMimeType_ShouldReturnImageJpeg_ForJpegExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getMimeType", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, ".jpeg");

        assertEquals("image/jpeg", result);
    }

    @Test
    void getMimeType_ShouldReturnImagePng_ForPngExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getMimeType", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, ".png");

        assertEquals("image/png", result);
    }

    @Test
    void getMimeType_ShouldReturnOctetStream_ForUnknownExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getMimeType", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, ".unknown");

        assertEquals("application/octet-stream", result);
    }

    @Test
    void getMimeType_ShouldBeCaseInsensitive() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getMimeType", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, ".JPG");

        assertEquals("image/jpeg", result);
    }

    @Test
    void extractUserFromFilename_ShouldReturnUser_WhenFilenameHasUserId() throws Exception {
        User testUser = new User();
        testUser.setId(123L);
        testUser.setEmail("test@example.com");

        when(userRepository.findById(123L)).thenReturn(Optional.of(testUser));

        Method method = PhotoProcessingService.class.getDeclaredMethod("extractUserFromFilename", String.class);
        method.setAccessible(true);

        User result = (User) method.invoke(photoProcessingService, "123_photo.jpg");

        assertNotNull(result);
        assertEquals(123L, result.getId());
        assertEquals("test@example.com", result.getEmail());
        verify(userRepository).findById(123L);
    }

    @Test
    void extractUserFromFilename_ShouldReturnNull_WhenUserNotFound() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Method method = PhotoProcessingService.class.getDeclaredMethod("extractUserFromFilename", String.class);
        method.setAccessible(true);

        User result = (User) method.invoke(photoProcessingService, "999_photo.jpg");

        assertNull(result);
        verify(userRepository).findById(999L);
    }

    @Test
    void extractUserFromFilename_ShouldReturnNull_WhenFilenameHasNoUserId() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("extractUserFromFilename", String.class);
        method.setAccessible(true);

        User result = (User) method.invoke(photoProcessingService, "photo.jpg");

        assertNull(result);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void extractUserFromFilename_ShouldReturnNull_WhenFilenameInvalid() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("extractUserFromFilename", String.class);
        method.setAccessible(true);

        User result = (User) method.invoke(photoProcessingService, "abc_photo.jpg");

        assertNull(result);
        verify(userRepository, never()).findById(any());
    }

    @Test
    void processPhoto_ShouldThrowException_WhenFileExtensionInvalid() throws IOException {
        File testFile = inputDir.resolve("test.gif").toFile();
        Files.write(testFile.toPath(), "fake image content".getBytes());

        photoProcessingService.processPhoto(testFile);

        assertTrue(Files.exists(failedDir.resolve("test.gif")));
        assertTrue(Files.exists(failedDir.resolve("test.gif.error.txt")));
    }

    @Test
    void createDirectoryIfNotExists_ShouldCreateDirectory_WhenNotExists() throws Exception {
        Path newDir = tempDir.resolve("newDir");
        assertFalse(Files.exists(newDir));

        Method method = PhotoProcessingService.class.getDeclaredMethod("createDirectoryIfNotExists", String.class);
        method.setAccessible(true);
        method.invoke(photoProcessingService, newDir.toString());

        assertTrue(Files.exists(newDir));
        assertTrue(Files.isDirectory(newDir));
    }

    @Test
    void createDirectoryIfNotExists_ShouldNotFail_WhenDirectoryExists() throws Exception {
        Path existingDir = tempDir.resolve("existing");
        Files.createDirectory(existingDir);
        assertTrue(Files.exists(existingDir));

        Method method = PhotoProcessingService.class.getDeclaredMethod("createDirectoryIfNotExists", String.class);
        method.setAccessible(true);
        method.invoke(photoProcessingService, existingDir.toString());

        assertTrue(Files.exists(existingDir));
    }

    @Test
    void extractUserFromFilename_ShouldReturnNull_WhenFilenameStartsWithZero() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("extractUserFromFilename", String.class);
        method.setAccessible(true);

        User result = (User) method.invoke(photoProcessingService, "0_photo.jpg");

        assertNull(result);
    }

    @Test
    void extractUserFromFilename_ShouldHandleMultipleUnderscores() throws Exception {
        User testUser = new User();
        testUser.setId(456L);

        when(userRepository.findById(456L)).thenReturn(Optional.of(testUser));

        Method method = PhotoProcessingService.class.getDeclaredMethod("extractUserFromFilename", String.class);
        method.setAccessible(true);

        User result = (User) method.invoke(photoProcessingService, "456_my_photo_name.jpg");

        assertNotNull(result);
        assertEquals(456L, result.getId());
        verify(userRepository).findById(456L);
    }

    @Test
    void isValidFileExtension_ShouldReturnFalse_ForBmpExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.bmp");

        assertFalse(result);
    }

    @Test
    void isValidFileExtension_ShouldReturnFalse_ForWebpExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.webp");

        assertFalse(result);
    }

    @Test
    void isValidFileExtension_ShouldReturnFalse_ForTiffExtension() throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, "photo.tiff");

        assertFalse(result);
    }
}
