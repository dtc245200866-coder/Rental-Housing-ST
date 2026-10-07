package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.TenantProfile;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.TenantProfileRepository;
import com.rentalhousing.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;
    private final TenantProfileRepository tenantProfileRepository;

    public ProfileController(
            UserRepository userRepository,
            TenantProfileRepository tenantProfileRepository
    ) {
        this.userRepository = userRepository;
        this.tenantProfileRepository = tenantProfileRepository;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        TenantProfile profile = tenantProfileRepository.findByUser(user).orElse(null);

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "phone", user.getPhone(),
                "email", user.getEmail() == null ? "" : user.getEmail(),
                "role", user.getRole().name(),
                "dateOfBirth", profile == null || profile.getDateOfBirth() == null ? "" : profile.getDateOfBirth(),
                "citizenId", profile == null || profile.getCitizenId() == null ? "" : profile.getCitizenId(),
                "hometown", profile == null || profile.getHometown() == null ? "" : profile.getHometown(),
                "job", profile == null || profile.getJob() == null ? "" : profile.getJob()
        ));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {

        User user = (User) authentication.getPrincipal();

        String name = (String) request.get("name");
        if (name != null && !name.isBlank()) {
            user.setName(name);
            userRepository.save(user);
        }

        TenantProfile profile = tenantProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    TenantProfile p = new TenantProfile();
                    p.setUser(user);
                    return p;
                });

        if (request.containsKey("dateOfBirth")) {
            profile.setDateOfBirth((String) request.get("dateOfBirth"));
        }
        if (request.containsKey("citizenId")) {
            String citizenId = (String) request.get("citizenId");
            if (citizenId != null && !citizenId.isBlank()
                    && !citizenId.matches("\\d{9}|\\d{12}")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số căn cước phải gồm 9 hoặc 12 chữ số"));
            }
            profile.setCitizenId(citizenId);
        }
        if (request.containsKey("hometown")) {
            profile.setHometown((String) request.get("hometown"));
        }
        if (request.containsKey("job")) {
            profile.setJob((String) request.get("job"));
        }

        tenantProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of("message", "Cập nhật hồ sơ thành công"));
    }
}
