package com.photomap.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "photos", indexes = {
    @Index(name = "photos_gps_idx", columnList = "gps_latitude, gps_longitude"),
    @Index(name = "photos_taken_at_idx", columnList = "taken_at"),
    @Index(name = "photos_uploaded_at_idx", columnList = "uploaded_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 500)
    private String filename;

    @Column(name = "original_filename", nullable = false, length = 500)
    private String originalFilename;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "thumbnail_filename", length = 500)
    private String thumbnailFilename;

    @Column(name = "gps_latitude", precision = 10, scale = 8)
    private BigDecimal gpsLatitude;

    @Column(name = "gps_longitude", precision = 11, scale = 8)
    private BigDecimal gpsLongitude;

    @Column(name = "taken_at")
    private Instant takenAt;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "photo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Rating> ratings = new ArrayList<>();
}
