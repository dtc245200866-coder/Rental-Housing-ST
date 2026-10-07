package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.RoomService;
import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.repository.RoomServiceRepository;
import com.rentalhousing.backend.repository.ServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms/{roomId}/services")
public class RoomServiceController {

    private final RoomRepository roomRepository;
    private final RoomServiceRepository roomServiceRepository;
    private final ServiceRepository serviceRepository;

    public RoomServiceController(
            RoomRepository roomRepository,
            RoomServiceRepository roomServiceRepository,
            ServiceRepository serviceRepository
    ) {
        this.roomRepository = roomRepository;
        this.roomServiceRepository = roomServiceRepository;
        this.serviceRepository = serviceRepository;
    }

    @GetMapping
    public ResponseEntity<?> listRoomServices(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> result = roomServiceRepository.findByRoom(room).stream()
                .map(rs -> Map.<String, Object>of(
                        "id", rs.getId(),
                        "serviceId", rs.getService().getId(),
                        "serviceName", rs.getService().getName(),
                        "calculationMethod", rs.getService().getCalculationMethod().name(),
                        "unit", rs.getService().getUnit(),
                        "price", rs.getPrice()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PutMapping
    public ResponseEntity<?> setRoomServices(
            @PathVariable Long roomId,
            Authentication authentication,
            @RequestBody Map<String, Object> request) {

        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền cấu hình dịch vụ phòng"));
        }

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();

        // request chứa danh sách: {"services": [{"serviceId": 1, "price": 4000}, ...]}
        List<?> items = (List<?>) request.get("services");
        if (items == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu danh sách dịch vụ"));

        roomServiceRepository.deleteByRoom(room);

        for (Object item : items) {
            Map<?, ?> m = (Map<?, ?>) item;
            Long serviceId = ((Number) m.get("serviceId")).longValue();
            long price = ((Number) m.get("price")).longValue();

            Service service = serviceRepository.findById(serviceId).orElse(null);
            if (service == null) continue;

            RoomService rs = new RoomService();
            rs.setRoom(room);
            rs.setService(service);
            rs.setPrice(price);
            roomServiceRepository.save(rs);
        }

        return ResponseEntity.ok(Map.of("message", "Cập nhật dịch vụ phòng thành công"));
    }
}
