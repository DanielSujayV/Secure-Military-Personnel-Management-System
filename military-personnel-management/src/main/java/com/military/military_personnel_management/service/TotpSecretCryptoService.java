package com.military.military_personnel_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class TotpSecretCryptoService {

    private static final String PREFIX = "enc:v1:";
    private static final int NONCE_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final String configuredKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public TotpSecretCryptoService(
            @Value("${totp.encryption-key:}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (configuredKey == null || configuredKey.length() < 32) {
            throw new IllegalStateException(
                    "TOTP_ENCRYPTION_KEY must be configured with at least 32 characters");
        }
    }

    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(PREFIX);
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            throw new IllegalArgumentException("TOTP secret is required");
        }
        if (isEncrypted(plaintext)) {
            return plaintext;
        }

        try {
            byte[] nonce = new byte[NONCE_LENGTH];
            secureRandom.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] payload = new byte[nonce.length + encrypted.length];
            System.arraycopy(nonce, 0, payload, 0, nonce.length);
            System.arraycopy(encrypted, 0, payload, nonce.length, encrypted.length);
            return PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to encrypt TOTP secret", exception);
        }
    }

    public String decrypt(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            throw new IllegalArgumentException("Stored TOTP secret is empty");
        }
        // Backward compatibility for credentials created before encryption was added.
        if (!isEncrypted(storedValue)) {
            return storedValue;
        }

        try {
            byte[] payload = Base64.getDecoder().decode(storedValue.substring(PREFIX.length()));
            if (payload.length <= NONCE_LENGTH) {
                throw new IllegalArgumentException("Invalid encrypted TOTP secret");
            }

            byte[] nonce = Arrays.copyOfRange(payload, 0, NONCE_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(payload, NONCE_LENGTH, payload.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to decrypt TOTP secret. Check TOTP_ENCRYPTION_KEY.", exception);
        }
    }

    private SecretKeySpec key() throws Exception {
        if (configuredKey == null || configuredKey.length() < 32) {
            throw new IllegalStateException(
                    "TOTP_ENCRYPTION_KEY must be configured with at least 32 characters");
        }
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(configuredKey.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(digest, "AES");
    }
}