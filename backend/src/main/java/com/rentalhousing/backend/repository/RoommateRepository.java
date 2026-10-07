package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.Roommate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoommateRepository extends JpaRepository<Roommate, Long> {

    List<Roommate> findByContractOrderByIdAsc(Contract contract);

    long countByContractAndMoveOutDateIsNull(Contract contract);

    List<Roommate> findByContract(Contract contract);
}
