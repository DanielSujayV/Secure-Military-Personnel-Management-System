package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Personnel;
import com.military.military_personnel_management.entity.Role;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.PersonnelRepository;
import com.military.military_personnel_management.repository.RoleRepository;
import com.military.military_personnel_management.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PersonnelRepository personnelRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PersonnelRepository personnelRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.personnelRepository = personnelRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public User createUser(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (user.getRole() == null || user.getRole().getId() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        Role role = roleRepository.findById(user.getRole().getId())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);
        user.setPersonnel(resolvePersonnel(user.getPersonnel()));

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        audit("USER_CREATED", "Created user: " + saved.getUsername()
                + " with role: " + saved.getRole().getRoleName());
        return saved;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUser(User user) {
        User existing = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + user.getId()));

        if (user.getRole() == null || user.getRole().getId() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        Role role = roleRepository.findById(user.getRole().getId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        existing.setUsername(user.getUsername());
        existing.setRole(role);
        existing.setEnabled(user.isEnabled());
        if (user.getPersonnel() != null && user.getPersonnel().getId() != null) {
            existing.setPersonnel(resolvePersonnel(user.getPersonnel()));
        }

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        User updated = userRepository.save(existing);
        audit("USER_UPDATED", "Updated user: " + updated.getUsername()
                + " with role: " + updated.getRole().getRoleName());
        return updated;
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        userRepository.deleteById(id);
        audit("USER_DELETED", "Deleted user: " + user.getUsername());
    }

    private Personnel resolvePersonnel(Personnel supplied) {
        if (supplied == null || supplied.getId() == null) {
            return null;
        }
        return personnelRepository.findById(supplied.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Linked personnel record was not found"));
    }

    private void audit(String action, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        auditLogService.createAuditLog(new AuditLog(
                auth == null ? "SYSTEM" : auth.getName(),
                action, details, LocalDateTime.now()));
    }
}