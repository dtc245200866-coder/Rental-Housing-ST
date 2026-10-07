package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ListingRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final RoomRepository roomRepository;
    private final AuditLogService auditLogService;

    public ListingController(
            ListingRepository listingRepository,
            RoomRepository roomRepository,
            AuditLogService auditLogService
    ) {
        this.listingRepository = listingRepository;
        this.roomRepository = roomRepository;
        this.auditLogService = auditLogService;
    }

    private Map<String, Object> toMap(Listing l) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", l.getId());
        m.put("roomId", l.getRoom().getId());
        m.put("roomCode", l.getRoom().getCode());
        m.put("buildingName", l.getRoom().getBuilding().getName());
        m.put("title", l.getTitle());
        m.put("description", l.getDescription() == null ? "" : l.getDescription());
        m.put("status", l.getStatus().name());
        m.put("rent", l.getRoom().getRent());
        m.put("area", l.getRoom().getArea());
        m.put("createdAt", l.getCreatedAt().toString());
        m.put("expiresAt", l.getExpiresAt().toString());
        return m;
    }

    @GetMapping
    public ResponseEntity<?> listMyListings(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Listing> listings = listingRepository.findAll().stream()
                .filter(l -> l.getRoom().getBuilding().getLandlord().getId().equals(user.getId()))
                .toList();
        return ResponseEntity.ok(listings.stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> createListing(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ chủ nhà mới được đăng tin"));
        }

        Long roomId = request.get("roomId") == null ? null : ((Number) request.get("roomId")).longValue();
        if (roomId == null) return ResponseEntity.badRequest().body(Map.of("message", "Phải chọn phòng"));

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy phòng"));
        if (room.getStatus() != Room.Status.EMPTY) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ phòng đang trống mới đăng được tin"));
        }
        if (listingRepository.existsByRoomAndStatus(room, Listing.Status.PUBLISHED)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phòng đã có tin đang hiển thị"));
        }

        String title = (String) request.get("title");
        if (title == null || title.isBlank()) {
            title = "Cho thuê phòng " + room.getCode() + " - " + room.getBuilding().getName();
        }

        Listing listing = new Listing();
        listing.setRoom(room);
        listing.setTitle(title.trim());
        listing.setDescription((String) request.get("description"));
        listing.setStatus(Listing.Status.DRAFT);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setExpiresAt(LocalDateTime.now().plusDays(30));
        listingRepository.save(listing);

        auditLogService.log(user, "CREATE", "LISTING", listing.getId(), null, toMap(listing));
        return ResponseEntity.ok(Map.of("message", "Tạo tin đăng thành công", "listingId", listing.getId()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Listing listing = listingRepository.findById(id).orElse(null);
        if (listing == null) return ResponseEntity.notFound().build();

        String statusStr = (String) request.get("status");
        Listing.Status status;
        try {
            status = Listing.Status.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ: DRAFT, PUBLISHED, HIDDEN, RENTED"));
        }

        if (status == Listing.Status.PUBLISHED
                && listingRepository.existsByRoomAndStatus(listing.getRoom(), Listing.Status.PUBLISHED)
                && listing.getStatus() != Listing.Status.PUBLISHED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phòng đã có tin đang hiển thị"));
        }

        listing.setStatus(status);
        if (status == Listing.Status.PUBLISHED && listing.getExpiresAt().isBefore(LocalDateTime.now())) {
            listing.setExpiresAt(LocalDateTime.now().plusDays(30));
        }
        listingRepository.save(listing);

        auditLogService.log(user, "UPDATE", "LISTING", listing.getId(), null, toMap(listing));
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái tin thành công", "status", listing.getStatus().name()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateListing(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        Listing listing = listingRepository.findById(id).orElse(null);
        if (listing == null) return ResponseEntity.notFound().build();

        if (request.containsKey("title")) listing.setTitle((String) request.get("title"));
        if (request.containsKey("description")) listing.setDescription((String) request.get("description"));
        listingRepository.save(listing);

        return ResponseEntity.ok(Map.of("message", "Cập nhật tin thành công"));
    }
}
