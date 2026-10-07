package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.InvoiceItem;
import com.rentalhousing.backend.entity.Payment;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingRepository;
import com.rentalhousing.backend.repository.InvoiceRepository;
import com.rentalhousing.backend.repository.PaymentRepository;
import com.rentalhousing.backend.service.InvoiceService;
import com.rentalhousing.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final BuildingRepository buildingRepository;
    private final InvoiceService invoiceService;
    private final NotificationService notificationService;

    public InvoiceController(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            BuildingRepository buildingRepository,
            InvoiceService invoiceService,
            NotificationService notificationService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.buildingRepository = buildingRepository;
        this.invoiceService = invoiceService;
        this.notificationService = notificationService;
    }

    private Map<String, Object> toMap(Invoice i) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", i.getId());
        m.put("code", i.getCode());
        m.put("contractId", i.getContract().getId());
        m.put("roomId", i.getRoom().getId());
        m.put("roomCode", i.getRoom().getCode());
        m.put("buildingName", i.getRoom().getBuilding().getName());
        m.put("tenantName", i.getContract().getTenant().getName());
        m.put("period", i.getPeriod());
        m.put("issueDate", i.getIssueDate() == null ? "" : i.getIssueDate().toString());
        m.put("dueDate", i.getDueDate() == null ? "" : i.getDueDate().toString());
        m.put("status", i.getStatus().name());
        m.put("totalAmount", i.getTotalAmount());
        m.put("paidAmount", i.getPaidAmount());
        m.put("remaining", i.getRemainingAmount());
        return m;
    }

    @GetMapping
    public ResponseEntity<?> listInvoices(
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) String period) {

        List<Invoice> invoices;
        if (buildingId != null && period != null) {
            invoices = invoiceRepository.findByRoom_BuildingIdAndPeriod(buildingId, period);
        } else if (period != null) {
            invoices = invoiceRepository.findByPeriod(period);
        } else {
            invoices = invoiceRepository.findAll();
        }

        return ResponseEntity.ok(invoices.stream().map(this::toMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findById(id).orElse(null);
        if (invoice == null) return ResponseEntity.notFound().build();

        Map<String, Object> data = new java.util.HashMap<>(toMap(invoice));
        data.put("items", invoice.getItems().stream()
                .map(it -> Map.<String, Object>of(
                        "id", it.getId(),
                        "itemType", it.getItemType().name(),
                        "name", it.getName(),
                        "quantity", it.getQuantity(),
                        "unit", it.getUnit() == null ? "" : it.getUnit(),
                        "unitPrice", it.getUnitPrice(),
                        "amount", it.getAmount()
                ))
                .toList());
        data.put("payments", paymentRepository.findByInvoiceOrderByCreatedAtDesc(invoice).stream()
                .map(p -> Map.<String, Object>of(
                        "id", p.getId(),
                        "amount", p.getAmount(),
                        "paymentDate", p.getPaymentDate().toString(),
                        "method", p.getMethod().name(),
                        "status", p.getStatus().name(),
                        "proofImageUrl", p.getProofImageUrl() == null ? "" : p.getProofImageUrl(),
                        "note", p.getNote() == null ? "" : p.getNote()
                ))
                .toList());
        return ResponseEntity.ok(data);
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ chủ nhà mới được phát hành hoá đơn"));
        }

        if (request.get("buildingId") == null || request.get("period") == null || ((String) request.get("period")).isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phải chọn toà nhà và kỳ hoá đơn"));
        }

        Long buildingId = ((Number) request.get("buildingId")).longValue();
        String period = (String) request.get("period");

        var building = buildingRepository.findById(buildingId).orElse(null);
        if (building == null) return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy toà nhà"));

        Map<String, Object> result = invoiceService.generateInvoices(building, period);
        return ResponseEntity.ok(Map.of("message", "Phát hành hoá đơn hoàn tất", "result", result));
    }

    @PutMapping("/{id}/issue")
    public ResponseEntity<?> issue(@PathVariable Long id, Authentication authentication) {
        try {
            Invoice invoice = invoiceService.issueInvoice(id, (User) authentication.getPrincipal());
            try {
                notificationService.notifyInvoiceIssued(invoice);
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(Map.of("message", "Phát hành hoá đơn thành công", "status", invoice.getStatus().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        try {
            Invoice invoice = invoiceService.cancelInvoice(id, (User) authentication.getPrincipal(), (String) request.get("reason"));
            return ResponseEntity.ok(Map.of("message", "Đã huỷ hoá đơn", "status", invoice.getStatus().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDraft(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("extraItems");
            Invoice invoice = invoiceService.updateDraftInvoice(id, (String) request.get("note"), items);
            return ResponseEntity.ok(Map.of("message", "Cập nhật hoá đơn nháp thành công", "totalAmount", invoice.getTotalAmount()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
