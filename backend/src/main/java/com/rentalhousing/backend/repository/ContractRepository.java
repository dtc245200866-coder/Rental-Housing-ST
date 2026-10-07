package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByTenantOrderByCreatedAtDesc(User tenant);

    List<Contract> findByRoomOrderByCreatedAtDesc(Room room);

    Optional<Contract> findFirstByRoomAndStatusOrderByCreatedAtDesc(Room room, Contract.Status status);

    boolean existsByRoomAndStatus(Room room, Contract.Status status);

    long countByCodeStartingWith(String prefix);

    List<Contract> findByStatus(Contract.Status status);

    List<Contract> findByRoom_BuildingIdOrderByCreatedAtDesc(Long buildingId);
}
