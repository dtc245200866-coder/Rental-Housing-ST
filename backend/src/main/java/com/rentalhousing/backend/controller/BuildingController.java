package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.repository.UserRepository;
import com.rentalhousing.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buildings")
public class BuildingController {

    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public BuildingController(
            BuildingRepository buildingRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.buildingRepository = buildingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    private boolean isLandlord(User u) {
        return u.getRole() == User.Role.LANDLORD;
    }

    private boolean isManager(User u) {
        return u.getRole() == User.Role.MANAGER;
    }

    private boolean isAdmin(User u) {
        return u.getRole() == User.Role.ADMIN;
    }

    private boolean canManage(User u, Building b) {
        if (isAdmin(u)) return true;
        if (isLandlord(u)) return b.getLandlord() != null && b.getLandlord().getId().equals(u.getId());
        if (isManager(u)) return b.getManager() != null && b.getManager().getId().equals(u.getId());
        return false;
    }

    @GetMapping
    public ResponseEntity<?> listBuildings(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        List<Building> buildings;
        if (isAdmin(user)) {
            buildings = buildingRepository.findAll();
        } else if (isLandlord(user)) {
            buildings = buildingRepository.findByLandlordOrderByIdDesc(user);
        } else if (isManager(user)) {
            buildings = buildingRepository.findByManagerOrderByIdDesc(user);
        } else {
            buildings = List.of();
        }

        List<Map<String, Object>> response = buildings.stream()
                .map(b -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", b.getId());
                    m.put("name", b.getName());
                    m.put("address", b.getAddress());
                    m.put("district", b.getDistrict() == null ? "" : b.getDistrict());
                    m.put("floors", b.getFloors());
                    m.put("note", b.getNote() == null ? "" : b.getNote());
                    m.put("active", b.isActive());
                    m.put("landlordId", b.getLandlord().getId());
                    m.put("landlordName", b.getLandlord().getName());
                    m.put("managerId", b.getManager() == null ? 0L : b.getManager().getId());
                    m.put("managerName", b.getManager() == null ? "" : b.getManager().getName());
                    m.put("totalRooms", roomRepository.countByBuilding(b));
                    m.put("emptyRooms", roomRepository.countByBuildingAndStatus(b, com.rentalhousing.backend.entity.Room.Status.EMPTY));
                    return m;
                })
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBuilding(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Building b = buildingRepository.findById(id).orElse(null);
        if (b == null) return ResponseEntity.notFound().build();
        if (!canManage(user, b)) return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền xem toà nhà này"));

        Map<String, Object> data = new java.util.HashMap<>();
        data.put("id", b.getId());
        data.put("name", b.getName());
        data.put("address", b.getAddress());
        data.put("district", b.getDistrict() == null ? "" : b.getDistrict());
        data.put("floors", b.getFloors());
        data.put("note", b.getNote() == null ? "" : b.getNote());
        data.put("active", b.isActive());
        data.put("managerId", b.getManager() == null ? null : b.getManager().getId());
        data.put("managerName", b.getManager() == null ? "" : b.getManager().getName());
        return ResponseEntity.ok(data);
    }

    @PostMapping
    public ResponseEntity<?> createBuilding(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (!isLandlord(user) && !isAdmin(user)) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ chủ nhà mới được tạo toà nhà"));
        }

        String name = (String) request.get("name");
        String address = (String) request.get("address");
        Integer floors = request.get("floors") == null ? null : ((Number) request.get("floors")).intValue();

        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Tên toà nhà không được để trống"));
        if (address == null || address.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Địa chỉ không được để trống"));
        if (floors == null || floors <= 0) return ResponseEntity.badRequest().body(Map.of("message", "Số tầng phải lớn hơn 0"));

        Building b = new Building();
        b.setName(name.trim());
        b.setAddress(address.trim());
        b.setDistrict((String) request.get("district"));
        b.setFloors(floors);
        b.setNote((String) request.get("note"));
        b.setLandlord(user);
        b.setActive(true);

        if (request.get("managerId") != null) {
            Long managerId = ((Number) request.get("managerId")).longValue();
            userRepository.findById(managerId).ifPresent(b::setManager);
        }

        buildingRepository.save(b);
        auditLogService.log(user, "CREATE", "BUILDING", b.getId(), null, Map.of("id", b.getId(), "name", b.getName()));

        return ResponseEntity.ok(Map.of("message", "Tạo toà nhà thành công", "buildingId", b.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBuilding(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Building b = buildingRepository.findById(id).orElse(null);
        if (b == null) return ResponseEntity.notFound().build();
        if (!isLandlord(user) && !isAdmin(user)) return ResponseEntity.status(403).body(Map.of("message", "Không có quyền sửa toà nhà"));
        if (isLandlord(user) && (b.getLandlord() == null || !b.getLandlord().getId().equals(user.getId()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền sửa toà nhà này"));
        }

        if (request.containsKey("name")) b.setName((String) request.get("name"));
        if (request.containsKey("address")) b.setAddress((String) request.get("address"));
        if (request.containsKey("district")) b.setDistrict((String) request.get("district"));
        if (request.containsKey("floors")) b.setFloors(((Number) request.get("floors")).intValue());
        if (request.containsKey("note")) b.setNote((String) request.get("note"));
        if (request.containsKey("active")) b.setActive((Boolean) request.get("active"));
        if (request.containsKey("managerId")) {
            Long managerId = request.get("managerId") == null ? null : ((Number) request.get("managerId")).longValue();
            if (managerId == null) b.setManager(null);
            else userRepository.findById(managerId).ifPresent(b::setManager);
        }

        buildingRepository.save(b);
        auditLogService.log(user, "UPDATE", "BUILDING", b.getId(), null, Map.of("id", b.getId(), "name", b.getName()));

        return ResponseEntity.ok(Map.of("message", "Cập nhật toà nhà thành công"));
    }
}
