import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, role, roleLoading } = useAuth();

    if (roleLoading) {
        return (
            <main className="loading-screen" role="status" aria-live="polite">
                Verifying your secure session...
            </main>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!role || (allowedRoles && !allowedRoles.includes(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;