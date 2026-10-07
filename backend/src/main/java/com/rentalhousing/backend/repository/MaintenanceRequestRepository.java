package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.MaintenanceRequest;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {

    List<MaintenanceRequest> findByTenantOrderByCreatedAtDesc(User tenant);

    List<MaintenanceRequest> findByRoom_BuildingIdOrderByCreatedAtDesc(Long buildingId);

    List<MaintenanceRequest> findAllByOrderByCreatedAtDesc();

    long countByCodeStartingWith(String prefix);

    long countByStatus(MaintenanceRequest.Status status);
}
