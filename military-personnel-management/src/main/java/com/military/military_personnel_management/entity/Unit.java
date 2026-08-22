package com.military.military_personnel_management.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "units")
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String unitName;

    @Column(length = 255)
    private String description;

    public Unit() {
    }

    public Unit(String unitName, String description) {
        this.unitName = unitName;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getUnitName() {
        return unitName;
    }

    public void setUnitName(String unitName) {
        this.unitName = unitName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}