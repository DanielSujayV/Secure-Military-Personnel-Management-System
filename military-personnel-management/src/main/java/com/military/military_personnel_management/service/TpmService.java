package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.TpmChallenge;
import com.military.military_personnel_management.entity.TrustedDevice;
import com.military.military_personnel_management.repository.TpmChallengeRepository;
import com.military.military_personnel_management.repository.TrustedDeviceRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class TpmService {

    @Value("${tpm.helper-url:http://127.0.0.1:8765}")
    private String tpmHelperUrl;

    private final RestTemplate restTemplate;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final TpmChallengeRepository tpmChallengeRepository;

    public TpmService(
            RestTemplate restTemplate,
            TrustedDeviceRepository trustedDeviceRepository,
            TpmChallengeRepository tpmChallengeRepository) {

        this.restTemplate = restTemplate;
        this.trustedDeviceRepository = trustedDeviceRepository;
        this.tpmChallengeRepository = tpmChallengeRepository;
    }

    public TrustedDevice registerDevice(String username) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> request =
                new HttpEntity<>(headers);

        Map<String, Object> response =
                restTemplate.postForObject(
                        tpmHelperUrl + "/tpm/register",
                        request,
                        Map.class
                );

        if (response == null) {
            throw new RuntimeException(
                    "TPM helper returned an empty response"
            );
        }

        Object deviceIdValue =
                response.get("deviceId");

        Object publicKeyValue =
                response.get("publicKey");

        if (deviceIdValue == null ||
                publicKeyValue == null) {

            throw new RuntimeException(
                    "TPM helper response did not contain deviceId and publicKey"
            );
        }

        String deviceId =
                deviceIdValue.toString();

        String publicKey =
                publicKeyValue.toString();

        TrustedDevice device =
                trustedDeviceRepository
                        .findByDeviceIdAndUsername(
                                deviceId,
                                username
                        )
                        .orElse(new TrustedDevice());

        device.setDeviceId(deviceId);
        device.setUsername(username);
        device.setPublicKey(publicKey);
        device.setRegisteredAt(
                LocalDateTime.now()
        );
        device.setEnabled(true);

        return trustedDeviceRepository.save(device);
    }

    public TpmChallenge createChallenge(
            String username,
            String deviceId) {

        TrustedDevice device =
                trustedDeviceRepository
                        .findByDeviceIdAndUsername(
                                deviceId,
                                username
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trusted TPM device not found"
                                )
                        );

        if (!device.isEnabled()) {
            throw new RuntimeException(
                    "Trusted TPM device is disabled"
            );
        }

        byte[] randomBytes =
                new byte[32];

        new SecureRandom()
                .nextBytes(randomBytes);

        String challenge =
                Base64.getEncoder()
                        .encodeToString(randomBytes);

        TpmChallenge tpmChallenge =
                new TpmChallenge();

        tpmChallenge.setChallengeId(
                UUID.randomUUID().toString()
        );

        tpmChallenge.setDeviceId(deviceId);

        tpmChallenge.setChallenge(
                challenge
        );

        tpmChallenge.setCreatedAt(
                LocalDateTime.now()
        );

        tpmChallenge.setExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );

        tpmChallenge.setUsed(false);

        return tpmChallengeRepository.save(
                tpmChallenge
        );
    }

    @Transactional
    public boolean verifySignature(
            String username,
            String challengeId,
            String deviceId,
            String signatureBase64) {

        TpmChallenge challenge = tpmChallengeRepository
                .findByChallengeIdForUpdate(challengeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "TPM challenge not found"));

        if (challenge.isUsed()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "TPM challenge has already been used");
        }

        if (challenge.getExpiresAt() == null
                || !challenge.getExpiresAt().isAfter(LocalDateTime.now())) {
            challenge.setUsed(true);
            tpmChallengeRepository.save(challenge);
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "TPM challenge has expired");
        }

        if (!challenge.getDeviceId().equals(deviceId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "TPM device mismatch");
        }

        TrustedDevice device = trustedDeviceRepository
                .findByDeviceIdAndUsername(deviceId, username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Trusted TPM device not found"));

        if (!device.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Trusted TPM device is disabled");
        }

        // Consume the challenge while holding the row lock, including failed
        // signature attempts. This prevents concurrent verification/replay.
        challenge.setUsed(true);
        tpmChallengeRepository.save(challenge);

        try {
            byte[] publicKeyBytes = Base64.getDecoder().decode(device.getPublicKey());
            byte[] signatureBytes = Base64.getDecoder().decode(signatureBase64);
            byte[] challengeBytes = Base64.getDecoder().decode(challenge.getChallenge());

            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(publicKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(keySpec);

            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(publicKey);
            verifier.update(challengeBytes);
            return verifier.verify(signatureBytes);
        } catch (Exception exception) {
            // Do not reveal cryptographic parsing details to the caller.
            return false;
        }
    }
}