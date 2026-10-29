import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_ROUTES = {
    ADMIN: ["/dashboard", "/personnel", "/units", "/leave", "/promotions", "/audit"],
    COMMANDER: ["/dashboard", "/personnel", "/units", "/leave", "/promotions"],
    OFFICER: ["/dashboard", "/personnel", "/leave"],
    PERSONNEL: ["/dashboard", "/personnel", "/leave"],
};

const ProtectedRoute = () => {
    const { isAuthenticated, role, roleLoading } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Wait for /api/auth/me so a valid token is not redirected mid-load.
    if (roleLoading) {
        return <div role="status" aria-live="polite">Loading your secure session…</div>;
    }

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    const allowedPaths = ROLE_ROUTES[role] || [];
    if (!allowedPaths.includes(location.pathname)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
