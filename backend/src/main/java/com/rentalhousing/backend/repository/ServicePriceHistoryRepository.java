package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.ServicePriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ServicePriceHistoryRepository extends JpaRepository<ServicePriceHistory, Long> {

    List<ServicePriceHistory> findByServiceOrderByEffectiveFromDesc(Service service);

    Optional<ServicePriceHistory> findFirstByServiceAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
            Service service, LocalDate date);
}
