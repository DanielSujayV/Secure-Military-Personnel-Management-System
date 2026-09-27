package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Role;
import com.military.military_personnel_management.entity.User;
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
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

public User createUser(User user) {

    if (user.getUsername() == null
            || user.getUsername().isBlank()) {
        throw new IllegalArgumentException("Username is required");
    }

    if (user.getPassword() == null
            || user.getPassword().isBlank()) {
        throw new IllegalArgumentException("Password is required");
    }

    if (user.getRole() == null
            || user.getRole().getId() == null) {
        throw new IllegalArgumentException("Role is required");
    }

    Role role = roleRepository.findById(
            user.getRole().getId()
    ).orElseThrow(() ->
            new RuntimeException("Role not found")
    );

    user.setRole(role);

    user.setPassword(
            passwordEncoder.encode(user.getPassword())
    );

    User savedUser = userRepository.save(user);

    auditLogService.createAuditLog(
            new AuditLog(
                    getCurrentUsername(),
                    "USER_CREATED",
                    "Created user: "
                            + savedUser.getUsername()
                            + " with role: "
                            + savedUser.getRole().getRoleName(),
                    LocalDateTime.now()
            )
    );

    return savedUser;
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

    User existingUser = userRepository.findById(user.getId())
            .orElseThrow(() ->
                    new RuntimeException(
                            "User not found with id: " + user.getId()
                    ));

    if (user.getRole() == null
            || user.getRole().getId() == null) {
        throw new IllegalArgumentException("Role is required");
    }

    Role role = roleRepository.findById(
            user.getRole().getId()
    ).orElseThrow(() ->
            new RuntimeException("Role not found")
    );

        existingUser.setUsername(user.getUsername());
        existingUser.setRole(role);
        existingUser.setEnabled(user.isEnabled());

        if (user.getPassword() != null
                && !user.getPassword().isBlank()) {

            existingUser.setPassword(
                    passwordEncoder.encode(user.getPassword())
            );
        }

        User updatedUser =
                userRepository.save(existingUser);

        auditLogService.createAuditLog(
                new AuditLog(
                        getCurrentUsername(),
                        "USER_UPDATED",
                        "Updated user: "
                                + updatedUser.getUsername()
                                + " with role: "
                                + updatedUser.getRole().getRoleName(),
                        LocalDateTime.now()
                )
        );

        return updatedUser;
    }

    public void deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        ));

        userRepository.deleteById(id);

        auditLogService.createAuditLog(
                new AuditLog(
                        getCurrentUsername(),
                        "USER_DELETED",
                        "Deleted user: "
                                + user.getUsername(),
                        LocalDateTime.now()
                )
        );
    }

    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null) {
            return "SYSTEM";
        }

        return authentication.getName();
    }
}