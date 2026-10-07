package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    List<Listing> findByStatusAndExpiresAtAfter(Listing.Status status, LocalDateTime now);

    Optional<Listing> findFirstByRoomAndStatusOrderByCreatedAtDesc(Room room, Listing.Status status);

    List<Listing> findByRoomOrderByCreatedAtDesc(Room room);

    boolean existsByRoomAndStatus(Room room, Listing.Status status);

    List<Listing> findByStatusOrderByCreatedAtDesc(Listing.Status status);
}
