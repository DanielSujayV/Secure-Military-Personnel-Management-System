package com.military.military_personnel_management.controller;

import com.military.military_personnel_management.dto.LoginResponse;
import com.military.military_personnel_management.dto.TotpVerificationRequest;
import com.military.military_personnel_management.entity.AuditLog;
import com.military.military_personnel_management.entity.TotpCredential;
import com.military.military_personnel_management.entity.TpmChallenge;
import com.military.military_personnel_management.entity.TrustedDevice;
import com.military.military_personnel_management.entity.User;
import com.military.military_personnel_management.repository.TotpCredentialRepository;
import com.military.military_personnel_management.repository.TrustedDeviceRepository;
import com.military.military_personnel_management.repository.UserRepository;
import com.military.military_personnel_management.security.JwtService;
import com.military.military_personnel_management.service.AuditLogService;
import com.military.military_personnel_management.service.TpmService;
import com.military.military_personnel_management.service.TotpService;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final TotpCredentialRepository totpCredentialRepository;
    private final TotpService totpService;
    private final UserDetailsService userDetailsService;
    private final AuditLogService auditLogService;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final TpmService tpmService;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            TotpCredentialRepository totpCredentialRepository,
            TotpService totpService,
            UserDetailsService userDetailsService,
            AuditLogService auditLogService,
            TrustedDeviceRepository trustedDeviceRepository,
            TpmService tpmService) {

        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.totpCredentialRepository = totpCredentialRepository;
        this.totpService = totpService;
        this.userDetailsService = userDetailsService;
        this.auditLogService = auditLogService;
        this.trustedDeviceRepository = trustedDeviceRepository;
        this.tpmService = tpmService;
    }

    @PostMapping("/login")
    public LoginResponse login(
            @RequestParam String username,
            @RequestParam String password) {

        try {

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    password
                            )
                    );

            UserDetails userDetails =
                    (UserDetails) authentication.getPrincipal();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() ->
                            new RuntimeException("User not found"));

            /*
             * Password authentication succeeded.
             * The next authentication factor is TPM.
             */
            TrustedDevice trustedDevice =
                   trustedDeviceRepository
        .findFirstByUsernameAndEnabledTrueOrderByRegisteredAtDesc(username)
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.UNAUTHORIZED,
                                            "No trusted TPM device registered for this user"
                                    ));

            /*
             * Generate a short-lived pre-authentication JWT.
             */
            String preAuthToken =
                    jwtService.generatePreAuthToken(userDetails);

            /*
             * Generate a fresh TPM challenge.
             */
            TpmChallenge challenge =
                    tpmService.createChallenge(
                            username,
                            trustedDevice.getDeviceId()
                    );

            auditLogService.createAuditLog(
                    new AuditLog(
                            username,
                            "LOGIN_PASSWORD_SUCCESS",
                            "Password authentication successful; TPM verification required",
                            LocalDateTime.now()
                    )
            );

            return new LoginResponse(
                    preAuthToken,
                    userDetails.getUsername(),
                    "TPM verification required",
                    true,
                    challenge.getChallengeId(),
                    challenge.getDeviceId(),
                    challenge.getChallenge()
            );

        } catch (org.springframework.security.core.AuthenticationException ex) {

            auditLogService.createAuditLog(
                    new AuditLog(
                            username,
                            "LOGIN_FAILED",
                            "Invalid username or password",
                            LocalDateTime.now()
                    )
            );

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid username or password"
            );
        }
    }

    @PostMapping("/verify-tpm")
    public LoginResponse verifyTpm(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            ) String authorization,
            @RequestBody TpmVerificationRequest request) {

        if (authorization == null
                || !authorization.startsWith("Bearer ")) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bearer token required"
            );
        }

        String token = authorization.substring(7);

        try {

            String username =
                    jwtService.extractUsername(token);

            /*
             * This must still be a password-only pre-auth token.
             */
            if (jwtService.isTpmVerified(token)
                    || jwtService.isTotpVerified(token)) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid TPM authentication state"
                );
            }

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

            if (!jwtService.isTokenValid(
                    token,
                    userDetails)) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid authentication token"
                );
            }

            boolean valid =
                    tpmService.verifySignature(
                            username,
                            request.challengeId(),
                            request.deviceId(),
                            request.signature()
                    );

            if (!valid) {

                auditLogService.createAuditLog(
                        new AuditLog(
                                username,
                                "TPM_VERIFICATION_FAILED",
                                "Invalid TPM signature during login",
                                LocalDateTime.now()
                        )
                );

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "TPM verification failed"
                );
            }

            auditLogService.createAuditLog(
                    new AuditLog(
                            username,
                            "TPM_VERIFICATION_SUCCESS",
                            "TPM verification successful during login",
                            LocalDateTime.now()
                    )
            );

            String tpmVerifiedToken =
                    jwtService.generateTpmVerifiedToken(
                            userDetails
                    );

            return new LoginResponse(
                    tpmVerifiedToken,
                    username,
                    "TPM verification successful; TOTP verification required"
            );

        } catch (ResponseStatusException ex) {

            throw ex;

        } catch (Exception ex) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid TPM authentication token"
            );
        }
    }

    @PostMapping("/verify-totp")
    public LoginResponse verifyTotp(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            ) String authorization,
            @RequestBody TotpVerificationRequest request) {

        if (authorization == null
                || !authorization.startsWith("Bearer ")) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Bearer token required"
            );
        }

        String token = authorization.substring(7);

        try {

            String username =
                    jwtService.extractUsername(token);

            /*
             * TOTP must only be performed after TPM verification.
             */
            if (!jwtService.isTpmVerified(token)
                    || jwtService.isTotpVerified(token)) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid TOTP authentication state"
                );
            }

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

            if (!jwtService.isTokenValid(
                    token,
                    userDetails)) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid authentication token"
                );
            }

            User user =
                    userRepository.findByUsername(username)
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.UNAUTHORIZED,
                                            "User not found"
                                    ));

            TotpCredential credential =
                    totpCredentialRepository
                            .findByUserId(user.getId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.UNAUTHORIZED,
                                            "TOTP is not configured"
                                    ));

            if (!credential.isEnabled()) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "TOTP is not enabled"
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
                                "Invalid TOTP code during login",
                                LocalDateTime.now()
                        )
                );

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid TOTP code"
                );
            }

            auditLogService.createAuditLog(
                    new AuditLog(
                            username,
                            "TOTP_VERIFICATION_SUCCESS",
                            "TOTP verification successful during login",
                            LocalDateTime.now()
                    )
            );

            String finalToken =
                    jwtService.generateToken(userDetails);

            return new LoginResponse(
                    finalToken,
                    username,
                    "Login successful"
            );

        } catch (ResponseStatusException ex) {

            throw ex;

        } catch (Exception ex) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authentication token"
            );
        }
    }

    public record TpmVerificationRequest(
            String challengeId,
            String deviceId,
            String signature
    ) {
    }
}