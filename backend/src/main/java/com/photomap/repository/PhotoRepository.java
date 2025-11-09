package com.photomap.repository;

import com.photomap.model.Photo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long>, JpaSpecificationExecutor<Photo> {

    List<Photo> findByUserId(Long userId);

    List<Photo> findByUserIdOrderByUploadedAtDesc(Long userId);

    Long countByUserId(Long userId);

    Page<Photo> findByUserIdIsNull(Pageable pageable);

    List<Photo> findByUserIdIsNull();
}
