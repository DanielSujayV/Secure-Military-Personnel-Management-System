import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";
import "./TOTPVerification.css";

const TPM_HELPER_URL = import.meta.env.VITE_TPM_HELPER_URL || "http://127.0.0.1:8765";

const TPMVerification = () => {
    const navigate = useNavigate();
    const { token, replaceToken, logout } = useAuth();
    const [status, setStatus] = useState("Verifying TPM security...");
    const [error, setError] = useState("");
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const verifyTPM = async () => {
            try {
                setError("");
                setStatus("Verifying TPM security...");

                const challengeId = sessionStorage.getItem("tpmChallengeId");
                const deviceId = sessionStorage.getItem("tpmDeviceId");
                const challenge = sessionStorage.getItem("tpmChallenge");

                if (!token || !challengeId || !deviceId || !challenge) {
                    throw new Error("TPM authentication session is missing. Please log in again.");
                }

                setStatus("Authenticating with TPM...");
                const signResponse = await fetch(`${TPM_HELPER_URL}/tpm/sign`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ challenge }),
                });

                const signData = await signResponse.json().catch(() => ({}));
                if (!signResponse.ok || !signData.success || !signData.signature) {
                    throw new Error(signData.message || signData.error || "TPM signing failed.");
                }
                if (signData.deviceId && signData.deviceId !== deviceId) {
                    throw new Error("The connected TPM device does not match the device registered to this account.");
                }

                setStatus("Verifying TPM signature...");
                const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-tpm`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ challengeId, deviceId, signature: signData.signature }),
                });

                const verifyData = await verifyResponse.json().catch(() => ({}));
                if (!verifyResponse.ok || !verifyData.token) {
                    throw new Error(verifyData.message || verifyData.error || "TPM verification failed.");
                }

                replaceToken(verifyData.token, verifyData.username);
                sessionStorage.removeItem("tpmChallengeId");
                sessionStorage.removeItem("tpmDeviceId");
                sessionStorage.removeItem("tpmChallenge");

                setStatus("TPM verification successful. Continuing...");
                navigate("/verify-totp", { replace: true });
            } catch (err) {
                setError(err.message || "TPM verification failed.");
                setStatus("TPM verification failed.");
            }
        };

        verifyTPM();
    }, [navigate, token, replaceToken]);

    const handleBackToLogin = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="totp-page">
            <div className="totp-card">
                <div className="totp-logo">MP</div>
                <h1>Hardware Security Verification</h1>
                <p className="totp-description">Verifying your TPM 2.0 hardware security key.</p>
                <div className="security-message">
                    <span className="security-dot"></span>
                    {status}
                </div>
                {error && <p className="totp-error" role="alert">{error}</p>}
                {!error && <p className="totp-help">Please wait while your device security is verified.</p>}
                {error && <button className="back-login" onClick={handleBackToLogin}>Back to Login</button>}
            </div>
            <div className="totp-footer">Military Personnel Management System · Secure Administrative Portal</div>
        </div>
    );
};

export default TPMVerification;