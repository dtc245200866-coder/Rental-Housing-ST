package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.MeterReading;
import com.rentalhousing.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeterReadingRepository extends JpaRepository<MeterReading, Long> {

    Optional<MeterReading> findByRoomAndPeriod(Room room, String period);

    List<MeterReading> findByRoomIdOrderByPeriodDesc(Long roomId);

    List<MeterReading> findTop3ByRoomIdOrderByPeriodDesc(Long roomId);

    List<MeterReading> findByRoom_BuildingIdAndPeriodOrderByRoom_FloorAscRoom_CodeAsc(Long buildingId, String period);

    List<MeterReading> findByPeriod(String period);

    List<MeterReading> findByPeriodAndStatus(String period, MeterReading.Status status);

    long countByPeriodAndStatus(String period, MeterReading.Status status);
}
