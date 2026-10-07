package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.TenantProfile;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantProfileRepository extends JpaRepository<TenantProfile, Long> {

    Optional<TenantProfile> findByUser(User user);

    Optional<TenantProfile> findByUserId(Long userId);
}
