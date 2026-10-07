package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime from, LocalDateTime to);

    List<AuditLog> findByActorIdOrderByTimestampDesc(Long actorId);

    List<AuditLog> findByObjectTypeOrderByTimestampDesc(String objectType);
}
