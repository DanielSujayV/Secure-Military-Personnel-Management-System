import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TOTPVerification.css";
const TOTPVerification = () => {
    const navigate = useNavigate();

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleCodeChange = (e) => {
    const value = e.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setCode(value);
    setError("");
};

    const handleVerify = async (e) => {
        e.preventDefault();

        setError("");

        if (!/^\d{6}$/.test(code)) {
            setError("Enter a valid 6-digit verification code.");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setError("Authentication session expired. Please log in again.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:8080/api/auth/verify-totp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        code: code,
                    }),
                }
            );

            if (!response.ok) {
                let message = "TOTP verification failed.";

                try {
                    const errorData = await response.json();

                    message =
                        errorData.message ||
                        errorData.error ||
                        message;
                } catch {
                    // Ignore non-JSON error response.
                }

                throw new Error(message);
            }

            const data = await response.json();

            // Replace the temporary pre-auth token
            // with the fully authenticated JWT.
            localStorage.setItem("token", data.token);

            if (data.username) {
                localStorage.setItem("username", data.username);
            }

            navigate("/dashboard");
        } catch (err) {
            setError(
                err.message || "TOTP verification failed."
            );
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="totp-page">

      <div className="totp-card">

        <div className="totp-logo">
          MP
        </div>

        <h1>Two-Factor Authentication</h1>

        <p className="totp-description">
          Enter the 6-digit verification code from your
          authenticator app to continue.
        </p>

        <div className="security-message">
          <span className="security-dot"></span>
          Additional security verification required
        </div>

        <form onSubmit={handleVerify}>

          <label htmlFor="totp">
            Verification Code
          </label>

          <input
            id="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength="6"
            className="totp-input"
          />

          {error && (
            <p className="totp-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="totp-button"
          >
            Verify & Continue
          </button>

        </form>

        <p className="totp-help">
          Open your authenticator app to view your current
          verification code.
        </p>

        <button
          className="back-login"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </button>

      </div>

      <div className="totp-footer">
        Military Personnel Management System · Secure Administrative Portal
      </div>

    </div>
  );
}

export default TOTPVerification;