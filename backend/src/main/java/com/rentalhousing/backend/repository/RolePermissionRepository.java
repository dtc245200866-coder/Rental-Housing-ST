package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.RolePermission;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRole(User.Role role);

    boolean existsByRoleAndPermission(User.Role role, String permission);
}
