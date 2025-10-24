package com.photomap.service;

import com.photomap.model.Photo;
import com.photomap.model.Rating;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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


    public Page<Photo> getPhotos(Long userId, Pageable pageable) {
        return photoRepository.findAll(pageable);
    }

    public Optional<Photo> getPhotoById(Long photoId, Long userId) {
        return photoRepository.findById(photoId)
                .filter(photo -> photo.getUser().getId().equals(userId));
    }

    @Transactional
    public void deletePhoto(Long photoId, Long userId) throws IOException {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (!photo.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("User does not own this photo");
        }

        deletePhotoFiles(photo);
        photoRepository.delete(photo);
        log.info("Photo deleted: id={}, filename={}", photoId, photo.getFilename());
    }

    @Transactional
    public Rating ratePhoto(Long photoId, Long userId, Integer ratingValue) {
        Photo photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found"));

        if (photo.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Cannot rate own photo");
        }

        if (ratingValue < 1 || ratingValue > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Optional<Rating> existingRating = ratingRepository.findByPhotoIdAndUserId(photoId, userId);

        if (existingRating.isPresent()) {
            Rating rating = existingRating.get();
            rating.setRating(ratingValue);
            return ratingRepository.save(rating);
        } else {
            Rating newRating = new Rating();
            newRating.setPhoto(photo);
            newRating.setUser(new User());
            newRating.getUser().setId(userId);
            newRating.setRating(ratingValue);
            return ratingRepository.save(newRating);
        }
    }

    @Transactional
    public void clearRating(Long photoId, Long userId) {
        ratingRepository.findByPhotoIdAndUserId(photoId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));

        ratingRepository.deleteByPhotoIdAndUserId(photoId, userId);
        log.info("Rating cleared: photoId={}, userId={}", photoId, userId);
    }


    private void deletePhotoFiles(Photo photo) throws IOException {
        Path originalPath = Paths.get(originalDirectory, photo.getFilename());
        Files.deleteIfExists(originalPath);
        log.info("Deleted original: {}", originalPath);

        if (photo.getThumbnailFilename() != null) {
            String filename = photo.getThumbnailFilename();

            Path smallPath = Paths.get(smallDirectory, filename);
            Files.deleteIfExists(smallPath);
            log.info("Deleted small thumbnail: {}", smallPath);

            Path mediumPath = Paths.get(mediumDirectory, filename);
            Files.deleteIfExists(mediumPath);
            log.info("Deleted medium thumbnail: {}", mediumPath);

            Path largePath = Paths.get(largeDirectory, filename);
            Files.deleteIfExists(largePath);
            log.info("Deleted large thumbnail: {}", largePath);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
