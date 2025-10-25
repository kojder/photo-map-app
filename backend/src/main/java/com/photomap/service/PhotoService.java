package com.photomap.service;

import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.PhotoSpecification;
import com.photomap.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final RatingRepository ratingRepository;

    @Value("${photo.upload.directory.original}")
    private String originalDirectory;

    @Value("${photo.upload.directory.small}")
    private String smallDirectory;

    @Value("${photo.upload.directory.medium}")
    private String mediumDirectory;

    @Value("${photo.upload.directory.large}")
    private String largeDirectory;


    @Transactional(readOnly = true)
    public Page<Photo> getPhotos(final Long userId, final Pageable pageable, final LocalDateTime dateFrom, final LocalDateTime dateTo, final Integer minRating, final Boolean hasGps) {
        Specification<Photo> spec = null;

        if (dateFrom != null) {
            spec = spec == null ? PhotoSpecification.takenAfter(dateFrom) : spec.and(PhotoSpecification.takenAfter(dateFrom));
        }

        if (dateTo != null) {
            spec = spec == null ? PhotoSpecification.takenBefore(dateTo) : spec.and(PhotoSpecification.takenBefore(dateTo));
        }

        if (minRating != null) {
            spec = spec == null ? PhotoSpecification.hasMinRating(minRating) : spec.and(PhotoSpecification.hasMinRating(minRating));
        }

        if (hasGps != null) {
            spec = spec == null ? PhotoSpecification.hasGps(hasGps) : spec.and(PhotoSpecification.hasGps(hasGps));
        }

        return spec != null ? photoRepository.findAll(spec, pageable) : photoRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Photo> getPhotoById(final Long photoId, final Long userId) {
        return photoRepository.findById(photoId);
    }

    @Transactional
    public void deletePhoto(final Long photoId, final Long userId) throws IOException {
        final Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (!photo.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("User does not own this photo");
        }

        deletePhotoFiles(photo);
        photoRepository.delete(photo);
        log.info("Photo deleted: id={}, filename={}", photoId, photo.getFilename());
    }

    @Transactional
    public Rating ratePhoto(final Long photoId, final Long userId, final Integer ratingValue) {
        final Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (ratingValue < 1 || ratingValue > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        final Optional<Rating> existingRating = ratingRepository.findByPhotoIdAndUserId(photoId, userId);

        if (existingRating.isPresent()) {
            final Rating rating = existingRating.get();
            rating.setRating(ratingValue);
            return ratingRepository.save(rating);
        } else {
            final Rating newRating = new Rating();
            newRating.setPhoto(photo);
            newRating.setUser(new User());
            newRating.getUser().setId(userId);
            newRating.setRating(ratingValue);
            return ratingRepository.save(newRating);
        }
    }

    @Transactional
    public void clearRating(final Long photoId, final Long userId) {
        ratingRepository.findByPhotoIdAndUserId(photoId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));

        ratingRepository.deleteByPhotoIdAndUserId(photoId, userId);
        log.info("Rating cleared: photoId={}, userId={}", photoId, userId);
    }


    private void deletePhotoFiles(final Photo photo) throws IOException {
        final Path originalPath = Paths.get(originalDirectory, photo.getFilename());
        Files.deleteIfExists(originalPath);
        log.info("Deleted original: {}", originalPath);

        if (photo.getThumbnailFilename() != null) {
            final String filename = photo.getThumbnailFilename();

            final Path smallPath = Paths.get(smallDirectory, filename);
            Files.deleteIfExists(smallPath);
            log.info("Deleted small thumbnail: {}", smallPath);

            final Path mediumPath = Paths.get(mediumDirectory, filename);
            Files.deleteIfExists(mediumPath);
            log.info("Deleted medium thumbnail: {}", mediumPath);

            final Path largePath = Paths.get(largeDirectory, filename);
            Files.deleteIfExists(largePath);
            log.info("Deleted large thumbnail: {}", largePath);
        }
    }

    private String getFileExtension(final String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
