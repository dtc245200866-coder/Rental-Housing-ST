package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.ServicePriceHistory;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ServicePriceHistoryRepository;
import com.rentalhousing.backend.repository.ServiceRepository;
import com.rentalhousing.backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceRepository serviceRepository;
    private final ServicePriceHistoryRepository priceHistoryRepository;
    private final AuditLogService auditLogService;

    public ServiceController(
            ServiceRepository serviceRepository,
            ServicePriceHistoryRepository priceHistoryRepository,
            AuditLogService auditLogService
    ) {
        this.serviceRepository = serviceRepository;
        this.priceHistoryRepository = priceHistoryRepository;
        this.auditLogService = auditLogService;
    }

    private Map<String, Object> toMap(Service s) {
        return Map.<String, Object>of(
                "id", s.getId(),
                "name", s.getName(),
                "calculationMethod", s.getCalculationMethod().name(),
                "unit", s.getUnit(),
                "price", s.getPrice(),
                "description", s.getDescription() == null ? "" : s.getDescription(),
                "active", s.isActive()
        );
    }

    @GetMapping
    public ResponseEntity<?> listServices() {
        return ResponseEntity.ok(serviceRepository.findAllByOrderByIdAsc().stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> createService(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền tạo dịch vụ"));
        }

        String name = (String) request.get("name");
        String method = (String) request.get("calculationMethod");
        String unit = (String) request.get("unit");
        Long price = request.get("price") == null ? null : ((Number) request.get("price")).longValue();

        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Tên dịch vụ không được để trống"));
        if (method == null) return ResponseEntity.badRequest().body(Map.of("message", "Cách tính tiền không được để trống"));
        if (price == null || price < 0) return ResponseEntity.badRequest().body(Map.of("message", "Đơn giá không hợp lệ"));

        Service.CalculationMethod cm;
        try {
            cm = Service.CalculationMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cách tính không hợp lệ: BY_METER, BY_PERSON, FIXED_ROOM"));
        }

        Service s = new Service();
        s.setName(name.trim());
        s.setCalculationMethod(cm);
        s.setUnit(unit == null ? "" : unit);
        s.setPrice(price);
        s.setDescription((String) request.get("description"));
        s.setActive(true);
        serviceRepository.save(s);

        auditLogService.log(user, "CREATE", "SERVICE", s.getId(), null, toMap(s));
        return ResponseEntity.ok(Map.of("message", "Tạo dịch vụ thành công", "serviceId", s.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateService(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Service s = serviceRepository.findById(id).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();

        if (request.containsKey("name")) s.setName((String) request.get("name"));
        if (request.containsKey("description")) s.setDescription((String) request.get("description"));
        if (request.containsKey("active")) s.setActive((Boolean) request.get("active"));
        serviceRepository.save(s);

        auditLogService.log(user, "UPDATE", "SERVICE", s.getId(), null, toMap(s));
        return ResponseEntity.ok(Map.of("message", "Cập nhật dịch vụ thành công"));
    }

    @PutMapping("/{id}/price")
    public ResponseEntity<?> updatePrice(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        Service s = serviceRepository.findById(id).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();

        Long newPrice = request.get("price") == null ? null : ((Number) request.get("price")).longValue();
        String effectiveFromStr = (String) request.get("effectiveFrom");

        if (newPrice == null || newPrice < 0) return ResponseEntity.badRequest().body(Map.of("message", "Đơn giá không hợp lệ"));

        LocalDate effectiveFrom;
        try {
            effectiveFrom = effectiveFromStr == null ? LocalDate.now() : LocalDate.parse(effectiveFromStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ngày hiệu lực không hợp lệ (yyyy-MM-dd)"));
        }

        // Ghi lịch sử giá
        ServicePriceHistory history = new ServicePriceHistory();
        history.setService(s);
        history.setPrice(newPrice);
        history.setEffectiveFrom(effectiveFrom);
        priceHistoryRepository.save(history);

        s.setPrice(newPrice);
        serviceRepository.save(s);

        auditLogService.log(user, "UPDATE_PRICE", "SERVICE", s.getId(), null, Map.of("price", newPrice, "effectiveFrom", effectiveFrom.toString()));
        return ResponseEntity.ok(Map.of("message", "Cập nhật đơn giá thành công"));
    }

    @GetMapping("/{id}/price-history")
    public ResponseEntity<?> priceHistory(@PathVariable Long id) {
        Service s = serviceRepository.findById(id).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> history = priceHistoryRepository.findByServiceOrderByEffectiveFromDesc(s).stream()
                .map(h -> Map.<String, Object>of("price", h.getPrice(), "effectiveFrom", h.getEffectiveFrom().toString()))
                .toList();

        return ResponseEntity.ok(history);
    }
}
