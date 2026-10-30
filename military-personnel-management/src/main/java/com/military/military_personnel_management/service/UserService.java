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
        if (user == null) {
            throw new IllegalArgumentException("User details are required");
        }
        validateUsername(user.getUsername(), null);
        if (user.getPassword() == null || user.getPassword().length() < 12) {
            throw new IllegalArgumentException("Password must contain at least 12 characters");
        }
        if (user.getRole() == null || user.getRole().getId() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        Role role = roleRepository.findById(user.getRole().getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Role not found"));
        user.setUsername(user.getUsername().trim());
        user.setRole(role);
        Personnel linkedPersonnel = resolvePersonnel(user.getPersonnel());
        validatePersonnelAssociation(role, linkedPersonnel);
        user.setPersonnel(linkedPersonnel);

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
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        validateUsername(user.getUsername(), user.getId());
        User existing = userRepository.findById(user.getId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == null || user.getRole().getId() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        Role role = roleRepository.findById(user.getRole().getId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        Personnel linkedPersonnel = existing.getPersonnel();
        if (user.getPersonnel() != null && user.getPersonnel().getId() != null) {
            linkedPersonnel = resolvePersonnel(user.getPersonnel());
        }
        validatePersonnelAssociation(role, linkedPersonnel);

        existing.setUsername(user.getUsername().trim());
        existing.setRole(role);
        existing.setEnabled(user.isEnabled());
        existing.setPersonnel(linkedPersonnel);

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
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));
        userRepository.deleteById(id);
        audit("USER_DELETED", "Deleted user: " + user.getUsername());
    }

    private void validateUsername(String username, Long currentId) {
        if (username == null || !username.trim().matches("^[A-Za-z0-9._-]{3,64}$")) {
            throw new IllegalArgumentException(
                    "Username must be 3-64 characters using letters, numbers, dot, underscore or hyphen");
        }
        String normalized = username.trim();
        boolean duplicate = currentId == null
                ? userRepository.existsByUsernameIgnoreCase(normalized)
                : userRepository.existsByUsernameIgnoreCaseAndIdNot(normalized, currentId);
        if (duplicate) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Username is already in use");
        }
    }

    private void validatePersonnelAssociation(Role role, Personnel personnel) {
        String roleName = role.getRoleName() == null
                ? "" : role.getRoleName().toUpperCase();
        if (("PERSONNEL".equals(roleName) || "OFFICER".equals(roleName))
                && personnel == null) {
            throw new IllegalArgumentException(
                    roleName + " accounts must be linked to a personnel record");
        }
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