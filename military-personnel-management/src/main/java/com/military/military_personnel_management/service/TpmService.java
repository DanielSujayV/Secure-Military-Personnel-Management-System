package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.TpmChallenge;
import com.military.military_personnel_management.entity.TrustedDevice;
import com.military.military_personnel_management.repository.TpmChallengeRepository;
import com.military.military_personnel_management.repository.TrustedDeviceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
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

    private static final String TPM_HELPER_URL =
            "http://127.0.0.1:8765";

    private final TrustedDeviceRepository trustedDeviceRepository;
    private final TpmChallengeRepository tpmChallengeRepository;
    private final RestTemplate restTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public TpmService(
            TrustedDeviceRepository trustedDeviceRepository,
            TpmChallengeRepository tpmChallengeRepository,
            RestTemplate restTemplate) {

        this.trustedDeviceRepository = trustedDeviceRepository;
        this.tpmChallengeRepository = tpmChallengeRepository;
        this.restTemplate = restTemplate;
    }

    public TrustedDevice registerDevice(String username) {

        ResponseEntity<Map> response = restTemplate.postForEntity(
                TPM_HELPER_URL + "/tpm/register",
                null,
                Map.class
        );

        if (!response.getStatusCode().is2xxSuccessful()
                || response.getBody() == null) {

            throw new RuntimeException(
                    "TPM registration failed"
            );
        }

        Map<String, Object> data = response.getBody();

        String deviceId = (String) data.get("deviceId");
        String publicKey = (String) data.get("publicKey");

        if (deviceId == null || publicKey == null) {
            throw new RuntimeException(
                    "TPM helper returned incomplete registration data"
            );
        }

        TrustedDevice device =
                trustedDeviceRepository
                        .findByDeviceId(deviceId)
                        .orElse(new TrustedDevice());

        device.setDeviceId(deviceId);
        device.setUsername(username);
        device.setPublicKey(publicKey);
        device.setRegisteredAt(LocalDateTime.now());
        device.setEnabled(true);

        return trustedDeviceRepository.save(device);
    }

    public TpmChallenge createChallenge(
            String username,
            String deviceId) {

        TrustedDevice device =
                trustedDeviceRepository
                        .findByDeviceId(deviceId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trusted TPM device not found"
                                ));

        if (!device.getUsername().equals(username)) {
            throw new RuntimeException(
                    "TPM device does not belong to this user"
            );
        }

        if (!device.isEnabled()) {
            throw new RuntimeException(
                    "TPM device is disabled"
            );
        }

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String challenge =
                Base64.getEncoder().encodeToString(randomBytes);

        TpmChallenge tpmChallenge = new TpmChallenge();

        tpmChallenge.setChallengeId(
                UUID.randomUUID().toString()
        );

        tpmChallenge.setDeviceId(deviceId);
        tpmChallenge.setChallenge(challenge);

        tpmChallenge.setCreatedAt(
                LocalDateTime.now()
        );

        tpmChallenge.setExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );

        tpmChallenge.setUsed(false);

        return tpmChallengeRepository.save(tpmChallenge);
    }

    public boolean verifySignature(
            String username,
            String challengeId,
            String deviceId,
            String signatureBase64) {

        TpmChallenge challenge =
                tpmChallengeRepository
                        .findByChallengeId(challengeId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "TPM challenge not found"
                                ));

        if (!challenge.getDeviceId().equals(deviceId)) {
            throw new RuntimeException(
                    "Challenge does not belong to this device"
            );
        }

        if (challenge.isUsed()) {
            throw new RuntimeException(
                    "TPM challenge has already been used"
            );
        }

        if (challenge.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            throw new RuntimeException(
                    "TPM challenge has expired"
            );
        }

        TrustedDevice device =
                trustedDeviceRepository
                        .findByDeviceId(deviceId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Trusted TPM device not found"
                                ));

        if (!device.getUsername().equals(username)) {
            throw new RuntimeException(
                    "TPM device does not belong to this user"
            );
        }

        if (!device.isEnabled()) {
            throw new RuntimeException(
                    "TPM device is disabled"
            );
        }

        try {
            byte[] publicKeyBytes =
                    Base64.getDecoder().decode(
                            device.getPublicKey()
                    );

            X509EncodedKeySpec keySpec =
                    new X509EncodedKeySpec(publicKeyBytes);

            KeyFactory keyFactory =
                    KeyFactory.getInstance("RSA");

            PublicKey publicKey =
                    keyFactory.generatePublic(keySpec);

            byte[] signatureBytes =
                    Base64.getDecoder().decode(
                            signatureBase64
                    );

            byte[] challengeBytes =
                    Base64.getDecoder().decode(
                            challenge.getChallenge()
                    );

            Signature verifier =
                    Signature.getInstance("SHA256withRSA");

            verifier.initVerify(publicKey);
            verifier.update(challengeBytes);

            boolean valid =
                    verifier.verify(signatureBytes);

            if (valid) {
                challenge.setUsed(true);
                tpmChallengeRepository.save(challenge);
            }

            return valid;

        } catch (Exception ex) {
            throw new RuntimeException(
                    "TPM signature verification failed",
                    ex
            );
        }
    }
}