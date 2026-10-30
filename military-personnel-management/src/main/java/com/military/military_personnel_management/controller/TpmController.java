package com.military.military_personnel_management.controller;

import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.TpmChallenge;
import com.military.military_personnel_management.entity.TrustedDevice;
import com.military.military_personnel_management.service.AuditLogService;
import com.military.military_personnel_management.service.TpmService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/tpm")
public class TpmController {

    private final TpmService tpmService;
    private final AuditLogService auditLogService;

    public TpmController(
            TpmService tpmService,
            AuditLogService auditLogService) {

        this.tpmService = tpmService;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerDevice(
            Authentication authentication) {

        String username = authentication.getName();

        TrustedDevice device =
                tpmService.registerDevice(username);

        auditLogService.createAuditLog(new AuditLog(
                username,
                "TPM_DEVICE_REGISTERED",
                "Registered TPM device for current user",
                LocalDateTime.now()
        ));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "deviceId", device.getDeviceId(),
                "username", device.getUsername(),
                "registeredAt", device.getRegisteredAt(),
                "enabled", device.isEnabled()
        ));
    }

    @PostMapping("/register-for-user")
    public ResponseEntity<?> registerDeviceForUser(
            @RequestParam String username,
            Authentication authentication) {

        TrustedDevice device =
                tpmService.registerDevice(username);

        auditLogService.createAuditLog(
                new AuditLog(
                        authentication.getName(),
                        "TPM_DEVICE_REGISTERED",
                        "Registered TPM device for user: " + username,
                        LocalDateTime.now()
                )
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "deviceId", device.getDeviceId(),
                "username", device.getUsername(),
                "registeredAt", device.getRegisteredAt(),
                "enabled", device.isEnabled()
        ));
    }

    @PostMapping("/challenge")
    public ResponseEntity<?> createChallenge(
            @RequestParam String deviceId,
            Authentication authentication) {

        String username = authentication.getName();

        TpmChallenge challenge =
                tpmService.createChallenge(
                        username,
                        deviceId
                );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "challengeId", challenge.getChallengeId(),
                "deviceId", challenge.getDeviceId(),
                "challenge", challenge.getChallenge(),
                "expiresAt", challenge.getExpiresAt()
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifySignature(
            @RequestBody VerifyTpmRequest request,
            Authentication authentication) {

        String username = authentication.getName();

        boolean valid =
                tpmService.verifySignature(
                        username,
                        request.challengeId(),
                        request.deviceId(),
                        request.signature()
                );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "valid", valid,
                "challengeId", request.challengeId(),
                "deviceId", request.deviceId()
        ));
    }

    public record VerifyTpmRequest(
            String challengeId,
            String deviceId,
            String signature
    ) {
    }
}