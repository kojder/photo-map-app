package com.photomap.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Photo Entity - JPA entity with User relationship
 *
 * Best Practices Demonstrated:
 * - Lombok annotations (@Getter, @Setter, @Builder)
 * - Indexes on frequently queried columns
 * - FetchType.LAZY for relationships (performance)
 * - @PrePersist for createdAt timestamp
 * - Proper field types (DECIMAL for coordinates)
 */
@Entity
@Table(name = "photos", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_taken_at", columnList = "taken_at"),
    @Index(name = "idx_rating", columnList = "rating")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many photos belong to one user (LAZY loading for performance)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private String originalPath;

    @Column(nullable = false)
    private String thumbnailSmallPath;

    @Column(nullable = false)
    private String thumbnailMediumPath;

    @Column(nullable = false)
    private String thumbnailLargePath;

    // GPS coordinates (DECIMAL for precision)
    @Column(precision = 10, scale = 7)
    private Double latitude;

    @Column(precision = 10, scale = 7)
    private Double longitude;

    // Rating (1-10 stars, nullable)
    @Column
    private Integer rating;

    // Date photo was taken (from EXIF)
    @Column
    private LocalDateTime takenAt;

    // Image dimensions
    @Column
    private Integer width;

    @Column
    private Integer height;

    // Audit timestamps
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Lifecycle hook - sets createdAt before persisting
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
