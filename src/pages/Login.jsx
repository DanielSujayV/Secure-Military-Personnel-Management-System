import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { beginLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      const body = new URLSearchParams();
      body.append("username", username.trim());
      body.append("password", password);

      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed.");
      }
      if (!data.token || !data.tpmRequired || !data.tpmChallengeId ||
          !data.tpmDeviceId || !data.tpmChallenge) {
        throw new Error("The server returned an incomplete TPM login challenge.");
      }

      // Do not make a password-only JWT look like a logged-in session.
      beginLogin(data.token, data.username || username.trim());
      sessionStorage.setItem("tpmChallengeId", data.tpmChallengeId);
      sessionStorage.setItem("tpmDeviceId", data.tpmDeviceId);
      sessionStorage.setItem("tpmChallenge", data.tpmChallenge);
      navigate("/verify-tpm");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="system-icon">MP</div>
          <h1>Military Personnel</h1>
          <p>Management System</p>
        </div>
        <div className="security-status">
          <span className="status-dot"></span>
          Secure Access Portal
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="security-info">
          <p>Authorized Personnel Only</p>
          <span>Access is monitored and logged for security purposes.</span>
        </div>
      </div>
      <div className="login-footer">
        Military Personnel Management System · Secure Administrative Portal
      </div>
    </div>
  );
}

export default Login;
