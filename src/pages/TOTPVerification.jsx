import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";
import "./TOTPVerification.css";


const TOTPVerification = () => {
    const navigate = useNavigate();
    const { token, replaceToken, logout } = useAuth();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCodeChange = (event) => {
        setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
        setError("");
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        setError("");

        if (!/^\d{6}$/.test(code)) {
            setError("Enter a valid 6-digit verification code.");
            return;
        }

        if (!token) {
            setError("Authentication session expired. Please log in again.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/verify-totp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.token) {
                throw new Error(data.message || data.error || "TOTP verification failed.");
            }

            // Replace the stage token through AuthContext; never update localStorage
            // directly from an authentication page.
            // AuthContext loads the final token's profile once token state updates.
            // The personnel route is available to all roles while that check completes.
            replaceToken(data.token, data.username);
            navigate("/personnel", { replace: true });
        } catch (err) {
            setError(err.message || "TOTP verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        logout();
        navigate("/login", { replace: true });
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
                        maxLength={6}
                        className="totp-input"
                        disabled={loading}
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
                <button className="back-login" onClick={handleBackToLogin} disabled={loading}>
                    Back to Login
                </button>
            </div>
            <div className="totp-footer">Military Personnel Management System · Secure Administrative Portal</div>
        </div>
    );
};

export default TOTPVerification;