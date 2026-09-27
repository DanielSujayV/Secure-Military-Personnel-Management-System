import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TOTPVerification.css";

const TPMVerification = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState(
    "Verifying TPM security..."
  );

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const verifyTPM = async () => {
      try {
        setError("");
        setStatus("Verifying TPM security...");

        const token = localStorage.getItem("token");

        const challengeId =
          sessionStorage.getItem("tpmChallengeId");

        const deviceId =
          sessionStorage.getItem("tpmDeviceId");

        const challenge =
          sessionStorage.getItem("tpmChallenge");

        if (!token || !challengeId || !deviceId || !challenge) {
          throw new Error(
            "TPM authentication session is missing. Please log in again."
          );
        }

        /*
         * Step 1:
         * Ask the local TPM helper to sign the server challenge.
         */
        setStatus("Authenticating with TPM...");

        const signResponse = await fetch(
          "http://127.0.0.1:8765/tpm/sign",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              challenge: challenge,
            }),
          }
        );

        const signData = await signResponse.json();

        if (!signResponse.ok || !signData.success) {
          throw new Error(
            signData.message ||
            signData.error ||
            "TPM signing failed."
          );
        }

        /*
         * Step 2:
         * Send the TPM signature to Spring Boot.
         */
        setStatus("Verifying TPM signature...");

        const verifyResponse = await fetch(
          "http://localhost:8080/api/auth/verify-tpm",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              challengeId: challengeId,
              deviceId: deviceId,
              signature: signData.signature,
            }),
          }
        );

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(
            verifyData.message ||
            verifyData.error ||
            "TPM verification failed."
          );
        }

        /*
         * TPM authentication succeeded.
         * Replace the password-only pre-auth token with
         * the TPM-verified token.
         */
        localStorage.setItem(
          "token",
          verifyData.token
        );

        if (verifyData.username) {
          localStorage.setItem(
            "username",
            verifyData.username
          );
        }

        /*
         * The challenge must not remain available
         * for another frontend attempt.
         */
        sessionStorage.removeItem("tpmChallengeId");
        sessionStorage.removeItem("tpmDeviceId");
        sessionStorage.removeItem("tpmChallenge");

        if (!cancelled) {
          setStatus(
            "TPM verification successful. Continuing..."
          );

          setTimeout(() => {
            navigate("/verify-totp");
          }, 500);
        }

      } catch (err) {

        if (!cancelled) {
          setError(
            err.message ||
            "TPM verification failed."
          );

          setStatus(
            "TPM verification failed."
          );
        }
      }
    };

    verifyTPM();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="totp-page">

      <div className="totp-card">

        <div className="totp-logo">
          MP
        </div>

        <h1>Hardware Security Verification</h1>

        <p className="totp-description">
          Verifying your TPM 2.0 hardware security key.
        </p>

        <div className="security-message">
          <span className="security-dot"></span>
          {status}
        </div>

        {error && (
          <p className="totp-error">
            {error}
          </p>
        )}

        {!error && (
          <p className="totp-help">
            Please wait while your device security
            is verified.
          </p>
        )}

        {error && (
          <button
            className="back-login"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        )}

      </div>

      <div className="totp-footer">
        Military Personnel Management System · Secure Administrative Portal
      </div>

    </div>
  );
};

export default TPMVerification;