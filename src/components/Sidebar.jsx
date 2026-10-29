
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const navigate = useNavigate();
    const { logout, role } = useAuth();

    const handleLogout = () => {
        logout();
        sessionStorage.removeItem("tpmChallengeId");
        sessionStorage.removeItem("tpmDeviceId");
        sessionStorage.removeItem("tpmChallenge");
        navigate("/login");
    };

    const linksByRole = {
        ADMIN: [
            { to: "/dashboard", label: "Dashboard" },
            { to: "/personnel", label: "Personnel" },
            { to: "/units", label: "Units" },
            { to: "/leave", label: "Leave Management" },
            { to: "/promotions", label: "Promotions" },
            { to: "/audit", label: "Audit Logs" },
        ],
        COMMANDER: [
            { to: "/dashboard", label: "Dashboard" },
            { to: "/personnel", label: "Personnel" },
            { to: "/units", label: "Units" },
            { to: "/leave", label: "Leave Management" },
            { to: "/promotions", label: "Promotions" },
        ],
        OFFICER: [
            { to: "/dashboard", label: "Dashboard" },
            { to: "/personnel", label: "Personnel" },
            { to: "/leave", label: "Leave Management" },
        ],
        PERSONNEL: [
            { to: "/dashboard", label: "Dashboard" },
            { to: "/personnel", label: "Personnel" },
            { to: "/leave", label: "Leave Management" },
        ],
    };

    const links = linksByRole[role] || [
        { to: "/dashboard", label: "Dashboard" },
    ];

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
                {links.map((link) => (
                    <NavLink key={link.to} to={link.to}>
                        {link.label}
                    </NavLink>
                ))}
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
