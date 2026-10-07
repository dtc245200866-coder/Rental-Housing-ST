package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.dto.ChangePasswordRequest;
import com.rentalhousing.backend.dto.ForgotPasswordRequest;
import com.rentalhousing.backend.dto.LoginRequest;
import com.rentalhousing.backend.dto.LoginResponse;
import com.rentalhousing.backend.dto.RefreshTokenRequest;
import com.rentalhousing.backend.dto.RegisterRequest;
import com.rentalhousing.backend.dto.ResetPasswordRequest;
import com.rentalhousing.backend.dto.VerifyEmailRequest;
import com.rentalhousing.backend.entity.RefreshToken;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.exception.LoginException;
import com.rentalhousing.backend.service.AuthService;
import com.rentalhousing.backend.service.PasswordResetService;
import com.rentalhousing.backend.service.PermissionService;
import com.rentalhousing.backend.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final PermissionService permissionService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            AuthService authService,
            RefreshTokenService refreshTokenService,
            PermissionService permissionService,
            PasswordResetService passwordResetService
    ) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.permissionService = permissionService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(Map.of("message", "Mã xác minh đã được gửi tới email"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        try {
            authService.verifyEmail(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(Map.of("message", "Xác minh email thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (LoginException e) {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("message", e.getMessage());
            if (e.getRemainingAttempts() != null) {
                body.put("remainingAttempts", e.getRemainingAttempts());
            }
            if (e.getLockedUntil() != null) {
                body.put("lockedUntil", e.getLockedUntil().toString());
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            LoginResponse response = authService.refreshAccessToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            RefreshToken refreshToken = refreshTokenService.getValidRefreshToken(request.getRefreshToken());
            refreshTokenService.revoke(refreshToken);
            return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập"));
        }

        User user = (User) authentication.getPrincipal();

        try {
            authService.changePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Liên kết đặt lại mật khẩu đã được gửi tới email"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Chưa đăng nhập"));
        }

        User user = (User) authentication.getPrincipal();

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "phone", user.getPhone(),
                "email", user.getEmail() == null ? "" : user.getEmail(),
                "role", user.getRole().name(),
                "active", user.isActive(),
                "mustChangePassword", user.isMustChangePassword(),
                "permissions", permissionService.getPermissions(user.getRole())
        ));
    }
}
