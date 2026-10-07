package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Listing;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Join;
import java.time.LocalDateTime;

public class ListingSpecification {

    public static Specification<Listing> isPublishedAndActive() {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), Listing.Status.PUBLISHED),
                cb.greaterThan(root.get("expiresAt"), LocalDateTime.now())
        );
    }

    public static Specification<Listing> hasDistrict(String district) {
        if (district == null || district.isBlank()) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Object, Object> room = root.join("room");
            Join<Object, Object> building = room.join("building");
            return cb.equal(cb.lower(building.get("district")), district.toLowerCase());
        };
    }

    public static Specification<Listing> hasRentBetween(Long min, Long max) {
        return (root, query, cb) -> {
            Join<Object, Object> room = root.join("room");
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (min != null) {
                predicates.add(cb.greaterThanOrEqualTo(room.get("rent"), min));
            }
            if (max != null) {
                predicates.add(cb.lessThanOrEqualTo(room.get("rent"), max));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    public static Specification<Listing> hasAreaBetween(Double min, Double max) {
        return (root, query, cb) -> {
            Join<Object, Object> room = root.join("room");
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (min != null) {
                predicates.add(cb.greaterThanOrEqualTo(room.get("area"), min));
            }
            if (max != null) {
                predicates.add(cb.lessThanOrEqualTo(room.get("area"), max));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    public static Specification<Listing> hasMinPeople(Integer minPeople) {
        if (minPeople == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Object, Object> room = root.join("room");
            return cb.greaterThanOrEqualTo(room.get("maxPeople"), minPeople);
        };
    }
}
