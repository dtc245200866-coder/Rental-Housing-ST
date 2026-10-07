package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.RentalRequest;
import com.rentalhousing.backend.entity.RentalRequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalRequestHistoryRepository extends JpaRepository<RentalRequestHistory, Long> {

    List<RentalRequestHistory> findByRequestOrderByCreatedAtAsc(RentalRequest request);
}
