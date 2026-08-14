import { NavLink } from "react-router-dom";

function Sidebar() {
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
        Secure Administrative Portal
      </div>

    </aside>
  );
}

export default Sidebar;