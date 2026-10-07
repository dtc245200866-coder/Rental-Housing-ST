package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Notification;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    long countByUserAndReadFalse(User user);

    List<Notification> findByUserAndReadFalse(User user);
}
