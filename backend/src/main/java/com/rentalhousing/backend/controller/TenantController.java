package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Danh bạ khách thuê, hỗ trợ chủ nhà chọn người đứng tên khi lập hợp đồng.
 */
@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final UserRepository userRepository;

    public TenantController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> listTenants(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền xem danh sách khách thuê"));
        }

        List<Map<String, Object>> tenants = userRepository.findByRoleAndActive(User.Role.TENANT, true).stream()
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "name", t.getName(),
                        "phone", t.getPhone(),
                        "email", t.getEmail() == null ? "" : t.getEmail()
                ))
                .toList();

        return ResponseEntity.ok(tenants);
    }
}
