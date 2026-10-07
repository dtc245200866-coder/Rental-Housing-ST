package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ContractRepository;
import com.rentalhousing.backend.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/my")
public class MyController {

    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;

    public MyController(
            ContractRepository contractRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.contractRepository = contractRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping("/contracts")
    public ResponseEntity<?> myContracts(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Map<String, Object>> result = contractRepository.findByTenantOrderByCreatedAtDesc(user).stream()
                .map(c -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", c.getId());
                    m.put("code", c.getCode());
                    m.put("roomId", c.getRoom().getId());
                    m.put("roomCode", c.getRoom().getCode());
                    m.put("buildingName", c.getRoom().getBuilding().getName());
                    m.put("address", c.getRoom().getBuilding().getAddress());
                    m.put("deposit", c.getDeposit());
                    m.put("rent", c.getRent());
                    m.put("startDate", c.getStartDate().toString());
                    m.put("endDate", c.getEndDate().toString());
                    m.put("status", c.getStatus().name());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/invoices")
    public ResponseEntity<?> myInvoices(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Contract contract : contractRepository.findByTenantOrderByCreatedAtDesc(user)) {
            for (Invoice invoice : invoiceRepository.findByContractIdOrderByPeriodDesc(contract.getId())) {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", invoice.getId());
                m.put("code", invoice.getCode());
                m.put("roomCode", invoice.getRoom().getCode());
                m.put("buildingName", invoice.getRoom().getBuilding().getName());
                m.put("period", invoice.getPeriod());
                m.put("issueDate", invoice.getIssueDate() == null ? "" : invoice.getIssueDate().toString());
                m.put("dueDate", invoice.getDueDate() == null ? "" : invoice.getDueDate().toString());
                m.put("status", invoice.getStatus().name());
                m.put("totalAmount", invoice.getTotalAmount());
                m.put("paidAmount", invoice.getPaidAmount());
                m.put("remaining", invoice.getRemainingAmount());
                result.add(m);
            }
        }

        return ResponseEntity.ok(result);
    }
}
