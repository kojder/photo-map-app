package com.photomap.repository;

import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.Role;
import com.photomap.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class PhotoSpecificationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private RatingRepository ratingRepository;

    private User testUser;
    private Photo photoWithGps;
    private Photo photoWithoutGps;
    private Photo oldPhoto;
    private Photo recentPhoto;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("hash");
        testUser.setRole(Role.USER);
        testUser = entityManager.persist(testUser);

        // Photo with GPS coordinates
        photoWithGps = new Photo();
        photoWithGps.setFilename("with-gps.jpg");
        photoWithGps.setOriginalFilename("original-with-gps.jpg");
        photoWithGps.setFileSize(1024L);
        photoWithGps.setMimeType("image/jpeg");
        photoWithGps.setGpsLatitude(BigDecimal.valueOf(52.2297));
        photoWithGps.setGpsLongitude(BigDecimal.valueOf(21.0122));
        photoWithGps.setTakenAt(LocalDateTime.now().minusDays(3).atZone(ZoneId.systemDefault()).toInstant());
        photoWithGps.setUser(testUser);
        photoWithGps = entityManager.persist(photoWithGps);

        // Photo without GPS
        photoWithoutGps = new Photo();
        photoWithoutGps.setFilename("without-gps.jpg");
        photoWithoutGps.setOriginalFilename("original-without-gps.jpg");
        photoWithoutGps.setFileSize(2048L);
        photoWithoutGps.setMimeType("image/jpeg");
        photoWithoutGps.setTakenAt(LocalDateTime.now().minusDays(2).atZone(ZoneId.systemDefault()).toInstant());
        photoWithoutGps.setUser(testUser);
        photoWithoutGps = entityManager.persist(photoWithoutGps);

        // Old photo
        oldPhoto = new Photo();
        oldPhoto.setFilename("old.jpg");
        oldPhoto.setOriginalFilename("original-old.jpg");
        oldPhoto.setFileSize(512L);
        oldPhoto.setMimeType("image/jpeg");
        oldPhoto.setGpsLatitude(BigDecimal.valueOf(50.0647));
        oldPhoto.setGpsLongitude(BigDecimal.valueOf(19.9450));
        oldPhoto.setTakenAt(LocalDateTime.now().minusDays(30).atZone(ZoneId.systemDefault()).toInstant());
        oldPhoto.setUser(testUser);
        oldPhoto = entityManager.persist(oldPhoto);

        // Recent photo
        recentPhoto = new Photo();
        recentPhoto.setFilename("recent.jpg");
        recentPhoto.setOriginalFilename("original-recent.jpg");
        recentPhoto.setFileSize(1536L);
        recentPhoto.setMimeType("image/jpeg");
        recentPhoto.setGpsLatitude(BigDecimal.valueOf(51.1079));
        recentPhoto.setGpsLongitude(BigDecimal.valueOf(17.0385));
        recentPhoto.setTakenAt(LocalDateTime.now().minusDays(1).atZone(ZoneId.systemDefault()).toInstant());
        recentPhoto.setUser(testUser);
        recentPhoto = entityManager.persist(recentPhoto);

        entityManager.flush();
    }

    @Test
    void hasGps_True_ReturnsOnlyPhotosWithGps() {
        final Specification<Photo> spec = PhotoSpecification.hasGps(true);

        final List<Photo> result = photoRepository.findAll(spec);

        assertEquals(3, result.size());
        assertTrue(result.stream().allMatch(p -> 
            p.getGpsLatitude() != null && p.getGpsLongitude() != null
        ));
    }

    @Test
    void hasGps_False_ReturnsOnlyPhotosWithoutGps() {
        final Specification<Photo> spec = PhotoSpecification.hasGps(false);

        final List<Photo> result = photoRepository.findAll(spec);

        assertEquals(1, result.size());
        assertTrue(result.stream().allMatch(p -> 
            p.getGpsLatitude() == null || p.getGpsLongitude() == null
        ));
    }

    @Test
    void hasGps_Null_ReturnsAllPhotos() {
        final Specification<Photo> spec = PhotoSpecification.hasGps(null);

        final List<Photo> result = photoRepository.findAll(spec);

        assertEquals(4, result.size());
    }

    @Test
    void takenAfter_ReturnsPhotosAfterDate() {
        final LocalDateTime cutoffDate = LocalDateTime.now().minusDays(5);
        final Specification<Photo> spec = PhotoSpecification.takenAfter(cutoffDate);

        final List<Photo> result = photoRepository.findAll(spec);

        assertEquals(3, result.size());
        final Instant cutoffInstant = cutoffDate.atZone(ZoneId.systemDefault()).toInstant();
        assertTrue(result.stream().allMatch(p -> 
            !p.getTakenAt().isBefore(cutoffInstant)
        ));
    }

    @Test
    void takenBefore_ReturnsPhotosBeforeDate() {
        final LocalDateTime cutoffDate = LocalDateTime.now().minusDays(2);
        final Specification<Photo> spec = PhotoSpecification.takenBefore(cutoffDate);

        final List<Photo> result = photoRepository.findAll(spec);

        // Should include photos taken 2+ days ago (old photo and possibly photoWithoutGps if taken at same time)
        assertTrue(result.size() >= 1);
        assertTrue(result.stream().anyMatch(p -> p.getId().equals(oldPhoto.getId())));
    }

    @Test
    void hasMinRating_ReturnsPhotosWithSufficientRating() {
        // Add ratings to photos
        final User rater1 = new User();
        rater1.setEmail("rater1@example.com");
        rater1.setPasswordHash("hash");
        rater1.setRole(Role.USER);
        entityManager.persist(rater1);

        final User rater2 = new User();
        rater2.setEmail("rater2@example.com");
        rater2.setPasswordHash("hash");
        rater2.setRole(Role.USER);
        entityManager.persist(rater2);

        // Photo with high rating (5)
        final Rating rating1 = new Rating();
        rating1.setPhoto(photoWithGps);
        rating1.setUser(rater1);
        rating1.setRating(5);
        entityManager.persist(rating1);

        // Photo with medium rating (3)
        final Rating rating2 = new Rating();
        rating2.setPhoto(recentPhoto);
        rating2.setUser(rater1);
        rating2.setRating(3);
        entityManager.persist(rating2);

        // Photo with low rating (2)
        final Rating rating3 = new Rating();
        rating3.setPhoto(oldPhoto);
        rating3.setUser(rater1);
        rating3.setRating(2);
        entityManager.persist(rating3);

        entityManager.flush();

        final Specification<Photo> spec = PhotoSpecification.hasMinRating(4);

        final List<Photo> result = photoRepository.findAll(spec);

        assertEquals(1, result.size());
        assertEquals(photoWithGps.getId(), result.get(0).getId());
    }

    @Test
    void combinedSpecifications_FiltersCorrectly() {
        // Add a rating to recentPhoto
        final User rater = new User();
        rater.setEmail("rater@example.com");
        rater.setPasswordHash("hash");
        rater.setRole(Role.USER);
        entityManager.persist(rater);

        final Rating rating = new Rating();
        rating.setPhoto(recentPhoto);
        rating.setUser(rater);
        rating.setRating(5);
        entityManager.persist(rating);

        entityManager.flush();

        // Combine: has GPS AND taken after 5 days ago AND min rating 4
        final Specification<Photo> spec = PhotoSpecification.hasGps(true)
                .and(PhotoSpecification.takenAfter(LocalDateTime.now().minusDays(5)))
                .and(PhotoSpecification.hasMinRating(4));

        final List<Photo> result = photoRepository.findAll(spec);

        assertEquals(1, result.size());
        assertEquals(recentPhoto.getId(), result.get(0).getId());
    }
}
