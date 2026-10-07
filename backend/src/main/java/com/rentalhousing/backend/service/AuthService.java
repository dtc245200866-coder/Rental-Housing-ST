package com.rentalhousing.backend.service;

import com.rentalhousing.backend.dto.LoginRequest;
import com.rentalhousing.backend.dto.LoginResponse;
import com.rentalhousing.backend.dto.RegisterRequest;
import com.rentalhousing.backend.entity.EmailVerification;
import com.rentalhousing.backend.entity.RefreshToken;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.exception.LoginException;
import com.rentalhousing.backend.repository.EmailVerificationRepository;
import com.rentalhousing.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailVerificationRepository emailVerificationRepository;
    private final MailService mailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            EmailVerificationRepository emailVerificationRepository,
            MailService mailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.emailVerificationRepository = emailVerificationRepository;
        this.mailService = mailService;
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email không được để trống");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        String otp = String.format("%06d", new Random().nextInt(1_000_000));

        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc(request.getEmail())
                .orElse(new EmailVerification());

        verification.setEmail(request.getEmail());
        verification.setName(request.getName());
        verification.setPhone(request.getPhone());
        verification.setPassword(passwordEncoder.encode(request.getPassword()));
        verification.setOtp(otp);
        verification.setCreatedAt(LocalDateTime.now());
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        emailVerificationRepository.save(verification);

        try {
            mailService.sendVerificationOtpMail(request.getEmail(), otp);
        } catch (Exception e) {
            log.warn("Không gửi được email OTP cho {}: {}", request.getEmail(), e.getMessage());
        }
    }

    public void verifyEmail(String email, String otp) {
        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã xác minh"));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã xác minh đã hết hạn");
        }

        if (!verification.getOtp().equals(otp)) {
            throw new RuntimeException("Mã xác minh không chính xác");
        }

        if (userRepository.existsByEmail(verification.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }
        if (userRepository.existsByPhone(verification.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng");
        }

        User user = new User();
        user.setName(verification.getName());
        user.setPhone(verification.getPhone());
        user.setEmail(verification.getEmail());
        user.setPassword(verification.getPassword());
        user.setRole(User.Role.TENANT);
        user.setActive(true);
        user.setMustChangePassword(false);
        user.setFailedLoginAttempts(0);

        userRepository.save(user);
        emailVerificationRepository.delete(verification);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getIdentifier())
                .orElseGet(() -> userRepository.findByEmail(request.getIdentifier()).orElse(null));

        if (user == null) {
            throw new LoginException("Thông tin đăng nhập không chính xác", null, null);
        }

        if (!user.isActive()) {
            throw new LoginException("Tài khoản đang bị khóa", null, null);
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new LoginException("Tài khoản bị khóa do nhập sai quá 5 lần", null, user.getLockedUntil());
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= 5) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
                throw new LoginException("Tài khoản bị khóa do nhập sai quá 5 lần", null, user.getLockedUntil());
            }
            userRepository.save(user);
            throw new LoginException("Thông tin đăng nhập không chính xác", 5 - attempts, null);
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new LoginResponse(
                accessToken,
                refreshToken.getToken(),
                user.getRole().name(),
                user.getName(),
                user.isMustChangePassword(),
                user.getId()
        );
    }

    public LoginResponse refreshAccessToken(String token) {
        RefreshToken refreshToken = refreshTokenService.getValidRefreshToken(token);
        User user = refreshToken.getUser();

        if (!user.isActive()) {
            throw new RuntimeException("Tài khoản đang bị khóa");
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        return new LoginResponse(
                newAccessToken,
                refreshToken.getToken(),
                user.getRole().name(),
                user.getName(),
                user.isMustChangePassword(),
                user.getId()
        );
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }
}
