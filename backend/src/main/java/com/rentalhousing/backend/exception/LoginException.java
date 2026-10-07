package com.rentalhousing.backend.exception;

import java.time.LocalDateTime;

/**
 * Lỗi đăng nhập mang theo thông tin bổ sung cho client:
 * số lần thử còn lại và thời điểm hết khóa (nếu tài khoản bị khóa tạm).
 */
public class LoginException extends RuntimeException {

    private final Integer remainingAttempts;
    private final LocalDateTime lockedUntil;

    public LoginException(String message, Integer remainingAttempts, LocalDateTime lockedUntil) {
        super(message);
        this.remainingAttempts = remainingAttempts;
        this.lockedUntil = lockedUntil;
    }

    public Integer getRemainingAttempts() {
        return remainingAttempts;
    }

    public LocalDateTime getLockedUntil() {
        return lockedUntil;
    }
}
