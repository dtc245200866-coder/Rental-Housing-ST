package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.ContractRenewal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractRenewalRepository extends JpaRepository<ContractRenewal, Long> {

    List<ContractRenewal> findByContractOrderByRenewedAtDesc(Contract contract);
}
