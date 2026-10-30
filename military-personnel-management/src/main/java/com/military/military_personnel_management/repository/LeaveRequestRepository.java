package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByPersonnel_Id(Long personnelId);
    Optional<LeaveRequest> findByIdAndPersonnel_Id(Long id, Long personnelId);
    boolean existsByPersonnel_Id(Long personnelId);
}