package com.military.military_personnel_management.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "promotions")
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "personnel_id", nullable = false)
    private Personnel personnel;

    @Column(nullable = false)
    private String previousRank;

    @Column(nullable = false)
    private String newRank;

    @Column(nullable = false)
    private LocalDate promotionDate;

    @Column(length = 500)
    private String remarks;

    public Promotion() {
    }

    public Promotion(Personnel personnel, String previousRank,
                     String newRank, LocalDate promotionDate,
                     String remarks) {
        this.personnel = personnel;
        this.previousRank = previousRank;
        this.newRank = newRank;
        this.promotionDate = promotionDate;
        this.remarks = remarks;
    }

    public Long getId() {
        return id;
    }

    public Personnel getPersonnel() {
        return personnel;
    }

    public void setPersonnel(Personnel personnel) {
        this.personnel = personnel;
    }

    public String getPreviousRank() {
        return previousRank;
    }

    public void setPreviousRank(String previousRank) {
        this.previousRank = previousRank;
    }

    public String getNewRank() {
        return newRank;
    }

    public void setNewRank(String newRank) {
        this.newRank = newRank;
    }

    public LocalDate getPromotionDate() {
        return promotionDate;
    }

    public void setPromotionDate(LocalDate promotionDate) {
        this.promotionDate = promotionDate;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}