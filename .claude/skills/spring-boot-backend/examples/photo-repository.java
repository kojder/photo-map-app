package com.photomap.repository;

import com.photomap.model.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Photo Repository - Data Access Layer
 *
 * Spring Data JPA repository with:
 * - Derived query methods (auto-generated)
 * - Custom JPQL queries
 * - User scoping enforcement
 */
@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // ========================================
    // Derived Query Methods
    // ========================================

    /**
     * Find all photos for user, sorted by takenAt DESC.
     * User scoping enforced.
     */
    List<Photo> findByUserIdOrderByTakenAtDesc(Long userId);

    /**
     * Find photo by ID with user scoping.
     * Returns empty Optional if photo doesn't belong to user.
     *
     * CRITICAL: Always use this for photo access (user scoping!)
     */
    Optional<Photo> findByIdAndUserId(Long id, Long userId);

    /**
     * Find photos by rating for user.
     */
    List<Photo> findByUserIdAndRating(Long userId, Integer rating);

    /**
     * Find photos within date range for user.
     */
    List<Photo> findByUserIdAndTakenAtBetween(
        Long userId,
        LocalDateTime startDate,
        LocalDateTime endDate
    );

    // ========================================
    // Custom JPQL Queries
    // ========================================

    /**
     * Find photos with GPS coordinates (latitude & longitude not null).
     * User scoping enforced.
     */
    @Query("SELECT p FROM Photo p WHERE p.user.id = :userId " +
           "AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
    List<Photo> findPhotosWithGps(@Param("userId") Long userId);

    /**
     * Find photos with minimum rating.
     * User scoping enforced, sorted by takenAt DESC.
     */
    @Query("SELECT p FROM Photo p WHERE p.user.id = :userId " +
           "AND p.rating >= :minRating ORDER BY p.takenAt DESC")
    List<Photo> findPhotosByMinRating(
        @Param("userId") Long userId,
        @Param("minRating") Integer minRating
    );

    // ========================================
    // Native SQL Queries
    // ========================================

    /**
     * Find photos by user and min rating (native SQL).
     * Use only when JPQL is insufficient.
     */
    @Query(value = "SELECT * FROM photos WHERE user_id = :userId " +
                   "AND rating >= :minRating ORDER BY taken_at DESC",
           nativeQuery = true)
    List<Photo> findPhotosByUserAndMinRatingNative(
        @Param("userId") Long userId,
        @Param("minRating") Integer minRating
    );

    // ========================================
    // Count & Exists Queries
    // ========================================

    /**
     * Count photos for user.
     */
    long countByUserId(Long userId);

    /**
     * Count photos with GPS for user.
     */
    @Query("SELECT COUNT(p) FROM Photo p WHERE p.user.id = :userId " +
           "AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL")
    long countPhotosWithGps(@Param("userId") Long userId);

    /**
     * Check if photo exists and belongs to user.
     * Useful for ownership validation.
     */
    boolean existsByIdAndUserId(Long id, Long userId);

    // ========================================
    // Delete Queries
    // ========================================

    /**
     * Delete photo by ID with user scoping.
     * User can only delete their own photos.
     */
    void deleteByIdAndUserId(Long id, Long userId);
}
