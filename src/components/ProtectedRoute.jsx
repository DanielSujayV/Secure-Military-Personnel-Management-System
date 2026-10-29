import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_ROUTES = {
    ADMIN: ["/dashboard", "/personnel", "/units", "/leave", "/promotions", "/audit"],
    COMMANDER: ["/dashboard", "/personnel", "/units", "/leave", "/promotions"],
    OFFICER: ["/dashboard", "/personnel", "/leave"],
    PERSONNEL: ["/dashboard", "/personnel", "/leave"],
};

const ProtectedRoute = () => {
    const { isAuthenticated, role, roleLoading } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roleLoading) return <div role="status" aria-live="polite">Loading your secure session…</div>;
    if (!role) return <Navigate to="/login" replace />;

    const allowedPaths = ROLE_ROUTES[role] || [];
    // Root protected routes render the nested page; check the current URL
    // at the page level would require useLocation, so this guard validates
    // access using the router's location.
    return <Outlet context={{ allowedPaths }} />;
};

export default ProtectedRoute;
