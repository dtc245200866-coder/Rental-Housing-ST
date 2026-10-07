package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.RentalRequest;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {

    List<RentalRequest> findByTenantOrderByCreatedAtDesc(User tenant);

    List<RentalRequest> findByListingOrderByCreatedAtDesc(Listing listing);

    List<RentalRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(RentalRequest.Status status);

    boolean existsByListingAndTenantAndStatusIn(Listing listing, User tenant, List<RentalRequest.Status> statuses);

    long countByRequestCodeStartingWith(String prefix);

    List<RentalRequest> findByListing_Room_BuildingIdOrderByCreatedAtDesc(Long buildingId);
}
