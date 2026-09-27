package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.TpmChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TpmChallengeRepository
        extends JpaRepository<TpmChallenge, Long> {

    Optional<TpmChallenge> findByChallengeId(String challengeId);
}