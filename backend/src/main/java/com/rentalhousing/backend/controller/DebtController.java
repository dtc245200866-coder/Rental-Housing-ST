package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debts")
public class DebtController {

    private final InvoiceRepository invoiceRepository;

    public DebtController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    public ResponseEntity<?> listDebts(@RequestParam(required = false) Long buildingId) {
        List<Invoice> unpaid = invoiceRepository.findAll().stream()
                .filter(i -> i.getRemainingAmount() > 0)
                .filter(i -> i.getStatus() == Invoice.Status.ISSUED || i.getStatus() == Invoice.Status.PARTIAL)
                .filter(i -> buildingId == null || i.getRoom().getBuilding().getId().equals(buildingId))
                .toList();

        // Gom theo phòng (hợp đồng)
        Map<Long, Map<String, Object>> grouped = new LinkedHashMap<>();
        long grandTotal = 0;

        for (Invoice invoice : unpaid) {
            Long roomId = invoice.getRoom().getId();
            Map<String, Object> row = grouped.computeIfAbsent(roomId, k -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("roomId", invoice.getRoom().getId());
                m.put("roomCode", invoice.getRoom().getCode());
                m.put("buildingId", invoice.getRoom().getBuilding().getId());
                m.put("buildingName", invoice.getRoom().getBuilding().getName());
                m.put("tenantName", invoice.getContract().getTenant().getName());
                m.put("tenantPhone", invoice.getContract().getTenant().getPhone());
                m.put("outstandingInvoices", 0L);
                m.put("totalRemaining", 0L);
                m.put("maxOverdueDays", 0L);
                return m;
            });

            row.put("outstandingInvoices", ((Number) row.get("outstandingInvoices")).longValue() + 1);
            row.put("totalRemaining", ((Number) row.get("totalRemaining")).longValue() + invoice.getRemainingAmount());

            if (invoice.getDueDate() != null && invoice.getDueDate().isBefore(LocalDate.now())) {
                long overdueDays = ChronoUnit.DAYS.between(invoice.getDueDate(), LocalDate.now());
                long currentMax = ((Number) row.get("maxOverdueDays")).longValue();
                row.put("maxOverdueDays", Math.max(currentMax, overdueDays));
            }

            grandTotal += invoice.getRemainingAmount();
        }

        List<Map<String, Object>> result = new ArrayList<>(grouped.values());

        return ResponseEntity.ok(Map.of(
                "debts", result,
                "totalRemaining", grandTotal,
                "count", result.size()
        ));
    }
}
