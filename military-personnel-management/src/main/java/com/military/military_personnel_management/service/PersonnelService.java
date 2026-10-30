package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Personnel;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.PersonnelRepository;
import com.military.military_personnel_management.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PersonnelService {

    private final PersonnelRepository personnelRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public PersonnelService(
            PersonnelRepository personnelRepository,
            UserRepository userRepository,
            AuditLogService auditLogService) {
        this.personnelRepository = personnelRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    public Personnel createPersonnel(Personnel personnel) {
        Personnel saved = personnelRepository.save(personnel);
        audit("PERSONNEL_CREATED", "Created personnel: " + saved.getFullName()
                + " (Service No: " + saved.getServiceNumber() + ")");
        return saved;
    }

    public List<Personnel> getAllPersonnel() {
        Authentication auth = currentAuthentication();
        if (hasRole(auth, "ROLE_PERSONNEL")) {
            return currentLinkedPersonnel().map(List::of).orElseGet(List::of);
        }
        return personnelRepository.findAll();
    }

    public Optional<Personnel> getPersonnelById(Long id) {
        Authentication auth = currentAuthentication();
        if (hasRole(auth, "ROLE_PERSONNEL")) {
            return currentLinkedPersonnel()
                    .filter(personnel -> personnel.getId().equals(id));
        }
        return personnelRepository.findById(id);
    }

    public Personnel updatePersonnel(Personnel personnel) {
        Personnel existing = personnelRepository.findById(personnel.getId())
                .orElseThrow(() -> new RuntimeException(
                        "Personnel not found with id: " + personnel.getId()));

        existing.setServiceNumber(personnel.getServiceNumber());
        existing.setFullName(personnel.getFullName());
        existing.setRank(personnel.getRank());
        existing.setEmail(personnel.getEmail());
        existing.setPhone(personnel.getPhone());
        existing.setUnit(personnel.getUnit());

        Personnel updated = personnelRepository.save(existing);
        audit("PERSONNEL_UPDATED", "Updated personnel: " + updated.getFullName()
                + " (Service No: " + updated.getServiceNumber() + ")");
        return updated;
    }

    public void deletePersonnel(Long id) {
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Personnel not found with id: " + id));
        personnelRepository.deleteById(id);
        audit("PERSONNEL_DELETED", "Deleted personnel: " + personnel.getFullName()
                + " (Service No: " + personnel.getServiceNumber() + ")");
    }

    private Optional<Personnel> currentLinkedPersonnel() {
        String username = currentAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user record not found"));
        if (user.getPersonnel() == null) {
            throw new IllegalStateException(
                    "This account is not linked to a personnel record. Contact an administrator.");
        }
        return Optional.of(user.getPersonnel());
    }

    private Authentication currentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> role.equals(authority.getAuthority()));
    }

    private void audit(String action, String details) {
        auditLogService.createAuditLog(new AuditLog(
                currentAuthentication() == null ? "SYSTEM" : currentAuthentication().getName(),
                action, details, LocalDateTime.now()));
    }
}