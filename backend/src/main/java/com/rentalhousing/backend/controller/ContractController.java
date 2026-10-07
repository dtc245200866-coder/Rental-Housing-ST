package com.rentalhousing.backend.controller;

import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.Roommate;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.ContractRenewalRepository;
import com.rentalhousing.backend.repository.ContractRepository;
import com.rentalhousing.backend.repository.RoommateRepository;
import com.rentalhousing.backend.service.AuditLogService;
import com.rentalhousing.backend.service.ContractService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractRepository contractRepository;
    private final ContractRenewalRepository renewalRepository;
    private final RoommateRepository roommateRepository;
    private final ContractService contractService;
    private final AuditLogService auditLogService;

    public ContractController(
            ContractRepository contractRepository,
            ContractRenewalRepository renewalRepository,
            RoommateRepository roommateRepository,
            ContractService contractService,
            AuditLogService auditLogService
    ) {
        this.contractRepository = contractRepository;
        this.renewalRepository = renewalRepository;
        this.roommateRepository = roommateRepository;
        this.contractService = contractService;
        this.auditLogService = auditLogService;
    }

    private Map<String, Object> toMap(Contract c) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", c.getId());
        m.put("code", c.getCode());
        m.put("tenantId", c.getTenant().getId());
        m.put("tenantName", c.getTenant().getName());
        m.put("tenantPhone", c.getTenant().getPhone());
        m.put("roomId", c.getRoom().getId());
        m.put("roomCode", c.getRoom().getCode());
        m.put("buildingId", c.getRoom().getBuilding().getId());
        m.put("buildingName", c.getRoom().getBuilding().getName());
        m.put("deposit", c.getDeposit());
        m.put("rent", c.getRent());
        m.put("startDate", c.getStartDate().toString());
        m.put("endDate", c.getEndDate().toString());
        m.put("termMonths", c.getTermMonths());
        m.put("billingDay", c.getBillingDay());
        m.put("status", c.getStatus().name());
        return m;
    }

    @GetMapping
    public ResponseEntity<?> listContracts(@RequestParam(required = false) Long buildingId) {
        List<Contract> contracts;
        if (buildingId != null) {
            contracts = contractRepository.findByRoom_BuildingIdOrderByCreatedAtDesc(buildingId);
        } else {
            contracts = contractRepository.findAll();
        }
        return ResponseEntity.ok(contracts.stream().map(this::toMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContract(@PathVariable Long id) {
        Contract c = contractRepository.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();

        Map<String, Object> data = new java.util.HashMap<>(toMap(c));
        data.put("roommates", roommateRepository.findByContractOrderByIdAsc(c).stream()
                .map(r -> Map.<String, Object>of(
                        "id", r.getId(),
                        "name", r.getName(),
                        "phone", r.getPhone() == null ? "" : r.getPhone(),
                        "citizenId", r.getCitizenId() == null ? "" : r.getCitizenId(),
                        "startDate", r.getStartDate() == null ? "" : r.getStartDate().toString(),
                        "moveOutDate", r.getMoveOutDate() == null ? "" : r.getMoveOutDate().toString()
                ))
                .toList());
        data.put("renewals", renewalRepository.findByContractOrderByRenewedAtDesc(c).stream()
                .map(rn -> Map.<String, Object>of(
                        "oldEndDate", rn.getOldEndDate().toString(),
                        "newEndDate", rn.getNewEndDate().toString(),
                        "termMonths", rn.getTermMonths(),
                        "rent", rn.getRent(),
                        "renewedAt", rn.getRenewedAt().toString()
                ))
                .toList());
        return ResponseEntity.ok(data);
    }

    @PostMapping
    public ResponseEntity<?> createContract(Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != User.Role.LANDLORD && user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ chủ nhà mới được lập hợp đồng"));
        }

        try {
            Contract c = contractService.createContract(user, request);
            auditLogService.log(user, "CREATE", "CONTRACT", c.getId(), null, toMap(c));
            return ResponseEntity.ok(Map.of("message", "Lập hợp đồng thành công", "contractId", c.getId(), "code", c.getCode()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<?> renewContract(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        int termMonths = request.get("termMonths") == null ? 0 : ((Number) request.get("termMonths")).intValue();
        long rent = request.get("rent") == null ? 0 : ((Number) request.get("rent")).longValue();

        try {
            Contract c = contractService.renewContract(user, id, termMonths, rent);
            auditLogService.log(user, "RENEW", "CONTRACT", c.getId(), null, Map.of("endDate", c.getEndDate().toString(), "rent", c.getRent()));
            return ResponseEntity.ok(Map.of("message", "Gia hạn hợp đồng thành công", "endDate", c.getEndDate().toString()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/roommates")
    public ResponseEntity<?> addRoommate(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();
        String name = (String) request.get("name");
        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Tên người ở ghép không được để trống"));

        try {
            Roommate r = contractService.addRoommate(id, name, (String) request.get("phone"),
                    (String) request.get("citizenId"), null);
            return ResponseEntity.ok(Map.of("message", "Thêm người ở ghép thành công", "roommateId", r.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/roommates/{roommateId}/move-out")
    public ResponseEntity<?> moveOutRoommate(@PathVariable Long roommateId, @RequestBody Map<String, Object> request) {
        try {
            Roommate r = contractService.moveOutRoommate(roommateId, LocalDate.now());
            return ResponseEntity.ok(Map.of("message", "Đã ghi nhận ngày chuyển đi"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<?> checkout(@PathVariable Long id, Authentication authentication, @RequestBody Map<String, Object> request) {
        User user = (User) authentication.getPrincipal();

        LocalDate moveOutDate;
        try {
            moveOutDate = LocalDate.parse((String) request.get("moveOutDate"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ngày trả phòng không hợp lệ"));
        }

        long finalElectric = request.get("finalElectric") == null ? 0 : ((Number) request.get("finalElectric")).longValue();
        long finalWater = request.get("finalWater") == null ? 0 : ((Number) request.get("finalWater")).longValue();
        long penalty = request.get("penalty") == null ? 0 : ((Number) request.get("penalty")).longValue();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> deductions = (List<Map<String, Object>>) request.get("deductions");

        try {
            Map<String, Object> result = contractService.checkout(user, id, moveOutDate, finalElectric, finalWater, deductions, penalty);
            auditLogService.log(user, "CHECKOUT", "CONTRACT", id, null, result);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
