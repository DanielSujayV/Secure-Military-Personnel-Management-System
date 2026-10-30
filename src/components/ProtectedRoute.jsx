import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, role, roleLoading } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles?.length) {
        if (roleLoading) {
            return <div className="loading-state">Checking account permissions...</div>;
        }

        const normalizedRole = String(role || "")
            .trim()
            .toUpperCase()
            .replace(/^ROLE_/, "");

        if (!allowedRoles.includes(normalizedRole)) {
            return <Navigate to={normalizedRole ? "/personnel" : "/login"} replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
