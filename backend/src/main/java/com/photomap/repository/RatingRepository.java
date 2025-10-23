package com.photomap.repository;

import com.photomap.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByPhotoId(Long photoId);

    List<Rating> findByUserId(Long userId);

    Optional<Rating> findByPhotoIdAndUserId(Long photoId, Long userId);

    void deleteByPhotoIdAndUserId(Long photoId, Long userId);
}
