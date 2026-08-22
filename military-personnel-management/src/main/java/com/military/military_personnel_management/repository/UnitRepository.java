package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, Long> {
}