package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.MeterReading;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ContractRepository;
import com.rentalhousing.backend.repository.MeterReadingRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meter-readings")
public class MeterReadingController {

    private final MeterReadingRepository meterReadingRepository;
    private final RoomRepository roomRepository;
    private final ContractRepository contractRepository;
    private final AuditLogService auditLogService;

    public MeterReadingController(
            MeterReadingRepository meterReadingRepository,
            RoomRepository roomRepository,
            ContractRepository contractRepository,
            AuditLogService auditLogService
    ) {
        this.meterReadingRepository = meterReadingRepository;
        this.roomRepository = roomRepository;
        this.contractRepository = contractRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/list")
    public ResponseEntity<?> listForBuilding(
            @RequestParam Long buildingId,
            @RequestParam String period) {

        // Lấy các phòng đang thuê của toà, sắp theo tầng rồi mã phòng
        List<Room> rentedRooms = roomRepository.findAll().stream()
                .filter(r -> r.getBuilding().getId().equals(buildingId) && r.getStatus() == Room.Status.RENTED)
                .sorted((a, b) -> {
                    int c = Integer.compare(a.getFloor(), b.getFloor());
                    return c != 0 ? c : a.getCode().compareTo(b.getCode());
                })
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Room room : rentedRooms) {
            MeterReading current = meterReadingRepository.findByRoomAndPeriod(room, period).orElse(null);
            MeterReading previous = previousReading(room.getId(), period);

            Map<String, Object> m = new java.util.HashMap<>();
            m.put("roomId", room.getId());
            m.put("roomCode", room.getCode());
            m.put("floor", room.getFloor());
            m.put("prevElectric", previous == null ? 0 : previous.getCurrentElectric());
            m.put("prevWater", previous == null ? 0 : previous.getCurrentWater());
            m.put("currentElectric", current == null ? null : current.getCurrentElectric());
            m.put("currentWater", current == null ? null : current.getCurrentWater());
            m.put("status", current == null ? "PENDING" : current.getStatus().name());
            m.put("recordedAt", current == null ? null : current.getRecordedAt().toString());
            result.add(m);
        }

        return ResponseEntity.ok(result);
    }

    private MeterReading previousReading(Long roomId, String period) {
        return meterReadingRepository.findByRoomIdOrderByPeriodDesc(roomId).stream()
                .filter(r -> r.getPeriod().compareTo(period) < 0)
                .findFirst()
                .orElse(null);
    }

    @PostMapping
    public ResponseEntity<?> saveReading(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.MANAGER && user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền ghi chỉ số"));
        }

        Long roomId = ((Number) request.get("roomId")).longValue();
        String period = (String) request.get("period");
        Long currentElectric = request.get("currentElectric") == null ? null : ((Number) request.get("currentElectric")).longValue();
        Long currentWater = request.get("currentWater") == null ? null : ((Number) request.get("currentWater")).longValue();

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();

        Contract contract = contractRepository.findFirstByRoomAndStatusOrderByCreatedAtDesc(room, Contract.Status.ACTIVE).orElse(null);
        if (contract == null) return ResponseEntity.badRequest().body(Map.of("message", "Phòng không có hợp đồng hiệu lực"));

        MeterReading previous = previousReading(roomId, period);
        long prevElectric = previous == null ? 0 : previous.getCurrentElectric();
        long prevWater = previous == null ? 0 : previous.getCurrentWater();

        if (currentElectric != null && currentElectric < prevElectric) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ số điện mới không được nhỏ hơn chỉ số cũ (" + prevElectric + ")"));
        }
        if (currentWater != null && currentWater < prevWater) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ số nước mới không được nhỏ hơn chỉ số cũ (" + prevWater + ")"));
        }

        MeterReading reading = meterReadingRepository.findByRoomAndPeriod(room, period)
                .orElseGet(() -> {
                    MeterReading r = new MeterReading();
                    r.setRoom(room);
                    r.setContract(contract);
                    r.setPeriod(period);
                    r.setPrevElectric(prevElectric);
                    r.setPrevWater(prevWater);
                    return r;
                });

        if (currentElectric != null) reading.setCurrentElectric(currentElectric);
        if (currentWater != null) reading.setCurrentWater(currentWater);
        reading.setRecordedBy(user);
        reading.setRecordedAt(LocalDateTime.now());
        meterReadingRepository.save(reading);

        boolean warning = isWarning(roomId, period, reading);

        auditLogService.log(user, "RECORD", "METER_READING", reading.getId(), null,
                Map.of("roomId", roomId, "period", period, "electric", reading.getCurrentElectric(), "water", reading.getCurrentWater()));

        return ResponseEntity.ok(Map.of("message", "Lưu chỉ số thành công", "warning", warning));
    }

    private boolean isWarning(Long roomId, String period, MeterReading reading) {
        List<MeterReading> history = meterReadingRepository.findTop3ByRoomIdOrderByPeriodDesc(roomId).stream()
                .filter(r -> r.getPeriod().compareTo(period) < 0)
                .toList();
        if (history.isEmpty()) return false;

        double avgElectric = history.stream().mapToLong(MeterReading::getElectricConsumption).average().orElse(0);
        if (avgElectric > 0 && reading.getElectricConsumption() > avgElectric * 2) {
            return true;
        }
        double avgWater = history.stream().mapToLong(MeterReading::getWaterConsumption).average().orElse(0);
        return avgWater > 0 && reading.getWaterConsumption() > avgWater * 2;
    }

    @GetMapping("/progress")
    public ResponseEntity<?> progress(@RequestParam Long buildingId, @RequestParam String period) {
        List<Room> rented = roomRepository.findAll().stream()
                .filter(r -> r.getBuilding().getId().equals(buildingId) && r.getStatus() == Room.Status.RENTED)
                .toList();

        List<String> missing = new ArrayList<>();
        int done = 0;
        for (Room room : rented) {
            if (meterReadingRepository.findByRoomAndPeriod(room, period).isPresent()) {
                done++;
            } else {
                missing.add(room.getCode());
            }
        }

        return ResponseEntity.ok(Map.of(
                "totalRooms", rented.size(),
                "done", done,
                "missing", missing.size(),
                "missingRooms", missing
        ));
    }
}
