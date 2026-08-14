import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter your username and password.");
      return;
    }

    navigate("/verify-totp");
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
            />

          </div>

          <button
            type="submit"
            className="login-button"
          >
            Sign In
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