package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Unit;
import com.military.military_personnel_management.repository.UnitRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UnitService {

    private final UnitRepository unitRepository;
    private final AuditLogService auditLogService;

    public UnitService(
            UnitRepository unitRepository,
            AuditLogService auditLogService) {

        this.unitRepository = unitRepository;
        this.auditLogService = auditLogService;
    }

    public Unit createUnit(Unit unit) {

        Unit savedUnit =
                unitRepository.save(unit);

        String username = getCurrentUsername();

        auditLogService.createAuditLog(
                new AuditLog(
                        username,
                        "UNIT_CREATED",
                        "Created unit: "
                                + savedUnit.getUnitName(),
                        LocalDateTime.now()
                )
        );

        return savedUnit;
    }

    public List<Unit> getAllUnits() {
        return unitRepository.findAll();
    }

    public Optional<Unit> getUnitById(Long id) {
        return unitRepository.findById(id);
    }

    public Unit updateUnit(Unit unit) {

    Unit existingUnit = unitRepository.findById(unit.getId())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Unit not found with id: " + unit.getId()
                    ));

    existingUnit.setUnitName(unit.getUnitName());
    existingUnit.setDescription(unit.getDescription());

    Unit updatedUnit =
            unitRepository.save(existingUnit);

    String username = getCurrentUsername();

    auditLogService.createAuditLog(
            new AuditLog(
                    username,
                    "UNIT_UPDATED",
                    "Updated unit: "
                            + updatedUnit.getUnitName(),
                    LocalDateTime.now()
            )
    );

    return updatedUnit;
}

    public void deleteUnit(Long id) {

        Unit unit =
                unitRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Unit not found with id: " + id
                                ));

        unitRepository.deleteById(id);

        String username = getCurrentUsername();

        auditLogService.createAuditLog(
                new AuditLog(
                        username,
                        "UNIT_DELETED",
                        "Deleted unit: "
                                + unit.getUnitName(),
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