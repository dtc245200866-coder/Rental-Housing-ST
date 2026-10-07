package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.RoomImage;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.RoomImageRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RoomImageController {

    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public RoomImageController(
            RoomRepository roomRepository,
            RoomImageRepository roomImageRepository
    ) {
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
    }

    @GetMapping("/rooms/{roomId}/images")
    public ResponseEntity<?> listImages(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> result = roomImageRepository.findByRoomOrderBySortOrderAsc(room).stream()
                .map(img -> Map.<String, Object>of(
                        "id", img.getId(),
                        "url", img.getImageUrl(),
                        "sortOrder", img.getSortOrder()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/rooms/{roomId}/images")
    public ResponseEntity<?> uploadImages(
            @PathVariable Long roomId,
            Authentication authentication,
            @RequestParam("images") List<MultipartFile> files) {

        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền tải ảnh"));
        }

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return ResponseEntity.notFound().build();

        int nextOrder = roomImageRepository.findByRoomOrderBySortOrderAsc(room).size();

        try {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
                String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : ".jpg";
                String filename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

                Path dir = Paths.get(uploadDir, "room", String.valueOf(roomId));
                Files.createDirectories(dir);
                file.transferTo(dir.resolve(filename).toFile());

                RoomImage image = new RoomImage();
                image.setRoom(room);
                image.setImageUrl("uploads/room/" + roomId + "/" + filename);
                image.setSortOrder(nextOrder++);
                roomImageRepository.save(image);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tải ảnh thất bại: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("message", "Tải ảnh thành công"));
    }

    @PutMapping("/room-images/order")
    public ResponseEntity<?> reorderImages(@RequestBody Map<String, Object> request) {
        List<?> items = (List<?>) request.get("images");
        if (items == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu danh sách ảnh"));

        for (Object item : items) {
            Map<?, ?> m = (Map<?, ?>) item;
            Long id = ((Number) m.get("id")).longValue();
            int order = ((Number) m.get("sortOrder")).intValue();
            roomImageRepository.findById(id).ifPresent(img -> {
                img.setSortOrder(order);
                roomImageRepository.save(img);
            });
        }

        return ResponseEntity.ok(Map.of("message", "Sắp xếp ảnh thành công"));
    }

    @DeleteMapping("/room-images/{id}")
    public ResponseEntity<?> deleteImage(@PathVariable Long id, Authentication authentication) {
        RoomImage image = roomImageRepository.findById(id).orElse(null);
        if (image == null) return ResponseEntity.notFound().build();

        try {
            Path path = Paths.get(image.getImageUrl());
            Files.deleteIfExists(path);
        } catch (Exception ignored) {
        }

        roomImageRepository.delete(image);
        return ResponseEntity.ok(Map.of("message", "Xóa ảnh thành công"));
    }
}
