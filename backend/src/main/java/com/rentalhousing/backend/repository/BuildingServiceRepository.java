package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.BuildingService;
import com.rentalhousing.backend.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BuildingServiceRepository extends JpaRepository<BuildingService, Long> {

    List<BuildingService> findByBuilding(Building building);

    List<BuildingService> findByBuildingAndServiceOrderByEffectiveFromDesc(Building building, Service service);

    Optional<BuildingService> findFirstByBuildingAndServiceAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
            Building building, Service service, LocalDate date);
}
