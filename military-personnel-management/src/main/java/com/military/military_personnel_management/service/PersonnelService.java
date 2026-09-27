package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Personnel;
import com.military.military_personnel_management.repository.PersonnelRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PersonnelService {

    private final PersonnelRepository personnelRepository;
    private final AuditLogService auditLogService;

    public PersonnelService(
            PersonnelRepository personnelRepository,
            AuditLogService auditLogService) {

        this.personnelRepository = personnelRepository;
        this.auditLogService = auditLogService;
    }

    public Personnel createPersonnel(Personnel personnel) {

        Personnel savedPersonnel =
                personnelRepository.save(personnel);

        String username = getCurrentUsername();

        auditLogService.createAuditLog(
                new AuditLog(
                        username,
                        "PERSONNEL_CREATED",
                        "Created personnel: "
                                + savedPersonnel.getFullName()
                                + " (Service No: "
                                + savedPersonnel.getServiceNumber()
                                + ")",
                        LocalDateTime.now()
                )
        );

        return savedPersonnel;
    }

    public List<Personnel> getAllPersonnel() {
        return personnelRepository.findAll();
    }

    public Optional<Personnel> getPersonnelById(Long id) {
        return personnelRepository.findById(id);
    }

    public Personnel updatePersonnel(Personnel personnel) {

    Personnel existingPersonnel =
            personnelRepository.findById(personnel.getId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Personnel not found with id: "
                                            + personnel.getId()
                            ));

    existingPersonnel.setServiceNumber(
            personnel.getServiceNumber()
    );

    existingPersonnel.setFullName(
            personnel.getFullName()
    );

    existingPersonnel.setRank(
            personnel.getRank()
    );

    existingPersonnel.setEmail(
            personnel.getEmail()
    );

    existingPersonnel.setPhone(
            personnel.getPhone()
    );

    existingPersonnel.setUnit(
            personnel.getUnit()
    );

    Personnel updatedPersonnel =
            personnelRepository.save(existingPersonnel);

    String username = getCurrentUsername();

    auditLogService.createAuditLog(
            new AuditLog(
                    username,
                    "PERSONNEL_UPDATED",
                    "Updated personnel: "
                            + updatedPersonnel.getFullName()
                            + " (Service No: "
                            + updatedPersonnel.getServiceNumber()
                            + ")",
                    LocalDateTime.now()
            )
    );

    return updatedPersonnel;
}

    public void deletePersonnel(Long id) {

        Personnel personnel =
                personnelRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Personnel not found with id: " + id
                                ));

        personnelRepository.deleteById(id);

        String username = getCurrentUsername();

        auditLogService.createAuditLog(
                new AuditLog(
                        username,
                        "PERSONNEL_DELETED",
                        "Deleted personnel: "
                                + personnel.getFullName()
                                + " (Service No: "
                                + personnel.getServiceNumber()
                                + ")",
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