package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuildingRepository extends JpaRepository<Building, Long> {

    List<Building> findByLandlord(User landlord);

    List<Building> findByManager(User manager);

    List<Building> findByActiveTrue();

    List<Building> findByLandlordOrderByIdDesc(User landlord);

    List<Building> findByManagerOrderByIdDesc(User manager);
}
