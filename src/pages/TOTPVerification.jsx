import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./TOTPVerification.css";

const TOTPVerification = () => {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (e) => {
    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter a valid 6-digit verification code.");
      return;
    }

    const token = sessionStorage.getItem("authStageToken");
    if (!token || sessionStorage.getItem("authStage") !== "tpm") {
      setError("Authentication session expired. Please log in again.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/auth/verify-totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "TOTP verification failed.");
      }
      if (!data.token) throw new Error("Server did not return a final authentication token.");

      completeLogin(data.token, data.username || localStorage.getItem("username"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "TOTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="totp-page">
      <div className="totp-card">
        <div className="totp-logo">MP</div>
        <h1>Two-Factor Authentication</h1>
        <p className="totp-description">
          Enter the 6-digit verification code from your authenticator app to continue.
        </p>
        <div className="security-message">
          <span className="security-dot"></span>
          Additional security verification required
        </div>
        <form onSubmit={handleVerify}>
          <label htmlFor="totp">Verification Code</label>
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
            required
          />
          {error && <p className="totp-error" role="alert">{error}</p>}
          <button type="submit" className="totp-button" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
        <p className="totp-help">
          Open your authenticator app to view your current verification code.
        </p>
        <button className="back-login" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
      <div className="totp-footer">
        Military Personnel Management System · Secure Administrative Portal
      </div>
    </div>
  );
};

export default TOTPVerification;
