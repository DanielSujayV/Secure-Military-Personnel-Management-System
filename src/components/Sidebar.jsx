import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();

    sessionStorage.removeItem("tpmChallengeId");
    sessionStorage.removeItem("tpmDeviceId");
    sessionStorage.removeItem("tpmChallenge");

    navigate("/login");
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <div className="sidebar-logo">MP</div>

        <div>
          <h2>Military PMS</h2>
          <span>Management System</span>
        </div>
      </div>

      <nav className="sidebar-nav">

        <NavLink to="/dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/personnel">
          Personnel
        </NavLink>

        <NavLink to="/units">
          Units
        </NavLink>

        <NavLink to="/leave">
          Leave Management
        </NavLink>

        <NavLink to="/promotions">
          Promotions
        </NavLink>

        <NavLink to="/audit">
          Audit Logs
        </NavLink>

      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

        <span>Secure Administrative Portal</span>
      </div>

    </aside>
  );
}

export default Sidebar;