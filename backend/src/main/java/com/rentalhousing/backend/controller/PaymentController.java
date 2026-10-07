package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.Payment;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.InvoiceRepository;
import com.rentalhousing.backend.repository.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentController(
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    private void recomputeInvoiceStatus(Invoice invoice) {
        if (invoice.getPaidAmount() >= invoice.getTotalAmount()) {
            invoice.setStatus(Invoice.Status.PAID);
        } else if (invoice.getPaidAmount() > 0) {
            invoice.setStatus(Invoice.Status.PARTIAL);
        } else {
            invoice.setStatus(Invoice.Status.ISSUED);
        }
        invoiceRepository.save(invoice);
    }

    /* Tenant báo đã thanh toán (S4-01) */
    @PostMapping("/api/my/payments")
    public ResponseEntity<?> submitPayment(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();

        Long invoiceId = request.get("invoiceId") == null ? null : ((Number) request.get("invoiceId")).longValue();
        Long amount = request.get("amount") == null ? null : ((Number) request.get("amount")).longValue();
        String methodStr = (String) request.get("method");

        if (invoiceId == null || amount == null || methodStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin thanh toán"));
        }

        Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (invoice == null) return ResponseEntity.notFound().build();

        if (!invoice.getContract().getTenant().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Không có quyền thanh toán hoá đơn này"));
        }

        if (amount <= 0 || amount > invoice.getRemainingAmount()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền phải lớn hơn 0 và không vượt quá số còn phải trả"));
        }

        Payment.Method method;
        try {
            method = Payment.Method.valueOf(methodStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Hình thức thanh toán không hợp lệ: CASH, TRANSFER"));
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setPaymentDate(LocalDate.now());
        payment.setMethod(method);
        payment.setStatus(Payment.Status.PENDING);
        payment.setProofImageUrl((String) request.get("proofImageUrl"));
        payment.setNote((String) request.get("note"));
        payment.setSubmittedBy(user);
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        return ResponseEntity.ok(Map.of("message", "Đã gửi báo thanh toán, chờ chủ nhà xác nhận", "paymentId", payment.getId()));
    }

    @GetMapping("/api/payments")
    public ResponseEntity<?> listPayments(@RequestParam(required = false) Long invoiceId) {
        List<Payment> payments;
        if (invoiceId != null) {
            Invoice invoice = invoiceRepository.findById(invoiceId).orElse(null);
            if (invoice == null) return ResponseEntity.notFound().build();
            payments = paymentRepository.findByInvoiceOrderByCreatedAtDesc(invoice);
        } else {
            payments = paymentRepository.findAll();
        }

        return ResponseEntity.ok(payments.stream().map(p -> Map.<String, Object>of(
                "id", p.getId(),
                "invoiceId", p.getInvoice().getId(),
                "invoiceCode", p.getInvoice().getCode(),
                "amount", p.getAmount(),
                "paymentDate", p.getPaymentDate().toString(),
                "method", p.getMethod().name(),
                "status", p.getStatus().name(),
                "proofImageUrl", p.getProofImageUrl() == null ? "" : p.getProofImageUrl(),
                "note", p.getNote() == null ? "" : p.getNote()
        )).toList());
    }

    /* Chủ nhà xác nhận đã thu (S4-02) */
    @PutMapping("/api/payments/{id}/confirm")
    public ResponseEntity<?> confirmPayment(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();

        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null) return ResponseEntity.notFound().build();

        if (payment.getStatus() == Payment.Status.CONFIRMED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lần thanh toán này đã được xác nhận"));
        }

        Invoice invoice = payment.getInvoice();

        if (payment.getAmount() > invoice.getRemainingAmount()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số tiền vượt quá số còn phải trả"));
        }

        payment.setStatus(Payment.Status.CONFIRMED);
        payment.setConfirmedBy(user);
        payment.setConfirmedAt(LocalDateTime.now());
        if (request.get("method") != null) {
            try {
                payment.setMethod(Payment.Method.valueOf(((String) request.get("method")).toUpperCase()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (request.get("paymentDate") != null) {
            payment.setPaymentDate(LocalDate.parse((String) request.get("paymentDate")));
        }
        paymentRepository.save(payment);

        invoice.setPaidAmount(invoice.getPaidAmount() + payment.getAmount());
        recomputeInvoiceStatus(invoice);

        return ResponseEntity.ok(Map.of("message", "Xác nhận đã thu thành công", "remaining", invoice.getRemainingAmount(), "status", invoice.getStatus().name()));
    }

    @PutMapping("/api/payments/{id}/cancel")
    public ResponseEntity<?> cancelPayment(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        Payment payment = paymentRepository.findById(id).orElse(null);
        if (payment == null) return ResponseEntity.notFound().build();
        if (payment.getStatus() == Payment.Status.CANCELLED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lần thanh toán này đã bị huỷ"));
        }

        Invoice invoice = payment.getInvoice();

        if (payment.getStatus() == Payment.Status.CONFIRMED) {
            invoice.setPaidAmount(Math.max(0, invoice.getPaidAmount() - payment.getAmount()));
        }

        payment.setStatus(Payment.Status.CANCELLED);
        payment.setNote((String) request.get("reason"));
        paymentRepository.save(payment);

        recomputeInvoiceStatus(invoice);

        return ResponseEntity.ok(Map.of("message", "Đã huỷ lần thanh toán", "remaining", invoice.getRemainingAmount()));
    }
}
