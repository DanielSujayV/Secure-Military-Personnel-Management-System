package com.military.military_personnel_management.service;

import com.military.military_personnel_management.entity.TotpCredential;
import com.military.military_personnel_management.repository.TotpCredentialRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TotpCredentialService {

    private final TotpCredentialRepository totpCredentialRepository;

    public TotpCredentialService(TotpCredentialRepository totpCredentialRepository) {
        this.totpCredentialRepository = totpCredentialRepository;
    }

    public TotpCredential createTotpCredential(TotpCredential credential) {
        return totpCredentialRepository.save(credential);
    }

    public List<TotpCredential> getAllTotpCredentials() {
        return totpCredentialRepository.findAll();
    }

    public Optional<TotpCredential> getTotpCredentialById(Long id) {
        return totpCredentialRepository.findById(id);
    }

    public Optional<TotpCredential> getByUserId(Long userId) {
        return totpCredentialRepository.findByUserId(userId);
    }

    public TotpCredential updateTotpCredential(TotpCredential credential) {
        return totpCredentialRepository.save(credential);
    }

    public void deleteTotpCredential(Long id) {
        totpCredentialRepository.deleteById(id);
    }
}