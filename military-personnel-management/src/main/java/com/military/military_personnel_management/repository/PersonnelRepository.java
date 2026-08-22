package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.Personnel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonnelRepository extends JpaRepository<Personnel, Long> {
}