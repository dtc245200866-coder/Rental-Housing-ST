package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.RefreshToken;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);
}
