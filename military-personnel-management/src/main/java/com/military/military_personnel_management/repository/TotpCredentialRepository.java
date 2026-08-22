package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.TotpCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TotpCredentialRepository
        extends JpaRepository<TotpCredential, Long> {

    Optional<TotpCredential> findByUserId(Long userId);
}