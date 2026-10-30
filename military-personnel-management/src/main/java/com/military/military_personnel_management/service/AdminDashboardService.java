package com.military.military_personnel_management.service;

import com.military.military_personnel_management.dto.AdminDashboardResponse;
import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.repository.AuditLogRepository;
import com.military.military_personnel_management.repository.LeaveRequestRepository;
import com.military.military_personnel_management.repository.PersonnelRepository;
import com.military.military_personnel_management.repository.PromotionRepository;
import com.military.military_personnel_management.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminDashboardService {

    private final PersonnelRepository personnelRepository;
    private final UnitRepository unitRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PromotionRepository promotionRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminDashboardService(
            PersonnelRepository personnelRepository,
            UnitRepository unitRepository,
            LeaveRequestRepository leaveRequestRepository,
            PromotionRepository promotionRepository,
            AuditLogRepository auditLogRepository) {
        this.personnelRepository = personnelRepository;
        this.unitRepository = unitRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.promotionRepository = promotionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        List<AdminDashboardResponse.RecentActivity> recentActivities =
                auditLogRepository.findTop6ByOrderByTimestampDesc()
                        .stream()
                        .map(this::toRecentActivity)
                        .toList();

        return new AdminDashboardResponse(
                personnelRepository.count(),
                unitRepository.count(),
                leaveRequestRepository.countByStatusIgnoreCase("PENDING"),
                promotionRepository.count(),
                recentActivities
        );
    }

    private AdminDashboardResponse.RecentActivity toRecentActivity(AuditLog auditLog) {
        return new AdminDashboardResponse.RecentActivity(
                auditLog.getUsername(),
                auditLog.getAction(),
                auditLog.getDetails(),
                auditLog.getTimestamp() == null
                        ? null
                        : auditLog.getTimestamp().toString()
        );
    }
}
