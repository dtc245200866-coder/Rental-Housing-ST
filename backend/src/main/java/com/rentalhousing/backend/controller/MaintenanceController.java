package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.MaintenanceRequest;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ContractRepository;
import com.rentalhousing.backend.repository.MaintenanceRequestRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
public class MaintenanceController {

    private final MaintenanceRequestRepository maintenanceRepository;
    private final RoomRepository roomRepository;
    private final ContractRepository contractRepository;

    public MaintenanceController(
            MaintenanceRequestRepository maintenanceRepository,
            RoomRepository roomRepository,
            ContractRepository contractRepository
    ) {
        this.maintenanceRepository = maintenanceRepository;
        this.roomRepository = roomRepository;
        this.contractRepository = contractRepository;
    }

    private Map<String, Object> toMap(MaintenanceRequest m) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", m.getId());
        map.put("code", m.getCode());
        map.put("roomId", m.getRoom().getId());
        map.put("roomCode", m.getRoom().getCode());
        map.put("buildingId", m.getRoom().getBuilding().getId());
        map.put("buildingName", m.getRoom().getBuilding().getName());
        map.put("tenantName", m.getTenant().getName());
        map.put("deviceType", m.getDeviceType());
        map.put("description", m.getDescription());
        map.put("urgency", m.getUrgency().name());
        map.put("status", m.getStatus().name());
        map.put("cost", m.getCost());
        map.put("costBearer", m.getCostBearer() == null ? null : m.getCostBearer().name());
        map.put("note", m.getNote() == null ? "" : m.getNote());
        map.put("createdAt", m.getCreatedAt().toString());
        return map;
    }

    /* Tenant báo hỏng (S4-06) */
    @PostMapping("/api/my/maintenance")
    public ResponseEntity<?> report(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();

        Long roomId = request.get("roomId") == null ? null : ((Number) request.get("roomId")).longValue();
        String deviceType = (String) request.get("deviceType");
        String description = (String) request.get("description");
        String urgencyStr = (String) request.get("urgency");

        if (roomId == null || deviceType == null || deviceType.isBlank() || description == null || description.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin báo hỏng"));
        }

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();

        // Chỉ báo hỏng cho phòng mình đang thuê
        boolean renting = contractRepository.findByRoomOrderByCreatedAtDesc(room).stream()
                .anyMatch(c -> (c.getStatus() == Contract.Status.ACTIVE || c.getStatus() == Contract.Status.RENEWED)
                        && c.getTenant().getId().equals(user.getId()));
        if (!renting) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không thuê phòng này"));
        }

        MaintenanceRequest.Urgency urgency = MaintenanceRequest.Urgency.NORMAL;
        if ("URGENT".equalsIgnoreCase(urgencyStr)) urgency = MaintenanceRequest.Urgency.URGENT;

        String prefix = "BH-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        long count = maintenanceRepository.countByCodeStartingWith(prefix);

        MaintenanceRequest m = new MaintenanceRequest();
        m.setCode(prefix + String.format("%04d", count + 1));
        m.setRoom(room);
        m.setTenant(user);
        m.setDeviceType(deviceType);
        m.setDescription(description);
        m.setUrgency(urgency);
        m.setStatus(MaintenanceRequest.Status.NEW);
        m.setCost(0);
        m.setCreatedAt(LocalDateTime.now());
        m.setUpdatedAt(LocalDateTime.now());
        maintenanceRepository.save(m);

        return ResponseEntity.ok(Map.of("message", "Đã gửi báo hỏng", "code", m.getCode()));
    }

    @GetMapping("/api/my/maintenance")
    public ResponseEntity<?> myReports(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(maintenanceRepository.findByTenantOrderByCreatedAtDesc(user).stream().map(this::toMap).toList());
    }

    /* Quản lý toà nhà / chủ nhà xem danh sách (S4-07) */
    @GetMapping("/api/maintenance")
    public ResponseEntity<?> list(
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) String status) {

        List<MaintenanceRequest> list;
        if (buildingId != null) {
            list = maintenanceRepository.findByRoom_BuildingIdOrderByCreatedAtDesc(buildingId);
        } else {
            list = maintenanceRepository.findAllByOrderByCreatedAtDesc();
        }

        if (status != null && !status.isBlank()) {
            MaintenanceRequest.Status s;
            try {
                s = MaintenanceRequest.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ: NEW, IN_PROGRESS, DONE, REJECTED"));
            }
            list = list.stream().filter(m -> m.getStatus() == s).toList();
        }

        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @PutMapping("/api/maintenance/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        MaintenanceRequest m = maintenanceRepository.findById(id).orElse(null);
        if (m == null) return ResponseEntity.notFound().build();

        String statusStr = (String) request.get("status");
        if (statusStr != null) {
            try {
                m.setStatus(MaintenanceRequest.Status.valueOf(statusStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ: NEW, IN_PROGRESS, DONE, REJECTED"));
            }
        }
        if (request.get("cost") != null) m.setCost(((Number) request.get("cost")).longValue());
        if (request.get("costBearer") != null) {
            try {
                m.setCostBearer(MaintenanceRequest.CostBearer.valueOf(((String) request.get("costBearer")).toUpperCase()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (request.get("note") != null) m.setNote((String) request.get("note"));
        m.setUpdatedAt(LocalDateTime.now());
        maintenanceRepository.save(m);

        return ResponseEntity.ok(Map.of("message", "Cập nhật tiến độ thành công", "status", m.getStatus().name()));
    }
}
