package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.TpmChallenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TpmChallengeRepository extends JpaRepository<TpmChallenge, Long> {

    Optional<TpmChallenge> findByChallengeId(String challengeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select challenge from TpmChallenge challenge where challenge.challengeId = :challengeId")
    Optional<TpmChallenge> findByChallengeIdForUpdate(
            @Param("challengeId") String challengeId);
}