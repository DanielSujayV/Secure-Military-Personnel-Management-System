package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Unit;
import com.military.military_personnel_management.repository.UnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UnitService {

    private final UnitRepository unitRepository;
    private final AuditLogService auditLogService;

    public UnitService(UnitRepository unitRepository, AuditLogService auditLogService) {
        this.unitRepository = unitRepository;
        this.auditLogService = auditLogService;
    }

    public Unit createUnit(Unit unit) {
        validateUnit(unit, null);
        Unit saved = unitRepository.save(unit);
        audit("UNIT_CREATED", "Created unit: " + saved.getUnitName());
        return saved;
    }

    public List<Unit> getAllUnits() {
        return unitRepository.findAll();
    }

    public Optional<Unit> getUnitById(Long id) {
        return unitRepository.findById(id);
    }

    public Unit updateUnit(Unit unit) {
        if (unit == null || unit.getId() == null) {
            throw new IllegalArgumentException("Unit ID is required");
        }
        Unit existing = unitRepository.findById(unit.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Unit not found"));
        validateUnit(unit, unit.getId());
        existing.setUnitName(unit.getUnitName().trim());
        existing.setDescription(unit.getDescription());
        Unit updated = unitRepository.save(existing);
        audit("UNIT_UPDATED", "Updated unit: " + updated.getUnitName());
        return updated;
    }

    public void deleteUnit(Long id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Unit not found"));
        try {
            unitRepository.delete(unit);
            unitRepository.flush();
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This unit is assigned to personnel and cannot be deleted");
        }
        audit("UNIT_DELETED", "Deleted unit: " + unit.getUnitName());
    }

    private void validateUnit(Unit unit, Long currentId) {
        if (unit == null || unit.getUnitName() == null || unit.getUnitName().isBlank()) {
            throw new IllegalArgumentException("Unit name is required");
        }
        String name = unit.getUnitName().trim();
        boolean duplicate = currentId == null
                ? unitRepository.existsByUnitNameIgnoreCase(name)
                : unitRepository.existsByUnitNameIgnoreCaseAndIdNot(name, currentId);
        if (duplicate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "A unit with this name already exists");
        }
        if (unit.getDescription() != null && unit.getDescription().length() > 255) {
            throw new IllegalArgumentException("Unit description cannot exceed 255 characters");
        }
    }

    private void audit(String action, String details) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        auditLogService.createAuditLog(new AuditLog(
                authentication == null ? "SYSTEM" : authentication.getName(),
                action, details, LocalDateTime.now()));
    }
}