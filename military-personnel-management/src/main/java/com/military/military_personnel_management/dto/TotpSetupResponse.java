package com.military.military_personnel_management.dto;

public class TotpSetupResponse {

    private String secret;
    private String otpauthUri;
    private String message;

    public TotpSetupResponse() {
    }

    public TotpSetupResponse(String secret, String otpauthUri, String message) {
        this.secret = secret;
        this.otpauthUri = otpauthUri;
        this.message = message;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getOtpauthUri() {
        return otpauthUri;
    }

    public void setOtpauthUri(String otpauthUri) {
        this.otpauthUri = otpauthUri;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}