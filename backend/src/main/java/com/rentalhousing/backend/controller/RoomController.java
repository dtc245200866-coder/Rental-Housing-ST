package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomRepository roomRepository;
    private final BuildingRepository buildingRepository;
    private final AuditLogService auditLogService;

    public RoomController(
            RoomRepository roomRepository,
            BuildingRepository buildingRepository,
            AuditLogService auditLogService
    ) {
        this.roomRepository = roomRepository;
        this.buildingRepository = buildingRepository;
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

    private boolean canManageBuilding(User u, Building b) {
        if (b == null) return false;
        if (isAdmin(u)) return true;
        if (isLandlord(u)) return b.getLandlord() != null && b.getLandlord().getId().equals(u.getId());
        if (isManager(u)) return b.getManager() != null && b.getManager().getId().equals(u.getId());
        return false;
    }

    private Map<String, Object> toMap(Room room) {
        return Map.<String, Object>of(
                "id", room.getId(),
                "code", room.getCode(),
                "buildingId", room.getBuilding().getId(),
                "buildingName", room.getBuilding().getName(),
                "floor", room.getFloor(),
                "area", room.getArea(),
                "rent", room.getRent(),
                "maxPeople", room.getMaxPeople(),
                "status", room.getStatus().name()
        );
    }

    @GetMapping
    public ResponseEntity<?> getRooms(
            Authentication authentication,
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) Integer floor) {

        User user = (User) authentication.getPrincipal();
        List<Room> rooms;

        if (buildingId == null) {
            if (isAdmin(user)) {
                rooms = roomRepository.findAll();
            } else if (isLandlord(user)) {
                rooms = floor == null ? roomRepository.findByBuilding_Landlord(user)
                        : roomRepository.findByBuilding_LandlordAndFloor(user, floor);
            } else if (isManager(user)) {
                rooms = floor == null ? roomRepository.findByBuilding_Manager(user)
                        : roomRepository.findByBuilding_ManagerAndFloor(user, floor);
            } else {
                rooms = List.of();
            }
        } else {
            Building building = buildingRepository.findById(buildingId).orElse(null);
            if (building == null) return ResponseEntity.notFound().build();
            if (!canManageBuilding(user, building)) {
                return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xem phòng của toà nhà này"));
            }
            rooms = floor == null ? roomRepository.findByBuildingOrderByFloorAscCodeAsc(building)
                    : roomRepository.findByBuildingAndFloor(building, floor);
        }

        return ResponseEntity.ok(rooms.stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> createRoom(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (!isLandlord(user) && !isManager(user) && !isAdmin(user)) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền tạo phòng"));
        }

        Long buildingId = request.get("buildingId") == null ? null : ((Number) request.get("buildingId")).longValue();
        String code = (String) request.get("code");
        Integer floor = request.get("floor") == null ? null : ((Number) request.get("floor")).intValue();
        Double area = request.get("area") == null ? null : ((Number) request.get("area")).doubleValue();
        Long rent = request.get("rent") == null ? null : ((Number) request.get("rent")).longValue();
        Integer maxPeople = request.get("maxPeople") == null ? null : ((Number) request.get("maxPeople")).intValue();

        if (buildingId == null) return ResponseEntity.badRequest().body(Map.of("message", "Phải chọn toà nhà"));
        if (code == null || code.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Mã phòng không được để trống"));
        if (floor == null || floor <= 0) return ResponseEntity.badRequest().body(Map.of("message", "Tầng phải lớn hơn 0"));
        if (area == null || area <= 0) return ResponseEntity.badRequest().body(Map.of("message", "Diện tích phải lớn hơn 0"));
        if (rent == null || rent < 500000) return ResponseEntity.badRequest().body(Map.of("message", "Giá thuê phải từ 500.000đ"));
        if (maxPeople == null || maxPeople <= 0) return ResponseEntity.badRequest().body(Map.of("message", "Số người tối đa phải lớn hơn 0"));

        Building building = buildingRepository.findById(buildingId).orElse(null);
        if (building == null) return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy toà nhà"));
        if (!canManageBuilding(user, building)) return ResponseEntity.status(403).body(Map.of("message", "Không có quyền quản lý toà nhà này"));
        if (floor > building.getFloors()) return ResponseEntity.badRequest().body(Map.of("message", "Tầng vượt quá số tầng của toà nhà"));
        if (roomRepository.existsByBuildingAndCode(building, code.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã phòng đã tồn tại trong toà nhà"));
        }

        Room room = new Room();
        room.setCode(code.trim());
        room.setBuilding(building);
        room.setFloor(floor);
        room.setArea(area);
        room.setRent(rent);
        room.setMaxPeople(maxPeople);
        room.setStatus(Room.Status.EMPTY);
        roomRepository.save(room);

        auditLogService.log(user, "CREATE", "ROOM", room.getId(), null, toMap(room));
        return ResponseEntity.ok(Map.of("message", "Tạo phòng thành công", "roomId", room.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoom(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();
        if (!canManageBuilding(user, room.getBuilding())) return ResponseEntity.status(403).body(Map.of("message", "Không có quyền sửa phòng này"));

        Map<String, Object> before = toMap(room);

        if (request.containsKey("code")) {
            String code = ((String) request.get("code")).trim();
            if (!code.equals(room.getCode()) && roomRepository.existsByBuildingAndCode(room.getBuilding(), code)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Mã phòng đã tồn tại trong toà nhà"));
            }
            room.setCode(code);
        }
        if (request.containsKey("floor")) room.setFloor(((Number) request.get("floor")).intValue());
        if (request.containsKey("area")) room.setArea(((Number) request.get("area")).doubleValue());
        if (request.containsKey("rent")) room.setRent(((Number) request.get("rent")).longValue());
        if (request.containsKey("maxPeople")) room.setMaxPeople(((Number) request.get("maxPeople")).intValue());

        roomRepository.save(room);
        auditLogService.log(user, "UPDATE", "ROOM", room.getId(), before, toMap(room));
        return ResponseEntity.ok(Map.of("message", "Cập nhật phòng thành công"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRoomStatus(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();
        if (!canManageBuilding(user, room.getBuilding())) return ResponseEntity.status(403).body(Map.of("message", "Không có quyền đổi trạng thái phòng này"));

        String statusValue = (String) request.get("status");
        if (statusValue == null || statusValue.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không được để trống"));

        Room.Status status;
        try {
            status = Room.Status.valueOf(statusValue.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ: EMPTY, DEPOSITED, RENTED, STOPPED"));
        }

        Map<String, Object> before = toMap(room);
        room.setStatus(status);
        roomRepository.save(room);
        auditLogService.log(user, "UPDATE", "ROOM", room.getId(), before, toMap(room));

        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công", "status", room.getStatus().name()));
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> createRoomsBulk(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Long buildingId = request.get("buildingId") == null ? null : ((Number) request.get("buildingId")).longValue();
        Integer startFloor = request.get("startFloor") == null ? null : ((Number) request.get("startFloor")).intValue();
        Integer floorCount = request.get("floorCount") == null ? null : ((Number) request.get("floorCount")).intValue();
        Integer roomsPerFloor = request.get("roomsPerFloor") == null ? null : ((Number) request.get("roomsPerFloor")).intValue();
        Double area = request.get("area") == null ? null : ((Number) request.get("area")).doubleValue();
        Long rent = request.get("rent") == null ? null : ((Number) request.get("rent")).longValue();
        Integer maxPeople = request.get("maxPeople") == null ? null : ((Number) request.get("maxPeople")).intValue();

        if (buildingId == null || startFloor == null || startFloor <= 0 || floorCount == null || floorCount <= 0
                || roomsPerFloor == null || roomsPerFloor <= 0 || area == null || area <= 0
                || rent == null || rent < 500000 || maxPeople == null || maxPeople <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu hoặc sai thông tin tạo phòng"));
        }

        Building building = buildingRepository.findById(buildingId).orElse(null);
        if (building == null) return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy toà nhà"));
        if (!canManageBuilding(user, building)) return ResponseEntity.status(403).body(Map.of("message", "Không có quyền quản lý toà nhà này"));

        int endFloor = startFloor + floorCount - 1;
        if (startFloor > building.getFloors() || endFloor > building.getFloors()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tầng vượt quá số tầng của toà nhà"));
        }

        List<Room> rooms = new ArrayList<>();
        for (int floor = startFloor; floor <= endFloor; floor++) {
            for (int rn = 1; rn <= roomsPerFloor; rn++) {
                String code = String.valueOf(floor * 100 + rn);
                if (roomRepository.existsByBuildingAndCode(building, code)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Mã phòng " + code + " đã tồn tại"));
                }
                Room room = new Room();
                room.setCode(code);
                room.setBuilding(building);
                room.setFloor(floor);
                room.setArea(area);
                room.setRent(rent);
                room.setMaxPeople(maxPeople);
                room.setStatus(Room.Status.EMPTY);
                rooms.add(room);
            }
        }

        roomRepository.saveAll(rooms);
        for (Room room : rooms) {
            auditLogService.log(user, "CREATE", "ROOM", room.getId(), null, toMap(room));
        }

        return ResponseEntity.ok(Map.of("message", "Tạo nhanh phòng thành công", "createdCount", rooms.size()));
    }
}
