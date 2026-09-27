package com.military.military_personnel_management.dto;

public class TotpVerificationRequest {

    private String code;

    public TotpVerificationRequest() {
    }

    public TotpVerificationRequest(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}