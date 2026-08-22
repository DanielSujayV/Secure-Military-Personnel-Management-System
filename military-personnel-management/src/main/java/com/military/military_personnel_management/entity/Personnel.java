package com.military.military_personnel_management.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "personnel")
public class Personnel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String serviceNumber;

    @Column(nullable = false)
    private String fullName;

    @Column(name = "personnel_rank")
    private String rank;

    private String email;

    private String phone;

    @ManyToOne
    @JoinColumn(name = "unit_id")
    private Unit unit;

    public Personnel() {
    }

    public Personnel(String serviceNumber, String fullName, String rank,
                     String email, String phone, Unit unit) {
        this.serviceNumber = serviceNumber;
        this.fullName = fullName;
        this.rank = rank;
        this.email = email;
        this.phone = phone;
        this.unit = unit;
    }

    public Long getId() {
        return id;
    }

    public String getServiceNumber() {
        return serviceNumber;
    }

    public void setServiceNumber(String serviceNumber) {
        this.serviceNumber = serviceNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRank() {
        return rank;
    }

    public void setRank(String rank) {
        this.rank = rank;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Unit getUnit() {
        return unit;
    }

    public void setUnit(Unit unit) {
        this.unit = unit;
    }
}