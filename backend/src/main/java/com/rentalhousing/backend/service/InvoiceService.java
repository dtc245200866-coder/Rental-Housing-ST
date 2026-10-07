package com.rentalhousing.backend.service;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.BuildingService;
import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.InvoiceItem;
import com.rentalhousing.backend.entity.MeterReading;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.RoomService;
import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingServiceRepository;
import com.rentalhousing.backend.repository.ContractRepository;
import com.rentalhousing.backend.repository.InvoiceRepository;
import com.rentalhousing.backend.repository.MeterReadingRepository;
import com.rentalhousing.backend.repository.RoomServiceRepository;
import com.rentalhousing.backend.repository.RoommateRepository;
import com.rentalhousing.backend.repository.ServiceRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@org.springframework.stereotype.Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final BuildingServiceRepository buildingServiceRepository;
    private final RoomServiceRepository roomServiceRepository;
    private final RoommateRepository roommateRepository;
    private final ServiceRepository serviceRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            ContractRepository contractRepository,
            MeterReadingRepository meterReadingRepository,
            BuildingServiceRepository buildingServiceRepository,
            RoomServiceRepository roomServiceRepository,
            RoommateRepository roommateRepository,
            ServiceRepository serviceRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.contractRepository = contractRepository;
        this.meterReadingRepository = meterReadingRepository;
        this.buildingServiceRepository = buildingServiceRepository;
        this.roomServiceRepository = roomServiceRepository;
        this.roommateRepository = roommateRepository;
        this.serviceRepository = serviceRepository;
    }

    private int peopleCount(Contract contract) {
        return 1 + (int) roommateRepository.countByContractAndMoveOutDateIsNull(contract);
    }

    private String nextInvoiceCode(String period) {
        String prefix = "HD-" + period.replace("-", "") + "-";
        long count = invoiceRepository.countByCodeStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private void addItem(Invoice invoice, InvoiceItem.ItemType type, String name,
                         double quantity, String unit, long unitPrice, long amount) {
        InvoiceItem item = new InvoiceItem();
        item.setItemType(type);
        item.setName(name);
        item.setQuantity(quantity);
        item.setUnit(unit);
        item.setUnitPrice(unitPrice);
        item.setAmount(amount);
        invoice.addItem(item);
    }

    /**
     * Tính một hoá đơn nháp cho phòng trong kỳ, dựa trên hợp đồng đang hiệu lực
     * và chỉ số điện nước đã chốt.
     */
    private Invoice buildInvoice(Contract contract, MeterReading reading, String period) {
        Room room = contract.getRoom();
        Building building = room.getBuilding();
        int people = peopleCount(contract);
        LocalDate priceDate = YearMonth.parse(period).atEndOfMonth();

        Invoice invoice = new Invoice();
        invoice.setCode(nextInvoiceCode(period));
        invoice.setContract(contract);
        invoice.setRoom(room);
        invoice.setPeriod(period);
        invoice.setStatus(Invoice.Status.DRAFT);
        invoice.setCreatedAt(LocalDateTime.now());

        // 1. Tiền phòng
        addItem(invoice, InvoiceItem.ItemType.ROOM_RENT, "Tiền phòng", 1, "tháng",
                contract.getRent(), contract.getRent());

        // 2. Điện
        Service elec = serviceRepository.findByName("Điện").orElse(null);
        if (elec != null) {
            buildingServiceRepository
                    .findFirstByBuildingAndServiceAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                            building, elec, priceDate)
                    .ifPresent(cfg -> {
                        if (cfg.getCalculationMethod() == Service.CalculationMethod.BY_METER) {
                            long consumption = reading.getElectricConsumption();
                            addItem(invoice, InvoiceItem.ItemType.ELECTRICITY, "Tiền điện",
                                    consumption, "kWh", cfg.getPrice(), consumption * cfg.getPrice());
                        } else if (cfg.getCalculationMethod() == Service.CalculationMethod.BY_PERSON) {
                            addItem(invoice, InvoiceItem.ItemType.ELECTRICITY, "Tiền điện (khoán)",
                                    people, "người", cfg.getPrice(), people * cfg.getPrice());
                        }
                    });
        }

        // 3. Nước
        Service water = serviceRepository.findByName("Nước").orElse(null);
        if (water != null) {
            buildingServiceRepository
                    .findFirstByBuildingAndServiceAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                            building, water, priceDate)
                    .ifPresent(cfg -> {
                        if (cfg.getCalculationMethod() == Service.CalculationMethod.BY_METER) {
                            long consumption = reading.getWaterConsumption();
                            addItem(invoice, InvoiceItem.ItemType.WATER, "Tiền nước",
                                    consumption, "m3", cfg.getPrice(), consumption * cfg.getPrice());
                        } else if (cfg.getCalculationMethod() == Service.CalculationMethod.BY_PERSON) {
                            addItem(invoice, InvoiceItem.ItemType.WATER, "Tiền nước (khoán)",
                                    people, "người", cfg.getPrice(), people * cfg.getPrice());
                        }
                    });
        }

        // 4. Dịch vụ cố định / theo đầu người (áp dụng riêng cho phòng)
        for (RoomService rs : roomServiceRepository.findByRoom(room)) {
            Service svc = rs.getService();
            if ("Điện".equals(svc.getName()) || "Nước".equals(svc.getName())) {
                continue; // đã tính ở bước trên
            }
            if (svc.getCalculationMethod() == Service.CalculationMethod.FIXED_ROOM) {
                addItem(invoice, InvoiceItem.ItemType.SERVICE_FIXED, svc.getName(),
                        1, svc.getUnit(), rs.getPrice(), rs.getPrice());
            } else if (svc.getCalculationMethod() == Service.CalculationMethod.BY_PERSON) {
                addItem(invoice, InvoiceItem.ItemType.SERVICE_PERSON, svc.getName(),
                        people, "người", rs.getPrice(), people * rs.getPrice());
            }
        }

        long total = invoice.getItems().stream().mapToLong(InvoiceItem::getAmount).sum();
        invoice.setTotalAmount(total);

        return invoice;
    }

    /**
     * S3-06: Phát hành hoá đơn hàng loạt cho một toà nhà trong một kỳ.
     */
    @Transactional
    public Map<String, Object> generateInvoices(Building building, String period) {
        List<String> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        List<Contract> contracts = contractRepository.findByRoom_BuildingIdOrderByCreatedAtDesc(building.getId()).stream()
                .filter(c -> c.getStatus() == Contract.Status.ACTIVE)
                .toList();

        for (Contract contract : contracts) {
            Room room = contract.getRoom();
            if (invoiceRepository.existsByRoomAndPeriod(room, period)) {
                skipped.add(room.getCode() + " (đã có hoá đơn)");
                continue;
            }

            MeterReading reading = meterReadingRepository.findByRoomAndPeriod(room, period).orElse(null);
            if (reading == null) {
                skipped.add(room.getCode() + " (chưa chốt chỉ số)");
                continue;
            }

            Invoice invoice = buildInvoice(contract, reading, period);
            invoiceRepository.save(invoice);

            reading.setStatus(MeterReading.Status.FINALIZED);
            meterReadingRepository.save(reading);

            created.add(room.getCode());
        }

        return Map.of(
                "created", created,
                "createdCount", created.size(),
                "skipped", skipped,
                "skippedCount", skipped.size()
        );
    }

    @Transactional
    public Invoice issueInvoice(Long invoiceId, User user) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoá đơn"));

        if (invoice.getStatus() != Invoice.Status.DRAFT) {
            throw new RuntimeException("Chỉ hoá đơn nháp mới phát hành được");
        }

        LocalDate today = LocalDate.now();
        invoice.setIssueDate(today);
        invoice.setDueDate(today.plusDays(7));
        invoice.setStatus(Invoice.Status.ISSUED);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice cancelInvoice(Long invoiceId, User user, String reason) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoá đơn"));

        if (invoice.getStatus() == Invoice.Status.DRAFT) {
            invoice.setStatus(Invoice.Status.CANCELLED);
            invoice.setNote("Đã huỷ: " + reason);
        } else {
            throw new RuntimeException("Hoá đơn đã phát hành không thể huỷ trực tiếp");
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateDraftInvoice(Long invoiceId, String note, List<Map<String, Object>> extraItems) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hoá đơn"));

        if (invoice.getStatus() != Invoice.Status.DRAFT) {
            throw new RuntimeException("Chỉ hoá đơn nháp mới sửa được");
        }

        if (note != null) {
            invoice.setNote(note);
        }

        if (extraItems != null) {
            for (Map<String, Object> item : extraItems) {
                String name = (String) item.get("name");
                long amount = ((Number) item.get("amount")).longValue();
                String type = (String) item.get("type");

                InvoiceItem.ItemType itemType;
                if ("DISCOUNT".equalsIgnoreCase(type)) {
                    itemType = InvoiceItem.ItemType.DISCOUNT;
                    amount = -Math.abs(amount);
                } else {
                    itemType = InvoiceItem.ItemType.EXTRA;
                }

                addItem(invoice, itemType, name, 1, "", amount, amount);
            }
            long total = invoice.getItems().stream().mapToLong(InvoiceItem::getAmount).sum();
            invoice.setTotalAmount(total);
        }

        return invoiceRepository.save(invoice);
    }
}
