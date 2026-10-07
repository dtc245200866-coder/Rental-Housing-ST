package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findByActiveTrueOrderByIdAsc();

    List<Service> findAllByOrderByIdAsc();

    boolean existsByName(String name);

    Optional<Service> findByName(String name);
}
