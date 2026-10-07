package com.rentalhousing.backend.dto;

public record AdminUserResponse(
        Long id,
        String name,
        String phone,
        String email,
        String role,
        boolean active,
        boolean mustChangePassword) {
}
