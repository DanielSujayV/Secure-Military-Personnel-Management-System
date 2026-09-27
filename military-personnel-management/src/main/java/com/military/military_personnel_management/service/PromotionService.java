package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.Promotion;
import com.military.military_personnel_management.repository.PromotionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final AuditLogService auditLogService;

    public PromotionService(
            PromotionRepository promotionRepository,
            AuditLogService auditLogService) {

        this.promotionRepository = promotionRepository;
        this.auditLogService = auditLogService;
    }

    public Promotion createPromotion(Promotion promotion) {

        Promotion savedPromotion =
                promotionRepository.save(promotion);

        String username = getCurrentUsername();

        auditLogService.createAuditLog(
                new AuditLog(
                        username,
                        "PROMOTION_CREATED",
                        "Created promotion for personnel: "
                                + savedPromotion.getPersonnel().getFullName()
                                + " from "
                                + savedPromotion.getPreviousRank()
                                + " to "
                                + savedPromotion.getNewRank(),
                        LocalDateTime.now()
                )
        );

        return savedPromotion;
    }

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Optional<Promotion> getPromotionById(Long id) {
        return promotionRepository.findById(id);
    }

    public Promotion updatePromotion(Promotion promotion) {

    Promotion existingPromotion =
            promotionRepository.findById(promotion.getId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Promotion not found with id: "
                                            + promotion.getId()
                            ));

    existingPromotion.setPersonnel(
            promotion.getPersonnel()
    );

    existingPromotion.setPreviousRank(
            promotion.getPreviousRank()
    );

    existingPromotion.setNewRank(
            promotion.getNewRank()
    );

    existingPromotion.setPromotionDate(
            promotion.getPromotionDate()
    );

    existingPromotion.setRemarks(
            promotion.getRemarks()
    );

    Promotion updatedPromotion =
            promotionRepository.save(existingPromotion);

    String username = getCurrentUsername();

    auditLogService.createAuditLog(
            new AuditLog(
                    username,
                    "PROMOTION_UPDATED",
                    "Updated promotion for personnel: "
                            + updatedPromotion.getPersonnel().getFullName()
                            + " from "
                            + updatedPromotion.getPreviousRank()
                            + " to "
                            + updatedPromotion.getNewRank(),
                    LocalDateTime.now()
            )
    );

    return updatedPromotion;
}

    public void deletePromotion(Long id) {

        Promotion promotion =
                promotionRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Promotion not found with id: " + id
                                ));

        promotionRepository.deleteById(id);

        String username = getCurrentUsername();

        auditLogService.createAuditLog(
                new AuditLog(
                        username,
                        "PROMOTION_DELETED",
                        "Deleted promotion for personnel: "
                                + promotion.getPersonnel().getFullName()
                                + " from "
                                + promotion.getPreviousRank()
                                + " to "
                                + promotion.getNewRank(),
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