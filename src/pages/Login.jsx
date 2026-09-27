import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      if (!response.ok) {
        let message = "Login failed.";

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

      /*
       * Store the password-authenticated pre-auth token.
       * It will be replaced after TPM verification.
       */
      login(data.token, data.username);

      /*
       * New authentication flow:
       *
       * Password
       *   ↓
       * TPM
       *   ↓
       * TOTP
       */
      if (data.tpmRequired) {
        sessionStorage.setItem(
          "tpmChallengeId",
          data.tpmChallengeId
        );

        sessionStorage.setItem(
          "tpmDeviceId",
          data.tpmDeviceId
        );

        sessionStorage.setItem(
          "tpmChallenge",
          data.tpmChallenge
        );

        navigate("/verify-tpm");
      } else if (
        data.message === "TOTP verification required"
      ) {
        navigate("/verify-totp");
      } else {
        navigate("/dashboard");
      }

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

          <div className="system-icon">
            MP
          </div>

          <h1>Military Personnel</h1>
          <p>Management System</p>

        </div>

        <div className="security-status">
          <span className="status-dot"></span>
          Secure Access Portal
        </div>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter your username"
              required
              autoComplete="username"
            />

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        <div className="security-info">

          <p>Authorized Personnel Only</p>

          <span>
            Access is monitored and logged for security purposes.
          </span>

        </div>

      </div>

      <div className="login-footer">
        Military Personnel Management System · Secure Administrative Portal
      </div>

    </div>
  );
}

export default Login;