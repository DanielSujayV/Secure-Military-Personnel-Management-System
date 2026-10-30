
package com.military.military_personnel_management.controller;

import com.military.military_personnel_management.dto.TotpSetupResponse;
import com.military.military_personnel_management.dto.TotpVerificationRequest;
import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.TotpCredential;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.TotpCredentialRepository;
import com.military.military_personnel_management.repository.UserRepository;
import com.military.military_personnel_management.service.AuditLogService;
import com.military.military_personnel_management.service.TotpService;
import com.military.military_personnel_management.service.TotpSecretCryptoService;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/totp")
public class TotpCredentialController {

    private final TotpCredentialRepository totpCredentialRepository;
    private final UserRepository userRepository;
    private final TotpService totpService;
    private final AuditLogService auditLogService;
    private final TotpSecretCryptoService totpSecretCryptoService;

    public TotpCredentialController(
            TotpCredentialRepository totpCredentialRepository,
            UserRepository userRepository,
            TotpService totpService,
            AuditLogService auditLogService,
            TotpSecretCryptoService totpSecretCryptoService) {

        this.totpCredentialRepository = totpCredentialRepository;
        this.userRepository = userRepository;
        this.totpService = totpService;
        this.auditLogService = auditLogService;
        this.totpSecretCryptoService = totpSecretCryptoService;
    }

    // Existing self-enrollment endpoint
    @PostMapping("/setup")
    public TotpSetupResponse setup(Authentication authentication) {
        return createSetup(authentication.getName(), authentication.getName(), false);
    }

    // Admin initiates TOTP enrollment for another account.
    // This endpoint must be restricted to ROLE_ADMIN in SecurityConfig.
    @PostMapping("/setup-for-user")
    public TotpSetupResponse setupForUser(
            @RequestParam String username,
            Authentication authentication) {

        return createSetup(username, authentication.getName(), true);
    }

    private TotpSetupResponse createSetup(
            String targetUsername,
            String actorUsername,
            boolean administratorReset) {

        User user = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        var existing = totpCredentialRepository.findByUserId(user.getId());

        if (existing.isPresent() && existing.get().isEnabled() && !administratorReset) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "TOTP is already enabled; an administrator must reset it");
        }

        boolean resettingEnabledCredential =
                existing.isPresent() && existing.get().isEnabled();
        String secret = totpService.generateSecret();
        TotpCredential credential;

        if (existing.isPresent()) {
            credential = existing.get();
            credential.setSecret(totpSecretCryptoService.encrypt(secret));
            credential.setEnabled(false);
        } else {
            credential = new TotpCredential(user, totpSecretCryptoService.encrypt(secret));
        }

        totpCredentialRepository.save(credential);

        auditLogService.createAuditLog(new AuditLog(
                actorUsername,
                resettingEnabledCredential ? "TOTP_RESET" : "TOTP_SETUP",
                (resettingEnabledCredential
                        ? "Administrator reset TOTP for user: "
                        : "TOTP setup initiated for user: ") + targetUsername,
                LocalDateTime.now()
        ));

        String otpauthUri =
                totpService.generateOtpAuthUri(targetUsername, secret);

        return new TotpSetupResponse(
                secret,
                otpauthUri,
                resettingEnabledCredential
                        ? "TOTP reset. Add the new secret to the user's authenticator app and confirm the generated code."
                        : "TOTP setup created. Add it to the user's authenticator app and confirm the generated code."
        );
    }

    // Existing self-confirmation endpoint
    @PostMapping("/confirm")
    public String confirm(
            Authentication authentication,
            @RequestBody TotpVerificationRequest request) {

        return confirmForUsername(
                authentication.getName(),
                authentication.getName(),
                request);
    }

    // Admin confirms enrollment for another account.
    // This endpoint must be restricted to ROLE_ADMIN in SecurityConfig.
    @PostMapping("/confirm-for-user")
    public String confirmForUser(
            @RequestParam String username,
            @RequestBody TotpVerificationRequest request,
            Authentication authentication) {

        return confirmForUsername(
                username,
                authentication.getName(),
                request);
    }

    private String confirmForUsername(
            String targetUsername,
            String actorUsername,
            TotpVerificationRequest request) {

        User user = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        TotpCredential credential = totpCredentialRepository
                .findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "TOTP setup has not been started"));

        if (credential.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "TOTP is already enabled");
        }

        boolean valid = request != null
                && totpService.verifyCode(
                        totpSecretCryptoService.decrypt(credential.getSecret()), request.getCode());

        if (!valid) {
            auditLogService.createAuditLog(new AuditLog(
                    actorUsername,
                    "TOTP_VERIFICATION_FAILED",
                    "Invalid TOTP code for user: " + targetUsername,
                    LocalDateTime.now()
            ));

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid TOTP code");
        }

        // Upgrade legacy plaintext TOTP secrets after successful enrollment confirmation.
        if (!totpSecretCryptoService.isEncrypted(credential.getSecret())) {
            credential.setSecret(totpSecretCryptoService.encrypt(
                    totpSecretCryptoService.decrypt(credential.getSecret())));
        }
        credential.setEnabled(true);
        totpCredentialRepository.save(credential);

        auditLogService.createAuditLog(new AuditLog(
                actorUsername,
                "TOTP_VERIFICATION_SUCCESS",
                "TOTP enabled for user: " + targetUsername,
                LocalDateTime.now()
        ));

        return "TOTP enabled successfully for " + targetUsername;
    }
}
