package com.military.military_personnel_management.dto;

import java.util.List;

public record AdminDashboardResponse(
        long totalPersonnel,
        long registeredUnits,
        long pendingLeaveRequests,
        long recordedPromotions,
        List<RecentActivity> recentActivities
) {
    public record RecentActivity(
            String username,
            String action,
            String details,
            String timestamp
    ) {
    }
}
