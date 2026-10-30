package com.military.military_personnel_management.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TotpSecretCryptoServiceTest {

    private static final String TEST_KEY =
            "test-only-key-with-at-least-thirty-two-characters";

    @Test
    void encryptsAndDecryptsSecret() {
        TotpSecretCryptoService crypto = new TotpSecretCryptoService(TEST_KEY);
        String plaintext = "JBSWY3DPEHPK3PXP";

        String encrypted = crypto.encrypt(plaintext);

        assertNotEquals(plaintext, encrypted);
        assertTrue(crypto.isEncrypted(encrypted));
        assertEquals(plaintext, crypto.decrypt(encrypted));
    }

    @Test
    void usesDifferentNonceForEachEncryption() {
        TotpSecretCryptoService crypto = new TotpSecretCryptoService(TEST_KEY);
        String plaintext = "JBSWY3DPEHPK3PXP";

        String first = crypto.encrypt(plaintext);
        String second = crypto.encrypt(plaintext);

        assertNotEquals(first, second);
        assertEquals(plaintext, crypto.decrypt(first));
        assertEquals(plaintext, crypto.decrypt(second));
    }

    @Test
    void readsLegacyPlaintextForBackwardCompatibility() {
        TotpSecretCryptoService crypto = new TotpSecretCryptoService(TEST_KEY);
        String legacySecret = "JBSWY3DPEHPK3PXP";

        assertFalse(crypto.isEncrypted(legacySecret));
        assertEquals(legacySecret, crypto.decrypt(legacySecret));
    }

    @Test
    void rejectsTamperedCiphertext() {
        TotpSecretCryptoService crypto = new TotpSecretCryptoService(TEST_KEY);
        String encrypted = crypto.encrypt("JBSWY3DPEHPK3PXP");
        String tampered = encrypted.substring(0, encrypted.length() - 2) + "AA";

        assertThrows(IllegalStateException.class, () -> crypto.decrypt(tampered));
    }

    @Test
    void refusesToEncryptWithoutConfiguredKey() {
        TotpSecretCryptoService crypto = new TotpSecretCryptoService("");

        assertThrows(IllegalStateException.class,
                () -> crypto.encrypt("JBSWY3DPEHPK3PXP"));
    }
}