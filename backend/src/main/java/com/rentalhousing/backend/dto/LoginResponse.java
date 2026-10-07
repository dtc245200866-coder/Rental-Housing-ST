package com.rentalhousing.backend.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String role,
        String name,
        boolean mustChangePassword,
        Long userId) {
}
