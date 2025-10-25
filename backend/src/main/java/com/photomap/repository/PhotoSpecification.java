package com.photomap.repository;

import com.photomap.model.Photo;
import com.photomap.model.Rating;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

public class PhotoSpecification {

    public static Specification<Photo> hasMinRating(final Integer minRating) {
        return (root, query, criteriaBuilder) -> {
            if (minRating == null) {
                return criteriaBuilder.conjunction();
            }

            // Join with ratings table
            final Subquery<Double> ratingSubquery = query.subquery(Double.class);
            final Root<Rating> ratingRoot = ratingSubquery.from(Rating.class);
            ratingSubquery.select(criteriaBuilder.avg(ratingRoot.get("rating")))
                    .where(criteriaBuilder.equal(ratingRoot.get("photo").get("id"), root.get("id")));

            // Return photos with average rating >= minRating
            return criteriaBuilder.greaterThanOrEqualTo(ratingSubquery, minRating.doubleValue());
        };
    }

    public static Specification<Photo> takenAfter(final LocalDateTime dateFrom) {
        return (root, query, criteriaBuilder) -> {
            if (dateFrom == null) {
                return criteriaBuilder.conjunction();
            }
            final Instant instant = dateFrom.atZone(ZoneId.systemDefault()).toInstant();
            return criteriaBuilder.greaterThanOrEqualTo(root.get("takenAt"), instant);
        };
    }

    public static Specification<Photo> takenBefore(final LocalDateTime dateTo) {
        return (root, query, criteriaBuilder) -> {
            if (dateTo == null) {
                return criteriaBuilder.conjunction();
            }
            // Add 1 day to include the entire end date
            final LocalDateTime endOfDay = dateTo.plusDays(1);
            final Instant instant = endOfDay.atZone(ZoneId.systemDefault()).toInstant();
            return criteriaBuilder.lessThan(root.get("takenAt"), instant);
        };
    }

    public static Specification<Photo> hasGps(final Boolean hasGps) {
        return (root, query, criteriaBuilder) -> {
            if (hasGps == null) {
                return criteriaBuilder.conjunction();
            }
            if (hasGps) {
                return criteriaBuilder.and(
                        criteriaBuilder.isNotNull(root.get("gpsLatitude")),
                        criteriaBuilder.isNotNull(root.get("gpsLongitude"))
                );
            } else {
                return criteriaBuilder.or(
                        criteriaBuilder.isNull(root.get("gpsLatitude")),
                        criteriaBuilder.isNull(root.get("gpsLongitude"))
                );
            }
        };
    }
}
