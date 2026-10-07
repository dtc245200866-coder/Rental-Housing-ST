package com.rentalhousing.backend.service;

import com.rentalhousing.backend.entity.BuildingService;
import com.rentalhousing.backend.entity.Contract;
import com.rentalhousing.backend.entity.ContractRenewal;
import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.InvoiceItem;
import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.MeterReading;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.Roommate;
import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingServiceRepository;
import com.rentalhousing.backend.repository.ContractRenewalRepository;
import com.rentalhousing.backend.repository.ContractRepository;
import com.rentalhousing.backend.repository.InvoiceRepository;
import com.rentalhousing.backend.repository.ListingRepository;
import com.rentalhousing.backend.repository.MeterReadingRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.repository.RoommateRepository;
import com.rentalhousing.backend.repository.ServiceRepository;
import com.rentalhousing.backend.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@org.springframework.stereotype.Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractRenewalRepository renewalRepository;
    private final RoomRepository roomRepository;
    private final RoommateRepository roommateRepository;
    private final ListingRepository listingRepository;
    private final InvoiceRepository invoiceRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final BuildingServiceRepository buildingServiceRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    public ContractService(
            ContractRepository contractRepository,
            ContractRenewalRepository renewalRepository,
            RoomRepository roomRepository,
            RoommateRepository roommateRepository,
            ListingRepository listingRepository,
            InvoiceRepository invoiceRepository,
            MeterReadingRepository meterReadingRepository,
            BuildingServiceRepository buildingServiceRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository
    ) {
        this.contractRepository = contractRepository;
        this.renewalRepository = renewalRepository;
        this.roomRepository = roomRepository;
        this.roommateRepository = roommateRepository;
        this.listingRepository = listingRepository;
        this.invoiceRepository = invoiceRepository;
        this.meterReadingRepository = meterReadingRepository;
        this.buildingServiceRepository = buildingServiceRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
    }

    private String nextContractCode() {
        String prefix = "HD-" + LocalDate.now().getYear() + "-";
        long count = contractRepository.countByCodeStartingWith(prefix);
        return prefix + String.format("%04d", count + 1);
    }

    @Transactional
    public Contract createContract(User landlord, Map<String, Object> request) {
        Long roomId = ((Number) request.get("roomId")).longValue();
        Long tenantId = ((Number) request.get("tenantId")).longValue();

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));

        if (room.getStatus() == Room.Status.RENTED) {
            throw new RuntimeException("Phòng đang có hợp đồng hiệu lực");
        }
        if (contractRepository.existsByRoomAndStatus(room, Contract.Status.ACTIVE)) {
            throw new RuntimeException("Phòng đã có hợp đồng hiệu lực");
        }

        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách thuê"));

        long rent = ((Number) request.get("rent")).longValue();
        long deposit = request.get("deposit") == null ? rent : ((Number) request.get("deposit")).longValue();
        LocalDate startDate = LocalDate.parse((String) request.get("startDate"));
        int termMonths = ((Number) request.get("termMonths")).intValue();
        int billingDay = request.get("billingDay") == null ? startDate.getDayOfMonth() : ((Number) request.get("billingDay")).intValue();

        if (rent < 500000) throw new RuntimeException("Giá thuê phải từ 500.000đ");
        if (deposit < 0 || deposit > 3 * rent) throw new RuntimeException("Tiền cọc phải từ 0 đến 3 tháng giá thuê");
        if (termMonths <= 0) throw new RuntimeException("Kỳ hạn phải lớn hơn 0");

        LocalDate endDate = startDate.plusMonths(termMonths);

        Contract contract = new Contract();
        contract.setCode(nextContractCode());
        contract.setTenant(tenant);
        contract.setRoom(room);
        contract.setDeposit(deposit);
        contract.setRent(rent);
        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setTermMonths(termMonths);
        contract.setBillingDay(billingDay);
        contract.setStatus(Contract.Status.ACTIVE);
        contract.setCreatedBy(landlord);
        contract.setCreatedAt(LocalDateTime.now());
        contractRepository.save(contract);

        // Chuyển phòng sang Đang thuê + ẩn tin đăng (S3-04)
        room.setStatus(Room.Status.RENTED);
        roomRepository.save(room);

        listingRepository.findFirstByRoomAndStatusOrderByCreatedAtDesc(room, Listing.Status.PUBLISHED)
                .ifPresent(l -> {
                    l.setStatus(Listing.Status.RENTED);
                    listingRepository.save(l);
                });

        return contract;
    }

    @Transactional
    public Contract renewContract(User landlord, Long contractId, int termMonths, long newRent) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng"));

        if (contract.getStatus() != Contract.Status.ACTIVE) {
            throw new RuntimeException("Chỉ hợp đồng đang hiệu lực mới gia hạn được");
        }
        if (termMonths <= 0) throw new RuntimeException("Kỳ hạn phải lớn hơn 0");
        if (newRent <= 0) newRent = contract.getRent();

        LocalDate oldEndDate = contract.getEndDate();
        LocalDate newEndDate = oldEndDate.plusMonths(termMonths);

        ContractRenewal renewal = new ContractRenewal();
        renewal.setContract(contract);
        renewal.setOldEndDate(oldEndDate);
        renewal.setNewEndDate(newEndDate);
        renewal.setTermMonths(termMonths);
        renewal.setRent(newRent);
        renewal.setRenewedBy(landlord);
        renewal.setRenewedAt(LocalDateTime.now());
        renewalRepository.save(renewal);

        contract.setEndDate(newEndDate);
        contract.setRent(newRent);
        contract.setTermMonths(contract.getTermMonths() + termMonths);
        contract.setStatus(Contract.Status.RENEWED);
        contractRepository.save(contract);

        return contract;
    }

    @Transactional
    public Roommate addRoommate(Long contractId, String name, String phone, String citizenId, LocalDate startDate) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng"));

        long activePeople = 1 + roommateRepository.countByContractAndMoveOutDateIsNull(contract);
        if (activePeople >= contract.getRoom().getMaxPeople()) {
            throw new RuntimeException("Phòng đã đủ số người tối đa " + contract.getRoom().getMaxPeople());
        }

        Roommate roommate = new Roommate();
        roommate.setContract(contract);
        roommate.setName(name);
        roommate.setPhone(phone);
        roommate.setCitizenId(citizenId);
        roommate.setStartDate(startDate == null ? LocalDate.now() : startDate);
        return roommateRepository.save(roommate);
    }

    @Transactional
    public Roommate moveOutRoommate(Long roommateId, LocalDate moveOutDate) {
        Roommate roommate = roommateRepository.findById(roommateId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người ở ghép"));
        roommate.setMoveOutDate(moveOutDate == null ? LocalDate.now() : moveOutDate);
        return roommateRepository.save(roommate);
    }

    /**
     * S4-04: Trả phòng và tất toán tiền cọc.
     */
    @Transactional
    public Map<String, Object> checkout(
            User landlord,
            Long contractId,
            LocalDate moveOutDate,
            long finalElectric,
            long finalWater,
            List<Map<String, Object>> deductions,
            long penalty) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng"));

        if (contract.getStatus() != Contract.Status.ACTIVE && contract.getStatus() != Contract.Status.RENEWED) {
            throw new RuntimeException("Hợp đồng không còn hiệu lực");
        }

        Room room = contract.getRoom();

        // Chỉ số cuối cùng đã ghi
        List<MeterReading> readings = meterReadingRepository.findByRoomIdOrderByPeriodDesc(room.getId());
        long prevElectric = readings.isEmpty() ? 0 : readings.get(0).getCurrentElectric();
        long prevWater = readings.isEmpty() ? 0 : readings.get(0).getCurrentWater();

        if (finalElectric < prevElectric || finalWater < prevWater) {
            throw new RuntimeException("Chỉ số cuối cùng không được nhỏ hơn chỉ số đã ghi gần nhất");
        }

        // Hoá đơn kỳ cuối
        Invoice finalInvoice = new Invoice();
        finalInvoice.setCode("HD-" + LocalDate.now().getYear() + "-" + contract.getCode().replace("HD-", "") + "-CK");
        finalInvoice.setContract(contract);
        finalInvoice.setRoom(room);
        finalInvoice.setPeriod(YearMonth.from(moveOutDate).toString());
        finalInvoice.setIssueDate(moveOutDate);
        finalInvoice.setDueDate(moveOutDate);
        finalInvoice.setStatus(Invoice.Status.ISSUED);
        finalInvoice.setCreatedAt(LocalDateTime.now());

        // Tiền phòng theo tỉ lệ ngày ở thực tế
        LocalDate lastBilling = readings.isEmpty()
                ? contract.getStartDate()
                : YearMonth.parse(readings.get(0).getPeriod()).atEndOfMonth();
        long days = Math.max(1, ChronoUnit.DAYS.between(lastBilling, moveOutDate));
        long proratedRent = Math.round(contract.getRent() * days / 30.0);

        InvoiceItem rentItem = new InvoiceItem();
        rentItem.setInvoice(finalInvoice);
        rentItem.setItemType(InvoiceItem.ItemType.ROOM_RENT);
        rentItem.setName("Tiền phòng (" + days + " ngày)");
        rentItem.setQuantity(days);
        rentItem.setUnit("ngày");
        rentItem.setUnitPrice(Math.round(contract.getRent() / 30.0));
        rentItem.setAmount(proratedRent);
        finalInvoice.addItem(rentItem);

        // Điện nước phát sinh
        LocalDate priceDate = moveOutDate;
        long electricPrice = priceFor(room, "Điện", priceDate);
        long waterPrice = priceFor(room, "Nước", priceDate);
        long electricAmount = (finalElectric - prevElectric) * electricPrice;
        long waterAmount = (finalWater - prevWater) * waterPrice;

        addItem(finalInvoice, InvoiceItem.ItemType.ELECTRICITY, "Tiền điện",
                finalElectric - prevElectric, "kWh", electricPrice, electricAmount);
        addItem(finalInvoice, InvoiceItem.ItemType.WATER, "Tiền nước",
                finalWater - prevWater, "m3", waterPrice, waterAmount);

        finalInvoice.setTotalAmount(proratedRent + electricAmount + waterAmount);
        invoiceRepository.save(finalInvoice);

        // Công nợ còn lại các kỳ trước
        long outstandingDebt = invoiceRepository.findByContractIdOrderByPeriodDesc(contractId).stream()
                .filter(i -> !i.getId().equals(finalInvoice.getId()))
                .mapToLong(Invoice::getRemainingAmount)
                .sum();

        // Khấu trừ hư hỏng
        long totalDeductions = penalty;
        List<Map<String, Object>> deductionList = new java.util.ArrayList<>();
        if (deductions != null) {
            for (Map<String, Object> d : deductions) {
                String name = (String) d.get("name");
                long amount = ((Number) d.get("amount")).longValue();
                totalDeductions += amount;
                deductionList.add(Map.of("name", name, "amount", amount));
            }
        }
        if (penalty > 0) {
            deductionList.add(Map.of("name", "Phạt cọc", "amount", penalty));
        }

        long refund = contract.getDeposit() - totalDeductions - outstandingDebt;

        // Kết thúc hợp đồng + phòng về trống (S4-05)
        contract.setStatus(Contract.Status.TERMINATED);
        contract.setEndDate(moveOutDate);
        contractRepository.save(contract);

        room.setStatus(Room.Status.EMPTY);
        roomRepository.save(room);

        // Nhân bản tin đăng cũ thành bản nháp
        listingRepository.findByRoomOrderByCreatedAtDesc(room).stream().findFirst()
                .ifPresent(old -> {
                    Listing clone = new Listing();
                    clone.setRoom(room);
                    clone.setTitle("Cho thuê phòng " + room.getCode() + " - " + room.getBuilding().getName());
                    clone.setDescription(old.getDescription());
                    clone.setStatus(Listing.Status.DRAFT);
                    clone.setCreatedAt(LocalDateTime.now());
                    clone.setExpiresAt(LocalDateTime.now().plusDays(30));
                    listingRepository.save(clone);
                });

        return Map.of(
                "finalInvoiceId", finalInvoice.getId(),
                "finalInvoiceTotal", finalInvoice.getTotalAmount(),
                "outstandingDebt", outstandingDebt,
                "deposit", contract.getDeposit(),
                "totalDeductions", totalDeductions,
                "deductions", deductionList,
                "refund", refund
        );
    }

    private void addItem(Invoice invoice, InvoiceItem.ItemType type, String name,
                         double quantity, String unit, long unitPrice, long amount) {
        InvoiceItem item = new InvoiceItem();
        item.setInvoice(invoice);
        item.setItemType(type);
        item.setName(name);
        item.setQuantity(quantity);
        item.setUnit(unit);
        item.setUnitPrice(unitPrice);
        item.setAmount(amount);
        invoice.addItem(item);
    }

    private long priceFor(Room room, String serviceName, LocalDate date) {
        Service service = serviceRepository.findByName(serviceName).orElse(null);
        if (service == null) return 0;
        BuildingService cfg = buildingServiceRepository
                .findFirstByBuildingAndServiceAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(
                        room.getBuilding(), service, date)
                .orElse(null);
        return cfg == null ? service.getPrice() : cfg.getPrice();
    }
}
