package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.dto.AdminUserResponse;
import com.rentalhousing.backend.entity.AuditLog;
import com.rentalhousing.backend.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAuditLogs(
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String objectType) {

        List<AuditLog> logs;

        if (actorId != null) {
            logs = auditLogRepository.findByActorIdOrderByTimestampDesc(actorId);
        } else if (objectType != null && !objectType.isBlank()) {
            logs = auditLogRepository.findByObjectTypeOrderByTimestampDesc(objectType);
        } else {
            logs = auditLogRepository.findAll();
        }

        List<Map<String, Object>> response = logs.stream()
                .map(log -> Map.<String, Object>of(
                        "id", log.getId(),
                        "timestamp", log.getTimestamp() == null ? "" : log.getTimestamp().toString(),
                        "actorName", log.getActor() == null ? "" : log.getActor().getName(),
                        "actorRole", log.getActorRole(),
                        "action", log.getAction(),
                        "objectType", log.getObjectType(),
                        "objectId", log.getObjectId() == null ? 0L : log.getObjectId(),
                        "beforeData", log.getBeforeData() == null ? "" : log.getBeforeData(),
                        "afterData", log.getAfterData() == null ? "" : log.getAfterData()
                ))
                .toList();

        return ResponseEntity.ok(response);
    }
}
