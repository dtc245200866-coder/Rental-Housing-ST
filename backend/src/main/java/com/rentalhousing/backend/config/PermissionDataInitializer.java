package com.rentalhousing.backend.config;

import com.rentalhousing.backend.entity.RolePermission;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.RolePermissionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PermissionDataInitializer {

    @Bean
    CommandLineRunner initPermissions(RolePermissionRepository repository) {
        return args -> {
            // ADMIN — toàn quyền tài khoản + xem mọi module
            String[] admin = {"ADMIN_ACCESS", "BUILDING_MANAGE", "ROOM_MANAGE", "SERVICE_MANAGE",
                    "LISTING_MANAGE", "CONTRACT_MANAGE", "METER_MANAGE", "INVOICE_MANAGE",
                    "PAYMENT_MANAGE", "MAINTENANCE_MANAGE", "REPORT_VIEW", "PROFILE_VIEW"};
            for (String p : admin) addIfNotExists(repository, User.Role.ADMIN, p);

            // LANDLORD — toàn quyền nghiệp vụ
            String[] landlord = {"BUILDING_MANAGE", "ROOM_MANAGE", "SERVICE_MANAGE", "LISTING_MANAGE",
                    "CONTRACT_MANAGE", "METER_MANAGE", "INVOICE_MANAGE", "PAYMENT_MANAGE",
                    "MAINTENANCE_MANAGE", "REPORT_VIEW", "PROFILE_VIEW"};
            for (String p : landlord) addIfNotExists(repository, User.Role.LANDLORD, p);

            // MANAGER — xem danh mục, ghi chỉ số + báo hỏng
            String[] manager = {"BUILDING_MANAGE", "ROOM_MANAGE", "SERVICE_MANAGE", "LISTING_MANAGE",
                    "CONTRACT_MANAGE", "INVOICE_MANAGE", "METER_MANAGE", "MAINTENANCE_MANAGE", "REPORT_VIEW"};
            for (String p : manager) addIfNotExists(repository, User.Role.MANAGER, p);

            // TENANT — chỉ xem dữ liệu của chính mình (qua /api/my/**)
            addIfNotExists(repository, User.Role.TENANT, "PROFILE_VIEW");
        };
    }

    private void addIfNotExists(
            RolePermissionRepository repository,
            User.Role role,
            String permission) {
        boolean exists = repository.findByRole(role)
                .stream()
                .anyMatch(p -> p.getPermission().equals(permission));
        if (!exists) {
            repository.save(new RolePermission(role, permission));
        }
    }
}
