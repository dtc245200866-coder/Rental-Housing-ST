package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.dto.AdminCreateUserRequest;
import com.rentalhousing.backend.dto.AdminUserResponse;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.UserRepository;
import com.rentalhousing.backend.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public AdminController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@RequestParam(required = false) String role) {
        List<User> users;
        if (role != null && !role.isBlank()) {
            try {
                users = userRepository.findByRole(User.Role.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vai trò không hợp lệ"));
            }
        } else {
            users = userRepository.findAll();
        }

        List<AdminUserResponse> response = users.stream()
                .map(u -> new AdminUserResponse(
                        u.getId(),
                        u.getName(),
                        u.getPhone(),
                        u.getEmail(),
                        u.getRole().name(),
                        u.isActive(),
                        u.isMustChangePassword()))
                .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vai trò không hợp lệ"));
        }

        if (role == User.Role.TENANT) {
            return ResponseEntity.badRequest().body(Map.of("message", "Khách thuê tự đăng ký, không tạo ở đây"));
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại đã được sử dụng"));
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email đã được sử dụng"));
        }

        String tempPassword = String.format("%08d", new Random().nextInt(100_000_000));

        User user = new User();
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setRole(role);
        user.setActive(true);
        user.setMustChangePassword(true);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Tạo tài khoản thành công",
                "temporaryPassword", tempPassword,
                "userId", user.getId()
        ));
    }

    @PutMapping("/users/{id}/lock")
    public ResponseEntity<?> lockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        user.setActive(false);
        userRepository.save(user);

        // Hủy mọi phiên đang hoạt động
        refreshTokenService.revokeAllByUser(user);

        return ResponseEntity.ok(Map.of("message", "Đã khóa tài khoản"));
    }

    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        user.setActive(true);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Đã mở khóa tài khoản"));
    }
}
