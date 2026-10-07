package com.rentalhousing.backend.service;

import com.rentalhousing.backend.entity.RolePermission;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.RolePermissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PermissionService {

    private final RolePermissionRepository repository;

    public PermissionService(RolePermissionRepository repository) {
        this.repository = repository;
    }

    public boolean hasPermission(User.Role role, String permission) {
        return getPermissions(role).contains(permission);
    }

    public List<String> getPermissions(User.Role role) {
        return repository.findByRole(role)
                .stream()
                .map(RolePermission::getPermission)
                .toList();
    }
}
