package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.RoomImage;
import com.rentalhousing.backend.entity.RoomService;
import com.rentalhousing.backend.repository.ListingRepository;
import com.rentalhousing.backend.repository.ListingSpecification;
import com.rentalhousing.backend.repository.RoomImageRepository;
import com.rentalhousing.backend.repository.RoomServiceRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/listings")
public class ListingPublicController {

    private final ListingRepository listingRepository;
    private final RoomImageRepository roomImageRepository;
    private final RoomServiceRepository roomServiceRepository;

    public ListingPublicController(
            ListingRepository listingRepository,
            RoomImageRepository roomImageRepository,
            RoomServiceRepository roomServiceRepository
    ) {
        this.listingRepository = listingRepository;
        this.roomImageRepository = roomImageRepository;
        this.roomServiceRepository = roomServiceRepository;
    }

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) Long minRent,
            @RequestParam(required = false) Long maxRent,
            @RequestParam(required = false) Double minArea,
            @RequestParam(required = false) Double maxArea,
            @RequestParam(required = false) Integer minPeople,
            @RequestParam(required = false, defaultValue = "newest") String sort) {

        Specification<Listing> spec = Specification.where(ListingSpecification.isPublishedAndActive());
        if (district != null && !district.isBlank()) spec = spec.and(ListingSpecification.hasDistrict(district));
        if (minRent != null || maxRent != null) spec = spec.and(ListingSpecification.hasRentBetween(minRent, maxRent));
        if (minArea != null || maxArea != null) spec = spec.and(ListingSpecification.hasAreaBetween(minArea, maxArea));
        if (minPeople != null) spec = spec.and(ListingSpecification.hasMinPeople(minPeople));

        Sort sortOrder = switch (sort) {
            case "price_asc" -> Sort.by("room.rent").ascending();
            case "price_desc" -> Sort.by("room.rent").descending();
            default -> Sort.by("createdAt").descending();
        };

        List<Listing> listings = listingRepository.findAll(spec, sortOrder);

        List<Map<String, Object>> result = listings.stream().map(l -> {
            List<RoomImage> images = roomImageRepository.findByRoomOrderBySortOrderAsc(l.getRoom());
            String cover = images.isEmpty() ? "" : images.get(0).getImageUrl();
            return Map.<String, Object>of(
                    "id", l.getId(),
                    "title", l.getTitle(),
                    "roomCode", l.getRoom().getCode(),
                    "buildingName", l.getRoom().getBuilding().getName(),
                    "district", l.getRoom().getBuilding().getDistrict() == null ? "" : l.getRoom().getBuilding().getDistrict(),
                    "address", l.getRoom().getBuilding().getAddress(),
                    "rent", l.getRoom().getRent(),
                    "area", l.getRoom().getArea(),
                    "maxPeople", l.getRoom().getMaxPeople(),
                    "coverImage", cover
            );
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        Listing l = listingRepository.findById(id).orElse(null);
        if (l == null || l.getStatus() != Listing.Status.PUBLISHED) {
            return ResponseEntity.notFound().build();
        }

        var room = l.getRoom();
        List<Map<String, Object>> images = roomImageRepository.findByRoomOrderBySortOrderAsc(room).stream()
                .map(img -> Map.<String, Object>of("id", img.getId(), "url", img.getImageUrl()))
                .toList();

        List<Map<String, Object>> services = new ArrayList<>();
        long fixedTotal = 0;
        for (RoomService rs : roomServiceRepository.findByRoom(room)) {
            services.add(Map.<String, Object>of(
                    "serviceName", rs.getService().getName(),
                    "calculationMethod", rs.getService().getCalculationMethod().name(),
                    "unit", rs.getService().getUnit(),
                    "price", rs.getPrice()
            ));
            if (rs.getService().getCalculationMethod() == com.rentalhousing.backend.entity.Service.CalculationMethod.FIXED_ROOM) {
                fixedTotal += rs.getPrice();
            }
        }

        Map<String, Object> detail = new java.util.HashMap<>();
        detail.put("id", l.getId());
        detail.put("title", l.getTitle());
        detail.put("description", l.getDescription() == null ? "" : l.getDescription());
        detail.put("roomId", room.getId());
        detail.put("roomCode", room.getCode());
        detail.put("buildingName", room.getBuilding().getName());
        detail.put("address", room.getBuilding().getAddress());
        detail.put("district", room.getBuilding().getDistrict() == null ? "" : room.getBuilding().getDistrict());
        detail.put("area", room.getArea());
        detail.put("rent", room.getRent());
        detail.put("maxPeople", room.getMaxPeople());
        detail.put("depositEstimate", room.getRent());
        detail.put("images", images);
        detail.put("services", services);
        detail.put("estimatedFirstMonth", room.getRent() + fixedTotal);

        return ResponseEntity.ok(detail);
    }
}
