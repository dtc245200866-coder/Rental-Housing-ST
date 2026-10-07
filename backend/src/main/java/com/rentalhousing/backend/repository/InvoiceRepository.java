package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByRoomAndPeriod(Room room, String period);

    boolean existsByRoomAndPeriod(Room room, String period);

    List<Invoice> findByRoomIdOrderByPeriodDesc(Long roomId);

    List<Invoice> findByContractIdOrderByPeriodDesc(Long contractId);

    long countByCodeStartingWith(String prefix);

    List<Invoice> findByPeriod(String period);

    List<Invoice> findByRoom_BuildingIdAndPeriod(Long buildingId, String period);

    List<Invoice> findByStatusInOrderByDueDateAsc(List<Invoice.Status> statuses);
}
