package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.BuildingService;
import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingRepository;
import com.rentalhousing.backend.repository.BuildingServiceRepository;
import com.rentalhousing.backend.repository.ServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buildings/{buildingId}/services")
public class BuildingServiceController {

    private final BuildingRepository buildingRepository;
    private final BuildingServiceRepository buildingServiceRepository;
    private final ServiceRepository serviceRepository;

    public BuildingServiceController(
            BuildingRepository buildingRepository,
            BuildingServiceRepository buildingServiceRepository,
            ServiceRepository serviceRepository
    ) {
        this.buildingRepository = buildingRepository;
        this.buildingServiceRepository = buildingServiceRepository;
        this.serviceRepository = serviceRepository;
    }

    @GetMapping
    public ResponseEntity<?> listConfigs(@PathVariable Long buildingId) {
        Building building = buildingRepository.findById(buildingId).orElse(null);
        if (building == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> configs = buildingServiceRepository.findByBuilding(building).stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "serviceId", c.getService().getId(),
                        "serviceName", c.getService().getName(),
                        "calculationMethod", c.getCalculationMethod().name(),
                        "price", c.getPrice(),
                        "effectiveFrom", c.getEffectiveFrom().toString()
                ))
                .toList();

        return ResponseEntity.ok(configs);
    }

    @PutMapping("/{serviceId}")
    public ResponseEntity<?> setConfig(
            @PathVariable Long buildingId,
            @PathVariable Long serviceId,
            Authentication authentication,
            @RequestBody Map<String, Object> request) {

        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền cấu hình"));
        }

        Building building = buildingRepository.findById(buildingId).orElse(null);
        Service service = serviceRepository.findById(serviceId).orElse(null);
        if (building == null || service == null) return ResponseEntity.notFound().build();

        String methodStr = (String) request.get("calculationMethod");
        Long price = request.get("price") == null ? null : ((Number) request.get("price")).longValue();
        String effectiveFromStr = (String) request.get("effectiveFrom");

        if (methodStr == null || price == null || price <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cách tính và đơn giá (lớn hơn 0) là bắt buộc"));
        }

        Service.CalculationMethod method;
        try {
            method = Service.CalculationMethod.valueOf(methodStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cách tính không hợp lệ"));
        }

        LocalDate effectiveFrom;
        try {
            effectiveFrom = effectiveFromStr == null ? LocalDate.now() : LocalDate.parse(effectiveFromStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ngày hiệu lực không hợp lệ"));
        }

        BuildingService config = new BuildingService();
        config.setBuilding(building);
        config.setService(service);
        config.setCalculationMethod(method);
        config.setPrice(price);
        config.setEffectiveFrom(effectiveFrom);
        buildingServiceRepository.save(config);

        return ResponseEntity.ok(Map.of("message", "Cấu hình cách tính thành công", "configId", config.getId()));
    }
}
