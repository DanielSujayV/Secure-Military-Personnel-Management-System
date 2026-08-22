package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
}