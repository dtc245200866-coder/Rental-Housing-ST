package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Notification;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.NotificationRepository;
import com.rentalhousing.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/my/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public NotificationController(
            NotificationRepository notificationRepository,
            NotificationService notificationService
    ) {
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> listNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Map<String, Object>> result = notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(n -> Map.<String, Object>of(
                        "id", n.getId(),
                        "title", n.getTitle(),
                        "content", n.getContent() == null ? "" : n.getContent(),
                        "type", n.getType(),
                        "link", n.getLink() == null ? "" : n.getLink(),
                        "read", n.isRead(),
                        "createdAt", n.getCreatedAt().toString()
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.unreadCount(user)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Notification n = notificationRepository.findById(id).orElse(null);
        if (n == null || !n.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền"));
        }
        n.setRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        for (Notification n : notificationRepository.findByUserAndReadFalse(user)) {
            n.setRead(true);
            notificationRepository.save(n);
        }
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả đã đọc"));
    }
}
