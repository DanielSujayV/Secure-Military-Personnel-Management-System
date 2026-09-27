package com.military.military_personnel_management.controller;
import com.military.military_personnel_management.service.AuditLogService;
import com.military.military_personnel_management.entity.AuditLog;
import java.time.LocalDateTime;
import com.military.military_personnel_management.dto.TotpSetupResponse;
import com.military.military_personnel_management.dto.TotpVerificationRequest;
import com.military.military_personnel_management.entity.TotpCredential;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.TotpCredentialRepository;
import com.military.military_personnel_management.repository.UserRepository;
import com.military.military_personnel_management.service.TotpService;

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

    public TotpCredentialController(
            TotpCredentialRepository totpCredentialRepository,
            UserRepository userRepository,
            TotpService totpService,
            AuditLogService auditLogService) {

        this.totpCredentialRepository = totpCredentialRepository;
        this.userRepository = userRepository;
        this.totpService = totpService;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/setup")
    public TotpSetupResponse setup(Authentication authentication) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        ));

        var existingCredential =
                totpCredentialRepository.findByUserId(user.getId());

        if (existingCredential.isPresent()
                && existingCredential.get().isEnabled()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "TOTP is already enabled"
            );
        }

        /*
         * If a disabled credential already exists, replace it.
         * This allows the user to restart setup if necessary.
         */
        String secret = totpService.generateSecret();

        TotpCredential credential;

        if (existingCredential.isPresent()) {
            credential = existingCredential.get();
            credential.setSecret(secret);
            credential.setEnabled(false);
        } else {
            credential = new TotpCredential(user, secret);
        }

totpCredentialRepository.save(credential);

auditLogService.createAuditLog(
        new AuditLog(
                username,
                "TOTP_SETUP",
                "TOTP setup initiated",
                LocalDateTime.now()
        )
);

String otpauthUri =
        totpService.generateOtpAuthUri(
                username,
                secret
        );

        

        return new TotpSetupResponse(
                secret,
                otpauthUri,
                "TOTP setup created. Add it to your authenticator app and confirm the generated code."
        );
    }

    @PostMapping("/confirm")
    public String confirm(
            Authentication authentication,
            @RequestBody TotpVerificationRequest request) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        ));

        TotpCredential credential =
                totpCredentialRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "TOTP setup has not been started"
                                ));

        if (credential.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "TOTP is already enabled"
            );
        }

        boolean valid =
                totpService.verifyCode(
                        credential.getSecret(),
                        request.getCode()
                );

       if (!valid) {

    auditLogService.createAuditLog(
            new AuditLog(
                    username,
                    "TOTP_VERIFICATION_FAILED",
                    "Invalid TOTP code",
                    LocalDateTime.now()
            )
    );

    throw new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Invalid TOTP code"
    );
}

        credential.setEnabled(true);
totpCredentialRepository.save(credential);

auditLogService.createAuditLog(
        new AuditLog(
                username,
                "TOTP_VERIFICATION_SUCCESS",
                "TOTP enabled successfully",
                LocalDateTime.now()
        )
);

return "TOTP enabled successfully";
    }
}