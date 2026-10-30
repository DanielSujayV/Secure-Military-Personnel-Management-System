package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Personnel;
import com.military.military_personnel_management.entity.Promotion;
import com.military.military_personnel_management.repository.PersonnelRepository;
import com.military.military_personnel_management.repository.PromotionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PersonnelRepository personnelRepository;
    private final AuditLogService auditLogService;

    public PromotionService(
            PromotionRepository promotionRepository,
            PersonnelRepository personnelRepository,
            AuditLogService auditLogService) {
        this.promotionRepository = promotionRepository;
        this.personnelRepository = personnelRepository;
        this.auditLogService = auditLogService;
    }

    public Promotion createPromotion(Promotion promotion) {
        validatePromotion(promotion);
        normalizePromotion(promotion);
        promotion.setPersonnel(resolvePersonnel(promotion.getPersonnel()));
        Promotion saved = promotionRepository.save(promotion);
        audit("PROMOTION_CREATED", describe(saved));
        return saved;
    }

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Optional<Promotion> getPromotionById(Long id) {
        return promotionRepository.findById(id);
    }

    public Promotion updatePromotion(Promotion promotion) {
        if (promotion == null || promotion.getId() == null) {
            throw new IllegalArgumentException("Promotion ID is required");
        }
        Promotion existing = promotionRepository.findById(promotion.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Promotion not found"));
        validatePromotion(promotion);
        normalizePromotion(promotion);
        existing.setPersonnel(resolvePersonnel(promotion.getPersonnel()));
        existing.setPreviousRank(promotion.getPreviousRank().trim());
        existing.setNewRank(promotion.getNewRank().trim());
        existing.setPromotionDate(promotion.getPromotionDate());
        existing.setRemarks(promotion.getRemarks());
        Promotion updated = promotionRepository.save(existing);
        audit("PROMOTION_UPDATED", describe(updated));
        return updated;
    }

    public void deletePromotion(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Promotion not found"));
        promotionRepository.delete(promotion);
        audit("PROMOTION_DELETED", describe(promotion));
    }

    private void normalizePromotion(Promotion promotion) {
        promotion.setPreviousRank(promotion.getPreviousRank().trim());
        promotion.setNewRank(promotion.getNewRank().trim());
        if (promotion.getRemarks() != null) {
            promotion.setRemarks(promotion.getRemarks().trim());
        }
    }

    private void validatePromotion(Promotion promotion) {
        if (promotion == null) {
            throw new IllegalArgumentException("Promotion details are required");
        }
        if (promotion.getPersonnel() == null || promotion.getPersonnel().getId() == null) {
            throw new IllegalArgumentException("A personnel record must be selected");
        }
        if (promotion.getPreviousRank() == null || promotion.getPreviousRank().isBlank()) {
            throw new IllegalArgumentException("Previous rank is required");
        }
        if (promotion.getNewRank() == null || promotion.getNewRank().isBlank()) {
            throw new IllegalArgumentException("New rank is required");
        }
        if (promotion.getPreviousRank().trim().equalsIgnoreCase(promotion.getNewRank().trim())) {
            throw new IllegalArgumentException("New rank must differ from previous rank");
        }
        if (promotion.getPromotionDate() == null) {
            throw new IllegalArgumentException("Promotion date is required");
        }
        if (promotion.getPromotionDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Promotion date cannot be in the future");
        }
        if (promotion.getRemarks() != null && promotion.getRemarks().length() > 500) {
            throw new IllegalArgumentException("Promotion remarks cannot exceed 500 characters");
        }
    }

    private Personnel resolvePersonnel(Personnel supplied) {
        return personnelRepository.findById(supplied.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Personnel record not found"));
    }

    private String describe(Promotion promotion) {
        return "Personnel: " + promotion.getPersonnel().getFullName()
                + ", " + promotion.getPreviousRank() + " to " + promotion.getNewRank();
    }

    private void audit(String action, String details) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        auditLogService.createAuditLog(new AuditLog(
                authentication == null ? "SYSTEM" : authentication.getName(),
                action, details, LocalDateTime.now()));
    }
}