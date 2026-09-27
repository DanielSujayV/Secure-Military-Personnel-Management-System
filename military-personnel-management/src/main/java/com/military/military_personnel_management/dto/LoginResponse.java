package com.military.military_personnel_management.dto;

public class LoginResponse {

    private String token;
    private String username;
    private String message;

    private boolean tpmRequired;
    private String tpmChallengeId;
    private String tpmDeviceId;
    private String tpmChallenge;

    public LoginResponse() {
    }

    // Existing constructor kept for compatibility
    public LoginResponse(
            String token,
            String username,
            String message) {

        this.token = token;
        this.username = username;
        this.message = message;
    }

    public LoginResponse(
            String token,
            String username,
            String message,
            boolean tpmRequired,
            String tpmChallengeId,
            String tpmDeviceId,
            String tpmChallenge) {

        this.token = token;
        this.username = username;
        this.message = message;
        this.tpmRequired = tpmRequired;
        this.tpmChallengeId = tpmChallengeId;
        this.tpmDeviceId = tpmDeviceId;
        this.tpmChallenge = tpmChallenge;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isTpmRequired() {
        return tpmRequired;
    }

    public void setTpmRequired(boolean tpmRequired) {
        this.tpmRequired = tpmRequired;
    }

    public String getTpmChallengeId() {
        return tpmChallengeId;
    }

    public void setTpmChallengeId(String tpmChallengeId) {
        this.tpmChallengeId = tpmChallengeId;
    }

    public String getTpmDeviceId() {
        return tpmDeviceId;
    }

    public void setTpmDeviceId(String tpmDeviceId) {
        this.tpmDeviceId = tpmDeviceId;
    }

    public String getTpmChallenge() {
        return tpmChallenge;
    }

    public void setTpmChallenge(String tpmChallenge) {
        this.tpmChallenge = tpmChallenge;
    }
}