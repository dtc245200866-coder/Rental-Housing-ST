package com.rentalhousing.backend.config;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.BuildingService;
import com.rentalhousing.backend.entity.Listing;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.Service;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.BuildingRepository;
import com.rentalhousing.backend.repository.BuildingServiceRepository;
import com.rentalhousing.backend.repository.ListingRepository;
import com.rentalhousing.backend.repository.RoomRepository;
import com.rentalhousing.backend.repository.ServiceRepository;
import com.rentalhousing.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * S4-10: Dữ liệu mẫu — 4 tài khoản, dịch vụ mặc định, 2 toà nhà, 30 phòng.
 * Chỉ chạy khi bảng users còn trống (không ghi đè dữ liệu hiện có).
 */
@Configuration
public class DemoDataInitializer {

    @Bean
    CommandLineRunner initDemoData(
            UserRepository userRepository,
            ServiceRepository serviceRepository,
            BuildingRepository buildingRepository,
            RoomRepository roomRepository,
            BuildingServiceRepository buildingServiceRepository,
            ListingRepository listingRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (userRepository.count() > 0) {
                return;
            }

            String demoPassword = passwordEncoder.encode("Password1");

            User admin = newUser("Quản trị hệ thống", "0900000000", "admin@rental.house", demoPassword, User.Role.ADMIN, false);
            User landlord = newUser("Chủ nhà", "0911111111", "landlord@rental.house", demoPassword, User.Role.LANDLORD, false);
            User manager = newUser("Quản lý toà nhà", "0922222222", "manager@rental.house", demoPassword, User.Role.MANAGER, false);
            User tenant = newUser("Người thuê", "0933333333", "tenant@rental.house", demoPassword, User.Role.TENANT, false);
            userRepository.save(admin);
            userRepository.save(landlord);
            userRepository.save(manager);
            userRepository.save(tenant);

            // Dịch vụ mặc định (S1-09)
            Service dien = serviceRepository.save(newService("Điện", Service.CalculationMethod.BY_METER, "kWh", 4000));
            Service nuoc = serviceRepository.save(newService("Nước", Service.CalculationMethod.BY_METER, "m3", 18000));
            serviceRepository.save(newService("Rác", Service.CalculationMethod.FIXED_ROOM, "phòng", 30000));
            serviceRepository.save(newService("Gửi xe", Service.CalculationMethod.BY_PERSON, "người", 100000));
            serviceRepository.save(newService("Internet", Service.CalculationMethod.FIXED_ROOM, "phòng", 120000));

            // Toà nhà + phòng
            Building buildingA = newBuilding("Tòa nhà A", "123 Đường ABC, Hà Nội", "Cầu Giấy", 5, landlord, manager);
            Building buildingB = newBuilding("Tòa nhà B", "456 Đường XYZ, Hà Nội", "Đống Đa", 3, landlord, manager);
            buildingRepository.save(buildingA);
            buildingRepository.save(buildingB);

            // Toà A: 5 tầng x 3 phòng = 15 phòng
            for (int floor = 1; floor <= 5; floor++) {
                for (int rn = 1; rn <= 3; rn++) {
                    roomRepository.save(newRoom(String.valueOf(floor * 100 + rn), floor, 25.5, 2600000, 3, buildingA));
                }
            }
            // Toà B: 3 tầng x 5 phòng = 15 phòng
            for (int floor = 1; floor <= 3; floor++) {
                for (int rn = 1; rn <= 5; rn++) {
                    roomRepository.save(newRoom(String.valueOf(floor * 100 + rn), floor, 20.0, 3000000, 2, buildingB));
                }
            }

            // Cấu hình cách tính điện nước theo chỉ số cho từng toà (S2-10)
            buildingServiceRepository.save(newBuildingService(buildingA, dien, Service.CalculationMethod.BY_METER, 4000));
            buildingServiceRepository.save(newBuildingService(buildingA, nuoc, Service.CalculationMethod.BY_METER, 18000));
            buildingServiceRepository.save(newBuildingService(buildingB, dien, Service.CalculationMethod.BY_METER, 4500));
            buildingServiceRepository.save(newBuildingService(buildingB, nuoc, Service.CalculationMethod.BY_METER, 20000));

            // Một tin đăng mẫu từ phòng trống đầu tiên của toà A
            Room firstEmpty = roomRepository.findByBuildingOrderByFloorAscCodeAsc(buildingA).get(0);
            Listing listing = new Listing();
            listing.setRoom(firstEmpty);
            listing.setTitle("Cho thuê phòng " + firstEmpty.getCode() + " - " + buildingA.getName());
            listing.setDescription("Phòng sạch sẽ, gần trường đại học, giờ giấc tự do.");
            listing.setStatus(Listing.Status.PUBLISHED);
            listing.setCreatedAt(LocalDateTime.now());
            listing.setExpiresAt(LocalDateTime.now().plusDays(30));
            listingRepository.save(listing);

            System.out.println(">>> Đã nạp dữ liệu mẫu: 4 tài khoản / 5 dịch vụ / 2 toà / 30 phòng / 1 tin đăng");
            System.out.println(">>> Tài khoản demo: admin@rental.house, landlord@rental.house, manager@rental.house, tenant@rental.house — mật khẩu: Password1");
        };
    }

    private User newUser(String name, String phone, String email, String password, User.Role role, boolean mustChange) {
        User u = new User();
        u.setName(name);
        u.setPhone(phone);
        u.setEmail(email);
        u.setPassword(password);
        u.setRole(role);
        u.setActive(true);
        u.setMustChangePassword(mustChange);
        u.setFailedLoginAttempts(0);
        return u;
    }

    private Service newService(String name, Service.CalculationMethod method, String unit, long price) {
        Service s = new Service();
        s.setName(name);
        s.setCalculationMethod(method);
        s.setUnit(unit);
        s.setPrice(price);
        s.setActive(true);
        return s;
    }

    private Building newBuilding(String name, String address, String district, int floors, User landlord, User manager) {
        Building b = new Building();
        b.setName(name);
        b.setAddress(address);
        b.setDistrict(district);
        b.setFloors(floors);
        b.setLandlord(landlord);
        b.setManager(manager);
        b.setActive(true);
        return b;
    }

    private Room newRoom(String code, int floor, double area, long rent, int maxPeople, Building building) {
        Room r = new Room();
        r.setCode(code);
        r.setFloor(floor);
        r.setArea(area);
        r.setRent(rent);
        r.setMaxPeople(maxPeople);
        r.setStatus(Room.Status.EMPTY);
        r.setBuilding(building);
        return r;
    }

    private BuildingService newBuildingService(Building building, Service service, Service.CalculationMethod method, long price) {
        BuildingService bs = new BuildingService();
        bs.setBuilding(building);
        bs.setService(service);
        bs.setCalculationMethod(method);
        bs.setPrice(price);
        bs.setEffectiveFrom(LocalDate.now());
        return bs;
    }
}
