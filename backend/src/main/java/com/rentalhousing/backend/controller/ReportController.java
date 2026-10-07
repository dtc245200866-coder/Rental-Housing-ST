package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.repository.InvoiceRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final InvoiceRepository invoiceRepository;
    private final RoomRepository roomRepository;

    public ReportController(InvoiceRepository invoiceRepository, RoomRepository roomRepository) {
        this.invoiceRepository = invoiceRepository;
        this.roomRepository = roomRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary(
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false, defaultValue = "6") int months) {

        if (months > 12) months = 12;

        YearMonth now = YearMonth.now();
        List<Map<String, Object>> monthly = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            String period = ym.toString();

            List<Invoice> invoices = invoiceRepository.findByPeriod(period).stream()
                    .filter(inv -> buildingId == null || inv.getRoom().getBuilding().getId().equals(buildingId))
                    .toList();

            long issued = invoices.stream().mapToLong(Invoice::getTotalAmount).sum();
            long collected = invoices.stream().mapToLong(Invoice::getPaidAmount).sum();

            monthly.add(Map.of(
                    "period", period,
                    "issued", issued,
                    "collected", collected,
                    "remaining", issued - collected
            ));
        }

        // Tỉ lệ lấp đầy hiện tại
        List<Room> rooms = buildingId == null
                ? roomRepository.findAll()
                : roomRepository.findAll().stream().filter(r -> r.getBuilding().getId().equals(buildingId)).toList();
        long totalRooms = rooms.stream().filter(r -> r.getStatus() != Room.Status.STOPPED).count();
        long rentedRooms = rooms.stream().filter(r -> r.getStatus() == Room.Status.RENTED).count();
        double occupancyRate = totalRooms == 0 ? 0 : Math.round(rentedRooms * 1000.0 / totalRooms) / 10.0;

        return ResponseEntity.ok(Map.of(
                "monthly", monthly,
                "totalRooms", totalRooms,
                "rentedRooms", rentedRooms,
                "occupancyRate", occupancyRate
        ));
    }
}
