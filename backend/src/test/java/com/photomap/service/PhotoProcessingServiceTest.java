package com.photomap.service;

import com.photomap.model.Photo;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
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
    private PhotoRepository photoRepository;

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

    @ParameterizedTest
    @CsvSource({
        "photo.jpg, true",
        "photo.jpeg, true",
        "photo.png, true",
        "photo.JPG, true",
        "photo.gif, false",
        "photo.bmp, false",
        "photo.webp, false",
        "photo.tiff, false"
    })
    void isValidFileExtension_ShouldValidateExtensions(String filename, boolean expected) throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("isValidFileExtension", String.class);
        method.setAccessible(true);

        boolean result = (boolean) method.invoke(photoProcessingService, filename);

        assertEquals(expected, result);
    }

    @ParameterizedTest
    @CsvSource({
        "photo.jpg, .jpg",
        "my.photo.name.png, .png"
    })
    void getFileExtension_ShouldReturnCorrectExtension(String filename, String expectedExtension) throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getFileExtension", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, filename);

        assertEquals(expectedExtension, result);
    }

    @ParameterizedTest
    @CsvSource({
        ".jpg, image/jpeg",
        ".jpeg, image/jpeg",
        ".png, image/png",
        ".unknown, application/octet-stream",
        ".JPG, image/jpeg"
    })
    void getMimeType_ShouldReturnCorrectMimeType(String extension, String expectedMimeType) throws Exception {
        Method method = PhotoProcessingService.class.getDeclaredMethod("getMimeType", String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, extension);

        assertEquals(expectedMimeType, result);
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
    void processPhoto_ShouldProcessValidPhoto_WithoutUser() throws IOException {
        File testImage = createTestImage("test.jpg");

        when(photoRepository.save(any(Photo.class))).thenAnswer(invocation -> {
            Photo photo = invocation.getArgument(0);
            photo.setId(1L);
            return photo;
        });

        photoProcessingService.processPhoto(testImage);

        verify(photoRepository).save(any(Photo.class));
        assertTrue(Files.exists(originalDir.resolve("test.jpg")));
        assertTrue(Files.exists(mediumDir.resolve("test.jpg")));
    }

    @Test
    void processPhoto_ShouldProcessValidPhoto_WithUser() throws IOException {
        User testUser = new User();
        testUser.setId(123L);
        testUser.setEmail("test@example.com");

        File testImage = createTestImage("123_photo.jpg");

        when(userRepository.findById(123L)).thenReturn(Optional.of(testUser));
        when(photoRepository.save(any(Photo.class))).thenAnswer(invocation -> {
            Photo photo = invocation.getArgument(0);
            photo.setId(1L);
            return photo;
        });

        photoProcessingService.processPhoto(testImage);

        verify(userRepository).findById(123L);
        verify(photoRepository).save(argThat(photo ->
                photo.getUser() != null && photo.getUser().getId().equals(123L)
        ));
        assertTrue(Files.exists(originalDir.resolve("123_photo.jpg")));
        assertTrue(Files.exists(mediumDir.resolve("123_photo.jpg")));
    }

    @Test
    void moveToDirectory_ShouldMoveFile() throws Exception {
        File testFile = inputDir.resolve("test.txt").toFile();
        Files.write(testFile.toPath(), "test content".getBytes());

        Method method = PhotoProcessingService.class.getDeclaredMethod("moveToDirectory", File.class, String.class, String.class);
        method.setAccessible(true);

        Path result = (Path) method.invoke(photoProcessingService, testFile, originalDir.toString(), "moved.txt");

        assertNotNull(result);
        assertTrue(Files.exists(originalDir.resolve("moved.txt")));
        assertFalse(Files.exists(testFile.toPath()));
    }

    @Test
    void generateThumbnail_ShouldCreateThumbnail() throws Exception {
        File testImage = createTestImage("original.jpg");
        Files.copy(testImage.toPath(), originalDir.resolve("original.jpg"));
        File originalFile = originalDir.resolve("original.jpg").toFile();

        Method method = PhotoProcessingService.class.getDeclaredMethod("generateThumbnail", File.class, String.class, String.class, String.class, int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(photoProcessingService, originalFile, mediumDir.toString(), "original", ".jpg", 300);

        assertEquals("original.jpg", result);
        assertTrue(Files.exists(mediumDir.resolve("original.jpg")));
    }

    @Test
    void extractExifMetadata_ShouldHandleImageWithoutExif() throws Exception {
        File testImage = createTestImage("no_exif.jpg");
        Photo photo = new Photo();

        Method method = PhotoProcessingService.class.getDeclaredMethod("extractExifMetadata", File.class, Photo.class);
        method.setAccessible(true);

        method.invoke(photoProcessingService, testImage, photo);

        assertNull(photo.getGpsLatitude());
        assertNull(photo.getGpsLongitude());
        assertNull(photo.getTakenAt());
    }

    private File createTestImage(String filename) throws IOException {
        BufferedImage image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        File imageFile = inputDir.resolve(filename).toFile();
        ImageIO.write(image, "jpg", imageFile);
        return imageFile;
    }

}
