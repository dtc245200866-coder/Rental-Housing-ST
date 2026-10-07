package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.RentalRequest;
import com.rentalhousing.backend.entity.RentalRequestHistory;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ListingRepository;
import com.rentalhousing.backend.repository.RentalRequestHistoryRepository;
import com.rentalhousing.backend.repository.RentalRequestRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
public class RentalRequestController {

    private final RentalRequestRepository requestRepository;
    private final RentalRequestHistoryRepository historyRepository;
    private final ListingRepository listingRepository;
    private final RoomRepository roomRepository;

    public RentalRequestController(
            RentalRequestRepository requestRepository,
            RentalRequestHistoryRepository historyRepository,
            ListingRepository listingRepository,
            RoomRepository roomRepository
    ) {
        this.requestRepository = requestRepository;
        this.historyRepository = historyRepository;
        this.listingRepository = listingRepository;
        this.roomRepository = roomRepository;
    }

    private Map<String, Object> toMap(RentalRequest r) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", r.getId());
        m.put("requestCode", r.getRequestCode());
        m.put("listingId", r.getListing().getId());
        m.put("roomCode", r.getListing().getRoom().getCode());
        m.put("buildingId", r.getListing().getRoom().getBuilding().getId());
        m.put("buildingName", r.getListing().getRoom().getBuilding().getName());
        m.put("tenantId", r.getTenant().getId());
        m.put("tenantName", r.getTenant().getName());
        m.put("tenantPhone", r.getTenant().getPhone());
        m.put("type", r.getType().name());
        m.put("desiredDate", r.getDesiredDate().toString());
        m.put("expectedPeople", r.getExpectedPeople());
        m.put("message", r.getMessage() == null ? "" : r.getMessage());
        m.put("status", r.getStatus().name());
        m.put("scheduledAt", r.getScheduledAt() == null ? null : r.getScheduledAt().toString());
        m.put("rejectReason", r.getRejectReason() == null ? null : r.getRejectReason().name());
        m.put("rejectNote", r.getRejectNote() == null ? "" : r.getRejectNote());
        m.put("createdAt", r.getCreatedAt().toString());
        return m;
    }

    /* ===== Tenant ===== */

    @PostMapping("/api/my/requests")
    public ResponseEntity<?> submitRequest(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();

        Long listingId = request.get("listingId") == null ? null : ((Number) request.get("listingId")).longValue();
        String typeStr = (String) request.get("type");
        String desiredDateStr = (String) request.get("desiredDate");
        Integer expectedPeople = request.get("expectedPeople") == null ? null : ((Number) request.get("expectedPeople")).intValue();

        if (listingId == null || typeStr == null || desiredDateStr == null || expectedPeople == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin yêu cầu"));
        }

        Listing listing = listingRepository.findById(listingId).orElse(null);
        if (listing == null || listing.getStatus() != Listing.Status.PUBLISHED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tin đăng không khả dụng"));
        }

        RentalRequest.Type type;
        try {
            type = RentalRequest.Type.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Loại yêu cầu không hợp lệ: VIEWING, RENT_NOW"));
        }

        LocalDate desiredDate;
        try {
            desiredDate = LocalDate.parse(desiredDateStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ngày mong muốn không hợp lệ"));
        }

        if (desiredDate.isBefore(LocalDate.now()) || desiredDate.isAfter(LocalDate.now().plusDays(60))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ngày mong muốn phải từ hôm nay đến 60 ngày tới"));
        }

        if (expectedPeople > listing.getRoom().getMaxPeople()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số người vượt quá giới hạn " + listing.getRoom().getMaxPeople() + " người của phòng"));
        }

        if (requestRepository.existsByListingAndTenantAndStatusIn(listing, user,
                List.of(RentalRequest.Status.OPEN, RentalRequest.Status.SCHEDULED))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã có yêu cầu đang mở cho tin này"));
        }

        String prefix = "YC-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        long count = requestRepository.countByRequestCodeStartingWith(prefix);

        RentalRequest rr = new RentalRequest();
        rr.setRequestCode(prefix + String.format("%04d", count + 1));
        rr.setListing(listing);
        rr.setTenant(user);
        rr.setType(type);
        rr.setDesiredDate(desiredDate);
        rr.setExpectedPeople(expectedPeople);
        rr.setMessage((String) request.get("message"));
        rr.setStatus(RentalRequest.Status.OPEN);
        rr.setCreatedAt(LocalDateTime.now());
        requestRepository.save(rr);

        historyRepository.save(new RentalRequestHistory(rr, null, rr.getStatus().name(), user, "Tạo yêu cầu thuê"));

        return ResponseEntity.ok(Map.of("message", "Gửi yêu cầu thành công", "requestCode", rr.getRequestCode()));
    }

    @GetMapping("/api/my/requests")
    public ResponseEntity<?> myRequests(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(requestRepository.findByTenantOrderByCreatedAtDesc(user).stream().map(this::toMap).toList());
    }

    @PostMapping("/api/my/requests/{id}/cancel")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        RentalRequest rr = requestRepository.findById(id).orElse(null);
        if (rr == null || !rr.getTenant().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền huỷ yêu cầu này"));
        }
        if (rr.getStatus() != RentalRequest.Status.OPEN && rr.getStatus() != RentalRequest.Status.SCHEDULED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Yêu cầu không thể huỷ ở trạng thái này"));
        }

        String from = rr.getStatus().name();
        rr.setStatus(RentalRequest.Status.CANCELLED);
        requestRepository.save(rr);
        historyRepository.save(new RentalRequestHistory(rr, from, rr.getStatus().name(), user, "Khách tự huỷ yêu cầu"));

        return ResponseEntity.ok(Map.of("message", "Đã huỷ yêu cầu"));
    }

    /* ===== Landlord / Manager ===== */

    @GetMapping("/api/requests")
    public ResponseEntity<?> listRequests(
            Authentication authentication,
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) String status) {

        List<RentalRequest> requests;
        if (buildingId != null) {
            requests = requestRepository.findByListing_Room_BuildingIdOrderByCreatedAtDesc(buildingId);
        } else {
            requests = requestRepository.findAllByOrderByCreatedAtDesc();
        }

        if (status != null && !status.isBlank()) {
            RentalRequest.Status s;
            try {
                s = RentalRequest.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ"));
            }
            requests = requests.stream().filter(r -> r.getStatus() == s).toList();
        }

        return ResponseEntity.ok(requests.stream().map(this::toMap).toList());
    }

    @GetMapping("/api/requests/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id) {
        RentalRequest rr = requestRepository.findById(id).orElse(null);
        if (rr == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> history = historyRepository.findByRequestOrderByCreatedAtAsc(rr).stream()
                .map(h -> Map.<String, Object>of(
                        "fromStatus", h.getFromStatus(),
                        "toStatus", h.getToStatus(),
                        "actorName", h.getActor().getName(),
                        "note", h.getNote() == null ? "" : h.getNote(),
                        "createdAt", h.getCreatedAt().toString()
                ))
                .toList();

        Map<String, Object> data = new java.util.HashMap<>(toMap(rr));
        data.put("history", history);
        return ResponseEntity.ok(data);
    }

    @PutMapping("/api/requests/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        RentalRequest rr = requestRepository.findById(id).orElse(null);
        if (rr == null) return ResponseEntity.notFound().build();

        String statusStr = (String) request.get("status");
        RentalRequest.Status status;
        try {
            status = RentalRequest.Status.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ"));
        }

        String from = rr.getStatus().name();
        String note = (String) request.get("note");

        switch (status) {
            case SCHEDULED -> {
                String scheduledAtStr = (String) request.get("scheduledAt");
                if (scheduledAtStr != null) {
                    rr.setScheduledAt(LocalDateTime.parse(scheduledAtStr));
                }
                rr.setStatus(RentalRequest.Status.SCHEDULED);
            }
            case ACCEPTED -> {
                rr.setStatus(RentalRequest.Status.ACCEPTED);
                if (rr.getType() == RentalRequest.Type.RENT_NOW) {
                    Room room = rr.getListing().getRoom();
                    room.setStatus(Room.Status.DEPOSITED);
                    roomRepository.save(room);
                }
            }
            case REJECTED -> {
                String reasonStr = (String) request.get("rejectReason");
                if (reasonStr != null) {
                    try {
                        rr.setRejectReason(RentalRequest.RejectReason.valueOf(reasonStr.toUpperCase()));
                    } catch (IllegalArgumentException ignored) {
                    }
                }
                rr.setRejectNote(note);
                rr.setStatus(RentalRequest.Status.REJECTED);
            }
            case COMPLETED -> {
                rr.setStatus(RentalRequest.Status.COMPLETED);
            }
            default -> {
                return ResponseEntity.badRequest().body(Map.of("message", "Chỉ hỗ trợ SCHEDULED, ACCEPTED, REJECTED, COMPLETED"));
            }
        }

        requestRepository.save(rr);
        historyRepository.save(new RentalRequestHistory(rr, from, rr.getStatus().name(), user, note));

        return ResponseEntity.ok(Map.of("message", "Cập nhật yêu cầu thành công", "status", rr.getStatus().name()));
    }
}
