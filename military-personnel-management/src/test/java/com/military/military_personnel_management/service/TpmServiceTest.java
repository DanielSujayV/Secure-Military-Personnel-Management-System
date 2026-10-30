package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.TpmChallenge;
import com.military.military_personnel_management.entity.TrustedDevice;
import com.military.military_personnel_management.repository.TpmChallengeRepository;
import com.military.military_personnel_management.repository.TrustedDeviceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TpmServiceTest {

    private static final String USERNAME = "member01";
    private static final String DEVICE_ID = "device-01";
    private static final String CHALLENGE_ID = "challenge-01";

    @Test
    void acceptsValidSignatureForChallengeOwner() throws Exception {
        KeyPair keyPair = generateKeyPair();
        TpmChallenge challenge = challenge(USERNAME, false, LocalDateTime.now().plusMinutes(2));
        TrustedDevice device = trustedDevice(USERNAME, keyPair);

        TpmChallengeRepository challengeRepository = mock(TpmChallengeRepository.class);
        TrustedDeviceRepository deviceRepository = mock(TrustedDeviceRepository.class);
        when(challengeRepository.findByChallengeIdForUpdate(CHALLENGE_ID))
                .thenReturn(Optional.of(challenge));
        when(deviceRepository.findByDeviceIdAndUsername(DEVICE_ID, USERNAME))
                .thenReturn(Optional.of(device));

        TpmService service = new TpmService(
                mock(RestTemplate.class), deviceRepository, challengeRepository);

        String signedValue = sign(keyPair, challenge.getChallenge());
        assertTrue(service.verifySignature(USERNAME, CHALLENGE_ID, DEVICE_ID, signedValue));
        assertTrue(challenge.isUsed());
        verify(challengeRepository).save(challenge);
    }

    @Test
    void rejectsChallengeRequestedByAnotherAccount() throws Exception {
        KeyPair keyPair = generateKeyPair();
        TpmChallenge challenge = challenge("different-user", false, LocalDateTime.now().plusMinutes(2));

        TpmChallengeRepository challengeRepository = mock(TpmChallengeRepository.class);
        TrustedDeviceRepository deviceRepository = mock(TrustedDeviceRepository.class);
        when(challengeRepository.findByChallengeIdForUpdate(CHALLENGE_ID))
                .thenReturn(Optional.of(challenge));

        TpmService service = new TpmService(
                mock(RestTemplate.class), deviceRepository, challengeRepository);

        assertThrows(ResponseStatusException.class,
                () -> service.verifySignature(USERNAME, CHALLENGE_ID, DEVICE_ID,
                        sign(keyPair, challenge.getChallenge())));
        verifyNoInteractions(deviceRepository);
        verify(challengeRepository, never()).save(any(TpmChallenge.class));
    }

    @Test
    void rejectsAndConsumesExpiredChallenge() {
        TpmChallenge challenge = challenge(
                USERNAME, false, LocalDateTime.now().minusSeconds(1));

        TpmChallengeRepository challengeRepository = mock(TpmChallengeRepository.class);
        TrustedDeviceRepository deviceRepository = mock(TrustedDeviceRepository.class);
        when(challengeRepository.findByChallengeIdForUpdate(CHALLENGE_ID))
                .thenReturn(Optional.of(challenge));

        TpmService service = new TpmService(
                mock(RestTemplate.class), deviceRepository, challengeRepository);

        assertThrows(ResponseStatusException.class,
                () -> service.verifySignature(USERNAME, CHALLENGE_ID, DEVICE_ID, "invalid"));
        assertTrue(challenge.isUsed());
        verify(challengeRepository).save(challenge);
        verifyNoInteractions(deviceRepository);
    }

    @Test
    void consumesChallengeAfterInvalidSignatureToPreventReplay() throws Exception {
        KeyPair registeredKey = generateKeyPair();
        KeyPair otherKey = generateKeyPair();
        TpmChallenge challenge = challenge(USERNAME, false, LocalDateTime.now().plusMinutes(2));
        TrustedDevice device = trustedDevice(USERNAME, registeredKey);

        TpmChallengeRepository challengeRepository = mock(TpmChallengeRepository.class);
        TrustedDeviceRepository deviceRepository = mock(TrustedDeviceRepository.class);
        when(challengeRepository.findByChallengeIdForUpdate(CHALLENGE_ID))
                .thenReturn(Optional.of(challenge));
        when(deviceRepository.findByDeviceIdAndUsername(DEVICE_ID, USERNAME))
                .thenReturn(Optional.of(device));

        TpmService service = new TpmService(
                mock(RestTemplate.class), deviceRepository, challengeRepository);

        assertFalse(service.verifySignature(
                USERNAME, CHALLENGE_ID, DEVICE_ID, sign(otherKey, challenge.getChallenge())));
        assertTrue(challenge.isUsed());
        verify(challengeRepository).save(challenge);
    }

    @Test
    void rejectsAlreadyUsedChallenge() {
        TpmChallenge challenge = challenge(
                USERNAME, true, LocalDateTime.now().plusMinutes(2));

        TpmChallengeRepository challengeRepository = mock(TpmChallengeRepository.class);
        TrustedDeviceRepository deviceRepository = mock(TrustedDeviceRepository.class);
        when(challengeRepository.findByChallengeIdForUpdate(CHALLENGE_ID))
                .thenReturn(Optional.of(challenge));

        TpmService service = new TpmService(
                mock(RestTemplate.class), deviceRepository, challengeRepository);

        assertThrows(ResponseStatusException.class,
                () -> service.verifySignature(USERNAME, CHALLENGE_ID, DEVICE_ID, "invalid"));
        verifyNoInteractions(deviceRepository);
    }

    private static TpmChallenge challenge(
            String username, boolean used, LocalDateTime expiresAt) {
        byte[] rawChallenge = "test-tpm-challenge".getBytes(StandardCharsets.UTF_8);
        TpmChallenge challenge = new TpmChallenge();
        challenge.setChallengeId(CHALLENGE_ID);
        challenge.setUsername(username);
        challenge.setDeviceId(DEVICE_ID);
        challenge.setChallenge(Base64.getEncoder().encodeToString(rawChallenge));
        challenge.setCreatedAt(LocalDateTime.now().minusSeconds(1));
        challenge.setExpiresAt(expiresAt);
        challenge.setUsed(used);
        return challenge;
    }

    private static TrustedDevice trustedDevice(String username, KeyPair keyPair) {
        TrustedDevice device = new TrustedDevice();
        device.setUsername(username);
        device.setDeviceId(DEVICE_ID);
        device.setPublicKey(Base64.getEncoder().encodeToString(
                keyPair.getPublic().getEncoded()));
        device.setRegisteredAt(LocalDateTime.now());
        device.setEnabled(true);
        return device;
    }

    private static KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private static String sign(KeyPair keyPair, String challengeBase64) throws Exception {
        byte[] challengeBytes = Base64.getDecoder().decode(challengeBase64);
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(keyPair.getPrivate());
        signature.update(challengeBytes);
        return Base64.getEncoder().encodeToString(signature.sign());
    }
}