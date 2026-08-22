package com.military.military_personnel_management.controller;

import com.military.military_personnel_management.entity.TotpCredential;
import com.military.military_personnel_management.service.TotpCredentialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/totp")
public class TotpCredentialController {

    private final TotpCredentialService totpCredentialService;

    public TotpCredentialController(TotpCredentialService totpCredentialService) {
        this.totpCredentialService = totpCredentialService;
    }

    @PostMapping
    public TotpCredential createTotpCredential(
            @RequestBody TotpCredential credential) {
        return totpCredentialService.createTotpCredential(credential);
    }

    @GetMapping
    public List<TotpCredential> getAllTotpCredentials() {
        return totpCredentialService.getAllTotpCredentials();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TotpCredential> getTotpCredentialById(
            @PathVariable Long id) {

        return totpCredentialService.getTotpCredentialById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<TotpCredential> getByUserId(
            @PathVariable Long userId) {

        return totpCredentialService.getByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public TotpCredential updateTotpCredential(
            @RequestBody TotpCredential credential) {
        return totpCredentialService.updateTotpCredential(credential);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTotpCredential(
            @PathVariable Long id) {

        totpCredentialService.deleteTotpCredential(id);
        return ResponseEntity.noContent().build();
    }
}