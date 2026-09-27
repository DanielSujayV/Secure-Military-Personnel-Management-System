package com.military.military_personnel_management.controller;

import com.military.military_personnel_management.entity.TpmChallenge;
import com.military.military_personnel_management.entity.TrustedDevice;
import com.military.military_personnel_management.service.TpmService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tpm")
public class TpmController {

    private final TpmService tpmService;

    public TpmController(TpmService tpmService) {
        this.tpmService = tpmService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerDevice(
            Authentication authentication) {

        String username = authentication.getName();

        TrustedDevice device =
                tpmService.registerDevice(username);

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