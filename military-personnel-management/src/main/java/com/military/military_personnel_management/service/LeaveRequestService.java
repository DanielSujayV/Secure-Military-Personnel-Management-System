package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.LeaveRequest;
import com.military.military_personnel_management.repository.LeaveRequestRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final AuditLogService auditLogService;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository,
            AuditLogService auditLogService) {

        this.leaveRequestRepository = leaveRequestRepository;
        this.auditLogService = auditLogService;
    }

    public LeaveRequest createLeaveRequest(LeaveRequest leaveRequest) {

        LeaveRequest savedLeaveRequest =
                leaveRequestRepository.save(leaveRequest);

        auditLogService.createAuditLog(
                new AuditLog(
                        getCurrentUsername(),
                        "LEAVE_REQUEST_CREATED",
                        "Created leave request for personnel ID: "
                                + savedLeaveRequest.getPersonnel().getId(),
                        LocalDateTime.now()
                )
        );

        return savedLeaveRequest;
    }

    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAll();
    }

    public Optional<LeaveRequest> getLeaveRequestById(Long id) {
        return leaveRequestRepository.findById(id);
    }

public LeaveRequest updateLeaveRequest(LeaveRequest leaveRequest) {

    LeaveRequest existingLeaveRequest =
            leaveRequestRepository.findById(leaveRequest.getId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Leave request not found with id: "
                                            + leaveRequest.getId()
                            ));

    existingLeaveRequest.setPersonnel(
            leaveRequest.getPersonnel()
    );

    existingLeaveRequest.setStartDate(
            leaveRequest.getStartDate()
    );

    existingLeaveRequest.setEndDate(
            leaveRequest.getEndDate()
    );

    existingLeaveRequest.setReason(
            leaveRequest.getReason()
    );

    

    LeaveRequest updatedLeaveRequest =
            leaveRequestRepository.save(existingLeaveRequest);

    auditLogService.createAuditLog(
            new AuditLog(
                    getCurrentUsername(),
                    "LEAVE_REQUEST_UPDATED",
                    "Updated leave request ID: "
                            + updatedLeaveRequest.getId(),
                    LocalDateTime.now()
            )
    );

    return updatedLeaveRequest;
}
public LeaveRequest approveLeaveRequest(Long id) {

    LeaveRequest leaveRequest =
            leaveRequestRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Leave request not found with id: " + id
                            ));

    leaveRequest.setStatus("APPROVED");

    LeaveRequest updatedLeaveRequest =
            leaveRequestRepository.save(leaveRequest);

    auditLogService.createAuditLog(
            new AuditLog(
                    getCurrentUsername(),
                    "LEAVE_REQUEST_APPROVED",
                    "Approved leave request ID: "
                            + updatedLeaveRequest.getId(),
                    LocalDateTime.now()
            )
    );

    return updatedLeaveRequest;
}

public LeaveRequest rejectLeaveRequest(Long id) {

    LeaveRequest leaveRequest =
            leaveRequestRepository.findById(id)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Leave request not found with id: " + id
                            ));

    leaveRequest.setStatus("REJECTED");

    LeaveRequest updatedLeaveRequest =
            leaveRequestRepository.save(leaveRequest);

    auditLogService.createAuditLog(
            new AuditLog(
                    getCurrentUsername(),
                    "LEAVE_REQUEST_REJECTED",
                    "Rejected leave request ID: "
                            + updatedLeaveRequest.getId(),
                    LocalDateTime.now()
            )
    );

    return updatedLeaveRequest;
}

    public void deleteLeaveRequest(Long id) {

        LeaveRequest leaveRequest =
                leaveRequestRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Leave request not found with id: " + id
                                ));

        leaveRequestRepository.deleteById(id);

        auditLogService.createAuditLog(
                new AuditLog(
                        getCurrentUsername(),
                        "LEAVE_REQUEST_DELETED",
                        "Deleted leave request ID: "
                                + leaveRequest.getId(),
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