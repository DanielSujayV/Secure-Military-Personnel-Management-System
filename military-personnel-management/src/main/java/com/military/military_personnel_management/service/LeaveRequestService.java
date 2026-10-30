package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.LeaveRequest;
import com.military.military_personnel_management.entity.Personnel;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.LeaveRequestRepository;
import com.military.military_personnel_management.repository.UserRepository;
import com.military.military_personnel_management.repository.PersonnelRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final PersonnelRepository personnelRepository;
    private final AuditLogService auditLogService;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository,
            UserRepository userRepository,
            PersonnelRepository personnelRepository,
            AuditLogService auditLogService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.userRepository = userRepository;
        this.personnelRepository = personnelRepository;
        this.auditLogService = auditLogService;
    }

    public LeaveRequest createLeaveRequest(LeaveRequest request) {
        validateDates(request);
        if (!isManager()) {
            request.setPersonnel(getCurrentPersonnel());
        } else {
            request.setPersonnel(resolvePersonnel(request.getPersonnel()));
        }

        request.setStatus("PENDING");
        LeaveRequest saved = leaveRequestRepository.save(request);
        audit("LEAVE_REQUEST_CREATED",
                "Created leave request for personnel ID: " + saved.getPersonnel().getId());
        return saved;
    }

    public List<LeaveRequest> getAllLeaveRequests() {
        if (isManager()) {
            return leaveRequestRepository.findAll();
        }
        return leaveRequestRepository.findByPersonnel_Id(getCurrentPersonnel().getId());
    }

    public Optional<LeaveRequest> getLeaveRequestById(Long id) {
        if (isManager()) {
            return leaveRequestRepository.findById(id);
        }
        return leaveRequestRepository.findByIdAndPersonnel_Id(
                id, getCurrentPersonnel().getId());
    }

    public LeaveRequest updateLeaveRequest(LeaveRequest request) {
        if (request == null || request.getId() == null) {
            throw new IllegalArgumentException("Leave request ID is required");
        }
        LeaveRequest existing = leaveRequestRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException(
                        "Leave request not found with id: " + request.getId()));

        if (!"PENDING".equals(existing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending leave requests can be edited");
        }
        validateDates(request);
        existing.setPersonnel(resolvePersonnel(request.getPersonnel()));
        existing.setStartDate(request.getStartDate());
        existing.setEndDate(request.getEndDate());
        existing.setReason(request.getReason());

        LeaveRequest updated = leaveRequestRepository.save(existing);
        audit("LEAVE_REQUEST_UPDATED", "Updated leave request ID: " + updated.getId());
        return updated;
    }

    public LeaveRequest approveLeaveRequest(Long id) {
        LeaveRequest request = findPendingRequest(id);
        request.setStatus("APPROVED");
        LeaveRequest updated = leaveRequestRepository.save(request);
        audit("LEAVE_REQUEST_APPROVED", "Approved leave request ID: " + updated.getId());
        return updated;
    }

    public LeaveRequest rejectLeaveRequest(Long id) {
        LeaveRequest request = findPendingRequest(id);
        request.setStatus("REJECTED");
        LeaveRequest updated = leaveRequestRepository.save(request);
        audit("LEAVE_REQUEST_REJECTED", "Rejected leave request ID: " + updated.getId());
        return updated;
    }

    public void deleteLeaveRequest(Long id) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Leave request not found with id: " + id));
        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending leave requests can be deleted");
        }
        leaveRequestRepository.delete(request);
        audit("LEAVE_REQUEST_DELETED", "Deleted leave request ID: " + request.getId());
    }

    private LeaveRequest findPendingRequest(Long id) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Leave request not found with id: " + id));
        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending leave requests can change status");
        }
        return request;
    }

    private Personnel resolvePersonnel(Personnel supplied) {
        if (supplied == null || supplied.getId() == null) {
            throw new IllegalArgumentException("Personnel is required for this leave request");
        }
        return personnelRepository.findById(supplied.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Personnel record not found"));
    }

    private void validateDates(LeaveRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Leave request details are required");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Leave start and end dates are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Leave end date cannot be before start date");
        }
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new IllegalArgumentException("Leave reason is required");
        }
    }

    private boolean isManager() {
        Authentication auth = currentAuthentication();
        return hasRole(auth, "ROLE_ADMIN") || hasRole(auth, "ROLE_COMMANDER");
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(authority -> role.equals(authority.getAuthority()));
    }

    private Personnel getCurrentPersonnel() {
        Authentication auth = currentAuthentication();
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user is required");
        }
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found"));
        if (user.getPersonnel() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Your account is not linked to a personnel record. Contact an administrator.");
        }
        return user.getPersonnel();
    }

    private Authentication currentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private void audit(String action, String details) {
        Authentication auth = currentAuthentication();
        auditLogService.createAuditLog(new AuditLog(
                auth == null ? "SYSTEM" : auth.getName(),
                action, details, LocalDateTime.now()));
    }
}