package com.military.military_personnel_management.repository;

import com.military.military_personnel_management.entity.TrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrustedDeviceRepository
        extends JpaRepository<TrustedDevice, Long> {

    Optional<TrustedDevice> findByDeviceIdAndUsername(
            String deviceId,
            String username
    );

    Optional<TrustedDevice> findByDeviceId(
            String deviceId
    );

    Optional<TrustedDevice>
    findFirstByUsernameAndEnabledTrueOrderByRegisteredAtDesc(
            String username
    );
}