package com.military.military_personnel_management.service;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private final SecretGenerator secretGenerator;
    private final CodeGenerator codeGenerator;
    private final DefaultCodeVerifier codeVerifier;

    public TotpService() {
        this.secretGenerator = new DefaultSecretGenerator();

        this.codeGenerator =
                new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);

        this.codeVerifier =
                new DefaultCodeVerifier(
                        codeGenerator,
                        new SystemTimeProvider()
                );

        // Standard TOTP period: 30 seconds
        this.codeVerifier.setTimePeriod(30);

        // Allow one period of clock difference (+/- 30 seconds)
        this.codeVerifier.setAllowedTimePeriodDiscrepancy(1);
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || secret.isBlank()) {
            return false;
        }

        if (code == null || !code.matches("\\d{6}")) {
            return false;
        }

        return codeVerifier.isValidCode(secret, code);
    }
    public String generateOtpAuthUri(
        String username,
        String secret) {

    String issuer = "Military Personnel Management System";

    String encodedIssuer = java.net.URLEncoder
            .encode(issuer, java.nio.charset.StandardCharsets.UTF_8)
            .replace("+", "%20");

    String encodedUsername = java.net.URLEncoder
            .encode(username, java.nio.charset.StandardCharsets.UTF_8)
            .replace("+", "%20");

    return "otpauth://totp/"
            + encodedIssuer
            + ":"
            + encodedUsername
            + "?secret="
            + secret
            + "&issuer="
            + encodedIssuer
            + "&algorithm=SHA1"
            + "&digits=6"
            + "&period=30";
}
}
