import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TOTPVerification.css";

function TOTPVerification() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleVerify = (e) => {
    e.preventDefault();

    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    // Temporary frontend verification.
    // This will later be replaced by a Spring Boot API call.
    navigate("/dashboard");
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;

    if (/^\d*$/.test(value) && value.length <= 6) {
      setCode(value);
      setError("");
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